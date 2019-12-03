---
title: Stateful Serverless through Durable Functions
hidden: true
tags: ["serverless", "azure", "azure-functions", "dotnet", "javascript"]
duration: 45 minutes
abstract: |
  You’re introducing Serverless as a component within your application architecture and it’s great at solving the processing-at-scale problems that you have. But there’s one sticking point, how do you handle an operation that takes more than a few seconds to run? What happens when we have an asynchronous operation that needs to complete before you can respond to the caller? We don’t want our Serverless code waiting, that’ll become expensive quickly, instead we want to sleep for a period of time. This is where event sourcing comes in, but do you want to be building your own orchestration engine or managing state across restarts?

  Enter Azure Durable Functions; Durable Functions allow you to orchestrate a workflow of functions that can start background jobs and then sleep until they are needed.

  From long running asynchronous operations in HTTP APIs to fan out, monitoring processes to human interaction, Durable Functions can be used to solve a variety of different problems without the need to build your own event sourcing platform.

  In this talk we’ll look at some of the patterns that Durable Functions helps to solve through a series of live coding exercises that you can take away and experiment with yourself and apply to your own problems.

audience:
  - People developing with Serverless (cloud agnostic)
  - People exploring the use-cases of Serverless

notes: |
  This talk intends to give an overview of Durable Functions and the problems they solve through a series of live demos.

  One of the demos I will use is a game I have on GitHub (and can be done using .NET, depending on the audience).

  Other demos will include:

  * Shopping cart management and inventory reduction
  * HTTP API with a long-running background job
  * Bulk data processing through fan out

resources:
  - name: Serverless Days Melbourne 2019
    link: https://www.youtube.com/watch?v=pqrrVIWCk6w
  - name: Sessionize link
    link: https://sessionize.com/s/aaron-powell/stateful_serverless_through_durable/23585
---