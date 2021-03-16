+++
title = "GraphQL on Azure: Part 6 - Subscriptions With SignalR"
date = 2021-03-15T23:31:19Z
description = "It's time to take a look at how we can do real-time GraphQL using Azure"
draft = false
tags = ["azure", "javascript", "graphql"]
tracking_area = "javascript"
tracking_id = "7129"
series = "graphql-azure"
series_title = "GraphQL Subscriptions with SignalR"
+++

In our exploration of how to run GraphQL on Azure, we've looked at the two most common aspects of a GraphQL server, queries and mutations, so we can get data and store data. Today, we're going to look at the third piece of the puzzle, subscriptions.

## What are GraphQL Subscriptions

In GraphQL, a Subscription is used as a way to provide real-time data to connected clients. Most commonly, this is implemented over a [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) connection, but I'm sure you could do it with long polling or Server Sent Events if you _really_ wanted to (I've not gone looking for that!). This allows the GraphQL server to broadcast query responses out when an event happens that the client is _subscribed_ to.

Let's think about this in the context of the quiz game we've been doing. So far the game is modeled for single player, but if we wanted to add multiplayer, we could have the game wait for all players to join, and once they have, broadcast out a message via a subscription that the game is starting.

### Defining Subscriptions

Like queries and mutations, subscriptions are defined as part of a GraphQL schema, and they can reuse the types that are available within our schema. Let's make a really basic schema that contains a subscription:

```graphql
type Query {
    hello: String!
}

type Subscription {
    getMessage: String!
}

schema {
    query: Query
    subscription: Subscription
}
```

The subscription `type` that we're defining can have as many different subscriptions that clients can subscribe via, and each might return different data, it's completely up to the way your server wants to expose real-time information.

## Implementing Subscriptions on Azure

For this implementation, we're going to go back to TypeScript and use [Apollo](https://www.apollographql.com/). Apollo have some really great docs on how to [implement subscriptions in an Apollo Server](https://www.apollographql.com/docs/apollo-server/data/subscriptions/), and that'll be our starting point.

But before we can start pushing messages around, we need to work out what is going to be the messaging backbone of our server. We're going to need some way in which the server and communicate with all connected clients, either from within a resolver, or from some external event that the server receives.

In Azure, when you want to do real-time communications, there's no better service to use than [SignalR Service](https://docs.microsoft.com/azure/azure-signalr/signalr-overview?{{<cda>}}). SignalR Service takes care of the protocol selection, connection management and scaling that you would require for a real-time application, so it's ideal for our needs.

## Creating the GraphQL server

In the previous posts, we've mostly talked about running GraphQL in a serverless model on [Azure Functions](https://docs.microsoft.com/azure/functions/?{{<cda>}}), but for a server with subscriptions, we're going to use [Azure App Service](https://docs.microsoft.com/azure/app-service/?{{<cda>}}), and we can't expose a WebSocket connection from Azure Functions for the clients to connect to.

Apollo provides [plenty of middleware options](https://www.apollographql.com/docs/apollo-server/integrations/middleware/) that we can chose from, so for this we'll use the Express integration, `apollo-server-express` and follow the [subscriptions setup guide](https://www.apollographql.com/docs/apollo-server/data/subscriptions/#using-with-middleware-integrations).

## Adding Subscriptions with SignalR

When it comes to implementing the integration with SignalR, Apollo uses the [`graphql-subscriptions`](https://www.npmjs.com/package/graphql-subscriptions) `PubSubEngine` class to handle how the broadcasting of messages, and connections from clients.

So that means we're going to need an implementation of that which uses SignalR, and thankfully there is one, [`@aaronpowell/graphql-signalr-subscriptions`](https://www.npmjs.com/package/@aaronpowell/graphql-signalr-subscriptions) (yes, I did write it 😝).

We'll start by adding that to our project:

```bash
npm install --save @aaronpowell/graphql-signalr-subscriptions
```

You'll need to [create a SignalR Service resource](https://docs.microsoft.com/azure/azure-signalr/signalr-quickstart-azure-signalr-service-arm-template?tabs=azure-portal&{{<cda>}}) and get the connection string for it (I use [`dotenv`](https://npm.im/dotenv) to inject it for local dev) so you can create PubSub engine. Create a new `resolvers.ts` file and create the `SignalRPubSub` instance in it.

```js
import { SignalRPubSub } from "@aaronpowell/graphql-signalr-subscriptions";

export const signalrPubSub = new SignalRPubSub(
    process.env.SIGNALR_CONNECTION_STRING
);
```

We export this so that we can import it in our `index.ts` and start the client when the server starts:

```ts
// setup ApolloServer
httpServer.listen({ port }, () => {
    console.log(
        `🚀 Server ready at http://localhost:${port}${server.graphqlPath}`
    );
    console.log(
        `🚀 Subscriptions ready at ws://localhost:${port}${server.subscriptionsPath}`
    );

    signalrPubSub
        .start()
        .then(() => console.log("🚀 SignalR up and running"))
        .catch((err: any) => console.error(err));
});
```

It's important to note that you must call `start()` on the instance of the PubSub engine, as this establishes the connection with SignalR, and until that happens you won't be able to send messages.

## Communicating with a Subscription

Let's use the simple schema from above:

```graphql
type Query {
    hello: String!
}

type Subscription {
    getMessage: String!
}

schema {
    query: Query
    subscription: Subscription
}
```

In the `hello` query we'll broadcast a message, which the `getMessage` can subscribe to. Let's start with the `hello` resolver:

```ts
export const resolvers = {
    Query: {
        hello() {
            signalrPubSub.publish("MESSAGE", {
                getMessage: "Hello I'm a message"
            });
            return "Some message";
        }
    }
};
```

So our `hello` resolver is going to publish a message with the name `MESSAGE` and a payload of `{ getMessage: "..." }` to clients. The name is important as it's what the subscription resolvers will be configured to listen for and the payload represents all the possible fields that someone could select in the subscription.

Now we'll add the resolver for the subscription:

```ts
export const resolvers = {
    Query: {
        hello() {
            signalrPubSub.publish("MESSAGE", {
                getMessage: "Hello I'm a message"
            });
            return "Some message";
        }
    },
    Subscription: {
        getMessage: {
            subscribe: () => signalrPubSub.asyncIterator(["MESSAGE"])
        }
    }
};
```

A resolver for a subscription is a little different to query/mutation/field resolvers as you need to provide a `subscribe` method, which is what Apollo will invoke to get back the names of the triggers to be listening on. We're only listening for `MESSAGE` here (but also only broadcasting it), but if you added another `publish` operation with a name of `MESSAGE2`, then `getMessage` subscribers wouldn't receive that. Alternatively, `getMessage` could be listening to a several trigger names, as it might represent an aggregate view of system events.

## Conclusion

In this post we've been introduced to subscriptions in GraphQL and seen how we can use the Azure SignalR Service as the backend to provide this functionality.

You'll find the code for the SignalR implementation of subscriptions [here](https://github.com/aaronpowell/graphql-azure-subscriptions/tree/main/packages/graphql-signalr-subscriptions) and the full example [here](https://github.com/aaronpowell/graphql-azure-subscriptions/tree/main/example/signalr).
