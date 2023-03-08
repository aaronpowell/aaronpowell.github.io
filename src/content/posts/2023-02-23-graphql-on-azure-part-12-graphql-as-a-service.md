+++
title = "GraphQL on Azure: Part 12 - GraphQL as a Service"
date = 2023-02-23T04:34:09Z
description = "It's never been easier to create a GraphQL server on Azure, let's check out what's new"
draft = true
tags = ["azure", "graphql", "javascript", "dotnet"]
tracking_area = "dotnet"
tracking_id = "7129"
series = "graphql-azure"
series_title = "GraphQL as a Service"
+++

![It's happening!](/images/2023-02-23-graphql-on-azure-part-12-graphql-as-a-service/its-happening.webp)

I'm really excited because today we launched the first public preview of [Data API builder for Azure Databases]() or DAb for short (the official name is a bit of a mouthful 😅).

The important links you'll need are:

- [Announcement post]()
  - [SQL announcement]()
  - [Cosmos announcement]()
- [Docs]()
- [SWA integration docs]()
- [GitHub Repo]()

## What is DAb

DAb is a joint effort from the Azure SQL, PostgreSQL, MySQL and Cosmos DB teams to provide a simple and easy way to create REST and GraphQL endpoints from your existing database. Now obviously this is something that you've always been able to do, but the difference is that DAb **does it for you** (after all, that's the point of this series 😜) so rather than having to write an ASP.NET application, data layer, authentication and authorisation, and so on, DAb will do all of that for you. Essentially, DAb is a Backend as a Service (BaaS) and this makes it easier to create an application over a database by removing the need to create the backend yourself.

_Quick note: DAb doesn't support REST for Cosmos DB as Cosmos DB [already has a REST API]()._

## How does DAb work

DAb is going to need a data schema that describes the entities you want to expose. In the case of a SQL backend, DAb will inspect the database schema and allow you to expose the tables, views and stored procedures as endpoints. With a NoSQL backend (currently Cosmos DB NoSQL) you need to provide a set of GraphQL types which define the entities you want expose, since there's no database schema to work from.

You'll also provide DAb with a config file which acts as a mapping between the data schema and how you want those entities exposed. In the config file you'll define entities you want to expose (so you can pick and choose what you want to expose from the available schema), access control and entity relationships. If you're working with a SQL database and have views or stored procedures, you can define how they will be exposed.

With this information DAb will then generate the appropriate REST endpoints for each entity with REST semantics on how CRUD should work, as well as a full GraphQL schema, including queries for individual items, paginated lists (with filtering) and mutations (create, update and delete).

## Your first DAb instance

Sounds cool doesn't it? Well, let's go ahead and make a DAb server. The first thing we'll need to do is install the [DAb CLI](https://github.com/Azure/data-api-builder/blob/main/docs/dab-cli.md):

```bash
dotnet tool install --global Microsoft.DataApiBuilder
```

The CLI is used to help us generate our config file, but also to run a local version of DAb. I'm going to use DAb with a Cosmos DB backend, just to show you how to go about creating a data schema for Cosmos, so you'll either need a [local emulator]() or deployed Cosmos DB instance (I'm going to use the [cross-platform emulator in a devcontainer]({{<ref "/posts/2022-08-24-improved-local-dev-with-cosmosdb-and-devcontainers.md">}})).

Let's start by initialising the config file:

```bash
dab init --config dab-config.json --database-type cosmosdb_nosql --connection-string "..." --host-mode Development --cors-origin "http://localhost:3000" --cosmosdb_nosql-database Trivia --graphql-schema schema.graphql
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
        "origins": [
          "http://localhost:3000"
        ],
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

Since this is Cosmos DB and we don't have a database schema we can work with, we're going to need to create some types in GraphQL for DAb to use:

```graphql
type Question @model {
  id: String!
  question: String!
  correct_answer: String!
  incorrect_answers: [String!]!
}
```

This looks pretty standard as far as a GraphQL type is concerned, with the exception of a `@model` directive that's been applied to the type. This directive is required to tell DAb that this is a type that we want to generate a full schema for (queries and mutations), and not a type that is a child of another type (in the case of a nested JavaScript object).

With our schema defined, we have to tell DAb how to retrieve documents from Cosmos that match that type, and that's what the `entities` field in the config file is for. Let's use the CLI to define a new entity:

```bash

```