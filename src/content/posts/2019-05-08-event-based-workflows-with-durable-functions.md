---
title: "Creating Event-Based Workflows With Azure Durable Functions"
date: 2019-05-08T10:37:32+10:00
description: "How to orchestrate event-based workflows using Azure Durable Functions"
draft: false
tags: ["azure-functions", "fsharp", "csharp", "javascript"]
---

[Durable Functions](https://docs.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-overview?{{< cda >}}) is an extension of the [Azure Functions](https://docs.microsoft.com/en-us/azure/azure-functions/?{{< cda >}}) serverless stack that introduces state management and orchestration across functions without the need to write the plumbing code yourself.

Today, I want to take a look at the scenario of creating a client-driven event workflow system. Our client will initiate a request and that will start a workflow. We'll use the [HTTP binding](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-http-webhook?{{< cda >}}) for our function and also pass in the [`OrchestrationClient`](https://docs.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-bindings?{{< cda >}}#orchestration-client):

```fsharp
[<FunctionName("StartWorkflow")>]
let startWorkflow
    ([<HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "start/{input}")>] req : HttpRequest)
    ([<OrchestrationClient>] starter : DurableOrchestrationClient)
    input
    (logger : ILogger) =
    task {
        logger.LogInformation(sprintf "Starting a new workflow for %s" input)
        let! _ = starter.StartNewAsync(eventName, input)
        return OkResult()
    }
```

The route has a parameter, `input`, that's passed in and we'll use that as our identifier across API calls (you could use the `instanceId` returned from starting the workflow instead if you want) otherwise there's nothing overly complex here, we use the `DurableOrchestrationClient` to start the workflow using `StartNewAsync(<name of instance>, <data for instance>)`.

Now we'll need to create our workflow function. This will use the [`OrchestrationTrigger`](https://docs.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-bindings?{{< cda >}}#orchestration-triggers):

```fsharp
module Workflow

open Microsoft.Azure.WebJobs
open Microsoft.Extensions.Logging
open FSharp.Control.Tasks.V2.ContextInsensitive

let eventName = "Workflow"

[<FunctionName("Workflow")>]
let run
    ([<OrchestrationTrigger>] context : DurableOrchestrationContext)
    (logger : ILogger) =
    task {
        let input = context.GetInput<string>()
        sprintf "Starting workflow for %s" input |> logger.LogInformation
        do! context.WaitForExternalEvent(eventName)
        sprintf "Workflow for %s is stopping" input |> logger.LogInformation
    }
```

The module defines the name of the event, `Workflow`, that we used in the first function, in then unpacks the data passed in using `context.GetInput<string>()` and then tells the function to sleep until an event is triggered using `context.WaitForExternalEvent(eventName)`.

Now, this `WaitForExternalEvent` is an important function, what it's doing is telling our function that something outside of its control will be controlling its execution and that it should go to sleep until that event is triggered, and that event must be triggered on the specific instance as well. This function is now "sleeping" and not consuming resources (or money) and can sleep for as long as you need it to do. It also returns a `Task`, meaning it's async, so you could combine it with a timer and have it only sleep for a period of time if you wanted.

The next function that we're going to create is an HTTP endpoint to check the status of the workflow. This function would be one that you call from the client in a polling manner to perform an action once the workflow has completed.

```fsharp
[<FunctionName("CheckWorkflow")>]
let checkWorkflow
    ([<HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "check/{input}")>] req : HttpRequest)
    ([<OrchestrationClient>] starter : DurableOrchestrationClient)
    input
    (logger : ILogger) =
    task {
        logger.LogInformation(sprintf "Checking workflow for %s" input)

        let offset = TimeSpan.FromMinutes 20.
        let time = DateTime.UtcNow

        let! instances = starter.GetStatusAsync
                                 (time.Subtract offset,
                                  Nullable(time.Add offset),
                                  System.Collections.Generic.List<OrchestrationRuntimeStatus>(),
                                  CancellationToken.None)

        return OkObjectResult(instances |> Seq.find (fun i -> i.Name = eventName && i.Input.ToObject<string>() = input))
    }
```

We're using the `HttpTrigger` again and also getting an `OrchestrationClient` provided, but this time we're using the client to search for all running workflow instances via the `GetStatusAsync` method (I'm also providing a date range for the search so that it doesn't find everything in my storage account). Once we have all the instances I'm then looking for any that match the `input` that is passed in, but if you were using the `instanceId` you could filter against that. The function then returns an object containing the found instance. This would allow the client to check against it for whether it's completed or not and make a decision on what to do in the client.

Our workflow can be started, we are able to poll it and check its status, now it's time to implement a way to invoke the event and complete the workflow:

```fsharp
[<FunctionName("StopWorkflow")>]
let stopWorkflow
    ([<HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "stop/{input}")>] req : HttpRequest)
    ([<OrchestrationClient>] starter : DurableOrchestrationClient)
    input
    (logger : ILogger) =
    task {
        logger.LogInformation(sprintf "Stopping workflow for %s" input)

        let offset = TimeSpan.FromMinutes 20.
        let time = DateTime.UtcNow

        let! instances = starter.GetStatusAsync
                                 (time.Subtract offset,
                                  Nullable(time.Add offset),
                                  System.Collections.Generic.List<OrchestrationRuntimeStatus>(),
                                  CancellationToken.None)

        return! match instances |> Seq.tryFind (fun i -> i.Name = eventName && i.Input.ToObject<string>() = input) with
                | Some instance ->
                    task {
                        logger.LogInformation(sprintf "Found a matching instance with id %s" instance.InstanceId)
                        do! starter.RaiseEventAsync(instance.InstanceId, eventName, input)
                        return OkObjectResult(instance) :> IActionResult
                    }

                | None ->
                    task {
                        sprintf "Didn't find a matching instance for %s" input |> logger.LogInformation

                        return NotFoundResult()
                    }
    }
```

We're performing a similar bit of searching logic here to find our workflow instance and if it's found we use the `DurableOrchestrationClient` `RaiseEventAsync` method and provide it with the ID of the workflow instance and the event name that we are waiting for, plus any input that we want to pass for the event.

This event will be raised asynchronously and the Workflow function will resume at the point it was waiting for the event, then run through to completion. The important part here is that it is **asynchronous**, meaning that if you were to poll immediately afterwards then the status _might_ not be completed, because the Workflow function might not have triggered/run to completion.

## Conclusion

Here we have an example of using events in Durable Functions to control a background job. Admittedly, we've used HTTP endpoints to trigger each step of the way but there is no reason why the "stop" function couldn't be written to wait for an item being written to Blob storage or any other Function trigger.

It's also worth remembering that this processing is all handled asynchronously, so you could wait for multiple events and use a `Task.WhenAny` to only wait for one event to be triggered, or combine with a timeout so you only wait for an event for a predefined period of time.

If you want to have a try yourself I've created [a sample on GitHub](https://github.com/aaronpowell/durable-functions-workflow-demo) with implementations in [F#](https://github.com/aaronpowell/durable-functions-workflow-demo/tree/master/fsharp), [C#](https://github.com/aaronpowell/durable-functions-workflow-demo/tree/master/csharp) and [JavaScript](https://github.com/aaronpowell/durable-functions-workflow-demo/tree/master/javascript).