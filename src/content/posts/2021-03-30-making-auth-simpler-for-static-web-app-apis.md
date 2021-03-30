+++
title = "Making Auth Simpler for Static Web App APIs"
date = 2021-03-30T04:51:02Z
description = "Let's look at how to make it a little easier to work with authenticated Static Web App APIs"
draft = false
tags = ["azure", "serverless", "javascript"]
tracking_area = "javascript"
tracking_id = "17897"
+++

[Azure Static Web Apps](https://docs.microsoft.com/azure/static-web-apps/?{{<cda>}}) has built-in [Authentication and Authorization](https://docs.microsoft.com/azure/static-web-apps/authentication-authorization?{{<cda>}}) for both the web and API part of the application.

At the end of last year, I wrote about a package [to make it easier in React apps]({{<ref "/posts/2020-12-21-simplifying-auth-with-static-web-apps-and-react.md">}}) to work with auth and get access to the user details. But this still left a gap in the APIs, your APIs need to parse the JSON out of a custom header, which is base64 encoded. All a bit complicated in my book.

So, I decided to make another package to help with that, [`@aaronpowell/static-web-apps-api-auth`](https://github.com/aaronpowell/azure-static-web-apps-api-auth).

## Using the package

The package exposes two functions, `isAuthenticated` and `getUserInfo`. Here's an example of an API that uses the package:

```typescript
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import {
    getUserInfo,
    isAuthenticated
} from "@aaronpowell/static-web-apps-api-auth";

const httpTrigger: AzureFunction = async function(
    context: Context,
    req: HttpRequest
): Promise<void> {
    context.log("HTTP trigger function processed a request.");

    if (!isAuthenticated(req)) {
        context.res = {
            body: "You are not logged in at the moment"
        };
    } else {
        const { clientPrincipal } = getUserInfo(req);

        context.res = {
            body: `Thanks for logging in ${
                clientPrincipal.userDetails
            }. You logged in via ${
                clientPrincipal.identityProvider
            } and have the roles ${clientPrincipal.userRoles.join(", ")}`
        };
    }
};

export default httpTrigger;
```

The `isAuthenticated` function takes the request that the API receives and returns a boolean of whether the user is authenticated or not, and the `getUserInfo` unpacks the header data into a JavaScript object (with TypeScript typings) that you can work with.

Hopefully this makes it just that bit easier to work with authenticated experiences on Static Web Apps.
