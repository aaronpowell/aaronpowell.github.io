+++
title = "Keystone on Azure: Part 1 - Local Dev"
date = 2021-09-29T02:19:08Z
description = "It's time to start a new series on using Keystone on Azure. Let's look at how we setup a local dev environment."
draft = true
tags = ["azure", "graphql", "javascript"]
tracking_area = "javascript"
tracking_id = "38807"
series = "keystone-on-azure"
series_title = "Local Dev"
+++

As I've been exploring GraphQL on Azure through my [series of the same name]({{<ref "/posts/2020-07-13-graphql-on-azure-part-1-getting-started.md">}}) I wanted to take a look at how we can run applications that provide GraphQL as an endpoint easily, specifically those which we'd class as headless CMSs (Content Management Systems).

So let's start a new series in which we look at one such headless CMS, [Keystone 6](https://keystonejs.com/). Keystone is an open source project created by the folks over at [Thinkmill](https://www.thinkmill.com.au/) and gives you a code-first approach to creating content types (models for the data you store), a web UI to edit the content and a GraphQL API in which you can consume the data via.

In this series we're going to create an app using Keystone, look at the services on Azure that we'd need to host it and how to deploy it using GitHub Actions. But first up, let's look at the local development experience and how we can optimise it for the way that (I think) gives you the best bang for buck.

## Setting up Keystone

The easiest way to setup Keystone is to use the `create-keystone-app` generator, which you can read about [in their docs](https://keystonejs.com/docs/walkthroughs/getting-started-with-create-keystone-app). I'm going to use npm as the package manager, but you're welcome to use yarn if that's your preference.

```bash
npm init keystone-app@latest azure-keystone-demo
```

This will create the app in the `azure-keystone-demo` folder, but feel free to change the folder name to whatever you want.

## Configuring VS Code

I use [VS Code](https://code.visualstudio.com/?{{<cda>}}) for all my development, so I'm going to show you how to set it up for optimal use in VS Code.

Once we've opened VS Code the first thing we'll do is add support for [Remote Container development](https://code.visualstudio.com/docs/remote/containers?{{<cda>}}). I've previously blogged about [why you need remote containers in projects]({{<ref "/posts/2021-03-08-your-open-source-project-needs-a-dev-container-heres-why.md">}}) and I do all of my development in them these days as I love having a fully isolated dev environment that only has the tooling I need at that point in time.

_You'll need to have the [Remote - Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers&{{<cda>}}) extension installed._

Open the VS Code Command Pallette (`F1`/`CTRL+SHIFT+P`) and type **Remote-Containers: Add Development Container Configuration Files** and select the [TypeScript and Node.js definition](https://github.com/microsoft/vscode-dev-containers/blob/v0.197.1/containers/typescript-node/.devcontainer/base.Dockerfile).

Before we reopen VS Code with the remote container we're going to do some tweaks to it. Open the `.devcontainer/devcontainer.json` file and let's add a few more extensions:

```json
  "extensions": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "apollographql.vscode-apollo",
    "prisma.prisma",
    "github.vscode-pull-request-github",
    "eg2.vscode-npm-script",
    "alexcvzz.vscode-sqlite"
  ],
```

This will configure VS Code with [eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint&{{<cda>}}), [prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode&{{<cda>}}), [Apollo's GraphQL plugin](https://marketplace.visualstudio.com/items?itemName=apollographql.vscode-apollo&{{<cda>}}) (for GraphQL language support), [Prisma's plugin](https://marketplace.visualstudio.com/items?itemName=prisma.prisma&{{<cda>}}) (for Prisma language support), [GitHub integration](https://marketplace.visualstudio.com/items?itemName=github.vscode-pull-request-github&{{<cda>}}), [npm](https://marketplace.visualstudio.com/items?itemName=eg2.vscode-npm-script&{{<cda>}}) and [a sqlite explorer](https://marketplace.visualstudio.com/items?itemName=alexcvzz.vscode-sqlite&{{<cda>}}).

Since we're using SQLite for local dev I find it useful to install the SQLite plugin for VS Code but that does mean that we need the `sqlite3` package installed into our container, so let's add that by opening the `Dockerfile` and adding the following line:

```dockerfile
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends sqlite3
```

Lastly, I like to add a `postCreateCommand` to my `devcontainer.json` file that does `npm install`, so all my dependencies are installed when the container starts up (if you're using `yarn`, then make the command `yarn install` instead).

Another useful thing you can do is setup some [VS Code Tasks](https://code.visualstudio.com/Docs/editor/tasks?{{<cda>}}) so that you can run the different commands (like `dev`, `start`, `build`) rather than using the terminal, but that's somewhat personal preference so I'll leave it as an exercise for the reader.

And with that done, you're dev environment is ready to go, use the command pallette to reopen VS Code in a container and you're all set.

## Conclusion

I know that this series is called "Keystone on Azure" and we didn't do anything with Azure, but I thought it was important to get ourselves setup and ready to go so that when we are ready to work with Azure, it's as easy as can be.