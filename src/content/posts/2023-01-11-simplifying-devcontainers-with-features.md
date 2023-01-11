+++
title = "Simplifying devcontainers With Features"
date = 2023-01-11T04:36:59Z
description = "Sometimes we want to add things to a devcontainer, but how do we do that in the simplest way"
draft = false
tags = ["vscode"]
tracking_area = "devcloud"
tracking_id = "84568"
+++

As much as I love using [devcontainers](https://containers.dev) for all my local development (see [here]({{<ref "/posts/2021-05-27-local-dev-with-cosmosdb-and-devcontainers.md">}})) there's often repeatable things that I want to do in them which means I go back and copy `RUN` steps from previous Dockerfiles that I've created.

## Enter devcontainer Features

A few months ago a new proposal was added to the [open dev container spec](https://containers.dev/) (the spec that supports devcontainers in vscode) for [custom features](https://code.visualstudio.com/blogs/2022/09/15/dev-container-features).

Features are predefined scripts that you can add to your `devcontainer.json` file that will add something to the base image or existing Dockerfile that you are using for a devcontainer. By doing this, you simplify the base that you're starting from and avoid a situation where you are having to add development tooling to what could be a shared image across environments.

## Using Features for my blog

The repo that my blog lives in has had a devcontainer definition for nearly two years ([see!](https://github.com/aaronpowell/aaronpowell.github.io/commit/a8dc8966ad2301e17ccc542d4ed47e5dba38feb0)), and in that time I've maintained a Dockerfile that uses the base image and a `devcontainer.json` file that describes how to use it within VS Code.

Over time I've added some more to the `RUN` command in the Dockerfile that installed more default installs, and it just kind of did it's thing.

Today though, I decided to port it across to using Features, and you'll find the [commit here](https://github.com/aaronpowell/aaronpowell.github.io/commit/dd8d3bd72014e1023381a9b9c06cc449faf19f7a).

The primary changes in the commit are moving away from maintaining a Dockerfile myself to using a generic base image, `mcr.microsoft.com/devcontainers/base:bullseye` to be precise, and adding the following Features:

```json
  "features": {
    "ghcr.io/devcontainers/features/github-cli:1": {},
    "ghcr.io/devcontainers/features/hugo:1": {},
    "ghcr.io/devcontainers/features/node:1": {},
    "ghcr.io/devcontainers/features/dotnet:1": {
      "version": "lts"
    },
    "ghcr.io/jlaundry/devcontainer-features/azure-functions-core-tools:1": {}
  }
```

Now when the container is rebuilt it'll use the generic base image before layering on the features that I need, making it a clearer view of what has been modified in the container that I'm developing in.

## Conclusion

While my blog might be a reasonably trivial place to have a complex devcontainer, I see that using Features is a really simple way to reduce the complexity of the local container setup. It would be quite possible to reuse the Dockerfile that defines your production infrastructure and then layer some Features over that, allowing it to be used for both local development and production deployments, without the risk of developer tooling leaking out.

The other added bonus is that you can define your own Features and use them within your organisations repos. Check out [the docs](https://containers.dev/implementors/features/#authoring) for insights on writing your own (it can be as simple as a JSON file and bash script!).
