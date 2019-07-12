+++
title = "Using FSharp with Table Storage and Azure Functions"
date = 2019-07-12T15:02:01+10:00
description = "A quick look at how to use the FSharp.Azure.Storage package in Azure Functions"
draft = false
tags = ["fsharp", "azure-functions", "serverless"]
+++

I've been doing a lot of work recently with [Azure Functions](https://azure.microsoft.com/en-us/services/functions/?{{< cda >}}) in which I use [Table Storage](https://azure.microsoft.com/en-us/services/storage/tables/?{{< cda >}}) as the backend for it. This led me to start using the [FSharp.Azure.Storage](https://github.com/fsprojects/FSharp.Azure.Storage) NuGet package which gives a nicer API for Table Storage (and also happens to be written by a former colleague of mine).

But there's a catch, `FSharp.Azure.Storage` is designed to work with the `CloudTableClient` which you would normally get like so:

```fsharp
open Microsoft.WindowsAzure.Storage
open Microsoft.WindowsAzure.Storage.Table

let account = CloudStorageAccount.Parse "UseDevelopmentStorage=true;" //Or your connection string here
let tableClient = account.CreateCloudTableClient()

let inGameTable game = inTable tableClient "Games" game
```

But when we're using an Azure Function we're likely doing a binding in our Function parameter, like this:

```fsharp
[<FunctionName("Some_Function")>]
let someFunction ([<HttpTrigger(AuthorizationLevel.Function, "get", Route = "some-function")>] req: HttpRequest)
                 ([<Table("MyData")>] dataTable: CloudTable) =
    // do stuff
```

Notice that here we'll receive a `CloudTable`, which has already been created from the `CloudTableClient`. This is because Azure Functions takes care of the creation and "connection pooling" (for lack of a better description) so that we don't need to do it ourselves as the Functions scale. We also need the name of the table that we're working with, again we don't need to worry about that in our Function, since we already have the `CloudTable`.

Thankfully, we can go from a `CloudTable` back to the `CloudTableClient` and get the name of the table at the same time. To do this I've created some new functions in my F# codebase:

```fsharp
module azureTableUtils
open FSharp.Azure.Storage.Table
open Microsoft.WindowsAzure.Storage.Table

let fromTableToClientAsync (table: CloudTable) q = fromTableAsync table.ServiceClient table.Name q
let fromTableToClient (table: CloudTable) q = fromTable table.ServiceClient table.Name q

let inTableToClientAsync (table: CloudTable) o = inTableAsync table.ServiceClient table.Name o
let inTableToClient (table: CloudTable) o = inTable table.ServiceClient table.Name o

let inTableToClientAsBatch (table: CloudTable) o = inTableAsBatch table.ServiceClient table.Name o
let inTableToClientAsBatchAsync (table: CloudTable) o = inTableAsBatchAsync table.ServiceClient table.Name o
```

From the `CloudTable` you can access the `ServiceClient` to get the `CloudTableClient` and `Name` gives you the name!

Now we can use it in our Azure Function like so:

```fsharp
[<FunctionName("Some_Function")>]
let someFunction ([<HttpTrigger(AuthorizationLevel.Function, "get", Route = "some-function")>] req: HttpRequest)
                 ([<Table("MyData")>] dataTable: CloudTable) =
    async {
        let! data = Query.all<MyData>
                    |> fromTableToClientAsync dataTable

        let! data
             |> Seq.map (fun (d, _) ->
                 { d with Value = "Updated" })
             |> Replace
             |> autobatch
             |> List.map (inTableToClientBatch dataTable)
             |> Async.Parallel

        return OkResult() :> IActionResult
    } |> Async.StartAsTask
```

Feel free to use those functions in your own applications. You will have to explcitly type the `table` argument as `CloudTable` as the F# type inference isn't able to pick up that that's what it is otherwise.

Happy F#'ing!
