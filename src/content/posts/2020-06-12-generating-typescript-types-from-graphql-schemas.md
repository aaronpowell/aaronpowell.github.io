+++
title = "Generating TypeScript Types From GraphQL Schemas"
date = 2020-06-12T16:44:27+10:00
description = "A continuation of my live streaming, this time looking at how to generate types from GraphQL."
draft = false
tags = ["javascript", "typescript", "web", "serverless"]
+++

Last week I did a live stream [on creating a web app with React, TypeScript and GraphQL]({{<ref "posts/2020-06-03-building-an-azure-static-web-app-with-graphql.md">}}) and there was a question that popped up on whether or not you could generate the TypeScript types from the GraphQL schema, as I was creating them by hand.

Today, I did a last-minute stream in which I showed how you could do it using [GraphQL Code Generator](https://graphql-code-generator.com/). It was really simple to integrate and what's more, I found a problem in the types I had written by hand relative to the GraphQL schema, so it's a win-win. I even showed off how the [pull request feature](https://docs.microsoft.com/azure/static-web-apps/review-publish-pull-requests?{{<cda>}}) of [Static Web Apps](https://docs.microsoft.com/azure/static-web-apps/?{{<cda>}}) works.

{{< youtube 9t-pLcZEmoE >}}
