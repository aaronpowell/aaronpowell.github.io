---
title: "TypeScript and GraphQL"
hidden: true
tags: ["typescript", "javascript", "serverless"]
duration: 45 minutes
abstract: |
    One of the nice things with GraphQL for API design is that it enforces type-safety in the schema that we define. But alas, these types are embedded as part of our schema and that type safety is lost for our resolvers, resolver variables, consuming clients and so on, requiring us to recreate the type system. It'd be so much easier if we could leverage our schema type system in our application.

    This sounds like a job for type generation, but how do we do that? We'll take a look at a tool that can generate you TypeScript type definitions, then implement our backend using them before looking at how they can plug into the front end with React (or Angular or Vue or Svelte or whatever is the framework of the month!).

    We'll cap off by learning how to model our storage platform effectively, using a separate type system for storage and combine them with the GraphQL schema types, producing a rich, strongly types, end-to-end development model.

audience:
    - TypeScript developers
    - GraphQL developers
    - Front end web devs looking to consume GraphQL

notes: |
    This session will walk through how to use [GraphQL Code Generator](https://graphql-code-generator.com/), and how I've implemented it on a number of projects.

resources:
    - name: BrisJS demo app
      link: https://github.com/aaronpowell/brisjs-graphql
    - name: Twitch stream
      link: https://www.youtube.com/watch?v=9t-pLcZEmoE
    - name: Type-Safe GraphQL at OpenJS World 2021
      link: https://www.youtube.com/watch?v=G2HUgV30EG4
---
