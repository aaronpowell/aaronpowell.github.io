+++
title = "Using GraphQL in Azure Functions to Access Cosmos DB"
date = 2020-04-07T15:05:12+10:00
description = "A quick start on how to create a GraphQL endpoint on an Azure Function"
draft = false
tags = ["serverless", "azure-functions", "azure"]
+++

I'm playing around with a new project in which I want to use [Azure Functions](https://docs.microsoft.com/azure/azure-functions/functions-overview?{{<cda>}}) as the backend to a React UI and figured that it was finally time to learn that newfangled ["GraphQL"](https://graphql.org/) (also, it'll get [Rob Crowley](https://twitter.com/robdcrowley) off my back as he's bugged me about learning it for **years**! 😝).

For the project I'm building I plan to use [Cosmos DB](https://docs.microsoft.com/azure/cosmos-db/introduction?{{<cda>}}) as the backing store, especially since [there is a free tier now](https://devblogs.microsoft.com/cosmosdb/build-apps-for-free-with-azure-cosmos-db-free-tier/?{{<cda>}}), so let have a look how we can connect all three of these things together, GraphQL, Azure Functions and Cosmos DB.

_Note: For the purposes of this article I'm going to assume you are familiar with GraphQL and I won't go over the semantics of it, just the stuff that relates to what we need to do._

## GraphQL + Azure Functions

To use GraphQL we'll need a server and that's what Azure Functions is going to be. After doing some research I found that [Apollo](https://www.apollographql.com) has an [integration with Azure Functions](https://www.apollographql.com/docs/apollo-server/deployment/azure-functions/), so that'll give us a nice starting point.

### Creating Our GraphQL Server

First thing we'll do is create the Azure Functions project with a [Http Trigger](https://docs.microsoft.com/azure/azure-functions/functions-bindings-http-webhook-trigger?tabs=csharp&{{<cda>}}). Jump over to the command line and let's create that (or use VS/VSCode, up to you):

```bash
func init graphql-functions --worker-runtime node --language typescript
cd graphql-functions
func new --template "Http Trigger" --name graphql
```

This will scaffold up a TypeScript Azure Functions project and then setup a HTTP trigger that will be where our GraphQL server will be.

_Note: If you want to use 'plain old JavaScript' rather than TypeScript just drop the `--language` flag from `func init`._

Now, we need to add the Apollo server integration for Azure Functions, which we can do with `npm`:

```bash
npm install --save apollo-server-azure-functions
```

With the dependencies setup, let's start implementing the endpoint.

### Implementing a GraphQL Endpoint

Open up an editor (such as VS Code) and open `graphql/index.ts`. You'll see the boilerplate code for the HTTP Trigger, let's delete it all so we can start from scratch. While this is a HTTP Trigger as far as Azure Functions is concerned we're going to be hiding that away behind Apollo, so we'll start by importing the Apollo Server and GraphQL tools:

```typescript
import { ApolloServer, gql } from "apollo-server-azure-functions";
```

Then, we can define a basic schema:

```typescript
const typeDefs = gql`
    type Query {
        helloWorld: String!
    }
`;
```

Create a resolver:

```typescript
const resolvers = {
    Query: {
        helloWorld() {
            return "Hello world!";
        }
    }
};
```

And lastly, export the handler for Azure Functions to call:

```typescript
const server = new ApolloServer({ typeDefs, resolvers });
export default server.createHandler();
```

Our `index.ts` should now look like this:

```typescript
import { ApolloServer, gql } from "apollo-server-azure-functions";

const typeDefs = gql`
    type Query {
        helloWorld: String!
    }
`;
const resolvers = {
    Query: {
        helloWorld() {
            return "Hello world!";
        }
    }
};

const server = new ApolloServer({ typeDefs, resolvers });
export default server.createHandler();
```

But before we can run it there's one final step, open up the `function.json` and change the name of the `http` `out` binding to `$return`, making the `functions.json` look like so:

```json
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

This is required as Apollo will return the value to Azure Functions rather than using a passed in argument that you set the `body` on. My guess is so that they don't have to have too much tying the core to how Azure Functions works.

Launch the Functions (`F5` in VS Code or `npm start` from the CLI) and navigate to [`http://localhost:7071/api/graphql`](http://localhost:7071/api/graphql) where you'll find the [GraphQL playground](https://www.apollographql.com/docs/apollo-server/testing/graphql-playground/). Type in your query, execute the query and tada, we have results!

![GraphQL Playground Output](/images/graphql-functions-cosmosdb/001.png)

### Disabling the Playground

We probably don't want the Playground shipping to production, so we'd need to disable that. That's done by setting the `playground` property of the `ApolloServer` options to `false`. For that we can use an environment variable (and set it in the appropriate configs):

```typescript
const server = new ApolloServer({
    typeDefs,
    resolvers,
    playground: process.env.NODE_ENV === "development"
});
```

## Adding Cosmos DB

Given that we've proven that we can integrate GraphQL with Azure Functions we can now start to do something more realistic than returning _hello world_, and for that we'll talk to Cosmos DB. Functions has [bindings to Cosmos DB](https://docs.microsoft.com/azure/azure-functions/functions-bindings-cosmosdb-v2?{{<cda>}}) but as we're going to be doing some dynamic queries we'll manage the connection ourselves rather than doing automated bindings, and for that we'll loosely follow the [Cosmos DB tutorial on docs](https://docs.microsoft.com/azure/cosmos-db/sql-api-nodejs-get-started?{{<cda>}}).

_Note: If you don't want to spin up a resource in Azure you can [use the Cosmos DB emulator](https://docs.microsoft.com/azure/cosmos-db/local-emulator?{{<cda>}})._

Start by adding the Node module for Cosmos DB:

```bash
npm install --save @azure/cosmos
```

Then it's time to update our Function to use it, so back to `index.ts` and import `CosmosClient`:

```typescript
import { CosmosClient } from "@azure/cosmos";
```

With this we can create the connection to Cosmos DB:

```typescript
const client = new CosmosClient(process.env.CosmosKey);
```

Since, we don't want to commit our Cosmos DB connection string to source control I'm expecting it to be passed in via the AppSettings (when deployed) or `local.settings.json` locally.

_Aside: I've decide to cheat when it comes to making the Cosmos DB, I'm using the database from [www.theurlist.com](https://www.theurlist.com/) which was created by some colleagues of mine. You can learn how to [create it yourself](https://burkeholland.github.io/posts/the-urlist/), see [how they migrated to Cosmos DB Free Tier](https://burkeholland.github.io/posts/cosmos-free-tier/) and [grab the code yourself](https://github.com/the-urlist). But feel free to use any Cosmos DB you want, just model the GraphQL schema appropriately._

## Changing Our Query

So far our GraphQL query has been just a silly static one, but we want to model our actual Cosmos DB backend, or at least, what of the backend we want to expose, so it's time to update the schema:

```typescript
const typeDefs = gql`
    type Record {
        id: ID
        userId: String
        vanityUrl: String!
        description: String
        links: [Link]
    }

    type Link {
        id: String
        url: String!
        title: String!
        description: String
        image: String
    }

    type Query {
        getByVanityUrl(vanity: String): Record
        getForUser(userId: String): [Record]!
    }
`;
```

And it's time to implement said schema:

```typescript
const resolvers = {
    Query: {
        async getByVanityUrl(_, { vanity }: { vanity: string }) {
            let results = await client
                .database("linkylinkdb")
                .container("linkbundles")
                .items.query({
                    query: "SELECT * FROM c WHERE c.vanityUrl = @vanity",
                    parameters: [
                        {
                            name: "@vanity",
                            value: vanity
                        }
                    ]
                })
                .fetchAll();

            if (results.resources.length > 0) {
                return results.resources[0];
            }
            return null;
        },
        async getForUser(_, { userId }: { userId: string }) {
            let results = await client
                .database("linkylinkdb")
                .container("linkbundles")
                .items.query({
                    query: "SELECT * FROM c WHERE c.userId = @userId",
                    parameters: [
                        {
                            name: "@userId",
                            value: userId
                        }
                    ]
                })
                .fetchAll();

            return results.resources;
        }
    }
};
```

With these changes done we can restart the Functions host and open up the Playground again to try a more complex query.

![GraphQL Playground Output from Cosmos DB](/images/graphql-functions-cosmosdb/002.png)

## Conclusion

And there we go, we've created a GraphQL server that is running inside an Azure Function, talking to Cosmos DB. One thing to be aware of, at least in the way that I've approached it, is that we're _potentially_ pulling more data back from Cosmos DB than we need through our `SELECT` statement, since the client can choose to drop fields that they don't need in the response. If this is a concern you could take a look into selection set of the query and dynamically build the SQL statement, but that could be risky, so it'd be something you want to test and optimise for, rather than doing upfront.

Ultimately, I hope that this gets you started in doing GraphQL in Azure Functions. 😊
