---
title: "Learning redux with reducks - beyond JavaScript"
date: "2016-10-10"
tags:
    - "javascript"
    - "redux"
    - "reducks"
    - "fsharp"
description: "Exploring how redux can be used as a generic design pattern, not just a JavaScript library"
series: "redux"
series_title: "Redux outside JavaScript"
---

Over this series we've been looking at how we would write a library which mimics the functionality of Redux from scratch to understand how it works at the most basic of levels. What we've seen is that there's three basic components, a Store which is our central point, Actions which indicate something happening and Reducers which handle something happening.

Really this is just a simple pattern for data flow, so I wanted now to explore how we could go beyond JavaScript with Redux and create something else.

## Look ma, no JavaScript!

To illustrate this I decided to implement Redux, well, something that does _some_ of what Redux does, in F#. The reason I chose F# was because as we've seen Redux lends itself nicely to functional programming concepts, like that Reducers should be pure functions and that state is immutable, so doing it in a functional programming language seemed to fit nicely (and also it meant I could write more F# :P).

If you're the kind of person who wants to skip ahead to the end you'll find the code [on my GitHub](https://github.com/aaronpowell/Reducks.FSharp), but for the rest of us I'll walk through some of the core concepts. Also I'll point out that this isn't the first implementation of Redux in .NET, nor is mine production ready!

# Starting from the top

When implementing something like Redux in F#, or any strongly typed language, we'll have a few things we need to be mindful of up front, one of those is that we actually have a type system, so I'm going to start by defining two types, one for our Store and one for our Middleware Store (which you'll remember was introduced when we [added middleware](/posts/2016-07-17-learning-redux-with-reducks-middleware.html)):

```fsharp
type MiddlewareStore<'State, 'Payload> =
    { getState : unit -> 'State
      dispatch : 'Payload -> 'Payload }

type Store<'State, 'Payload> =
    { getState : unit -> 'State
      dispatch : 'Payload -> 'Payload
      subscribe : (unit -> unit) -> unit -> unit }
```

Now you'll see here that we've got two generic arguments to these types, we have one which represents the `state` of the application and the other is `payload`, which is provided to the `dispatch` method. This deviates a bit from how the actions were dispatched in our JavaScript implementation, but we'll come to that in a moment, first off we're going to create the `createStore` function.

## Creating the Store

When creating a store you can provide up to three arguments:

-   The root reducer
-   The initial state
-   Middleware

In JavaScript the last two are optional, so how will we handle them in F#? Well in F# we don't have method overloading so we can't define multiple `createStore` functions (without using different names), so we could go with the `Option` type for them, or we could make them mandatory. I've gone with the final approach, making them mandatory, as this will simplify some of our internal code and avoids the pain that can be introduced with dynamic typing.

So what does `createStore` look like?

```fsharp
let rec createStore<'State, 'Payload> =
    fun reducer (initialState : 'State) (middlewares : seq<MiddlewareStore<'State, 'Payload> -> ('Payload -> 'Payload) -> 'Payload -> 'Payload>) ->
```

Oh yeah, dem type annotations! The type annotations for the `middlewares` argument really melted my brain...

Now you'll also notice that I've defined this as a recursive function (the `rec` keyword), and that's because we'll need it for handling middleware, but let's start fleshing it out:

```fsharp
let rec createStore<'State, 'Payload> =
    fun reducer (initialState : 'State) (middlewares : seq<MiddlewareStore<'State, 'Payload> -> ('Payload -> 'Payload) -> 'Payload -> 'Payload>) ->
        match Seq.isEmpty middlewares with
        | false ->
        | true ->
```

Pattern matching FTW! We can use pattern matching to decide if we're going to have middleware or not, and then that results in which branch to take. Let's start making some middleware.

## Implementing a store with middleware

Here's what it looks like:

```fsharp
let compose chain =
    let last = Seq.last chain
    let rest = Seq.toList(chain).[0..(Seq.length chain) - 2]
    fun arg -> List.foldBack (fun func composed -> func composed) rest (last arg)

let rec createStore<'State, 'Payload> =
    fun reducer (initialState : 'State) (middlewares : seq<MiddlewareStore<'State, 'Payload> -> ('Payload -> 'Payload) -> 'Payload -> 'Payload>) ->
        match Seq.isEmpty middlewares with
        | false ->
            let store = createStore reducer initialState Seq.empty
            let mutable dispatch = store.dispatch

            let chain =
                middlewares |> Seq.map (fun m ->
                                   m ({ getState = store.getState
                                        dispatch = fun action -> dispatch (action) }))

            dispatch <- dispatch |> compose chain

            { store with dispatch = dispatch }
```

Well that's... interesting? if you remember how [we implemented middleware](/posts/2016-07-17-learning-redux-with-reducks-middleware.html) some of the ideas will look familiar, but we'll break it down a little bit. First off we've got the `compose` function which:

-   Grabs the last item in the sequence
-   Grabs the rest of the items
-   Uses `List.foldBack` which is the same as `Array.prototype.reduceRight` to walk backwards through the sequence and create a new `dispatch` method

Again this broke my brain as I tried to try and work out how it'd come together and while strong typing helps it's still a bit frustrating. Ultimately the way that it works is:

-   Creates a function that takes 2 arguments, `func` and `composed`
-   `func` is the current item in the collection
-   `composed` is the item that we're returning

`List.foldBack` then takes 2 arguments, the collection that we're folding and the initial value (`last arg`).

Ok, maybe I should have named things a bit better... but at the end of the day `compose` has a signature of `compose:seq<('a -> 'a)> -> ('a -> 'a)` which is a function taking a sequence of functions that return their argument and returns a single function that takes an argument and returns it. Simple!

Now we can use that inside our `createStore` method. The first line of the `match` when we have middleware is:

```fsharp
let store = createStore reducer initialState Seq.empty
```

This is why we made a recursive function, when we have middleware we create a store _without_ middleware by invoking ourself, and that's because we're going to grab the `dispatch` method off the store, wrap it with middleware and return a new store with the new dispatch method.

Our local variable for `dispatch` is defined as a mutable variable because we want to replace it with the new composed chain!

## Actually making a store

Alright, the hard stuff is out of the way, now we'll, you know, create the store!

```fsharp
| true ->
    let mutable state = initialState
    let mutable subs = Seq.empty

    let dispatcher (action : 'Payload) =
        state <- reducer state action
        subs |> Seq.iter (fun s -> s())
        action

    let subscriber subscriber =
        subs <- Seq.append subs [ subscriber ]
        let index = Seq.length subs
        fun () ->
            subs <- subs
                    |> Seq.mapi (fun i s -> i, s)
                    |> Seq.filter (fun (i, e) -> i <> index)
                    |> Seq.map (fun (i, s) -> s)

    let getState = fun () -> state
    { getState = getState
        dispatch = dispatcher
        subscribe = subscriber }
```

Here's the definition of our three core functions, `dispatch`, `subscribe` and `getState`. None of these methods are particularly complex, the only thing we have to do that isn't something I'm super keen on is the use of `mutable` for the `state` and `subs`. This is because we need to change a single point of the state, which is "owned" by the store, and we need to be able to add/remove subscribers.

At the end of the function we create a new store instance with out functions all nice and bound!

## Using our Reducks store

Right so we're all ready to go with out implementation, seriously, 53 lines of F# is all it took! Now we want to see about how we would use it in an application.

For that I've created a simple [demo app](https://github.com/aaronpowell/Reducks.FSharp/tree/master/Examples/Reducks.FSharp.Examples.SignalR) that is a chat application. It's a SingalR server (running in a console application) that has a Reducks store on the server that has a single method _dispatch_. Here's what the hub looks like:

```fsharp
type Typing = {
    user: string
    value: string
}

type Payload =
    | User of string
    | PostMessage of string
    | Typing of Typing

type public ChatHub() =
    inherit Hub()

    let store = getStore()

    override this.OnConnected() =
        store.subscribe(fun () ->
            this.Clients.Client(this.Context.ConnectionId)?subscribe(store.getState())
            ()
        ) |> ignore
        System.Threading.Tasks.Task.Run(fun () -> ())

    member this.Dispatch (action: Payload) =
        match action with
        | Typing payload ->
            store.dispatch(typingAction payload.user payload.value) |> ignore
        | User payload -> store.dispatch(newUserAction payload) |> ignore
        | PostMessage payload -> store.dispatch(postMessageAction payload) |> ignore
```

When the client connects the hub finds the `store` and subscribes to it. When store state changes it invokes the `subscribe` method on the connected client, sending the state, and the client decides what to do with the updated state.

The `dispatch` method receives an Action and this is where we first see the power that F# gives us in Redux, static typing and union types. WHen in JavaScript we would have to set the `type` property of the Action we can rely on the static type to give us this, and our Action, which looks like:

```fsharp
type Payload =
    | User of string
    | PostMessage of string
    | Typing of Typing
```

Is a single type that represents a bunch of different Actions, which then can be combined with pattern matching to dispatch a store-level action (sure we could pass the action directly from the client to the server store, but I wanted to do some data remapping, basically the server becauses an action creator).

### Server side implementation

So what does the server side usage of reducks look like? Let's start with our actions:

```fsharp
type Payload =
    | NewUser of string
    | Message of (string * DateTimeOffset)
    | Typing of (string * string)

let postMessageAction name =
    Message(name, DateTimeOffset.Now)

let typingAction user value =
    Typing(user, value)

let newUserAction user =
    NewUser(user)
```

Pretty simple looking little action creators which takes some information and creates a new value from them using the union type.

Next up let's look at how we create the store instance:

```fsharp
type Message = {
    user: string
    timestamp: DateTimeOffset
    message: string
}

type State = {
    typing: Map<string, string>
    messages: seq<Message>
    users: Set<string>
}

let reducer (state: State) (action: Payload) =
    match action with
    | Message (user, timestamp) ->
        let message = state.typing.[user]
        { state with
            messages = Seq.append state.messages [{ user = user; timestamp = timestamp; message = message }]
            typing = Map.remove user state.typing }
    | Typing (user, value) -> { state with typing = state.typing.Add(user, value) }
    | NewUser user -> { state with users = Set.add user state.users }


let middleware store next action =
    match action with
    | NewUser user -> printfn "The user '%s' has joined" user
    | _ -> ()

    next(action)

let store = createStore
                reducer
                { typing = Map.empty<string, string>; messages = Seq.empty; users = Set.empty }
                [middleware]

let getStore = fun () -> store
```

More types, yay! I've a basic reducer which again leverages pattern matching to then update the appropriate part of the state. We're able to create a new state using the existing state object _but_ we provide a partial state, the stuff we're changing, so that the new state is a combination of the current application and the result of the reducer. This is similar to either using `Object.assign` or the spread operator in JavaScript.

For demo purposes I've also created a piece of middleware which logs to the console window when the action is a `NewUser`, otherwise it's a no-op.

Finally we create the store providing the reducer, initial state (a record type) and the middleware sequence.

So fire up the console application and it's running!

![Reducks!](/get/reducks/reducks-fsharp-demo.gif)

## Conclusion

There you have it, we've taken redux, a library written in JavaScript, pushed it server side and written it in something other that JavaScript.

The code is [on my GitHub](https://github.com/aaronpowell/Reducks.FSharp) if you're keen to have a poke and a play (or if you want to show me how to do the F# better!), but overall I'm pretty happy with how it came together and how clean it is to read.

Some fun side effects of having the store living server side is that when a new client connects they are provided with all the existing state (assuming they dispatch a "new user" event), which can be a fun part for time travel debugging ;).
