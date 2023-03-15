+++
title = "GraphQL on Azure: Part 12 - GraphQL as a Service"
date = 2023-03-15T16:00:47Z
description = "It's never been easier to create a GraphQL server on Azure, let's check out what's new"
draft = false
tags = ["azure", "graphql", "javascript", "dotnet"]
tracking_area = "dotnet"
tracking_id = "7129"
series = "graphql-azure"
series_title = "GraphQL as a Service"
+++

![It's happening!](/images/2023-02-23-graphql-on-azure-part-12-graphql-as-a-service/its-happening.webp)

I'm really excited because today we launched the first public preview of [Data API builder for Azure Databases](https://aka.ms/dabdocs) or DAB for short (the official name is a bit of a mouthful 😅).

The important links you'll need are:

- [SQL announcement](https://devblogs.microsoft.com/azure-sql/data-api-builder-for-azure-sql-databases-public-preview)
- [Cosmos announcement](https://devblogs.microsoft.com/cosmosdb/announcing-data-api-builder-for-azure-cosmos-db)
- [Docs](https://aka.ms/dabdocs)
- [SWA integration announcement](https://aka.ms/swa/db/announcement)
- [GitHub Repo](https://aka.ms/dab)

## What is DAB

DAB is a joint effort from the Azure SQL, PostgreSQL, MySQL and Cosmos DB teams to provide a simple and easy way to create REST and GraphQL endpoints from your existing database. Now obviously this is something that you've always been able to do, but the difference is that DAB **does it for you** (after all, that's the point of this series 😜) so rather than having to write an ASP.NET application, data layer, authentication and authorisation, and so on, DAB will do all of that for you. Essentially, DAB is a Backend as a Service (BaaS) and this makes it easier to create an application over a database by removing the need to create the backend yourself.

_Quick note: DAB doesn't support REST for Cosmos DB as Cosmos DB [already has a REST API](https://learn.microsoft.com/rest/api/cosmos-db/?{{<cda>}})._

## How does DAB work

DAB is going to need a data schema that describes the entities you want to expose. In the case of a SQL backend, DAB will inspect the database schema and allow you to expose the tables, views and stored procedures as endpoints. With a NoSQL backend (currently Cosmos DB NoSQL) you need to provide a set of GraphQL types which define the entities you want expose, since there's no database schema to work from.

You'll also provide DAB with a config file which acts as a mapping between the data schema and how you want those entities exposed. In the config file you'll define entities you want to expose (so you can pick and choose what you want to expose from the available schema), access control and entity relationships. If you're working with a SQL database and have views or stored procedures, you can define how they will be exposed.

With this information DAB will then generate the appropriate REST endpoints for each entity with REST semantics on how CRUD should work, as well as a full GraphQL schema, including queries for individual items, paginated lists (with filtering) and mutations (create, update and delete).

## Your first DAB instance

Sounds cool doesn't it? Well, let's go ahead and make a DAB server. The first thing we'll need to do is install the [DAB CLI](https://github.com/Azure/data-api-builder/blob/main/docs/dab-cli.md):

```bash
dotnet tool install --global Microsoft.DataApiBuilder
```

The CLI is used to help us generate our config file, but also to run a local version of DAB. I'm going to use DAB with a Cosmos DB backend, just to show you how to go about creating a data schema for Cosmos, so you'll either need a [local emulator](https://docs.microsoft.com/azure/cosmos-db/local-emulator?tabs=ssl-netstd21&{{<cda>}}) or deployed Cosmos DB instance (I like to use the [cross-platform emulator in a devcontainer]({{<ref "/posts/2022-08-24-improved-local-dev-with-cosmosdb-and-devcontainers.md">}})).

Let's start by initialising the config file:

```bash
dab init --config dab-config.json --database-type cosmosdb_nosql --connection-string "..." --host-mode Development --cors-origin "http://localhost:3000" --cosmosdb_nosql-database trivia --graphql-schema schema.graphql
```

This will generate you a config file like so:

```json
{
  "$schema": "https://dataapibuilder.azureedge.net/schemas/v0.5.34/dab.draft.schema.json",
  "data-source": {
    "database-type": "cosmosdb_nosql",
    "options": {
      "database": "Trivia",
      "schema": "schema.graphql"
    },
    "connection-string": "..."
  },
  "runtime": {
    "graphql": {
      "allow-introspection": true,
      "enabled": true,
      "path": "/graphql"
    },
    "host": {
      "mode": "development",
      "cors": {
        "origins": ["http://localhost:3000"],
        "allow-credentials": false
      },
      "authentication": {
        "provider": "StaticWebApps"
      }
    }
  },
  "entities": {}
}
```

Since this is Cosmos DB and we don't have a database schema we can work with, we're going to need to create some types in GraphQL for DAB to use:

```graphql
type Question @model {
  id: String!
  question: String!
  correct_answer: String!
  incorrect_answers: [String!]!
}
```

This looks pretty standard as far as a GraphQL type is concerned, with the exception of a `@model` directive that's been applied to the type. This directive is required to tell DAB that this is a type that we want to generate a full schema for (queries and mutations), and not a type that is a child of another type (in the case of a nested JavaScript object).

With our schema defined, we have to tell DAB how to retrieve documents from Cosmos that match that type, and that's what the `entities` field in the config file is for. Let's use the CLI to define a new entity:

```bash
dab add Question --source questions --permissions "anonymous:*"
```

This command is defining a new `entity` called `Question`, specifying that the collection (`source`) in Cosmos DB is _questions_ and that we want to allow anonymous access to all operations on this entity. I'm being pretty lazy on the security, but if you want to do it properly you can define different roles and the access they have (create, read, update or delete) to the entity.

With this added our config file now looks like this:

```json
{
  "$schema": "https://dataapibuilder.azureedge.net/schemas/v0.5.34/dab.draft.schema.json",
  "data-source": {
    "database-type": "cosmosdb_nosql",
    "options": {
      "database": "Trivia",
      "schema": "schema.graphql"
    },
    "connection-string": "..."
  },
  "runtime": {
    "graphql": {
      "allow-introspection": true,
      "enabled": true,
      "path": "/graphql"
    },
    "host": {
      "mode": "development",
      "cors": {
        "origins": ["http://localhost:3000"],
        "allow-credentials": false
      },
      "authentication": {
        "provider": "StaticWebApps"
      }
    }
  },
  "entities": {
    "Question": {
      "source": "questions",
      "permissions": [
        {
          "role": "*",
          "actions": ["*"]
        }
      ]
    }
  }
}
```

With the config file complete we can now the server:

```bash
dab start
```

Now we can load up the GraphQL endpoint, https://localhost:5001/graphql, in your preferred GraphQL IDE (I like to use [Banana Cake Pop](https://chillicream.com/products/bananacakepop)):

![Connect to GraphQL endpoint](/images/2023-03-16-graphql-on-azure-part-12-graphql-as-a-service/001.png)

You'll then see the whole GraphQL schema that was generated from the config file and GraphQL types provided:

![GraphQL schema](/images/2023-03-16-graphql-on-azure-part-12-graphql-as-a-service/002.png)

It's really cool, we have queries just magically generated for us!

```graphql
type Query {
  """
  Get a list of all the Question items from the database
  """
  questions(
    """
    The number of items to return from the page start point
    """
    first: Int

    """
    A pagination token from a previous query to continue through a paginated list
    """
    after: String

    """
    Filter options for query
    """
    filter: QuestionFilterInput

    """
    Ordering options for query
    """
    orderBy: QuestionOrderByInput
  ): QuestionConnection!

  """
  Get a Question from the database by its ID/primary key
  """
  question_by_pk(id: ID, _partitionKeyValue: String): Question
}
```

This means we could write a query like this:

```graphql
query {
  questions {
    items {
      id
      question
      correct_answer
      incorrect_answers
    }
  }
}
```

And when executed it'll return all the documents:

![GraphQL query](/images/2023-03-16-graphql-on-azure-part-12-graphql-as-a-service/003.png)

You can even write complex filter queries that take a subset of the results:

```graphql
query {
  questions(filter: { question: { contains: "What" } }, first: 10) {
    endCursor
    hasNextPage
    items {
      id
      question
      correct_answer
      incorrect_answers
    }
  }
}
```

Which will then give us an output such as:

```json
{
  "data": {
    "questions": {
      "endCursor": "W3sidG9rZW4iOiIrUklEOn41anNMQU83WXk4TVhBQUFBQUFBQUFBPT0jUlQ6MSNUUkM6MTAjSVNWOjIjSUVPOjY1NTUxI1FDRjo4I0ZQQzpBZ0VBQUFBT0FCWUFnS0lBb05pUk5nUUxJQXdBIiwicmFuZ2UiOnsibWluIjoiIiwibWF4IjoiRkYifX1d",
      "hasNextPage": true,
      "items": [ ... ]
    }
  }
}
```

The `endCursor` is a token that can be used to get the next page of results, using the `after` input field, and the `hasNextPage` flag tells us if there are any more pages to get.

## Conclusion

In this post we've looked at how to use GraphQL as a service on Azure, using the Data API builder project. It's a really cool project that allows you to quickly get up and running with a GraphQL API (or REST if that's your preference, but this series is **GraphQL** on Azure, not **REST** on Azure 😝).

With a few commands we can scaffold up DAB, define what the data schema we want to export looks like, connect to an existing database and then start serving up data.

Go check out [the official announcement](https://devblogs.microsoft.com/azure-sql/data-api-builder-for-azure-sql-databases-public-preview?{{<cda>}}), and [the GitHub repo](https://aka.ms/dab), the [docs](https://aka.ms/dabdocs) and [the samples](https://github.com/Azure-Samples/data-api-builder) and give it a try!
