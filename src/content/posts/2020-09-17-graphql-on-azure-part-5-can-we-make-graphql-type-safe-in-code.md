+++
title = "GraphQL on Azure: Part 5 - Can We Make GraphQL Type Safe in Code"
date = 2020-09-17T15:21:02+10:00
description = "We're defining a GraphQL schema with a type system, but can we use that type system for our application?"
draft = false
tags = ["azure", "serverless", "azure-functions", "javascript", "graphql"]
series = "graphql-azure"
series_title = "Can We Make GraphQL Type Safe in Code?"
tracking_area = "javascript"
tracking_id = "7129"
+++

I've been doing a lot of work recently with GraphQL on [Azure Functions](https://docs.microsoft.com/azure/functions/?WT.mc_id=servsept20-devto-aapowell) and something that I find works nicely is the schema-first approach to designing the GraphQL endpoint.

The major drawback I've found though is that you start with a strongly typed schema but lose that type information when implementing the resolvers and working with your data model.

So let's have a look at how we can tackle that by building an application with GraphQL on Azure Functions and backing it with a data model in [CosmosDB](https://azure.microsoft.com/services/cosmos-db/?WT.mc_id=servsept20-devto-aapowell), all written in TypeScript.

> To learn how to get started with GraphQL on Azure Functions, check out the earlier posts in this series.

## Creating our schema

The API we're going to build today is a trivia API (which uses data from [Open Trivia DB](https://opentdb.com/) as the source).

We'll start by defining a schema that'll represent the API as a file named `schema.graphql` within the _graphql_ folder:

```graphql
type Question {
    id: ID!
    question: String!
    correctAnswer: String!
    answers: [String!]!
}

type Query {
    question(id: ID!): Question
    getRandomQuestion: Question
}

type Answer {
    questionId: ID
    question: String!
    submittedAnswer: String!
    correctAnswer: String!
    correct: Boolean
}

type Mutation {
    answerQuestion(id: ID, answer: String): Answer
}

schema {
    query: Query
    mutation: Mutation
}
```

Our schema has defined two core types, `Question` and `Answer`, along with a few queries and a mutation and all these types are decorated with useful GraphQL type annotations, that would be useful to have respected in our TypeScript implementation of the resolvers.

## Creating a resolver

Let's start with the query resolvers, this will need to get back the data from CosmosDB to return the our consumer:

```typescript
const resolvers = {
    Query: {
        question(_, { id }, { dataStore }) {
            return dataStore.getQuestionById(id);
        },
        async getRandomQuestion(_, __, { dataStore }) {
            const questions = await dataStore.getQuestions();
            return questions[Math.floor(Math.random() * questions.length) + 1];
        }
    }
};

export default resolvers;
```

This matches the _query_ portion of our schema from the structure, but how did we know how to implement the resolver functions? What arguments do we get to `question` and `getRandomQuestion`? We know that `question` will receive an `id` parameter, but how? If we look at this in TypeScript there's `any` all over the place, and that's means we're not getting much value from TypeScript.

Here's where we start having a disconnect between the code we're writing, and the schema we're working against.

## Enter GraphQL Code Generator

Thankfully, there's a tool out there that can help solve this for us, [GraphQL Code Generator](https://graphql-code-generator.com/). Let's set it up by installing the tool:

```bash
npm install --save-dev @graphql-codegen/cli
```

And we'll setup a config file named `config.yml` in the root of our Functions app:

```yml
overwrite: true
schema: "./graphql/schema.graphql"
generates:
    graphql/generated.ts:
        plugins:
            - typescript
            - typescript-resolvers
```

This will generate a file named `generated.ts` within the `graphql` folder using our `schema.graphql` as the input. The output will be TypeScript and we're also going to generate the resolver signatures using the `typescript` and `typescript-resolvers` plugins, so we best install those too:

```bash
npm install --save-dev @graphql-codegen/typescript @graphql-codegen/typescript-resolvers
```

It's time to run the generator:

```bash
npx graphql-codegen --config codegen.yml
```

## Strongly typing our resolvers

We can update our resolvers to use this new type information:

```typescript
import { Resolvers } from "./generated";

const resolvers: Resolvers = {
    Query: {
        question(_, { id }, { dataStore }) {
            return dataStore.getQuestionById(id);
        },
        async getRandomQuestion(_, __, { dataStore }) {
            const questions = await dataStore.getQuestions();
            return questions[Math.floor(Math.random() * questions.length) + 1];
        }
    }
};

export default resolvers;
```

Now we can hover over something like `id` and see that it's typed as a `string`, but we're still missing a piece, what is `dataStore` and how do we know what type to make it?

## Creating a data store

Start by creating a new file named `data.ts`. This will house our API to work with CosmosDB, and since we're using CosmosDB we'll need to import the node module:

```bash
npm install --save @azure/cosmos
```

_Why CosmosDB? CosmosDB have just launched a [serverless plan](https://docs.microsoft.com/azure/cosmos-db/serverless?WT.mc_id=aaronpowell-blog-aapowell) which works nicely with the idea of a serverless GraphQL host in Azure Functions. Serverless host with a serverless data store, sound like a win all around!_

With the module installed we can implement our data store:

```typescript
import { CosmosClient } from "@azure/cosmos";

export type QuestionModel = {
  id: string;
  question: string;
  category: string;
  incorrect_answers: string[];
  correct_answer: string;
  type: string;
  difficulty: "easy" | "medium" | "hard";
};

interface DataStore {
  getQuestionById(id: string): Promise<QuestionModel>;
  getQuestions(): Promise<QuestionModel[]>;
}

class CosmosDataStore implements DataStore {
  #client: CosmosClient;
  #databaseName = "trivia";
  #containerName = "questions";

  #getContainer = () => {
    return this.#client
      .database(this.#databaseName)
      .container(this.#containerName);
  };

  constructor(client: CosmosClient) {
    this.#client = client;
  }

  async getQuestionById(id: string) {
    const container = this.#getContainer();

    const question = await container.items
      .query<QuestionModel>({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: id }],
      })
      .fetchAll();

    return question.resources[0];
  }

  async getQuestions() {
    const container = this.#getContainer();

    const question = await container.items
      .query<QuestionModel>({
        query: "SELECT * FROM c",
      })
      .fetchAll();

    return question.resources;
  }
}

export const dataStore = new CosmosDataStore(
  new CosmosClient(process.env.CosmosDB)
);
```

This class will receive a `CosmosClient` that gives us the connection to query CosmosDB and provides the two functions that we used in the resolver. We've also got a data model, `QuestionModel` that represents how we're storing the data in CosmosDB.

> To create a CosmosDB resource in Azure, [check out their quickstart](https://docs.microsoft.com/azure/cosmos-db/create-cosmosdb-resources-portal?WT.mc_id=servsept20-devto-aapowell) and [here is a data sample](https://github.com/aaronpowell/graphql-code-generator-sample/blob/main/api/trivia.json) that can be uploaded via the Data Explorer in the Azure Portal.\_

To make this available to our resolvers, we'll add it to the GraphQL context by extending `index.ts`:

```typescript
import { ApolloServer } from "apollo-server-azure-functions";
import { importSchema } from "graphql-import";
import resolvers from "./resolvers";
import { dataStore } from "./data";

const server = new ApolloServer({
    typeDefs: importSchema("./graphql/schema.graphql"),
    resolvers,
    context: {
        dataStore
    }
});

export default server.createHandler();
```

If we run the server, we'll be able to query the endpoint and have it pull data from CosmosDB but our resolver is still lacking a type for `dataStore`, and to do that we'll use a custom mapper.

### Custom context types

So far, the types we're generating are all based off what's in our GraphQL schema, and that works mostly but there are gaps. One of those gaps is how we use the request context in a resolver, since this doesn't exist as far as the schema is concerned we need to do something more for the type generator.

Let's define the context type first by adding this to the bottom of `data.ts`:

```typescript
export type Context = {
    dataStore: DataStore;
};
```

Now we can tell GraphQL Code Generator to use this by modifying our config:

```yml
overwrite: true
schema: "./graphql/schema.graphql"
generates:
    graphql/generated.ts:
        config:
            contextType: "./data#Context"
        plugins:
            - "typescript"
            - "typescript-resolvers"
```

We added a new `config` node in which we specify the `contextType` in the form of `<path>#<type name>` and when we run the generator the type is used and now the `dataStore` is typed in our resolvers!

### Custom models

It's time to run our Function locally.

```bash
npm start
```

And let's query it. We'll grab a random question:

```graphql
{
    getRandomQuestion {
        id
        question
        answers
    }
}
```

Unfortunately, this fails with the following error:

> Cannot return null for non-nullable field Question.answers.

If we refer back to our `Question` type in the GraphQL schema:

```graphql
type Question {
    id: ID!
    question: String!
    correctAnswer: String!
    answers: [String!]!
}
```

This error message makes sense as `answers` is a non-nullable array of non-nullable strings (`[String!]!`), but if that's compared to our data model in Cosmos:

```typescript
export type QuestionModel = {
    id: string;
    question: string;
    category: string;
    incorrect_answers: string[];
    correct_answer: string;
    type: string;
    difficulty: "easy" | "medium" | "hard";
};
```

Well, there's no `answers` field, we only have `incorrect_answers` and `correct_answer`.

It's time to extend our generated types a bit further using custom models. We'll start by updating the config file:

```yml
overwrite: true
schema: "./graphql/schema.graphql"
generates:
    graphql/generated.ts:
        config:
            contextType: "./data#Context"
            mappers:
                Question: ./data#QuestionModel
        plugins:
            - "typescript"
            - "typescript-resolvers"
```

With the `mappers` section, we're telling the generator when you find the `Question` type in the schema, it's use `QuestionModel` as the parent type.

But this still doesn't tell GraphQL how to create the `answers` field, for that we'll need to define a resolver on the `Question` type:

```typescript
import { Resolvers } from "./generated";

const resolvers: Resolvers = {
    Query: {
        question(_, { id }, { dataStore }) {
            return dataStore.getQuestionById(id);
        },
        async getRandomQuestion(_, __, { dataStore }) {
            const questions = await dataStore.getQuestions();
            return questions[Math.floor(Math.random() * questions.length) + 1];
        }
    },

    Question: {
        answers(question) {
            return question.incorrect_answers
                .concat([question.correct_answer])
                .sort();
        },
        correctAnswer(question) {
            return question.correct_answer;
        }
    }
};

export default resolvers;
```

These field resolvers will receive a _parent_ as their first argument that is the `QuestionModel` and expect to return the type as defined in the schema, making it possible to do mapping of data between types as required.

If you restart your Azure Functions and execute the query from before, a random question is returned from the API.

## Conclusion

We've taken a look at how we can build on the idea of deploying GraphQL on Azure Functions and looked at how we can use the GraphQL schema, combined with our own models, to enforce type safety with TypeScript.

We didn't implement the mutation in this post, that's an exercise for you as the reader to tackle.

You can check out the full example, including how to connect it with a React front end, on [GitHub](https://github.com/aaronpowell/graphql-code-generator-sample).

> This article is part of #ServerlessSeptember ([https://aka.ms/ServerlessSeptember2020](https://aka.ms/ServerlessSeptember2020)). You’ll find other helpful articles, detailed tutorials, and videos in this all-things-Serverless content collection. New articles from community members and cloud advocates are published every week from Monday to Thursday through September.

> Find out more about how Microsoft Azure enables your Serverless functions at [https://docs.microsoft.com/azure/azure-functions/](https://docs.microsoft.com/azure/azure-functions/?{{<cda>}})
