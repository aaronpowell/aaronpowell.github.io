+++
title = "GraphQL on Azure: Part 13 - Using Data API builder with SWA and React"
date = 2023-03-15T16:01:47Z
description = ""
draft = true
tags = ["azure", "graphql", "javascript", "serverless"]
tracking_area = "javascript"
tracking_id = "7129"
series = "graphql-azure"
series_title = "Using React with DAB and SWA"
+++

In the last post I introduced you to a new project we've been working on, Data API builder for Azure Databases (DAB) and in this post I want to look at how we can use it in Azure, and that will be through one of my favourite Azure services, [Azure Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/overview?{{<cda>}}), for you see, as part of the announcement today of DAB, we've announced that it is [available as a feature of SWA](https://aka.ms/swa/db/announcement) (called Database Connections), so let's build a React app!

## Local Development

One of the neat things about working with SWA is that we have [a CLI tool](https://azure.github.io/static-web-apps-cli/) which emulates the functionality of SWA, and with today's announcement, we can use it to emulate the Database Connections feature, so let's get started. First off, we need to ensure we have the latest version of the CLI installed, so let's run the following command:

```bash
npm install -g @azure/static-web-apps-cli@latest
```

For the Database Connections, we'll use the same configuration that we had in the last post, so let's copy the `dab-config.json` and `schema.graphql` into the `data` folder of our repo, and rename the `dab-config.json` to `staticwebapp.database.config.json`. Next, I'm going to scaffold out a new React app (using [Vite](https://vitejs.dev/)), so let's run the following command:

```bash
npx create-vite frontend --template react-ts
```

Lastly, we'll initialise the SWA CLI:

```bash
swa init
```

Follow the prompts and adjust any of the values you require (the default Vite template uses `npm run dev` for the dev server but the SWA CLI init will want to use `npm start`, so you'll need to adjust one of those values). When completed, you should have a `swa-cli.config.json` like this:

```json
{
  "$schema": "https://aka.ms/azure/static-web-apps-cli/schema",
  "configurations": {
    "dab": {
      "appLocation": "frontend",
      "outputLocation": "build",
      "appBuildCommand": "npm run build",
      "run": "npm run dev",
      "appDevserverUrl": "http://localhost:5173",
      "dataApiLocation": "data"
    }
  }
}
```

Notice the last line, `"dataApiLocation": "data"`, this is the location of the folder that contains the `schema.graphql` and `staticwebapp.database.config.json` files which are going to be used by the Database Connections feature. Now, let's start the SWA CLI:

```bash
swa start
```

Once the CLI has started you can browse the GraphQL schema in your choice of IDE by providing it with the address http://localhost:4280/data-api/graphql.

## Building a React application

It's time to build the React application, I won't cover all the details (you'll find the full example [on my GitHub](https://github.com/aaronpowell/dab-react-trivia-demo)), instead I'll focus on the GraphQL integration.

Since we have a TypeScript application, we can adapt the pattern I discussed in [part 5 on type-safe GraphQL]({{<ref "/posts/2020-09-17-graphql-on-azure-part-5-can-we-make-graphql-type-safe-in-code.md">}}), using [GraphQL Code Generator](https://graphql-code-generator.com/) to generate the types for us. To do this, we'll need to install the following packages to the `frontend` project:

```bash
npm install -D @graphql-codegen/cli
```

We'll then initialise the GraphQL Code Generator:

```bash
npx graphql-code-generator init
```

Follow the setup guide to create the config file like so:

```ts
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: "http://localhost:4280/data-api/graphql",
  documents: ["src/**/*.tsx", "src/**/*.ts"],
  generates: {
    "src/gql/": {
      preset: "client",
      plugins: [],
    },
  },
};

export default config;
```

Great, we're almost ready to go, the last thing we're going to need is a GraphQL client, and for that, we'll use [Apollo Client](https://www.apollographql.com/docs/react/), so let's install that:

```bash
npm install @apollo/client graphql
```

## Integrating GraphQL

It's time to integrate GraphQL into our application, and I'm going to do that by creating a `useQuestions` hook, which will return the questions from the database. First, let's create the hook:

```ts
import { graphql } from "./gql/gql";
import { useQuery } from "@apollo/client";
import { useEffect, useState } from "react";

const getQuestionsDocument = graphql(/* GraphQL */ `
  query getQuestions {
    questions(first: 10) {
      items {
        id
        question
        correct_answer
        incorrect_answers
      }
    }
  }
`);
```

This might error at the moment as the `graphql` function doesn't exist, which is to be expected as we haven't generated it yet via the GraphQL Code Generator. Let's do that now:

```bash
npm run codegen
```

_This assumes that the `codegen` script is in the `package.json` file, if not, you'll need to run `npx graphql-codegen` instead._

With the error sorted, let's continue with the hook. Initially we've defined the GraphQL query in the `getQuestionsDocument` variable, and then we've used the `graphql` function create a `TypedDocumentNode` which is the type that Apollo Client expects. Next, we'll use the `useQuery` hook to execute the query, and then we'll return the data from the query:

```ts
export const useQuestions = () => {
  const { data, loading } = useQuery(getQuestionsDocument);
};
```

Admittedly, we could just return the `data.questions.items` from the hook, but I don't want to do that because the data structure contains two fields I'd prefer to merge, `correct_answer` and `incorrect_answers`, so that we can shuffle the answers in a random way and then have the application only know about all the answers as a single array. To do this, we'll use the `useEffect` hook to merge the data, and then we'll return the merged data:

```ts
export type QuestionModel = Omit<
  GetQuestionsQuery["questions"]["items"][0],
  "incorrect_answers"
> & {
  answers: string[];
};

export const useQuestions = () => {
  const { data, loading } = useQuery(getQuestionsDocument);
  const [questions, setQuestions] = useState<QuestionModel[] | undefined>(
    undefined
  );

  useEffect(() => {
    if (data) {
      setQuestions(
        data?.questions.items.map((question) => ({
          id: question.id,
          question: question.question,
          correct_answer: question.correct_answer,
          answers: arrayRandomizer(
            question.incorrect_answers.concat(question.correct_answer)
          ),
        }))
      );
    }
  }, [data]);

  return { questions, loading };
};
```

Since the `questions` that we return will have some of the same fields as the object returned from the original GraphQL query, we may as well use the `Omit` type to remove the `incorrect_answers` field from the `QuestionModel` type. We can then add the `answers` field to the type, which is an array of strings that contains the `correct_answer` and the `incorrect_answers` shuffled in a random order.

Now all that's left is to add the Apollo Client provider to our React application:

```tsx
import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const client = new ApolloClient({
  uri: `/data-api/graphql/`,
  cache: new InMemoryCache(),
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>
);
```

And then use the hook in the `App` component (I'll omit that for brevity, you can check it out in the [GitHub repo](https:/github.com/aaronpowell/dab-react-trivia-demo)). But with it all configured, here's how it looks:

![A video of the trivia application](/images/2023-03-16-graphql-on-azure-part-13-using-dab-with-swa-and-react/001.gif)

## Conclusion

In this post we've taken a look at how we can use the new Database Connections feature of Azure Static Web Apps to connect to a Cosmos DB database and expose it as a GraphQL endpoint, without having to write the server ourself. We've also seen that this can be done entirely via the local emulator for SWA, allowing us to rapidly iterate over the application without having to deploy it each time.

While we didn't go through the deployment aspect in this post specifically, you can learn how to do that [through our docs](https://aka.ms/swa/db/docs).
