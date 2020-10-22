+++
title = "Building a Video Chat App, Part 1 - Setup"
date = 2020-10-06T09:18:43+10:00
description = "Let's get started with building our video chat app"
draft = false
tags = ["javascript", "azure"]
series = "building-video-chat"
series_title = "Setup"
tracking_area = "javascript"
tracking_id = "10223"
+++

Last week I kicked off a [new stream series]({{<ref "/posts/2020-09-29-new-stream-series-building-a-video-calling-app.md">}}) in which we're going to take a look at [Azure Communication Services (ACS)](https://azure.microsoft.com/blog/build-rich-communication-experiences-at-scale-with-azure-communication-services/?{{<cda>}}).

Well, the first episode is out and I wanted to document what we learnt with building on ACS.

## Setting the scene

ACS is essentially the backend for Teams, but provided in a way that you can integrate it into your existing applications. For our case, we're building from scratch and the target deployment is going to be [Azure Static Web Apps (SWA)](https://docs.microsoft.com/azure/static-web-apps?{{<cda>}}) as this will give us an API backend (for user management), a host for our React front end and most importantly, account management.

For the codebase, we're starting with a [React TypeScript GitHub template](https://github.com/aaronpowell/aswa-react-template) that I've created for SWA, with the API backend written in TypeScript Azure Functions.

## Giving users access

One thing that is really awesome about ACS is that you bring your own authentication model, meaning that you aren't being forced to port your application to Azure AD or anything, but it does raise the question, how do you grant the user access?

Well, this is where the API backend that we're using in SWA comes into play, you need a token service that will issue tokens for the users, however your representing them. Let's take a look at how to do that.

### Creating a token service

We'll use a [HTTP Trigger](https://docs.microsoft.com/azure/azure-functions/functions-bindings-http-webhook-trigger?tabs=javascript&{{<cda>}}) to do this, and it'll live at `/api/issueToken`. Start by creating that within the `api` folder of the Git repo:

```bash
func new --template HttpTrigger --name issueToken
```

In our Function, the first thing that we'll do is the ensure that there is a logged in user. SWA provides a mechanism to do that [via its config file](https://docs.microsoft.com/azure/static-web-apps/routes?{{<cda>}}#securing-routes-with-roles), but we also want to get access to the [user profile](https://docs.microsoft.com/azure/static-web-apps/user-information?tabs=javascript&{{<cda>}}#api-functions) and validate it (we won't use the profile yet, but in the future we will).

Time to remove the boilerplate Function code and start putting in ours:

```typescript
import { AzureFunction, Context, HttpRequest } from "@azure/functions";

type ClientPrincipal = {
    identityProvider: string;
    userId: string;
    userDetails: string;
    userRoles: string[];
};

const httpTrigger: AzureFunction = async function(
    context: Context,
    req: HttpRequest
): Promise<void> {
    const header = req.headers["x-ms-client-principal"];
    const encoded = Buffer.from(header, "base64");
    const decoded = encoded.toString("ascii");

    const principal: ClientPrincipal = JSON.parse(decoded);

    if (!principal.userId) {
        context.res = {
            status: 401,
            body: "The user name is required to ensure their access token"
        };
        return;
    }

    context.res = {
        body: "TODO"
    };
};

export default httpTrigger;
```

Here we're unpacking the header and ensuring that there is a `userId` in the principal, if not, then we'll return bad request.

Now we're going to integrate the the ACS administration npm package, [`@azure/communication-administration`](https://www.npmjs.com/package/@azure/communication-administration) which gives us the ability to issue a token for the user. This token is then used in the client application to connect with ACS and do whatever we're allowing the client to do.

```bash
npm install --save @azure/communication-administration
```

With the package installed, we can incorporate it in and issue our token. To do that we need to create a `CommunicationIdentityClient`, in which we provide the connection string to ACS.

_If you haven't created an ACS resource yet, check out [the docs](https://docs.microsoft.com/azure/communication-services/quickstarts/create-communication-resource?tabs=windows&pivots=platform-azp&{{<cda>}})._

```typescript
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { CommunicationIdentityClient } from "@azure/communication-administration";

const identityClient = new CommunicationIdentityClient(
    process.env["COMMUNICATION_SERVICES_CONNECTION_STRING"]
);

// snip
```

_I've added a connection string to the `local.settings.json`, as per [Azure Functions docs](https://docs.microsoft.com/azure/azure-functions/functions-run-local?tabs=windows%2Ccsharp%2Cbash&{{<cda>}}#local-settings-file) called `COMMUNICATION_SERVICES_CONNECTION_STRING` that gives me access to ACS._

Once the `identityClient` is ready, we can use it within the Function:

```typescript {hl_lines=[20,21]}
// snip
const httpTrigger: AzureFunction = async function(
    context: Context,
    req: HttpRequest
): Promise<void> {
    const header = req.headers["x-ms-client-principal"];
    const encoded = Buffer.from(header, "base64");
    const decoded = encoded.toString("ascii");

    const principal: ClientPrincipal = JSON.parse(decoded);

    if (!principal.userId) {
        context.res = {
            status: 401,
            body: "The user name is required to ensure their access token"
        };
        return;
    }

    const user = await identityClient.createUser();
    const tokenResponse = await identityClient.issueToken(user, ["voip"]);

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: {
            token: tokenResponse.token,
            expiresOn: tokenResponse.expiresOn,
            communicationUserId: user.communicationUserId
        } as TokenResponse
    };
};

export default httpTrigger;
```

The important lines from above are these two lines:

```typescript
const user = await identityClient.createUser();
const tokenResponse = await identityClient.issueToken(user, ["voip"]);
```

The first is creating a user in ACS. Notice how this user doesn't have any direct relationship to the user account we've got in our system already. This does mean that we're creating a whole new user each time that we want a token, rather than associating the ACS user with our systems user, so down the track we're going to need to work out how to do that more effectively, but this is ok for the moment. Once we have our `CommunicationUser` we then call the `issueToken` method, and provide it with the scopes that we want the user to have, in this case the token will only allow them to have VOIP capabilities, but if you wanted them to have chat as well, then you'd need to explicitly grant them that.

But with that, our backend is done and we're able to issue tokens for the client application.

## Conclusion

This isn't everything that we managed to get to in the first episode, but it is the most important thing because once we can issue tokens we can start to build up the client application. You'll find the code in the [`part-01` tag on GitHub](https://github.com/aaronpowell/super-duper-enigma/tree/part-01), and you can watch the whole episode on YouTube. Nex time, we're going to start displaying camera feeds and accessing the microphone.

{{<youtube ryf1011Qvzw>}}
