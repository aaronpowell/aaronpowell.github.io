+++
title = "Scaffolding Static Web Apps"
date = 2021-11-16T03:41:40Z
description = "I make a lot of Azure Static Web Apps, so I make it easier to scaffold them."
draft = false
tags = ["javascript", "azure"]
tracking_area = "javascript"
tracking_id = "47883"
cover_image = "/images/2021-11-16-scaffolding-static-web-apps/cover_image.png"
social_image = "/images/2021-11-16-scaffolding-static-web-apps/a-lot-of-swa.png"
+++

![Jesus that's a lot of Static Web Apps (meme)](/images/2021-11-16-scaffolding-static-web-apps/a-lot-of-swa.png)

_Modified version of [this comic](https://jakelikesonions.com/post/158707858999/the-future-more-of-the-present)_

Over the past 18 months I've created a lot of [Azure Static Web Apps](https://docs.microsoft.com/azure/static-web-apps/?{{<cda>}}), like... a lot. I've hit the quota of free apps several times and had to clean out demos to keep testing things!

But it's always a little bit tedious, running `create-react-app`, setting up Functions, etc. so I went about creating a GitHub repo template for a [basic React + TypeScript + Functions app](https://github.com/aaronpowell/aswa-react-template). Then sometimes I'd be wanting a different framework, so I'd go off hunting for a new template, rinse and repeat.

## Enter `create-swa-app`

![create-swa-app demo](/images/2021-11-16-scaffolding-static-web-apps/terminal.gif)

To tackle this, I decided to create a command line tool to be used with `npm init`, [`@aaronpowell/swa-app`](https://github.com/aaronpowell/create-swa-app), which will guide you through the creation using one of the templates that is listed on [`awesome-static-web-apps`](https://github.com/staticwebdev/awesome-azure-static-web-apps#starter-kits). It will also offer to create a GitHub repo for you using the template (this will prompt for a GitHub sign in workflow), so you'll be ready to deploy it to Azure!

Think of this as a helpful starting point before jumping into the [SWA CLI](https://github.com/Azure/static-web-apps-cli) or [VS Code extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurestaticwebapps&{{<cda>}}).

Hopefully you'll find this as a useful way to scaffold up a Static Web Apps project!
