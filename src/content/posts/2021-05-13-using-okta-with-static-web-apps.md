+++
title = "Using Okta With Static Web Apps"
date = 2021-05-12T22:49:11Z
description = "With Azure Static Web Apps supporting custom authentication, let's look at how we can use Okta as a provider."
draft = false
tags = ["javascript", "serverless"]
tracking_area = "javascript"
tracking_id = "28109"
+++

One of my favorite features of (the now General Available) [Azure Static Web Apps (SWA)](https://docs.microsoft.com/azure/static-web-apps/?{{<cda>}}) is that in the Standard Tier you can now provide a custom [OpenID Connect (OIDC) provider](https://docs.microsoft.com/azure/static-web-apps/authentication-custom?tabs=aad&{{<cda>}}). This gives you a lot more control over who can and can't access your app.

In this post, I want to look at how we can use [Okta](https://www.okta.com/) and an OIDC provider for Static Web Apps.

For this, you'll need an Okta account, so if you don't already have one [go sign up](https://developer.okta.com/signup/) and maybe have a read of [their docs](https://developer.okta.com/docs/guides/quickstart/website/create-org/), just so you're across everything.

## Creating a Static Web App

_For this demo, we'll use the [React template](https://github.com/aaronpowell/aswa-react-template), but what we're covering isn't specific to React, it'll be applicable anywhere._

Once you've created your app, we're going to need to setup a [configuration file](https://docs.microsoft.com/azure/static-web-apps/configuration?{{<cda>}}), so add `staticwebapp.config.json` to the repo root.

This config file is used for controlling a lot of things within our SWA, but the most important part for us is going to be the `auth` section. Let's flesh out the skeleton for it:

```json
{
    "auth": {
        "identityProviders": {
            "customOpenIdConnectProviders": {}
        }
    }
}
```

Great! Now it's time to setup Okta.

## Creating an Okta application

Log into the Okta dashboard and navigate through to the Applications section of the portal:

![Manage Okta Applications](/images/swa-auth-okta/001.png)

From here, we're going to select **Create App Integration** and select _OIDC - OpenID Connect_ for the **Sign-on method** and _Web Application_ as the **Application type**. You might be tempted to select the SPA option, given that we're creating a JavaScript web application, but the reason we don't use that is that SWA's auth isn't handled by your application itself, it's handled by the underlying Azure service, which is a "web application", that then exposes the information out that you need.

![Create an application](/images/swa-auth-okta/002.png)

## Configure your Okta application

With your application created, it's time to configure it. Give it a name, something that'll make sense when you see it in the list of Okta applications, a logo if you desire, but leave the **Grant type** information alone, the defaults are configured for us just fine.

We are going to need to provide the application with some redirect options for login/logout, so that SWA will know you've logged in and can unpack the basic user information.

For the **Sign-in redirect URIs** you will need to add `https://<hostname>/.auth/login/okta/callback` and for **Sign-out redirect URIs** add `https://<hostname>/.auth/logout/okta/callback`. If you haven't yet deployed to Azure, don't worry about this step yet, we'll do it once the SWA is created.

_Quick note - the `okta` value here is going to be how we name the provider in the `staticwebapp.config.json`, so it can be anything you want, I just like to use the provider name so the config is easy to read._

Click **Save**, and it's time to finish off our SWA config file.

![Completed settings](/images/swa-auth-okta/003.png)

## Completing our settings

With our Okta application setup, it's time to complete our config file so it can use it. We'll add a new configuration under `customOpenIdConnectProviders` for Okta and it'll contain two core pieces of information, the information on how to register the OIDC provider and some login information on how to talk to the provider.

Inside `registration`, we'll add a `clientIdSettingName` field, which will point to an entry in the [app settings](https://docs.microsoft.com/azure/static-web-apps/application-settings?{{<cda>}}) that the SWA has. Next, we'll need a `clientCredential` object that has `clientSecretSettingName` that is the entry for the OIDC client secret. Lastly, we'll provide the `openIdConnectConfiguration` with a `wellKnownOpenIdConfiguration` endpoint that is `https://<your_okta_domain>/.well-known//openid-configuration`.

The config should now look like this:

```json
{
    "auth": {
        "identityProviders": {
            "customOpenIdConnectProviders": {
                "okta": {
                    "registration": {
                        "clientIdSettingName": "OKTA_ID",
                        "clientCredential": {
                            "clientSecretSettingName": "OKTA_SECRET"
                        },
                        "openIdConnectConfiguration": {
                            "wellKnownOpenIdConfiguration": "https://dev-920852.okta.com/.well-known/openid-configuration"
                        }
                    }
                }
            }
        }
    }
}
```

_I use `OKTA_ID` and `OKTA_SECRET` as the names of the items I'll be putting into app settings._

All this information will tell SWA how to issue a request against the right application in Okta, but we still need to tell it how to make the request and handle the response. That's what we use the `login` config for. With the `login` config, we provide a `nameClaimType`, which is a fully-qualified path to the claim that we want SWA to use as the [`userDetails` field of the user info](https://docs.microsoft.com/azure/static-web-apps/user-information?tabs=javascript&{{<cda>}}). Generally speaking, you'll want this to be `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name`, but if there's a custom field in your response claims you want to use, make sure you provide that. The other bit of config we need here is what scopes to request from Okta. For SWA, you only need `openid` and `profile` as the scopes, unless you're wanting to use a `nameClaimType` other than standard.

Let's finish off our SWA config:

```json
{
    "auth": {
        "identityProviders": {
            "customOpenIdConnectProviders": {
                "okta": {
                    "registration": {
                        "clientIdSettingName": "OKTA_ID",
                        "clientCredential": {
                            "clientSecretSettingName": "OKTA_SECRET"
                        },
                        "openIdConnectConfiguration": {
                            "wellKnownOpenIdConfiguration": "https://dev-920852.okta.com/.well-known/openid-configuration"
                        }
                    },
                    "login": {
                        "nameClaimType": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
                        "scopes": ["openid", "profile"]
                    }
                }
            }
        }
    }
}
```

With the config ready you can create the SWA in Azure and kick off a deployment (don't forget to update the Okta app with the login/logout callbacks). When the resource is created in Azure, copy the **Client ID** and **Client secret** from Okta and create app settings in Azure using the names in your config and the values from Okta.

## Using the provider

Once the provider is registered in the config file, it is usable just like the other providers SWA offers, with the login being `/.auth/login/<provider_name>`, which in this case the `provider_name` is `okta`. The user information will then be exposed [as standard](https://docs.microsoft.com/azure/static-web-apps/user-information?tabs=javascript&{{<cda>}}) to both the web and API components.

If you're building a React application, check out [my React auth helper](https://www.npmjs.com/package/@aaronpowell/react-static-web-apps-auth) and for the API [there is a companion](https://www.npmjs.com/package/@aaronpowell/static-web-apps-api-auth).

## Conclusion

I really like that with the GA of Static Web Apps we are now able to use custom OIDC providers with the platform. This makes it a lot easier to have controlled user access and integration with a more complex auth story when needed. Setting this up with Okta only takes a few lines of config.

You can check out a full code sample [on my GitHub](https://github.com/aaronpowell/swa-custom-auth-okta) and a live demo [here](https://blue-bay-0eac9b910.azurestaticapps.net) (but I'm not giving you my Okta credentials 😝).
