+++
title = "Your Open Source Project Needs a devcontainer - Here's Why"
date = 2021-03-08T00:04:31Z
description = "A look at devcontainers and why you should have them on all projects"
draft = false
tags = ["vscode", "docker", "oss"]
tracking_area = "javascript"
tracking_id = "17914"
cover_image = "/images/banners/2021-03-08-your-open-source-project-needs-a-dev-container-heres-why.png"
+++

**TL;DR**: Add a [devcontainer](https://code.visualstudio.com/docs/remote/containers?{{<cda>}}) to your projects now, you'll thank me later.

---

Prior to joining Microsoft I worked a consultant, so every few months I'd join with a new development team and undertake the dreaded task of any new starter... _machine setup_. Many of us have been there, you have a wiki page (often outdated) of steps to follow to setup the development environment _just right_, otherwise you won't be able to work as intended.

These days I do similar things, but instead of it being going into a client, I'm jumping into an open source repo to poke around, try out the quickstarts or contribute back to it, and well, XKCD probably said it best.

[![Competing standard](https://imgs.xkcd.com/comics/standards.png)](https://xkcd.com/927/)

As a community we celebrate individuality, whether it's your choice of indentation style, yarn vs npm vs pnpm, linting rules, monorepo tools, etc. that's entirely up to you as an OSS project maintainer, but as an outsider coming in, that's where it can be a bit more difficult. When someone comes to your repo there's a process they'll go through, first they'll look for and setup instructions in the `README` file, "what version of Node/dotnet/Python/etc. is required?", "what package manager(s) are being used?", "how does one install all the dependencies?", and so on. Failing that, it's digging for a contributors guide, whether that's a `CONTRIBUTING.md` file, or a page on a wiki, something that'll help them get started.

All of this starts producing barriers to be able to effectively contribute. Have the wrong version of dotnet and you might not be able to compile. Didn't realise a linter/formatter was in use can result in a PR failing to meet the code style guide. While dealing with these PR's as a maintainer is frustrating, it's equally so for a contributor who has to go back and rework something that they were unaware about to begin with.

## Standardising Environments with devcontainers

This is where dev [devcontainers](https://code.visualstudio.com/docs/remote/containers?{{<cda>}}) come in. A devcontainer is used by the VS Code Remote Containers extension and works by creating a Docker container to do your development in.

As the development environment is within Docker, you supply the [`Dockerfile`](https://docs.docker.com/engine/reference/builder/) and VS Code will take care of building the image and starting the container for you. Then since you control the `Dockerfile` you can have it install any software you need for your project, set the right version of Node, install global packages, etc.

This is just a plain old `Dockerfile`, you can run it without VS Code using the standard Docker tools and mount a volume in, but the power comes when you combine it with the `devcontainers.json` file, which gives VS Code instructions on how to configure itself.

Using eslint + prettier? Tell the devcontainer to install those extensions so the user has them already installed. Want some VS Code settings enabled by default, specify them so users don't have to know about it.

## Creating a devcontainer

You're going to need VS Code and Docker installed, but also the [Remote Extensions pack](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack&{{<cda>}}) to give you the Remote Containers extension.

Open the command pallette (`CTRL/CMD + SHIFT + P`) and search for **Remote-Containers: Add Development Container Configuration Files**. This command will give you a list of possible devcontainers that you and start with (pro tip, the definitions are [here](https://github.com/microsoft/vscode-dev-containers)), so select the one you want.

_VS Code will detect the devcontainer and ask if you want to open in it, you can or you can wait until we've done any changes to the files we want._

This will add a `.devcontainer` folder, along with the starting files you need based off your chosen container (likely `Dockerfile` and `devcontainer.json`, but sometimes some auxillary scripts too). You'll find the ones for this blog [here](https://github.com/aaronpowell/aaronpowell.github.io/tree/main/.devcontainer), and if we look at the `Dockerfile`, it doesn't do much other than setup dotnet and node, with the versions specified in the `devcontainer.json` file. Go ahead and add any steps you need for your dev environment, have Docker install more software, whatever is needed.

Next, open your `devcontainer.json` file and it's time to get the VS Code side of things going. Give the devcontainer a name (I called this one `Aaron's blog`), and set the extensions you want installed by default. I use prettier on my blog to format the markdown, so I'll make sure that's installed, along with a spellcheck plugin!

```json
{
    "name": "Aaron's blog",
    "extensions": [
        "ms-dotnettools.csharp",
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "editorconfig.editorconfig",
        "streetsidesoftware.code-spell-checker"
    ]
    // snip
}
```

There are other things that can be configured from the `devcontainer.json` file. If you've got a webserver, you can tell it your exposing those ports, for example. Another handy option is `postCreateCommand`, which allows you to run commands once the container has started, such as `npm install`, so as soon someone starts work, everything is ready to go.

With all the files ready, we can open the devcontainer by reloading the window (Command Pallette -> `Developer: Reload Window`) and clicking the notification when it appears to open the container.

Also, every time we change either the `Dockerfile` or `devcontainer.json` VS Code will detect it and ask if we want to recreate the environment, so we keep ourselves in sync.

## Conclusion

Devcontainers are awesome, we can use them to define an isolated development environment within Docker that has all that we need, and only what we need, installed in it. This helps simplify people getting into a new codebase by removing the barrier of unknown around what to setup before then can start working. While I talked about this from the standpoint of OSS, the same pattern can be applied to internal company projects. You don't even have to ship a `Dockerfile`, you can point the `devcontainer.json` to a Docker image and speed up the process.

So let's make it easier for people to jump into a codebase by giving them a scripted environment to start with!

## Bonus tip - Use with GitHub Codespaces

_At the time of writing [GitHub Codespaces](https://github.com/features/codespaces?{{<cda>}}) is in private preview, so you'll need to request access, or wait until it's publicly available._

If you have a devcontainer in your GitHub repo, when you open a GitHub Codespace, it'll use that definition. This is really awesome, but I don't think I can do it justice, instead, check out this video my colleague [Alvaro](https://twitter.com/old_sound?s=20) did to show it off. He literally can't contain his excitement.

{{<youtube B_gtLXvDQhE>}}

Imaging being able to jump into a project that runs tools like RabbitMQ, but you don't need to make sure it's installed/configured/etc., as the dev environment is already scripted for you.

Yeah, I think this is pretty neat.
