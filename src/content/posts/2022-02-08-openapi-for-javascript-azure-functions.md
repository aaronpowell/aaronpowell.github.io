+++
title = "OpenAPI for JavaScript Azure Functions"
date = 2022-02-08T22:38:39Z
description = "A new tool for generating OpenAPI specs from JavaScript and TypeScript Azure Functions"
draft = false
tags = ["azure", "serverless", "javascript", "azure-functions"]
tracking_area = "javascript"
tracking_id = "56972"
+++

OpenAPI, formerly known as Swagger (or still known, depending who you ask!), is used to describe a REST API's

Last year my colleague [Justin Yoo](https://twitter.com/justinchronicle) released an extension for .NET Azure Functions to [generate OpenAPI definitions](https://github.com/Azure/azure-functions-openapi-extension) and not long afterwards he reached out to me on whether it'd be possible to do something similar for JavaScript/TypeScript Functions.

Well, good news, I've created a [npm package](https://www.npmjs.org/package/@aaronpowell/azure-functions-nodejs-openapi) to do that, which you can find [on GitHub](https://github.com/aaronpowell/azure-functions-nodejs-openapi) and in this post we'll take a look at how to use it.

## How it works

This npm package works conceptually similar to the .NET one in that you annotate the Function handler to provide OpenAPI schema information. This is done using a wrapper, or higher order, function, which takes a JavaScript object in that represents the schema for OpenAPI.

The second part of the plugin is used to create an endpoint which the OpenAPI spec file will be exposed via.

Also, the package will give you the option to use each of the different spec version, v2, v3 and v3.1, so you can describe the API in the way that's right for consumers.

## Annotating a Function

Let's look at how we can annotate a Function to expose an OpenAPI spec, and we'll look at the [Trivia Game example](https://github.com/aaronpowell/azure-functions-nodejs-openapi/blob/main/example/trivia-game/), specifically the `game-get` API.

_Note: The Function handler doesn't really matter as there's (at least currently) no inspection of it being undertaken, JavaScript doesn't have enough of a type system to do runtime reflection and figure that stuff out on the fly, so I'll keep that abbreviated for the sample._

We'll use the [OpenAPI 3.1 spec](https://spec.openapis.org/oas/latest.html), which is the latest at time of authoring, as the schema, so the first thing is to import the mapping function:

```ts
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { mapOpenApi3_1 as openApi } from "@aaronpowell/azure-functions-nodejs-openapi";

export default async function(
    context: Context,
    req: HttpRequest
): Promise<void> {
    // snip
}
```

Next, we'll change the `export default` to be a call to the mapping function, rather than the Function handler itself:

```ts
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { mapOpenApi3_1 as openApi } from "@aaronpowell/azure-functions-nodejs-openapi";

const httpTrigger: AzureFunction = async function(
    context: Context,
    req: HttpRequest
): Promise<void> {
    // snip
};

export default openApi(httpTrigger, "/game/{gameId}", {});
```

The `mapOpenApi3_1` (aliased as `openApi` in my sample) takes three arguments:

1. The Function handler that the trigger invokes
1. The path for the API
1. The OpenAPI spec definition for this path

_Note: If you're using TypeScript, you'll get type help as you build out your schema, thanks to the [`openapi-types`](https://www.npmjs.com/package/openapi-types) npm package._

This Function will respond on a `GET` request, expect the `gameId` to be a URL parameter and return a `200` when the game is found or a `404` if it is not, so we can describe that in our object. Let's start with the parameter:

```ts
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { mapOpenApi3_1 as openApi } from "@aaronpowell/azure-functions-nodejs-openapi";

const httpTrigger: AzureFunction = async function(
    context: Context,
    req: HttpRequest
): Promise<void> {
    // snip
};

export default openApi(httpTrigger, "/game/{gameId}", {
    get: {
        parameters: [
            {
                name: "gameId",
                in: "path",
                required: true,
                description: "Gets a game that's being played",
                schema: {
                    type: "string"
                }
            }
        ]
    }
});
```

The top level of the object is the **verb** that we're going to be working with (you can define multiple verbs for each Function) and then we use the `parameters` array to describe the parameter. The `gameId` is being describe as required and that it's a string, plus we can attach some metadata to it if we desire, I'm giving it a description for example.

Now we can define some responses. Let's start simple with the 404:

```ts
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { mapOpenApi3_1 as openApi } from "@aaronpowell/azure-functions-nodejs-openapi";

const httpTrigger: AzureFunction = async function(
    context: Context,
    req: HttpRequest
): Promise<void> {
    // snip
};

export default openApi(httpTrigger, "/game/{gameId}", {
    get: {
        parameters: [
            {
                name: "gameId",
                in: "path",
                required: true,
                description: "Gets a game that's being played",
                schema: {
                    type: "string"
                }
            }
        ],
        responses: {
            "404": {
                description: "Unable to find a game with that id"
            }
        }
    }
});
```

Here we've added a new `responses` property and we can define any status code we want as the response code and attach info to it. Since this was a 404, all I've done is defined the description as it won't return a body. For a more complex one, let's put in the 200:

```ts
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { mapOpenApi3_1 as openApi } from "@aaronpowell/azure-functions-nodejs-openapi";

const httpTrigger: AzureFunction = async function(
    context: Context,
    req: HttpRequest
): Promise<void> {
    // snip
};

export default openApi(httpTrigger, "/game/{gameId}", {
    get: {
        parameters: [
            {
                name: "gameId",
                in: "path",
                required: true,
                description: "Gets a game that's being played",
                schema: {
                    type: "string"
                }
            }
        ]
    },
    responses: {
        "200": {
            description: "Successful operation",
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        allOf: [
                            {
                                $ref: "#/components/schemas/Game"
                            }
                        ]
                    }
                }
            }
        },
        "404": {
            description: "Unable to find a game with that id"
        }
    }
});
```

The 200 response will have a body and that is defined in the `content` property, in which you can set the content for the different possible mime types. I'm only supporting a mime type of `application/json`, so that's all that's defined and for the content it returns we're using a schema reference to a component defined elsewhere in our spec. This is useful if you've got objects that can be used in multiple places, which the `Game` time would likely be (it's shared between `GET` and `POST` in the sample).

But that's the first part completed, we've defined the spec information for our `game-get` API, on to creating the endpoint that will make it available to us.

## Defining the swagger.json endpoint

We've got to the effort of annotating our Function but there needs to be some way in which consumers and get that, and to do that, we need to create a Function for them to access it. Start by creating a new HTTP Trigger Function, delete it's contents and then we can use another helper function from the npm package:

```ts
import { generateOpenApi3_1Spec } from "@aaronpowell/azure-functions-nodejs-openapi";

export default generateOpenApi3_1Spec({});
```

With this Function we're going define the shared metadata and components that our OpenAPI spec requires, as it'll be merged with the annotated Functions at runtime. Start by telling consumers about the API:

```ts
import { generateOpenApi3_1Spec } from "@aaronpowell/azure-functions-nodejs-openapi";

export default generateOpenApi3_1Spec({
    info: {
        title: "Awesome trivia game API",
        version: "1.0.0"
    }
});
```

This is really the minimum you need to do, but since we used `$ref` to reference a shared component schema, we should define that as well. I'll only show one of the shared components, as this object model has components that reference other components, but you should get the idea:

```ts
import { generateOpenApi3_1Spec } from "@aaronpowell/azure-functions-nodejs-openapi";

export default generateOpenApi3_1Spec({
    info: {
        title: "Awesome trivia game API",
        version: "1.0.0"
    },
    components: {
        schemas: {
            Game: {
                type: "object",
                properties: {
                    id: {
                        type: "string",
                        description: "Unique identifier for the game"
                    },
                    state: {
                        type: "string",
                        description: "The status of the game",
                        enum: ["WaitingForPlayers", "Started", "Complete"]
                    },
                    questions: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/Question"
                        }
                    },
                    players: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/Player"
                        }
                    },
                    answers: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/PlayerAnswer"
                        }
                    }
                }
            }
        }
    }
});
```

And there you have it, `Game` is now defined and can be used as a reference elsewhere within our spec. You can find the full implementation with all other schema objects [in the GitHub source](https://github.com/aaronpowell/azure-functions-nodejs-openapi/blob/main/example/trivia-game/swagger/index.ts).

Start up your Azure Functions (with CORS enabled) and pop the spec endpoint into [Swagger UI](https://swagger.io/tools/swagger-ui/) and you'll see your docs generated!

![Swagger UI example](/images/2022-02-08-openapi-for-javascript-azure-functions/001.png)

## Conclusion

There we have it, a working app in Azure Functions which provides OpenAPI docs for anyone who wants to consume them.

Right now this is a proof-of-concept project more than anything, and we're looking for feedback on whether this is a useful tool to have for people creating Azure Functions in JavaScript/TypeScript or whether there'd be a better solution, so if you want to give it a try take the [npm package](https://www.npmjs.org/package/@aaronpowell/azure-functions-nodejs-openapi) for a spin and get in touch.

I have ideas of things to do next, but I'm more keen to solve the problems that you'd experience with it first.
