+++
title = "Introducing FSharp.CosmosDb"
date = 2020-03-16T20:19:50+11:00
description = "Introducing a library to make Cosmos DB easier with F#"
draft = false
tags = ["fsharp", "azure", "cosmosdb"]
+++

I've recently been doing some work with [Cosmos DB](https://docs.microsoft.com/en-us/azure/cosmos-db/introduction?{{<cda>}}) and not just because [there was a free tier announced](https://docs.microsoft.com/en-gb/azure/cosmos-db/optimize-dev-test?{{<cda>}}#azure-cosmos-db-free-tier) at the start of March (although that's appealing! 😉).

One of the main use cases I have for it is to replace the [Table Storage](https://azure.microsoft.com/en-us/services/storage/tables/?{{<cda>}}) backend of my [IoT project]({{<ref "/posts/2019-05-30-home-grown-iot-prologue.md">}}) with something a bit more flexible, and this means that I'm writing F#.

## Cosmos DB for .NET

When it comes to working with Cosmos DB in .NET the Azure SDK team is working on a [v4 SDK](https://docs.microsoft.com/en-gb/azure/cosmos-db/create-sql-api-dotnet-v4?{{<cda>}}) that I decided to use (even though it's still in preview).

Unfortunately, the SDK doesn't feel particularly friendly to F# developers, mainly because it relies on the .NET `Task` API rather than F#'s `Async`, so I wanted to make something that felt a bit more like F# code.

## Introducing `FSharp.CosmosDb`

To this end I've created [FSharp.CosmosDb](https://github.com/aaronpowell/FSharp.CosmosDb), a wrapper API over the top of the .NET SDK. The initial release is up [on NuGet](https://www.nuget.org/packages/FSharp.CosmosDb) and currently supports querying for data:

```fsharp
open FSharp.CosmosDb

let host = "https://..."
let key = "..."
let findUsers() =
    host
    |> Cosmos.host
    |> Cosmos.connect key
    |> Cosmos.database "UserDb"
    |> Cosmos.container "UserContainer"
    |> Cosmos.query "SELECT u.FirstName, u.LastName FROM u WHERE u.LastName = @name"
    |> Cosmos.parameters [ "name", box "Powell" ]
    |> Cosmos.execAsync<User>
```

### Breaking It Down

Here we've got a pipe-able API, starting with the host endpoint for our Cosmos instance, then providing the authorisation key. This will allow us to setup a connection to Cosmos and then we can start working with it. Then we can specify the database and container that we'll work with before writing a query and providing parameters (if required).

The last step is `Cosmos.execAsync<'T>` which takes a type argument that we want to unpack our query results into. This will provide an [`AsyncSeq`](http://fsprojects.github.io/FSharp.Control.AsyncSeq/index.html) for you to iterate over asynchronously. Until you run `Cosmos.execAsync<'T>` nothing has happened with Cosmos, in fact, it uses a record type to wrap up the information provided so you can pass it around easily.

### Some Notes

This first version is a little rough around the edges, I won't deny that, so here's a few things to be aware of:

-   The argument for `Cosmos.parameters` is `(string * object) list` so you have to `box` the value argument. This is because the underlying API takes an object value, but if anyone can think a better approach let me know
-   If the type provided to `execAsync` is a record type it must be marked as `[<CLIMutable>]`. I need to find a way to work around that so we can use plain record types
-   It doesn't support connection string connections, only host + key access (easy fix, just requires some time)
-   I haven't written docs yet, sorry!

## Conclusion

I hope you find this useful, I'm going to keep plugging away at adding features to the API and make it more feature compatible with the full .NET SDK. In the mean time if you try it out let me know what you think. 😊
