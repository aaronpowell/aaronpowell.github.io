---
title: "Typed Bindings for TypeScript Azure Functions"
date: 2019-04-03T09:03:52+11:00
draft: false
tags: ["typescript", "azure-functions", "serverless"]
---

A few weeks ago Microsoft announced their improvements to [TypeScript Azure Functions](https://azure.microsoft.com/en-us/blog/improving-the-typescript-support-in-azure-functions/?{{< cda >}}) with some new templates to help you get started.

As I'm currently doing a bunch of stuff with Azure Functions I decided to give it a go and share some of my learnings. Today I want to talk about how to improve the typedness of Azure Functions with TypeScript.

With TypeScript, and naturally JavaScript, we rely on the [`function.json`](https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference?{{< cda >}}) file to create our bindings to different services (since we don't have a static type system like .NET functions can leverage). But this results in a disconnect between what we're binding and what our editor knows about.

A standard [HTTP Trigger](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-http-webhook?{{< cda >}}) binding will see a file scaffolded like this in TypeScript:

```typescript
import { AzureFunction, Context, HttpRequest } from "@azure/functions"

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    // function code here
}

export default httpTrigger;
```

Here we're relying on a bunch of primitive types provided by the Functions TypeScript package, but it doesn't understand our application at all.

## Extending built-in interfaces

To improve on this I've started extending the built-in interfaces that are provided in the `@azure/functions` package to understand the bindings I'm creating, like so:

```typescript
import { AzureFunction, Context, HttpRequest } from "@azure/functions"

interface InputHttpRequest extends HttpRequest {
    query: {
        name: string
    }
}

const httpTrigger: AzureFunction = async function (context: Context, req: InputHttpRequest): Promise<void> {
    const name = req.query.name;

    // function body
};

export default httpTrigger;
```

For this example instead of leaving `req.query` with the type `[key: string]: string`, meaning it's a dictionary of _anything_, I'm saying that I expect the query string provided to have `name` as one value (and potentially others, but I only care about `name`). This then gives me good code completion of just how I expect my type to look and when I create tests I know the _shape_ of the object as well.

## Typing bindings

Let's say that you've got two additional bindings on your function, a queue output and HTTP response output. Again we can extend the built in types to achieve this, this time we'll extend `Context`.


Here's the bindings from our `function.json`:

```json
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    },
    {
      "type": "queue",
      "direction": "out",
      "name": "myQueue",
      "queueName": "my-queue",
      "connection": "QueueConnectionString"
    }
```

And the TypeScript:

```typescript
interface InputFunctionContext extends Context {
    bindings: {
        myQueue: string[]
    }

    res: {
        status?: number
        body: string
    }
}

const httpTrigger: AzureFunction = async function (context: InputFunctionContext, req: InputHttpRequest): Promise<void> {
    // function code
}
```

Both `bindings` and `res` have a default type of `{ [key: string] : any }` denoting that they can have as many properties and they are untyped, but we know from our `function.json` what they should be and we can set them accordingly.

You can do the same with input bindings such as Table and type them to the class that they are within your application normally.

## Conclusion

From what starts out as a very loosely typed design with TypeScript Azure Functions you can easily leverage type extending to make your function code more aware of the bindings and the types that they should represent.

I've created a [full working example on GitHub](https://github.com/aaronpowell/typed-typescript-functions-demo) if you'd like to play with it yourself.