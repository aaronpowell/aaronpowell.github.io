+++
title = "Azure Functions With F#"
date = 2019-03-05T14:24:36+11:00
description = "How to create an Azure Function using F#"
draft = false
tags = ["fsharp", "serverless", "azure-functions"]
+++

I'm starting to work on a new project in which I'm going to use [Azure Functions v2](https://docs.microsoft.com/en-us/azure/azure-functions/?{{< cda >}}) for a simple API backend.

Azure Functions support a number of different languages such as [Java](https://azure.microsoft.com/en-us/blog/announcing-the-general-availability-of-java-support-in-azure-functions/?{{< cda >}}), [Python (in preview at time of writing)](https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-first-function-python?{{< cda >}}), [TypeScript (and naturally JavaScript)](https://azure.microsoft.com/en-us/blog/improving-the-typescript-support-in-azure-functions/?{{< cda >}}) and of course C#. So with all those to pick from what would I want to choose?

Well, naturally I decided to go with F#, which _kind of_ worked in v1. And after all, it's a CLR language so there's no reason it shouldn't work in v2 like C# does.

But unfortunately there's no templates available, so getting started seems to be a bit trickier.

## Creating an F# Functions Application

To create a F# Functions Application the easiest approach is to follow the [Visual Studio Code instructions](https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-first-function-vs-code?{{< cda >}}) to get the extensions installed.

Once VS Code is ready to go we'll create a new [New Functions Project](https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-first-function-vs-code?{{< cda >}}#create-an-azure-functions-project) choosing C# as the language.

Now comes the tricky part, rename your `csproj` file to `fsproj` and add a reference to `FSharp.Core`.

**And you're done!**

Ok, it wasn't really that tricky was it! Since it's all on the CLR and it's a .NET Core application the `dotnet` cli tools will just work! You'll even get debugging support from within VS Code of your F# Functions.

Now you're ready to create a function with F#!

Here's a basic HTTP trigger:

```fsharp
module HttpTrigger

open Microsoft.Azure.WebJobs
open Microsoft.AspNetCore.Mvc
open Microsoft.Azure.WebJobs.Extensions.Http
open Microsoft.AspNetCore.Http
open System.IO
open System.Text

[<FunctionName("HttpTrigger")>]
let httpTriggerFunction ([<HttpTrigger(AuthorizationLevel.Function, "post", Route = null)>] req : HttpRequest) =
    async {
        use reader = new StreamReader(req.Body, Encoding.UTF8)
        let! body = reader.ReadToEndAsync() |> Async.AwaitTask
        return OkObjectResult body
    } |> Async.StartAsTask
```

Be aware that if you're doing anything with `async` you'll need to convert it to `Task<'T>` for the return as the Functions host expects the C# Task API for async, not F#'s Async workflows 😦.

## Caveat's

There's a minor caveat to this whole thing, because the VS Code extension doesn't understand F# you can't use it to add new functions to your project, you have to manually do it, and you then have to know what NuGet packages that you require are going to be. I find it easy enough to just have another VS Code window open and create a C# one if I need to look up types and their packages.

You'll also find that the `.vscode/settings.json` file contains `"azureFunctions.projectLanguage": "C#"`. You can change that to `F#` if you want, but it'll give you a warning because the extension doesn't understand it. I leave it as C# because it doesn't bother me.

## Conclusion

While the tooling might not be there, creating an Azure Function with F# really isn't that big a deal.