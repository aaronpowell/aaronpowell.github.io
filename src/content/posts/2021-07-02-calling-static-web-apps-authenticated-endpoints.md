+++
title = "Calling Static Web Apps Authenticated API Endpoints"
date = 2021-07-02T03:30:41Z
description = "Authenticated SWA endpoints can be tricky to test, as you don't control the headers... until now!"
draft = false
tags = ["javascript", "azure", "webdev"]
tracking_area = "javascript"
tracking_id = "34097"
cover_image = "/images/2021-07-02-calling-static-web-apps-authenticated-endpoints/cover_image.png"
+++

Static Web Apps provides built in [authentication and authorisation](https://docs.microsoft.com/azure/static-web-apps/authentication-authorization?{{<cda>}}), as well as [BYO options](https://docs.microsoft.com/azure/static-web-apps/authentication-custom?tabs=aad&{{<cda>}}) (like [Auth0]({{<ref "/posts/2021-05-13-using-auth0-with-static-web-apps.md">}}) or [Okta]({{<ref "/posts/2021-05-13-using-okta-with-static-web-apps.md">}})) and this is all handled by the SWA platform.

For local development, we can use the [cli tool]({{<ref "/posts/2021-05-25-leveling-up-static-web-apps-with-the-cli.md">}}) that can simulate how an authenticated experience works for local dev, without the hassle of setting up custom OAuth endpoints or anything like that.

This all works together nicely to make it easy to build authenticated experiences, test them locally and then deploy to Azure.

## The problem

While working on some content for an upcoming post, I hit a problem. I was building an authenticated experience and I wanted to test calling the API, but didn't want to have to click through all the screens that would get me to that point. I just wanted to use something like [REST Client for VS Code](https://marketplace.visualstudio.com/items?itemName=humao.rest-client&{{<cda>}}) (or Postman, Insomniac, Fiddler, etc.) to call a specific API endpoint in an authenticated manner.

But since we go via the cli, or in production, the SWA proxy (I'm not sure it's _really_ a proxy server, but that's what I call the thing that sits in front of your web and API endpoints to handle routing/auth/etc.), and not directly to the API, it poses a problem... **how does auth happen?**. It's just taken care of by the platform, headers are injected, auth tokens are created, and as a user, you don't need to think about it.

## How SWA tracks auth

It's time to get under the hood of Static Web Apps and try and work out how we can tell it that this inbound request from REST Client is authenticated and to pass the user information to the Functions backend.

Since we don't have access to the Static Web Apps source code, we'll have to dig around in the cli, although it's not the same, it's doing _something_ to set the right headers.

The cli works by intercepting the requests that come in and sending them to either the web app, API or its built in mock auth server, and for the API, that happens [here](https://github.com/Azure/static-web-apps-cli/blob/main/src/msha/handlers/function.handler.ts#L50) with the thing we're specifically looking for that sets the headers happening [in this callback](https://github.com/Azure/static-web-apps-cli/blob/main/src/msha/handlers/function.handler.ts#L71-L74). This calls the [`injectClientPrincipalCookies`](https://github.com/Azure/static-web-apps-cli/blob/main/src/msha/handlers/function.handler.ts#L28-L48) method and now we're starting to get somewhere.

What it's doing is looking for a specific cookie, named `StaticWebAppsAuthCookie`, which becomes the header that you unpack [in the API](https://docs.microsoft.com/azure/static-web-apps/user-information?tabs=javascript&{{<cda>}}#api-functions) to get the user info (or use my [nifty JavaScript library](https://github.com/aaronpowell/azure-static-web-apps-api-auth)).

## Simulating auth from REST tools

We now know the value that is expected by the cli to pass to the API, and it's something that we can get by opening the web app and going through an auth flow, then open up the browser dev tools and go to the **Application** tab -> **Cookies**:

![Cookies in browser dev tools](/images/2021-07-02-calling-static-web-apps-authenticated-endpoints/01.png)

Copy the cookie value, and it's time to use your favourite REST tool, I'll be using [REST Client for VS Code](https://marketplace.visualstudio.com/items?itemName=humao.rest-client&{{<cda>}}) and for the app I'm using my [Auth0 SWA sample](https://github.com/aaronpowell/swa-custom-auth-auth0).

Let's create an initial API call:

```
### Local
GET http://localhost:4280/api/get-message
```

Now, if you click the `Send Request` option above the request name it'll give you back a response in a new tab:

```
HTTP/1.1 200 OK
connection: close
date: Fri, 02 Jul 2021 05:42:49 GMT
content-type: text/plain; charset=utf-8
server: Kestrel
transfer-encoding: chunked

This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response. There is no logged in user
```

Nice! Our API is working, next up is to add the cookie to the request. With REST Client, we do that by adding a `Cookie` header, and custom headers are added to a request as subsequent lines from the one containing the HTTP request:

```
## Local
GET http://localhost:4280/api/get-message
Cookie: StaticWebAppsAuthCookie=<your cookie value here>
```

I'm logged in with a mock user that has the `userDetail` value being `test_user@auth0.com`, so the response is:

```
HTTP/1.1 200 OK
connection: close
date: Fri, 02 Jul 2021 05:45:16 GMT
content-type: text/plain; charset=utf-8
server: Kestrel
transfer-encoding: chunked

This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response. The user is test_user@auth0.com
```

🎉 We are making an authenticated requests from an external tool to SWA.

It you want to do this against a deployed SWA app, it's the same process, although the cookie is a lot bigger (I assume it's doing some better security than the cli 🤣) and I take no responsibility for it breaking down the track, as I don't know how the cookie is _really_ used!

## Conclusion

Static Web Apps authentication is great for adding security to an API, but it does become a little more challenging when we want to call that API from tools that we're commonly using for API testing.

Thankfully, we're able to simulate this by injecting a cookie to our requests that will "trick" the cli (and Azure) into thinking it was an authenticated request, passing the right user information down to the API.

Just be aware - trying to poke too much at security against the Azure resource is probably not the _best_ idea, but then again, we don't to dev against production do we... 😉
