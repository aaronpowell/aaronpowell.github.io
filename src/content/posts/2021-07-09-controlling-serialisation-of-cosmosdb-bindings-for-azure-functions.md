+++
title = "Controlling Serialisation of CosmosDB Bindings for Azure Functions"
date = 2021-07-09T04:29:50Z
description = "Do you want to do changes to how CosmosDB serialises/deserialises data in the Azure Function bindings? Then have a read of this post."
draft = false
tags = ["azure", "serverless", "azure-functions", "dotnet"]
tracking_area = "dotnet"
tracking_id = "33392"
+++

While preparing the content for [the live stream I did today]({{<ref "/posts/2021-07-09-learn-about-fsharp-and-web-development.md">}}) I came across a problem with how the data in CosmosDB was being handled. The sample data set I was using was using camel-case for the field names, such as `correctAnswer` and `incorrectAnswer`, while the casing on the F# record types was pascal-case (`CorrectAnswer` and `IncorrectAnswer`), and this was causing problems in the serialisation/deserialisation of the data.

Since I was using the [input and output bindings for CosmosDB](https://docs.microsoft.com/azure/azure-functions/functions-bindings-cosmosdb-v2?{{<cda>}}) I don't control the serialisation/deserialisation of the data, so how do we get around this?

Under the hood the bindings use [Newtonsoft.Json](https://www.newtonsoft.com/json) and that has a singleton that we can set the global configuration on, but there's a problem, _where_ do we do that in a Functions project? we don't control the startup of the Function, so how do we set the configuration?

After some digging I came across the [`Microsoft.Azure.Functions.Extensions` NuGet package](https://www.nuget.org/packages/Microsoft.Azure.Functions.Extensions) ([source](https://github.com/Azure/azure-functions-dotnet-extensions)) which provides an `FunctionsStartup` class. Now this looks promising.

This class gives us a method `public abstract void Configure(IFunctionsHostBuilder builder)` which will be executed when it initialises the Functions. One of the uses for this class is to do dependency injection, by adding services to the `IFunctionsHostBuilder`, but in our case we don't need to do that, instead, we can use the method to setup our own configuration for JSON serialisation/deserialisation.

Here's the F# implementation:

```fsharp
module Startup

open Microsoft.Azure.Functions.Extensions.DependencyInjection
open Newtonsoft.Json
open Newtonsoft.Json.Serialization
open Newtonsoft.Json.Converters

type Startup() =
    inherit FunctionsStartup()

    override _.Configure(_: IFunctionsHostBuilder) : unit =
        let settings = JsonSerializerSettings()
        settings.ContractResolver <- CamelCasePropertyNamesContractResolver()

        DiscriminatedUnionConverter() |> settings.Converters.Add
        StringEnumConverter() |> settings.Converters.Add

        JsonConvert.DefaultSettings <- (fun _ -> settings)

[<assembly: FunctionsStartup(typeof<Startup>)>]
do ()
```

In the `Configure` method we're creating a new instance of the `JsonSerializerSessions`, setting the default contract resolver to be the `CamelCasePropertyNamesContractResolver` and then adding a few additional converters (to play nicer with F# types) before setting this as the default settings.

To make the Function host aware of this class we need to add the assembly-level attribute `FunctionsStartup` (with the `typeof` reference), and now we're controlling how the input and output binding for CosmosDB works.

Hopefully this help you the next time you're wanting to apply global configuration to Azure Functions.
