+++
title = "Adding User Profiles to Static Web Apps"
date = 2021-07-16T04:48:26Z
description = "SWA gives you authentication, but without much of a user profile, so let's look at how to add that."
draft = false
tags = ["javascript", "azure", "serverless"]
tracking_area = "javascript"
tracking_id = "35427"
+++

With Azure Static Web Apps we get a [user profile](https://docs.microsoft.com/azure/static-web-apps/user-information?tabs=javascript&{{<cda>}}) as part of the security platform, but that profile is pretty limited, we get an ID for the user and something contextual from the authentication provider, like an email address or a username. This means that if we want to create a more enriched user profile, we need to do it ourselves.

So, let's take a look at how we can do that. For this demo, I'm going to use the [React SWA template](https://github.com/aaronpowell/aswa-react-template), the npm package [`@aaronpowell/react-static-web-apps-auth`](https://www.npmjs.com/package/@aaronpowell/react-static-web-apps-auth) and [`@aaronpowell/static-web-apps-api-auth`](https://www.npmjs.com/package/@aaronpowell/static-web-apps-api-auth). We're also only going to use GitHub as the authentication provider, but the pattern displayed here is applicable to any authentication provider (you'd just need to figure out the appropriate APIs).

## Authenticating a user

First we're going to need some way to log the user in, or at least, checking that they are logged in, so we'll wrap the whole application in the `ClientPrincipalContextProvider` component:

```jsx
// updated index.jsx
ReactDOM.render(
    <React.StrictMode>
        <ClientPrincipalContextProvider>
            <App />
        </ClientPrincipalContextProvider>
    </React.StrictMode>,
    document.getElementById("root")
);
```

Having this `ContextProvider` means that we'll be able to use the `useClientPrincipal` React Hook (which the package ships with) to check if the user is logged in or not within our application, and that'll be critical to make the right decisions throughout the app.

Let's rewrite the `App` component to use the `useClientPrincipal` hook:

```jsx
function App() {
    const details = useClientPrincipal();

    if (!details.loaded) {
        return (
            <section>
                <h1>Loading...</h1>
            </section>
        );
    }

    // todo
    return null;
}
```

The `loaded` property of the Hook state is indicating whether or not we're received a response from the `/.auth/me` endpoint, which is what we use to determine if someone is authenticated to our app, if they're authenticated, we'll get the standard profile back, if not, we'll get a null profile. Once this has completed we can check for a `clientPrincipal`:

```jsx
function App() {
    const details = useClientPrincipal();

    if (!details.loaded) {
        return (
            <section>
                <h1>Loading...</h1>
            </section>
        );
    }

    if (!details.clientPrincipal) {
        return <Login />;
    }

    // todo
    return null;
}
```

We'll create a basic `Login` component that:

```jsx
function Login() {
    return (
        <section>
            <h1>Login</h1>
            <StaticWebAuthLogins azureAD={false} twitter={false} />
        </section>
    );
}
```

This uses the component from `@aaronpowell/react-static-web-apps-auth` and disabled Azure AD and Twitter, which are part of the [pre-configured providers](https://docs.microsoft.com/azure/static-web-apps/authentication-authorization?{{<cda>}}).

## Getting the GitHub user info

Before we can finish off the UI component, we need some way in which we can get the user's information from GitHub. Let's do that by adding a new API to our SWA:

```typescript
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import fetch, { Headers } from "node-fetch";
import {
    getUserInfo,
    isAuthenticated
} from "@aaronpowell/static-web-apps-api-auth";

const httpTrigger: AzureFunction = async function(
    context: Context,
    req: HttpRequest
): Promise<void> {
    if (!isAuthenticated(req)) {
        context.res = {
            status: 401
        };
        return;
    }

    const userInfo = getUserInfo(req);

    const headers = new Headers();
    headers.append("accept", "application/json");
    headers.append("user-agent", "azure-functions");
    headers.append(
        "authorization",
        `Basic ${Buffer.from(
            `${process.env.GitHubUsername}:${process.env.GitHubToken}`
        ).toString("base64")}`
    );
    const res = await fetch(
        `https://api.github.com/users/${userInfo.userDetails}`,
        {
            headers
        }
    );
    if (!res.ok) {
        const body = await res.text();
        context.res = {
            status: res.status,
            body
        };
        return;
    }
    const {
        login,
        avatar_url,
        html_url,
        name,
        company,
        blog,
        location,
        bio,
        twitter_username
    } = await res.json();

    context.res = {
        body: {
            login,
            avatar_url,
            html_url,
            name,
            company,
            blog,
            location,
            bio,
            twitter_username
        }
    };
};

export default httpTrigger;
```

The first thing this function is going to do is check that there is a logged in user, using the `isAuthenticated` function from the `@aaronpowell/static-web-apps-api-auth` package (you don't need to do this if you configure SWA to require the call to be authenticated, but I tend to do it out of habit anyway).

Assuming they are logged in, we'll make a call to the GitHub API to get the user's details. It'd be a good idea to provide an authentication token to do this, so you don't get rate limited. _Aside: I'm using `Buffer.from("...").toString("base64")` not `btoa` to do the encoding, as at the time of writing the API that SWA deploys runs Node.js ~12, and `btoa` was added to Node.js in ~14._

How do we know the user to access? The `clientPrincipal` that we get back has the `userDetails` field set to the GitHub username, so we can use that in the API call.

And then assuming that's successful, we'll return the fields that are we care about back to the client.

## `<GitHubIdentityContextProvider>`

We're going to build a new React Context (+ Provider) so that we can finish off our `App` like so:

```jsx
function App() {
    const details = useClientPrincipal();

    if (!details.loaded) {
        return (
            <section>
                <h1>Loading...</h1>
            </section>
        );
    }

    if (!details.clientPrincipal) {
        return <Login />;
    }

    return (
        <GitHubIdentityContextProvider>
            <User />
        </GitHubIdentityContextProvider>
    );
}
```

We'll create a new file called `GitHubIdentityContextProvider.tsx` and start creating our context provider:

```tsx
import { useClientPrincipal } from "@aaronpowell/react-static-web-apps-auth";
import React, { createContext, useContext } from "react";

type GitHubUser = {
    login: string;
    avatar_url: string;
    html_url: string;
    name: string;
    company: string;
    blog: string;
    location: string;
    bio: string;
    twitter_username: string;
};

const GitHubIdentityContext = createContext<GitHubUser | null>(null);
```

First thing, let's create a TypeScript type for the user, obviously skip this if you're not using TypeScript.

We'll then create our React Context using `createContext` and call it `GitHubIdentityContext`. We're not going to export this from the module, as we don't want people creating their own providers using it, we want to do that for them, so we can control how it populates the profile data.

Now for the Context Provider:

```tsx
const GitHubIdentityContextProvider = ({ children }: any) => {
    const swaUser = useClientPrincipal();
    const [githubUser, setGitHubUser] = React.useState<GitHubUser | null>(null);

    React.useEffect(() => {
        if (swaUser.loaded && swaUser.clientPrincipal) {
            fetch("/api/user-details")
                .then(res => res.json())
                .then(setGitHubUser);
        }
    }, [swaUser]);

    return (
        <GitHubIdentityContext.Provider value={githubUser}>
            {children}
        </GitHubIdentityContext.Provider>
    );
};
```

The `GitHubIdentityContextProvider` is a React Component, which uses the `useClientPrincipal` Hook and tracks the GitHub user details as local state. We'll use an effect Hook to wait for the profile to be loaded, and if it has been, call the new API that we created earlier in this post (I called mine `user-details`). Unpack the response as JSON and push it into state, now we have the GitHub user info available to our client.

Lastly, we'll create a custom Context Hook to expose this and export them from our module.

```tsx
const useGitHubUser = () => useContext(GitHubIdentityContext);

export { GitHubIdentityContextProvider, useGitHubUser };
```

## The `<User />` component

With the GitHub profile ready, we can create a `<User />` component to render the information out:

```tsx
function User() {
    const githubUser = useGitHubUser();

    if (!githubUser) {
        return null;
    }

    return (
        <div>
            <h1>{githubUser.name}</h1>
            <h2>
                Works at {githubUser.company} in {githubUser.location}
            </h2>
            <p>{githubUser.bio}</p>
            <ul>
                <li>
                    <a href={githubUser.html_url}>Profile</a>
                </li>
                <li>
                    <a
                        href={`https://twitter.com/${githubUser.twitter_username}`}
                    >
                        Twitter
                    </a>
                </li>
                <li>
                    <Logout />
                </li>
            </ul>
        </div>
    );
}
```

With a `null` check to ensure it isn't used in the wrong place (and to satisfy the TypeScript compiler that we aren't using a `null` object 😜) we can dump out the profile in whatever format we want.

And there we have it, an Azure Static Web App with authentication provided by GitHub, along with a rich user profile.

You can check out the full sample [on my GitHub](https://github.com/aaronpowell/swa-github-auth-identity), along with a [deployed version of the sample](https://victorious-moss-09e734410.azurestaticapps.net/).

{{<github "aaronpowell/swa-github-auth-identity">}}

## Conclusion

Static Web Apps does a good job of giving us the building blocks for creating an authenticated experience. In this post we've looked at how we can take those building blocks and create a rich user profile, provided by the underlying GitHub API.

Although this sample is GitHub centric, there's no reason you can't apply the pattern against any other authentication provider, including custom ones. You could even make an API that looks at the `identityProvider` property of the `clientPrincipal` and call Azure AD, Twitter, or any other provider in use.

I'd also suggest that you explore how you can effectively cache this data locally, either in a user store in Azure, or in the browser using `localStorage` or `sessionStorage`, but there are privacy considerations and data purging to think of, which is beyond the scope of what I wanted to cover in this post.

Hopefully this helps you create apps with richer user profiles.
