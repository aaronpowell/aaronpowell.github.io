+++
title = "GraphQL on Azure: Part 3 - Serverless With JavaScript"
date = 2020-08-07T11:08:58+10:00
description = "Let's look at how we can create a JavaScript GraphQL server and deploy it to an Azure Function"
draft = false
tags = ["azure", "serverless", "azure-functions", "javascript", "graphql"]
series = "graphql-azure"
series_title = "Serverless with JavaScript"
tracking_area = "javascript"
tracking_id = "7129"
+++

Last time we look at how to get started with [GraphQL on dotnet]({{<ref "/posts/2020-07-21-graphql-on-azure-part-2-app-service-with-dotnet.md">}}) and we looked at the [Azure App Service](https://docs.microsoft.com/azure/app-service/?{{<cda>}}) platform to host our GraphQL server. Today we're going to have a look at a different approach, using [Azure Functions](https://docs.microsoft.com/azure/functions/?{{<cda>}}) to create run GraphQL in a Serverless model. We'll also look at using JavaScript (or specifically, TypeScript) for this codebase, but there's no reason you couldn't deploy a dotnet GraphQL server on Azure Functions or deploy JavaScript to App Service.

## Getting Started

For the server, we'll use the tooling provided by [Apollo](https://www.apollographql.com), specifically their server [integration with Azure Functions](https://www.apollographql.com/docs/apollo-server/deployment/azure-functions/), which will make it place nicely together.

We'll create a new project using Azure Functions, and scaffold it using the [Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local?tabs=linux%2Ccsharp%2Cbash&{{<cda>}}):

```bash
func init graphql-functions --worker-runtime node --language typescript
cd graphql-functions
```

_If you want JavaScript, not TypeScript, as the Functions language, change the `--language` flag to `javascript`._

Next, to host the GraphQL server we'll need a [Http Trigger](https://docs.microsoft.com/azure/azure-functions/functions-bindings-http-webhook-trigger?tabs=csharp&{{<cda>}}), which will create a HTTP endpoint in which we can access our server via:

```bash
func new --template "Http Trigger" --name graphql
```

_The `--name` can be anything you want, but let's make it clear that it's providing GraphQL._

Now, we need to add the Apollo server integration for Azure Functions, which we can do with `npm`:

```bash
npm install --save apollo-server-azure-functions
```

_Note: if you are using TypeScript, you need to enable [`esModuleInterop`](https://www.staging-typescript.org/tsconfig#esModuleInterop) in your `tsconfig.json` file._

Lastly, we need to configure the way the HTTP Trigger returns to work with the Apollo integration, so let's open `function.json` within the `graphql` folder, and change the way the HTTP response is received from the Function. By default it's using a property of the context called `res`, but we need to make it explicitly return be naming it `$return`:

```json {hl_lines=[13]}
{
    "bindings": [
        {
            "authLevel": "function",
            "type": "httpTrigger",
            "direction": "in",
            "name": "req",
            "methods": ["get", "post"]
        },
        {
            "type": "http",
            "direction": "out",
            "name": "$return"
        }
    ],
    "scriptFile": "../dist/graphql/index.js"
}
```

## Implementing a Server

We've got out endpoint ready, it's time to start implementing the server, which will start in the `graphql/index.ts` file. Let's replace it with this chunk:

```typescript
import { ApolloServer, gql } from "apollo-server-azure-functions";

const typeDefs = gql`
    type Query {
        graphQLOnAzure: String!
    }
`;
const resolvers = {
    Query: {
        graphQLOnAzure() {
            return "GraphQL on Azure!";
        }
    }
};

const server = new ApolloServer({ typeDefs, resolvers });
export default server.createHandler();
```

Let's talk about what we did here, first up we imported the `ApolloServer` which is the server that will handle the incoming requests on the HTTP Trigger, we use that as the very bottom by creating the instance and exporting the handler as the module export.

Next, we imported `gql`, which is a template literal that we use to write our GraphQL schema in. The schema we've created here is pretty basic, it only has a single type, `Query` on it that has a single member to output.

Lastly, we're creating an object called `resolvers`, which are the functions that handle the request when it comes in. You'll notice that this object mimics the structure of the schema we provided to `gql`, by having a `Query` property which then has a function matching the name of the available queryable values.

This is the minimum that needs to be done and if you fire up `func start` you can now query the GraphQL endpoint, either via the playground of from another app.

## Implementing our Quiz

Let's go about creating a more complex solution, we'll implement the same Quiz that we did in [dotnet]({{<ref "/posts/2020-07-21-graphql-on-azure-part-2-app-service-with-dotnet.md">}}).

We'll start by defining the schema that we'll have on our server:

```typescript
const typeDefs = gql`
    type Quiz {
        id: String!
        question: String!
        correctAnswer: String!
        incorrectAnswers: [String!]!
    }

    type TriviaQuery {
        quizzes: [Quiz!]!
        quiz(id: String!): Quiz!
    }

    schema {
        query: TriviaQuery
    }
`;
```

Now we have two types defined, `Quiz` and `TriviaQuery`, then we've added a root node to the schema using the `schema` keyword and then stating that the `query` is of type `TriviaQuery`.

With that done, we need to implement the resolvers to handle when we request data.

```typescript
const resolvers = {
    TriviaQuery: {}
};
```

This will compile and run, mostly because GraphQL doesn't type check that the resolver functions are implemented, but you'll get a bunch of errors, so instead we'll need implement the `quizzes` and `quiz` resolver handlers.

## Handling a request

Let's implement the `quizzes` handler:

```typescript
const resolvers = {
    TriviaQuery: {
        quizzes: (parent, args, context, info) => {
            return null;
        }
    }
};
```

The function will receive 4 arguments, you'll find them [detailed on Apollo's docs](https://www.apollographql.com/docs/apollo-server/data/resolvers/#resolver-arguments), but for this handler we really only need one of them, `context`, and that will be how we'll get access to our backend data source.

_For the purposes of this blog, I'm skipping over the implementation of the data source, but you'll find it on [my github](https://github.com/aaronpowell/azure-functions-graphql/blob/master/graphql/data.ts)._

```typescript
const resolvers = {
    TriviaQuery: {
        quizzes: async (parent, args, context, info) => {
            const questions = await context.dataStore.getQuestions();
            return questions;
        }
    }
};
```

You might be wondering how the server knows about the data store and how it got on that `context` argument. This is another thing we can provide to Apollo server when we start it up:

```typescript
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: {
        dataStore
    }
});
```

_Here, `dataStore` is something imported from another module._

Context gives us dependency injection like features for our handlers, so they don't need to establish data connections themselves.

If we were to open the GraphQL playground and then execute a query like so:

```graphql
query {
    quizzes {
        question
        id
        correctAnswer
        incorrectAnswers
    }
}
```

We'll get an error back that `Quiz.correctAnswer` is a non-null field but we gave it null. The reason for this is that our storage type has a field called `correct_answer`, whereas our model expects it to be `correctAnswer`. To address this we'll need to do some field mapping within our resolver so it knows how to _resolve_ the field.

```typescript
const resolvers = {
    TriviaQuery: {
        quizzes: async (parent, args, context, info) => {
            const questions = await context.dataStore.getQuestions();
            return questions;
        }
    },

    Quiz: {
        correctAnswer: (parent, args, context, info) => {
            return parent.correct_answer;
        },

        incorrectAnswers: (parent, args, context, info) => {
            return parent.incorrect_answers;
        }
    }
};
```

This is a [resolver chain](https://www.apollographql.com/docs/apollo-server/data/resolvers/#resolver-chains), it's where we tell the resolvers how to handle sub-fields of an object and it acts just like a resolver itself, so we have access to the same context and if we needed to do another DB lookup, we could.

_Note: These resolvers will only get called if the fields are requested from the client. This avoids loading data we don't need._

You can go ahead and implement the `quiz` resolver handler yourself, as it's now time to deploy to Azure.

## Disabling GraphQL Playground

We probably don't want the Playground shipping to production, so we'd need to disable that. That's done by setting the `playground` property of the `ApolloServer` options to `false`. For that we can use an environment variable (and set it in the appropriate configs):

```typescript
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: {
        dataStore
    },
    playground: process.env.NODE_ENV === "development"
});
```

_For the sample on GitHub, I've left the playground enabled._

## Deploying to Azure Functions

With all the code complete, let's look at deploying it to Azure. For this, we'll use a standard [Azure Function](https://docs.microsoft.com/azure/azure-functions/?{{<cda>}}) running the latest Node.js runtime for Azure Functions (Node.js 12 at the time of writing). We don't need to do anything special for the Functions, it's already optimised to run a Node.js Function with a HTTP Trigger, which is all this really is. If we were using a different runtime, like .NET, we'd follow the standard setup for a .NET Function app.

To deploy, we'll use [GitHub Actions](https://help.github.com/en/articles/about-github-actions?{{<cda>}}), and you'll find docs on how to do that [already written](https://docs.microsoft.com/azure/app-service/deploy-github-actionshttps://docs.microsoft.com/azure/azure-functions/functions-how-to-github-actions?tabs=javascript&{{<cda>}}), and I've done a [video on this as well]({{<ref "/posts/2020-02-28-using-github-actions-with-azure-functions.md">}}). You'll find the workflow file I've used [in the GitHub repo](https://github.com/aaronpowell/azure-functions-graphql/blob/master/.github/workflows/workflow.yml).

With a workflow committed and pushed to GitHub and our App Service waiting, the Action will run and our application will be deployed. The demo I created [is here](https://graphql-on-azure-functions.azurewebsites.net/api/graphql).

## Conclusion

Throughout this post we've taken a look at how we can create a GraphQL server running inside a JavaScript Azure Functions using the Apollo GraphQL server, before finally deploying it to Azure.

When it comes to the Azure side of things, there's nothing different we have to to do run the GraphQL server in Azure Functions, it's just treated as a HTTP Trigger function and Apollo has nice bindings to allow us to integrate the two platforms together.

Again, you'll find the complete sample [on my GitHub](https://github.com/aaronpowell/azure-functions-graphql) for you to play around with yourself.
