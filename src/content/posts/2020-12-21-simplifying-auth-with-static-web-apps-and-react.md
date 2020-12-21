+++
title = "Simplifying Auth With Static Web Apps and React"
date = 2020-12-21T15:41:00+11:00
description = "I created a small npm package to make SWA auth simpler in React apps"
draft = false
tags = ["javascript", "azure", "serverless"]
tracking_area = "javascript"
tracking_id = "12079"
+++

It's no secret that I'm a fan of [Azure Static Web Apps](https://docs.microsoft.com/azure/static-web-apps/?{{<cda>}}) and I'm constantly looking for ways to make it easier for people to get working with it.

Something I hadn't done much with until recently was work with the [Authentication and Authorization](https://docs.microsoft.com/azure/static-web-apps/authentication-authorization?{{<cda>}}) aspect of it; I knew it was there, but I wasn't building anything that required it.

While [building a video chat app]({{<ref "/posts/2020-10-06-building-a-video-chat-app-part-1-setup.md">}}) on [Twitch](https://twitch.tv/NumberOneAaron) I found myself jumping back and forth to the documentation to make sure that I was creating the login URLs correctly, loading the profiles, etc. and so it's time to do something about it.

## Introducing `react-static-web-apps-auth`

I created a npm package, [`@aaronpowell/react-static-web-apps-auth`](https://www.npmjs.com/package/@aaronpowell/react-static-web-apps-auth), which helps simplify development.

It introduces a component, `<StaticWebAppsAuthLogins />`, which will display all the auth providers (you can hide them by setting their corresponding prop to `false`), as well as a `<Logout />` component and a React Context provider, `<UserInfoContextProvider>`, to give up access to the current user profile.

If you're interested in the process of building it, I streamed that, including setting up a GitHub Actions pipeline with package deployment ([like I blogged recently]({{<ref "/posts/2020-11-06-deploy-to-github-packages-with-github-actions.md">}})).

{{<youtube "MjHRSueoNsM">}}
