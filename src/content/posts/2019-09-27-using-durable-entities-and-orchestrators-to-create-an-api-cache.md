+++
title = "Using Durable Entities and Orchestrators to Create an Api Cache"
date = 2019-09-27T09:01:28+10:00
description = "Let's look at how you can use Entities in Durable Functions v2 to create an API cache"
draft = false
tags = ["serverless", "fsharp", "azure-functions"]
+++

_This post is part of [#ServerlessSeptember](https://dev.to/azure/serverless-september-content-collection-2fhb), a month-long series we've been producing as part of the Cloud Advocate team._

I've been playing a bunch with [Durable Entities](https://docs.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-entities?{{<cda>}}) and I must say, I really love the experience of building with the framework, but what I find **really** cool is how it can integrate seamlessly with [Orchestrators](https://docs.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-orchestrations?{{<cda>}}) from Durable Functions v1.

For a demo I've been working on I need to pull data from an external API, but this API a) has a rate limit on it and b) can vary in the response time. Because of this I wanted to work out how I could cache the response from it for a period of time.

In a traditional API I would be doing this by writing to a data store (maybe Redis) and then keeping track of a timestamp when I wrote the data, and if it's stale I'd re-fetch the data and update it. But with Durable Entities we can persist some state without a whole lot of effort!

## Creating Our Entity

Let's create a generic base for our cache and implement it (we'll just cache `string array` in our API, but you could use anything here):

```fsharp
type ICache<'T> =
    abstract member Init: 'T -> unit
    abstract member Clear: unit -> unit

[<AbstractClass>]
type Cache<'T>() =
    [<JsonProperty>]
    member val Items = Unchecked.defaultof<'T> with get, set

    member this.Init i =
        this.Items <- i
    member __.Clear() =
        Entity.Current.DestructOnExit()

    interface ICache<'T> with
        member this.Init i = this.Init i
        member this.Clear() = this.Clear()

type StringArrayCache() =
    inherit Cache<string array>()

    [<FunctionName("StringArrayCache")>]
    static member Run ([<EntityTrigger>] ctx: IDurableEntityContext) =
        ctx.DispatchAsync<StringArrayCache>()
```

_Quick note, in F# you need to create a member of the class **and** the interface due to [this bug](https://github.com/Azure/azure-functions-durable-extension/issues/928), that's why I have an `Init` method on the interface which just calls the `Init` method on the class._

Our `StringArrayCache` Entity will be initialised with a value and we intend to store that value until the cache expires.

## Creating a HTTP Function

With our Entity defined it's time to create the Function that we're calling that caches data:

```fsharp
[<FunctionName("HttpCachingFunction")>]
let run
    ([<HttpTrigger(AuthorizationLevel.Function, "get", Route = "data")>] req : HttpRequest)
    ([<DurableClient>] client: IDurableClient) =
    task {
        // todo
    }
```

This is a standard [HTTP triggered function](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-http-webhook?{{<cda>}}) and will be responsible for populating our cache. This might not be the most optimal way to do it in your project, maybe you want a timer trigger that runs on start up and then ever _n_ number of minutes, but I just want to keep it simple. The second argument is a [`DurableClient` binding](https://docs.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-bindings?{{<cda>}}#orchestration-client) which will be what we use to work with the Entity and Orchestrator.

_Note: In v1 this binding was called `OrchestrationClient`, but was renamed to `DurableClient` for v2._

```fsharp
[<FunctionName("HttpCachingFunction")>]
let run
    ([<HttpTrigger(AuthorizationLevel.Function, "get", Route = "data")>] req : HttpRequest)
    ([<DurableClient>] client: IDurableClient) =
    task {
        let entityId = EntityId(typeof<StringArrayCache>.Name, "Cache")

        return OkResult()
    }
```

We're starting to scaffold out our Function, the first thing we're going to need is a Cache Identifier, which is in the form of the `EntityId`. I've got this hard coded to be the name of our cache class (if I was using F# 4.7 with preview features I could use [`nameof`](https://github.com/fsharp/fslang-design/issues/48) like in C#) and the key `Cache`. If you were doing cache-by-user then maybe you'd use the user ID as the cache key.

_Note: The Entity Name, which I defined as `typeof<StringArrayCache>.Name`, must match the value provided to the `FunctionName` attribute on the Entity, again where `nameof` can be useful._

```fsharp
[<FunctionName("HttpCachingFunction")>]
let run
    ([<HttpTrigger(AuthorizationLevel.Function, "get", Route = "data")>] req : HttpRequest)
    ([<DurableClient>] client: IDurableClient) =
    task {
        let entityId = EntityId(typeof<StringArrayCache>.Name, "Cache")
        let! state = client.ReadEntityStateAsync<StringArrayCache> entityId

        if state.EntityExists then
            return OkObjectResult state.EntityState.Items
        else
            // Todo
            return OkResult()
    }
```

With the Cache Identifier defined it's time to look up whether it does already exist in the cache, and we do that by reading the Entity State from the `IDurableClient` input. This returns us an object with an `EntityExists` boolean property and if it does exist we can access that Entity via `EntityState`, so we're returning the `Items` property if it does exist, which is where our cached data lives.

```fsharp
[<FunctionName("HttpCachingFunction")>]
let run
    ([<HttpTrigger(AuthorizationLevel.Function, "get", Route = "data")>] req : HttpRequest)
    ([<DurableClient>] client: IDurableClient) =
    task {
        let entityId = EntityId(typeof<StringArrayCache>.Name, "Cache")
        let! state = client.ReadEntityStateAsync<StringArrayCache> entityId

        if state.EntityExists then
            return OkObjectResult state.EntityState.Items
        else
            do! Task.Delay 5000

            let cachedData = [|"a";"b";"c"|]
            do! client.SignalEntityAsync<ICache<string array>>(
                    entityId,
                    fun (proxy: ICache<string array>) ->
                        proxy.Init cachedData
                )
            return OkObjectResult cachedData
    }
```

If the Entity doesn't exist then we need to fetch the data from our external source (I'm simulating this with a `Task.Delay`) and once we have the data we can initalise our Entity with `client.SignalEntityAsync`. I'm doing this using the [Typed Client](https://docs.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-bindings?{{<cda>}}#client-sample-typed) approach, where you need to provide the interface that your Entity implements. Since I'm using a generic base class I provide it with `ICache<string array>`, next we provide it with the `EntityId` we created above and the signaling method. This method is provided with a proxy instance of your Entity (cast as the interface) and allows you to do whatever you want before calling a specific method on the Entity itself. I've kept it simple and just called the `Init` method providing our data to cache.

Finally, we return the data from this brach so that the responses are the same, regardless of whether it was cached or not.

_Interesting side note, the proxy is a dynamically generated class, not your actual implementation (my `StringArrayCache`). Instead it does some "magic" which results in calling your `EntityTrigger` function. The way this works is quite interesting and I'll explore it in my [IL blog series]({{< ref "/posts/2019-09-11-a-quirk-with-implicit-vs-explicit-interfaces.md" >}})._

We're done now, our data will be cached forever with that entity.

## Creating a Cache Timeout

While an infinite cache might be good, we probably want the data to expire at some point in time and either automatically replaced or only replaced when it's next required. To achieve this we'll use a [Durable Orchestrator](https://docs.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-orchestrations?{{<cda>}}) which was introduced in the Durable Functions v1 release.

```fsharp
[<FunctionName("CacheOrchestrator")>]
let cacheOrchestrator
    ([<OrchestrationTrigger>] ctx: IDurableOrchestrationContext)
    (logger: ILogger) =
    task {
        logger.LogInformation "Starting Cache manager"

        let entityId = ctx.GetInput<EntityId>()

        let timer = ctx.CreateTimer(ctx.CurrentUtcDateTime.AddMinutes(1.), CancellationToken.None)
        do! timer

        logger.LogInformation "Cache cleaning"

        ctx.SignalEntity(entityId, "Clear")
    }
```

The Orchestrator is pretty simple if you've been working with Durable Functions v1. We start off with a trigger type of [`OrchestrationTrigger`](https://docs.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-bindings?{{<cda>}}#orchestration-trigger) and the type we expect is an `IDurableOrchestrationContext`.

_Note: This is a type change from Durable Functions v1. In v1 it was a class named `DurableOrchestrationContext`, now we have an interface which is prefixed with `I` as per the .NET style guide._

Since this Orchestrator is to be generic we're expecting the `EntityId` to be passed in as input, so it could be responsible for the timeout handling of multiple caches.

Now we can create a [Timer](https://docs.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-timers?{{<cda>}}) for our cache expiry using the context's `CreateTimer` function. As per the guidance in the documentation we're using the `CurrentUtcDateTime` from the context and then adding 1 minute to it, this is when our cache will expire. (I'd consider passing in the timeout duration, rather than hard-coding it like I have, but I kept it simple for this demo.)

We then wait for the timer to elapse (`do! timer`) and once it's done we need to tell the cache Entity to destroy itself, and this is where the `Clear` method on our Entity comes in. It's also worth noting that this time when we signal the Entity it's using a **synchronous** method called `SignalEntity` and it requires you to pass in the name of the method you want to call (this is similar to [untyped signaling](https://docs.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-bindings?{{<cda>}}#client-sample-untyped)).

The `Clear` method looks like this:

```fsharp
    member __.Clear() =
        Entity.Current.DestructOnExit()
```

And it called the `DestructOnExit` method of the current Entity, which isn't actually a function of the class itself, but it tells the Durable Entity framework that this Entity has completed and can be deleted. This is similar to when an Orchestrator function finishes and the `RuntimeStatus` is `Completed`.

## Conclusion

This brings us to the end of todays post, we've seen how we can combine Entities and Orchestrators in a single set of functions. We used this to create a cache of responses for HTTP calls, but we could use this on any data access happening within our Serverless application.

Make sure you check out the rest of [#ServerlessSeptember](https://dev.to/azure/serverless-september-content-collection-2fhb) for more Serverless content!

### Bonus Tip

It's likely that when we get an RTM of Durable Entities we won't need to use the Orchestrator for the timer as [they are getting that support](https://github.com/Azure/azure-functions-durable-extension/issues/716).