+++
title = "Implementing a Token Store With APIM Authorizations"
date = 2022-06-16T02:05:27Z
description = "Let's take a look at making OAuth2 simpler with APIM Authorizations"
draft = false
tags = ["security", "javascript"]
tracking_area = "javascript"
tracking_id = "57408"
canonical = "https://techcommunity.microsoft.com/t5/apps-on-azure-blog/implementing-a-token-store-with-apim-authorizations/ba-p/3453516"
+++

{{<youtube mVSugXueVYM>}}

In this post, we're going to take a look at the [recently previewed Authorizations](https://docs.microsoft.com/azure/api-management/authorizations-overview{{<cda>}}) feature of [Azure API Management (APIM)](https://docs.microsoft.com/azure/api-management/api-management-key-concepts{{<cda>}}) and see how to setup a React and TypeScript application that uses the Dropbox SDK to upload a file, without needing to handle OAuth token creation.

## What is APIM Authorizations

Before we dive into creating the application, let's quickly look at what this feature is.

In a connected system, being able to communicate between different Software as a Service (SaaS) platforms is a common task, but often these platforms will use OAuth2 to verify the user identity. This requires undertaking an authentication flow, which is fine if you're directly using the system, but what if it's being handled by a background job, like an Azure Function running with a Timer Trigger? Then we need to use alternative authentication workflows, handle expiry of tokens, etc.

This can result in a lot of our application code being responsible for managing and storing tokens.

And this is where Authorizations comes in, it is a managed **Token Store** for your OAuth2 access tokens. Rather than your application having to authenticate, APIM will handle this on your behalf. It also means your application can operate in a lower trust environment, rather than your application needing to know about the `client id`/`client secret` of the SaaS provider, it becomes unaware and only relies on the REST API to API Management to get the token back as-needed.

You can learn more about Authorizations in APIM on [their docs](https://docs.microsoft.com/azure/api-management/authorizations-overview{{<cda>}}).

## Creating our app

The application we're creating is a data entry form that could be used to capture user information while at an event, a person will enter their information and it'll generate a file to upload to Dropbox, which could later be ingested by another part of our system.

Let's start by generating the new application using [`vite`](https://vitejs.dev/):

```bash
npm create vite@latest my-app -- --template react-ts
```

Next, we'll start creating the form that we'll use for data capture, so open the `my-app` folder in VS Code (or any other editor of your choice) and we'll add a form to the `App.tsx` file:

```tsx
const updateField = (
    updater: React.Dispatch<React.SetStateAction<UserInfo>>
) => (e: ChangeEvent<HTMLInputElement>) =>
    updater(userInfo => ({
        ...userInfo,
        [e.target.name]: e.target.value
    }));

function App() {
    const [userInfo, setUserInfo] = useState<UserInfo>({});
    const [submitting, setSubmitting] = useState(false);

    return (
        <div className="App">
            <header className="App-header">
                <h1>Contoso Lead Capture</h1>
                <form
                    action=""
                    onSubmit={e => (e.preventDefault(), setSubmitting(true))}
                >
                    <fieldset>
                        <div>
                            <label htmlFor="firstName">First name</label>
                            <input
                                type="text"
                                name="firstName"
                                id="firstName"
                                placeholder="Aaron"
                                value={userInfo.firstName}
                                onChange={updateField(setUserInfo)}
                            />
                        </div>
                        <div>
                            <label htmlFor="lastName">Last name</label>
                            <input
                                type="text"
                                name="lastName"
                                id="lastName"
                                placeholder="Powell"
                                value={userInfo.lastName}
                                onChange={updateField(setUserInfo)}
                            />
                        </div>
                    </fieldset>

                    <fieldset>
                        <div>
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="foo@email.com"
                                value={userInfo.email}
                                onChange={updateField(setUserInfo)}
                            />
                        </div>

                        <div>
                            <label htmlFor="phone">Phone</label>
                            <input
                                type="phone"
                                id="phone"
                                name="phone"
                                placeholder="555-555-555"
                                value={userInfo.phone}
                                onChange={updateField(setUserInfo)}
                            />
                        </div>
                    </fieldset>

                    <fieldset>
                        <button
                            type="submit"
                            disabled={
                                submitting ||
                                !userInfo.firstName ||
                                !userInfo.lastName ||
                                !userInfo.email ||
                                !userInfo.phone
                            }
                        >
                            Submit
                        </button>
                    </fieldset>
                </form>
            </header>
        </div>
    );
}
```

I've also brought in the [`useState` hook](https://reactjs.org/docs/hooks-state.html) so that we can set the values of the various fields as we go along and created a type the represent the data in the form (and put it in a new file called `types.ts`):

```ts
export type UserInfo = {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
};
```

## Hooking up to Dropbox

It's time to hook up with Dropbox, so we'll need their JavaScript SDK:

```bash
npm install --save dropbox
```

And we'll put the save process in a [`useEffect` hook](https://reactjs.org/docs/hooks-effect.html):

```ts
const [dropboxResponse, setDropboxResponse] = useState<
    DropboxSaveResponse | undefined
>();

useEffect(() => {
    async function saveToDropbox() {
        const accessToken = "???";

        const dropbox = new Dropbox({ accessToken });

        const contents = `${userInfo.firstName},${userInfo.lastName},${userInfo.email},${userInfo.phone}`;
        const path = `/submissions/${+new Date()}.csv`;

        const response = await dropbox.filesUpload({
            path,
            contents
        });
        if (response.status !== 200) {
            setDropboxResponse({
                error: true,
                message: "Failed to upload to dropbox"
            });
            return;
        }

        setDropboxResponse({
            error: false,
            message: "Details have been saved. Start again?"
        });
    }

    if (!submitting) {
        return;
    }

    saveToDropbox();
}, [submitting, userInfo]);
```

I've also created a type called `DropboxSaveResponse` to set on the hook:

```ts
export type DropboxSaveResponse = {
    error: boolean;
    message: string;
};
```

Our code is ready, well, except for one critical part - how do we get our access token for the Dropbox SDK? Well, we could kick off a Dropbox auth flow, but now everyone has to be able to approve access to the shared Dropbox account, which isn't ideal. Thankfully, this is exactly what APIM Authorizations is designed for.

## Setting up APIM with Authorizations

We're going to use the Azure Portal to deploy our APIM instance, but as part of the sample repo, we've also provided some [Bicep](https://docs.microsoft.com/azure/azure-resource-manager/bicep/overview?tabs=bicep&WT.mc_id=javascript-57408-aapowell) templates, so if that's your preferred approach, head over to [the GitHub repo](https://github.com/aaronpowell/token-store-demo) for that guide. Also, if you just want to get deployed, click the **Deploy to Azure** button below:

[![Deploy To Azure](https://raw.githubusercontent.com/Azure/azure-quickstart-templates/master/1-CONTRIBUTION-GUIDE/images/deploytoazure.svg?sanitize=true)](https://portal.azure.com/?Microsoft_Azure_ApiManagement=tuanguye2&feature.tokenstores=true#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Faaronpowell%2Ftoken-store-demo%2Fmain%2Fsrc%2Fbackend%2Fmain.json)

_Note: Please be aware this is preview so there may be some changes before the final release._

Head over the the [Azure Portal](https://portal.azure.com{{<cda>}}) and create a new APIM instance:

![Create an APIM instance](/images/2022-06-16-implementing-a-token-store-with-apim-authorizations/01.png)

Fill in the required fields and click through the other screens (there's nothing more that we need to add to the APIM resource beyond the first screen - unless you want to configure APIM for other uses).

_Note: For the preview, you'll need to use the **Developer** pricing tier._

When the resource has been created, you should see a new **Authorizations (preview)** option under the _APIs_ grouping:

![Navigate to Authorizations](/images/2022-06-16-implementing-a-token-store-with-apim-authorizations/02.png)

Click on that and we'll see a list of previously created Authorizations, but since we haven't got any yet, we'll start with the **Create** button to provision it:

![Authorizations landing view](/images/2022-06-16-implementing-a-token-store-with-apim-authorizations/03.png)

From this screen, we can configure the OAuth2 service that we are going to authorize against, and you'll see all that's available in the _Identity provider_ list. Since we're using Dropbox, you'll need to have created a [Dropbox app](https://dropbox.com/developers/apps) and obtained the _client id_ and _client secret_ already (if you haven't done that, head over to [Dropbox](https://dropbox.com/developers/apps) and set that up).

When filling out this form, note down the _Provider name_ and _Authorization name_, as we're going to need those later on.

Also, ensure that the _Scopes_ you provide match that in Dropbox. Since we're going to be uploading files we're going to need `files.metadata.write files.contents.write files.content.read`, but match those to your applications needs.

![Create an Authorization](/images/2022-06-16-implementing-a-token-store-with-apim-authorizations/04.png)
Before going to the next screen, copy the _Redirect URL_ and add that to the Dropbox application, so that it can authenticate on the next step:

![Authenticate the Authorization](/images/2022-06-16-implementing-a-token-store-with-apim-authorizations/05.png)

On step two of the process, we need to authenticate APIM against our Dropbox application using the OAuth2 application we've created, so click the _Login with DropBox_ button and follow the authorization workflow that it provides.

The last stage of setting up the Authorization is configuring the Access Policy the Authorization will use, you can either link this to users/groups within AAD or you can use a managed identity, such as the one provided by APIM. We're going to use the managed identity:

![Select Managed Identity](/images/2022-06-16-implementing-a-token-store-with-apim-authorizations/06.png)

From the fly-in window select **API Management service** for the _Managed identity_ and then pick your service from the listed options.

![Chose the right Managed Identity](/images/2022-06-16-implementing-a-token-store-with-apim-authorizations/07.png)

This will populate the main window and we can finish the setup.

![Created Authorization](/images/2022-06-16-implementing-a-token-store-with-apim-authorizations/08.png)

## Accessing our token

APIM is now acting as our Token Store, and will get new OAuth2 tokens for us as required, but _we_ still need to access them, and for that, we're going to create an API endpoint in API to return it. Head over to the _APIs_ section and we're going to manually define a HTTP API:

![Define a new API](/images/2022-06-16-implementing-a-token-store-with-apim-authorizations/09.png)

The API I've defined will be available at the `/token` route, and since we'll be calling it from another web host, we need to configure a CORS policy. We can do that by clicking on _All operations_ and opening the code editor for policies to replace the default with:

```xml
<policies>
    <inbound>
        <cors allow-credentials="false">
            <allowed-origins>
                <origin>*</origin>
            </allowed-origins>
            <allowed-methods>
                <method>GET</method>
                <method>POST</method>
            </allowed-methods>
        </cors>
    </inbound>
    <backend>
        <forward-request />
    </backend>
    <outbound />
    <on-error />
</policies>
```

This is defining an _inbound_ policy that allows CORS from all origins (you might want to tighten that up in a production app!) and passes through all requests to the backend without interference.

Now we can create an operation to the API so that we can get back the token:

![Create an API operation](/images/2022-06-16-implementing-a-token-store-with-apim-authorizations/10.png)

I'm calling the operation `Get Dropbox token` and making it a HTTP `GET` at the `/` URL, which is relative to the path of the API that we've defined, meaning it's a GET request against `/token`.

With that saved, we need to define just what this API will do. Since we want to access the token store that our authorizations use, we're going to use the [`get-authorization-context` policy]() on the _inbound_ request:

```xml
<policies>
<inbound>
    <base />
    <get-authorization-context provider-id="dropbox-demo" authorization-id="auth" context-variable-name="auth-context" ignore-error="false" identity-type="managed" />
    <return-response>
        <set-body>@(((Authorization)context.Variables.GetValueOrDefault(&quot;auth-context&quot;))?.AccessToken)</set-body>
    </return-response>
</inbound>
<backend>
    <base />
</backend>
<outbound>
    <base />
</outbound>
<on-error>
    <base />
</on-error>
</policies>
```

The `get-authorization-context` policy needs two bits of information that we set when we created the Authorization initially, the name of the provider, `dropbox-demo`, and the name of the Authorization, `auth`. The policy will then call into our token store, grab the token and we set it as the body using `set-body`, to return in our response. This is just setting a `text/plain` response, but you could build up a JSON payload if that was more preferred in your scenario.

Save the policy, click the _Test_ tab at the top and fire off the request:

![Test our API](/images/2022-06-16-implementing-a-token-store-with-apim-authorizations/12.png)

Success! We can see in the _HTTP response_ that the response body contains our OAuth2 token that we can can provide to the Dropbox SDK.

## Hooking it all up

APIM is all configured with the authorizations now so it's time to integrate with our application.

From the React application we're going to make a call to the `/token` API that we created, and you can get the URL from this command:

```bash
SUBSCRIPTION_KEY=$(az rest --method post --url /$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.ApiManagement/service/$APIM_NAME/subscriptions/master/listSecrets?api-version=2021-08-01 | jq .primaryKey -r)
GATEWAY_URL=$(az apim show --name $APIM_NAME --resource-group $RESOURCE_GROUP --query gatewayUrl --output tsv)

echo "$GATEWAY_URL?dropbox-demo/token?subscription-key=$SUBSCRIPTION_KEY"
```

_Note: We are going to be including the `subscription key` in the URL and that key will be exposed via the React app so it can call APIM, meaning you are potentially leaking secrets. In a more robust application you'd likely include an Azure Function which makes the call to Dropbox, rather than doing it in the browser, so your client would POST to Azure Functions and it in turn would retrieve the access token and upload the file. But we're keeping it in the client for today's demo._

To use this from our React application, create a `.env` file at the root of your workspace and add it in like so:

```env
VITE_APIM_ENDPOINT=<...>
```

Now we can go back to our `App.tsx` and update this line:

```js
const accessToken = "???";
```

To:

```js
const accessTokenResponse = await fetch(import.meta.env.VITE_APIM_ENDPOINT);
const accessToken = await accessTokenResponse.text();
```

Start the application with `npm run dev`, fill out the data in the form and hit submit - you'll see a call to APIM that gets back the access token and then it's provided to the Dropbox SDK to upload the file to Dropbox.

![Sample app in action](/images/2022-06-16-implementing-a-token-store-with-apim-authorizations/token-store.gif)

## Conclusion

There we have it, you've learnt about a new feature we've added to API Management - Authorizations.

Throughout this post we've taken a look at how to setup Authorizations in APIM, in this case we've used Dropbox, connected APIM to our Dropbox application to it can request OAuth2 access tokens on our behalf. We then created a policy in APIM that will return the access token via an API call we can make, rather than us having to build our own API from scratch.

We also built a React application that can call the API we created in APIM to get back the Dropbox access token from the token store, provide it to the Dropbox SDK and then upload a file to Dropbox, all without the client having to undertake an OAuth2 flow itself.

You'll find the sample of this application [on GitHub](https://github.com/aaronpowell/token-store-demo), including the scripts for provisioning APIM and a Blazor/C# version. To learn more about the Blazor version, check out [this article](https://aka.ms/tokenstore/blazor) by my colleague [Justin Yoo](https://twitter.com/justinchronicle).

Don't forget to have a read of the [Authorizations in API Management docs](https://docs.microsoft.com/azure/api-management/authorizations-overview{{<cda>}}) and let us know what kinds of things you would find this useful for.
