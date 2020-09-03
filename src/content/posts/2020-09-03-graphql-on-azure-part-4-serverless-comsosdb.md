+++
title = "GraphQL on Azure: Part 4 - Serverless CosmosDB"
date = 2020-09-03T16:04:32+10:00
description = "Let's take a look at how to integrate a data source with GraphQL on Azure"
draft = true
tags = ["azure", "serverless", "azure-functions", "dotnet"]
series = "graphql-azure"
series_title = "CosmosDB and GraphQL"
+++

A few months ago [I wrote a post]({{<ref "/posts/2020-04-07-using-graphql-in-azure-functions-to-access-cosmosdb.md">}}) on how to use GraphQL with CosmosDB from Azure Functions, so this post might feel like a bit of a rehash of it, with the main difference being that I want to look at it from the perspective of doing .NET integration between the two.

The reason I wanted to tackle .NET GraphQL with Azure Functions is that it provides a unique opportunity, being able to leverage [Function bindings](https://docs.microsoft.com/azure/azure-functions/functions-triggers-bindings?{{<cda>}}). If you're new to Azure Functions, bindings are a way to have the Functions runtime provide you with a connection to another service in a read, write or read/write mode. This could be useful in the scenario of a function being triggered by a file being uploaded to storage and then writing some metadata to a queue. But for todays scenario, we're going to use a HTTP triggered function, our GraphQL endpoint, and then work with a database, [CosmosDB](https://docs.microsoft.com/azure/cosmos-db/?{{<cda>}}).

_Why CosmosDB? Well I thought it might be timely given they have just launched a [consumption plan](https://docs.microsoft.com/azure/cosmos-db/serverless?{{<cda>}}) which works nicely with the idea of a serverless GraphQL host in Azure Functions._

While we have looked at using [.NET for GraphQL]({{<ref "/posts/2020-07-21-graphql-on-azure-part-2-app-service-with-dotnet.md">}}) previously in the series, for this post we're going to use a different GraphQL .NET framework, [Hot Chocolate](https://hotchocolate.io/), so there's going to be some slightly different types to our previous demo, but it's all in the name of exploring different options.

## Getting Started

At the time of writing, Hot Chocolate doesn't **officially** support Azure Functions as the host, but there is a [proof of concept from a contributor](https://github.com/oneCyrus/GraphQL-AzureFunctions-HotChocolate/) that we'll use as our starting point, so start by creating a new [Functions project](https://docs.microsoft.com/azure/azure-functions/functions-create-first-azure-function-azure-cli?tabs=bash%2Cbrowser&pivots=programming-language-csharp&{{<cda>}}):

```bash
func init dotnet-graphql-cosmosdb --dotnet
```