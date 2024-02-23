+++
title = "Exploring OpenAI With Aspire Preview 3"
date = 2024-02-22T02:04:24Z
description = "With Aspire Preview 3 there is a new service connector for OpenAI, let's check it out."
draft = false
tags = ["dotnet", "ai"]
tracking_area = "dotnet"
tracking_id = ""
+++

I've been exploring [.NET Aspire](https://learn.microsoft.com/dotnet/aspire/?{{<cda>}}) as a pattern for how to build .NET apps, and when checking the features of the [Preview 3 release](https://github.com/dotnet/aspire/discussions/2205) I noticed something interesting, a new service connector for using OpenAI/Azure OpenAI. We knew this was coming, [I was following the PR for it](https://github.com/dotnet/aspire/pull/1475), and given I've been doing a lot of AI stuff it made sense to try it out.

Before we can use the service connector we need to setup the resource in the AppHost:

```csharp
var builder = DistributedApplication.CreateBuilder(args);
var openAI = builder.AddAzureOpenAI("AzureOpenAI");

builder.AddProject<MyApp>("app").WithResource(openAI);
builder.Build().Run();
```

In this case we're using the new `AddAzureOpenAI` resource builder method to create the resource definition, but if you don't want to use Azure you can use `AddOpenAI` instead. Next, the resource needs to be named, in this case I went to `AzureOpenAI`. This name is important because it's used to get the endpoint and key from config. Currently, this uses the _ConnectionStrings_ feature of the .NET config system, so I've added a section to my `appsettings.Development.json` like this:

```json
"ConnectionStrings": {
  "AzureOpenAI": "Endpoint=https://<my-endpoint>.openai.azure.com/;Key=<my-api-key>"
}
```

Admittedly, this setup isn't _ideal_ as the concept of a connection string doesn't really map to how the OpenAI SDK works, but that's being [discussed by the team](https://github.com/dotnet/aspire/issues/1765). Also, if you're using managed identity to connect you don't need the `Key` component of it.

It's also possible to define model deployments:

```csharp
openAI.AddDeployment("gpt-35-turbo");
```

So far, this doesn't seem to be used but it's laying the groundwork for the future where it'll be possible to deploy Azure OpenAI resources, which is currently not possible.

Anyway, we have the resource defined and added to our app, now we can use the service connector in the `MyApp` project:

```csharp
var builder = WebApplication.CreateBuilder();

builder.AddAzureOpenAI("AzureOpenAI");

// Finish configuring the app
```

Like with all Aspire resources, for the service connector we provide the same name that the resource was built as, `AzureOpenAI` in this case, and with the `AddAzureOpenAI` inject an instance of the `OpenAIClient` (from the [Azure.AI.OpenAI SDK](https://nuget.org/packages/azure.ai.openai), which is the same regardless of if you're doing OpenAI or Azure OpenAI).

And with that all setup, we can inject the `OpenAIClient` instance into anything we need to use it, such as in an API handler:

```csharp
api.MapGet("chat", (OpenAIClient client) => {
  // Do AI stuff
});
```

## Wrapping up

While it might seem like it's pretty trivial to setup the `OpenAIClient` to be injected in an application, I really like the direction that Aspire is taking with the service connectors. The fact that we can define the resource and inject it into the applications, allowing the resource to be shared across a set of services in your app makes it very convenient.

I'm not a fan of the "connection string" model for providing the credentials, so I'm following along with what the discussion is going to land on.

Also, while deployment isn't supported in Preview 3, I don't doubt that that is coming along for a future release, so I'm keen to play with that when it lands.

Until then, let's keep building!
