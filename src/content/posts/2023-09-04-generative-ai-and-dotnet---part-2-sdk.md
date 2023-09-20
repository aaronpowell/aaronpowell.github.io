+++
title = "Generative AI and .NET - Part 2 SDK"
date = 2023-09-04T23:55:34Z
description = "Let's take a look at the SDK for OpenAI and have we can use it."
draft = false
tags = ["dotnet", "ai"]
tracking_area = "dotnet"
tracking_id = "100129"
series = "ai-dotnet"
series_title = "The SDK"
+++

It's time to have a look at how we can build the basics of an application using [Azure OpenAI Services](https://learn.microsoft.com/azure/ai-services/openai/overview?{{<cda>}}) and the .NET SDK. Remember, while I will be using AOAI in here everything is going to be applicable to OpenAI itself as well, so if you're using that you can still follow along (I just happen to use AOAI as then I can test it for the product team).

## Getting Started

Before we install the SDK it's important to know how we work with these services, and that is via the REST API that they publish. Azure OpenAI Service has [docs on their REST API](https://learn.microsoft.com/azure/ai-services/openai/reference?{{<cda>}}) but I find them a little unfriendly to read (at least, at the time of writing this blog post) compared to the REST API docs from [OpenAI directly](https://platform.openai.com/docs/api-reference).

But if you look at them, you'll notice that the Open API spec (swagger) is the same for both, so you can use the OpenAI docs to get a better understanding of the API, the parameters and how to call it. The only real difference is the endpoint, OpenAI or your AOAI instance, and the authentication method.

## Installing the SDK

While it's useful to understand the underpinnings of all this, you're probably not going to want to use the REST API directly, instead we'll use the .NET SDK for that, which you'll find on NuGet as [`Azure.AI.OpenAI`](https://www.nuget.org/packages/azure.ai.openai). Yes, there are others out there on NuGet but this is the official one from Microsoft, so I'm going to use that.

## Creating a Client

The first thing we need to do is create a client, and we do that by creating an instance of the `OpenAIClient` class, which is in the `Azure.AI.OpenAI` namespace. Depending on whether you're using it with AOAI or OpenAI, the constructor you choose is going to be different.

```csharp
// Creating a client for AOAI
OpenAIClient client = new OpenAIClient(new Uri("https://<your service>.openai.azure.com"), new Azure.AzureKeyCredential("<your AOAI API key>"));

// Creating a client for OpenAI
client = new OpenAIClient("<your OpenAI API key>");
```

From then on it doesn't matter if you're using AOAI or OpenAI, the rest of the code is the same, since it's the same type, `OpenAIClient`, that is used to interact with the service.

## Generating Chat Completions

Now that we have a client, let's have a look at how to get it to do something, and that something will be to generate a chat completion. Don't worry if you're not familiar with what a chat completion is, we'll dive into that properly in the next post, but for now consider it as the most common way you would work with the service.

To generate a chat completion we need to call the `GetChatCompletionsAsync` method, passing in the model we want to use, and the prompt to complete:

```csharp
ChatCompletionsOptions options = new(new[] { new ChatMessage(ChatRole.User, "What is the colour of the sky?") });

string model = "<deployment name or GPT model>";

Response<ChatCompletions> completion = await client.GetChatCompletionsAsync(model, options);

foreach (ChatChoice choice in completions.Value.Choices)
{
    string content = choice.Message.Content;

    Console.WriteLine(content);
}
```

This gave me the response of:

> The color of the sky can vary depending on factors such as time of day, weather conditions, and location. Generally, during the day when the sun is out, the color of the sky is blue. At sunset or sunrise, the sky can turn shades of red, orange, and pink. At night, the sky can appear black or dark blue with stars visible.

You might be wondering though, what do you provide for the `model` parameter? Well, this will depend on which service you are using, if it's AOAI you will first [deploy a model](https://learn.microsoft.com/azure/ai-services/openai/concepts/models?{{<cda>}}) and then use the name of that deployment, if it's OpenAI you will use the name of the model, such as `gpt-3.5-turbo`.

## Conclusion

Congratulations, we have created our very first call to OpenAI and generated a chat completion response from a prompt (that was admittedly hard-coded). If you want to have a play around with this, I've created a [Polyglot Notebook](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.dotnet-interactive-vscode) that you can check out [in my website repo](https://github.com/aaronpowell/aaronpowell.github.io/blob/main/notebooks/2023-09-04-generative-ai-and-dotnet---part-2-sdk.ipynb).

In the next post we'll take a proper look at what chat completions are, and how we can use them.
