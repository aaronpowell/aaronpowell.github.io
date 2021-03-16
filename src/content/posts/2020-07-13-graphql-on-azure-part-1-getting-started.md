+++
title = "GraphQL on Azure: Part 1 - Getting Started"
date = 2020-07-13T14:45:30+10:00
description = "Let's get started looking at GraphQL on Azure"
draft = false
tags = ["azure", "serverless", "azure-functions", "graphql"]
series = "graphql-azure"
series_title = "Getting Started"
tracking_area = "javascript"
tracking_id = "7129"
+++

I've done a few posts recently around using GraphQL, especially with [Azure Static Web Apps](https://azure.microsoft.com/services/app-service/static/?{{<cda>}}), and also [on some recent streams](https://www.youtube.com/channel/UCT1QtGr1IzVPNSF_YMrKCAw). This has led to some questions coming my way around the best way to use GraphQL with Azure.

Let me start by saying that I'm by no means a GraphQL expert. In fact, I've been quite skeptical of GraphQL over the years.

{{< tweet 677064094784991232 >}}

This tweet here was my initial observation when I first saw it presented back in 2015 (and now I use it [to poke fun at friends now](https://twitter.com/slace/status/1132145211197411335)) and I still this there are some metis in the comparison, even if it's not 100% valid.

So, I am by no means a GraphQL expert, meaning that in this series I want to share what my perspective is as I come to looking at how to be do GraphQL with Azure, and in this post we'll look at how to get started with it.

## Running GraphQL on Azure

This question has come my way a few times, "how do you run GraphQL on Azure?" and like any good problem, the answer to it is a solid _it depends_.

When I've started to unpack the problem with people it comes down to wanting to find a service on Azure that does GraphQL, in the same way that you can use something like AWS Amplify to create a GraphQL endpoint for an application. Presently, Azure doesn't have this as a service offering, and to have GraphQL _as a service sounds_ is a tricky proposition to me because GraphQL defines how you interface as a client to your backend, but not how your backend works. This is an important thing to understand because the way you'd implement GraphQL would depend on what your underlying data store is, is it Azure SQL or CosmosDB? maybe it's Table Storage, or a combination of several storage models.

So for me the question is really about how you run a GraphQL server and in my mind this leaves two types of projects; one is that it's a completely new system you're building with no relationship to any existing databases or backends that you've got\* or two you're looking at how to expose your existing backend in a way other than REST.

_\*I want to point out that I'm somewhat stretching the example here. Even in a completely new system it's unlikely you'd have zero integrations to existing systems, I'm more point out the two different ends of the spectrum._

If you're in the first bucket, the world is your oyster, but you have the potential of choice paralysis, there's no _single thing_ to choose from in Azure, meaning you have to make a lot of decisions to get up and running with GraphQL. This is where having a service that provides you a GraphQL interface over a predefined data source would work really nicely and if you're looking for this solution I'd love to chat more to provide that feedback to our product teams (you'll find my contact info [on my About page]({{<ref "/about">}})). Whereas if you're in the second, the flexibility of not having to conform to an existing service design means it's easier to integrate into. What this means is that you need some way to host a GraphQL server, because when it comes down to it, that's the core piece of infrastructure you're going to need, the rest is just plumbing between the queries/mutations/subscriptions and where your data lives.

## Hosting a GraphQL Server

There are implementations of GraphQL for [lots of languages](https://graphql.org/code/) so whether you're a .NET or JavaScript dev, Python or PHP, there's going to be an option for you do implement a GraphQL server in whatever language you desire.

Let's take a look at the options that we have available to us in Azure.

### Azure Virtual Machines

[Azure Virtual Machines](https://azure.microsoft.com/services/virtual-machines/?{{<cda>}}) are a natural first step, they give us a really flexible hosting option, you are responsible for the infrastructure so you can run whatever you need to run on it. Ultimately though, a VM has some drawbacks, you're responsible for the infrastructure security like patching the host OS, locking down firewalls and ports, etc..

Personally, I would skip a VM as the management overhead outweighs the flexibility.

### Container Solutions

The next option to look at is deploying a GraphQL server within a Docker container. [Azure Kubernetes Service (AKS)](https://azure.microsoft.com/services/kubernetes-service/?{{<cda>}}) would be where you'd want to look if you're looking to include GraphQL within a larger Kubernetes solution or wanting to use Kubernetes as a management platform for your server. This might be a bit of an overkill if it's a standalone server, but worthwhile if it's part of a broader solution.

My perferred container option would be [Azure Web Apps for Containers](https://docs.microsoft.com/azure/app-service/containers/?{{<cda>}}). This is an alternative to the standard App Service (or App Service on Linux) but useful if you're runtime isn't one of the supported ones (runtimes like .NET, Node, PHP, etc.). App Service is a great platform to host on, it gives you plenty of management over the environment that you're running in, but keeps it very much in a PaaS (Platform as a Service) model, so you don't have to worry about patching the host OS, runtime upgrades, etc., you just consume it. You have the benefit of being able to scale both up (bigger machines) and out (more machines), building on top of an backend system allows for a lot of scale in the right way.

### Azure Functions

App Service isn't the only way to run a Node.js GraphQL service, and this leads to my preference, [Azure Functions](https://docs.microsoft.com/azure/azure-functions/functions-overview?{{<cda>}}) with [Apollo Server](https://www.apollographql.com/docs/apollo-server). The reason I like Functions for GraphQL is that I feel GraphQL fits nicely in the Serverless design model nicely (not to say it doesn't fit others) and thus Functions is the right platform for it. If the kinds of use cases that you're designing your API around fit with the notion of the on-demand scale that Serverless provides, but you do have a risk of performance impact due to cold start delays (which can be addressed with [Always On plans](https://docs.microsoft.com/azure/azure-functions/functions-scale?{{<cda>}}#cold-start)).

## Summary

We're just getting started on our journey into running GraphQL on Azure. In this post we touched on the underlying services that we might want to look at when it comes to looking to host a GraphQL server, with my pick being Azure Functions if you're doing a JavaScript implementation, App Service and App Service for Containers for everything else.

As we progress through the series we'll look at each piece that's important when it comes to hosting GraphQL on Azure, and if there's something specific you want me to drill down into in more details, please let me know.
