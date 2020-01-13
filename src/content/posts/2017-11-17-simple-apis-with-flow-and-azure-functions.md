+++
title = "Simple APIs With Microsoft Flow And Azure Functions"
date = 2017-11-17T10:04:08+11:00
description = "How to use Microsoft Flow and Azure Functions to create simple demo APIs"
draft = false
tags = ["flow", "serverless", "azure-functions"]
+++

When I'm working on demos for a blog post/talk/OSS project/etc. I will tend to just create an ASP.NET Core app or Node.js app and throw it somewhere for hosting. But it's always a little tedious, no matter how many times I do it it requires me to dig up my old boilerplate code and then put it somewhere.

Recently I was wanting to create a PoC but I wanted to have data persistence to it, I don't really care how I persist the data, just it needs persisting. Standing up an Azure SQL instance was overkill, it's a PoC so I'm likely to have a dozen records in it. Ok, well I guess I can just write it to a file on disk, but that's not really great as an AppService, next deployment will just kill it, so I thought why not use an Azure Table.

Well that's easy enough, but there's a bunch of code I'd need to write to get it all working when really I just want to send some values and store them to retrieve from another API call.

Well this is really a lot of work for something that is a very minor part of the problem I'm trying to solve, and I feel like there's a bunch of shawn yaks around in my future...

## Enter Microsoft Flow

I've been playing with [Microsoft Flow](https://flow.microsoft.com/?{{< cda >}}) for a while, it's a nice way to do automation, it's similar to [IFTTT](https://ifttt.com/) but integrates nicely with O365 and other MS services. One Connectors of Flow that I like is the HTTP connection which created a HTTP endpoint that you can use to invoke your Flow!

So this sounds like a neat starting point isn't it? I can create a Flow that is a HTTP endpoint and then there's an [Azure Table Storage connector](https://docs.microsoft.com/en-au/connectors/azuretables/?{{< cda >}}) that can write to or read from Table Storage.

Well then, this looks nice and easy doesn't it!

![Flow endpoint](/images/flow-functions/001.PNG)

But there's a few downsides to using Flow as a HTTP endpoint though, one is the URL that's generated, it looks something like this:

```
https://prod-21.australiasoutheast.logic.azure.com/workflows/77d8f1dfb5304131918db56d667b6bd8/triggers/manual/paths/invoke/api/task?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=HRN8KhwMbox9fbsGXJRG9y-As4VQkMilRgMe2NbqQ2A
```

Yeah that's not particularly simple a URL to use. The other problem is that if you're building anything CRUD you're going to have a bunch of different URLs that you have to use, as each Flow will have a unique URL (sure, you could get around this by having the Flow accept many different HTTP methods and then branch internally based on what it was, but that would make the Flow complex).

## Enter Azure Function Proxies

[Azure Functions](https://azure.microsoft.com/en-us/services/functions/?{{< cda >}}) is Microsoft's entry in the Serverless architecture and it has a neat feature of it call [Function Proxies](https://docs.microsoft.com/en-us/azure/azure-functions/functions-proxies?{{< cda >}}).

Function Proxies are exactly what they sound like, a proxy to another endpoint (or you can use it to mock an endpoint). Now you can probably see where I'm going with this, creating a proxy to wrap the Flow URL with a proxy!

![Proxies wrapping Flow](/images/flow-functions/002.PNG)

This now gives me a nice friendly URL from the Azure Function, I can define a route template (eg: `/api/tasks`) to hang off the hostname I get from the Azure Functions.

Now I'm able hide my Flow URLs be something that's easy to consume from my application, and if my PoC was to become a real application I can just swap out the Flow URL in the Proxies to either be another AppService or to be Azure Functions.

## Conclusion

It's pretty easy to use create an Azure Function Proxy that will wrap around your ugly URL's for testing. I used Flow for this but you could also use [Logic Apps](https://azure.microsoft.com/en-us/services/logic-apps/?{{< cda >}}), which are the same infrastructure as Flow but they are part of the Azure Portal (rather than a separate service) and have easier integration with a CI/CD pipeline, or the Azure CLI.