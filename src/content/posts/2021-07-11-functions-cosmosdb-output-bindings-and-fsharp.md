+++
title = "Azure Functions, F# and CosmosDB Output Bindings"
date = 2021-07-11T23:25:38Z
description = "Let's look at how to work with Azure Functions output bindings from F#, specifically for CosmosDB"
draft = false
tags = ["serverless", "azure", "functions", "dotnet", "fsharp"]
tracking_area = "dotnet"
tracking_id = "34893"
+++

While building the [demo application](https://github.com/aaronpowell/ondotnet-fsharp-complete) from [last weeks On .NET Live stream]({{<ref "/posts/2021-07-09-learn-about-fsharp-and-web-development.md">}}) I was needing to do some writing of data to CosmosDB and figured I'd use the [output bindings](https://docs.microsoft.com/azure/azure-functions/functions-bindings-cosmosdb-v2-output?tabs=csharp&{{<cda>}}). With the docs only containing C# examples (at least, at the time of writing), I thought I'd use this post to show how to do it in F#.

## `out` arguments

One way which we can use an output binding is to have an `out` argument, essentially somewhere that you're passing a reference to a variable that the host will send to CosmosDB. Since `out` is a C# keyword we need to use the F# equivalent, which is [`outref<T>`](https://docs.microsoft.com/dotnet/fsharp/language-reference/parameters-and-arguments?{{<cda>}}#passing-by-reference):

```fsharp
namespace Demo

type ToDo =
    { Id: string
      Description: string }

module CreateToDo =
    [<FunctionName("CreateGame")>]
    let run
        ([<QueueTrigger("todoqueueforwrite")>] queueMessage: string),
        ([<CosmosDB("ToDoItems", "Items", ConnectionStringSetting = "CosmosConnection")>] todo: outref<ToDo>)
        (log: ILogger)
        =
        todo <- { Id = Guid.NewGuid().ToString(); Description = queueMessage }

        log.LogInformation "F# Queue trigger function inserted one row"
        log.LogInformation (sprintf "Description=%s" queueMessage);
```

In this example, we have the `outref<ToDo>` as the second argument of our Function and we use the `<-` operator to do assignment to the mutable value (`outref` is a mutable reference, similar to `let mutable` makes a mutable binding).

## Dealing with `async`

Here's a slightly more challenging problem, if you're doing something that's requiring an asynchronous process to happen, like reading the request body, and then writing to the output binding, we can't use `outref<T>`, as the way async operations work (whether it's `Task` or `Async` based) means that you can't capture an `outref` parameter (nor in C# can you use an `out` parameter in an `async` function).

This is what the `IAsyncCollector<T>` is for, it gives us an interface which we can push output to from within an async operation.

```fsharp
namespace Demo

type ToDo =
    { Id: string
      Description: string }

module CreateToDo =
    [<FunctionName("CreateGame")>]
    let run
        ([<HttpTrigger(AuthorizationLevel.Function, "post", Route = null)>] req: HttpRequest)
        ([<CosmosDB("ToDoItems", "Items", ConnectionStringSetting = "CosmosConnection")>] todos: IAsyncCollector<ToDo>)
        (log: ILogger)
        =
        async {
            use stream = new StreamReader(req.Body)
            let! reqBody = stream.ReadToEndAsync() |> Async.AwaitTask

            do!
                { Id = Guid.NewGuid().ToString(); Description = reqBody }
                |> todos.AddAsync
                |> Async.AwaitIAsyncResult
                |> Async.Ignore

            return OkResult()
        } |> Async.AwaitTask
```

In this example, we're reading the `req.Body` stream and then creating a new record that is passed to the `IAsyncCollector.AddAsync`, and since it returns `Task`, not `Task<T>`, we need to ignore the result.

Lastly, we convert the `async` block to `Task<T>` using `Async.AwaitTask`, since the Functions host requires `Task<T>` to be returned. You could optimise this code using [Ply](https://github.com/crowded/ply) or [TaskBuilder.fs](https://github.com/rspeele/TaskBuilder.fs), but I kept it simple for this example.

## Conclusion

This post shows how we can use the CosmosDB output bindings for Azure Functions from F# in the two most common scenarios, outputting a single item directly or outputting an item as part of an async operation.

You'll find a much more complete example [in the demo app](https://github.com/aaronpowell/ondotnet-fsharp-complete) I built.
