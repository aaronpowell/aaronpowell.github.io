+++
title = "Tools to Make Remote Workshops Easier"
date = 2021-04-29T03:50:26Z
description = "While remote workshops can be hard, here's a few tools to make them a little easier."
draft = false
tags = ["public-speaking", "conferences", "vscode"]
tracking_area = "javascript"
tracking_id = "17914"
+++

I wrote a post last year about [my first virtual workshop]({{<ref "/posts/2020-07-30-a-guide-to-virtual-workshops.md">}}). Since then I've had the opportunity to do more remote workshop, and in doing so I've picked up a few tools that I think are really useful for doing them, and possibly even useful for doing in-person workshops in the future, so I thought I'd share my learnings.

## VS Code Devcontainers

I [posted about]({{<ref "/posts/2021-03-08-your-open-source-project-needs-a-dev-container-heres-why.md">}}) [devcontainers](https://code.visualstudio.com/docs/remote/containers?{{<cda>}}) recently, but let me elaborate a bit more on them from a workshop perspective.

First, a quick recap of devcontainers. A devcontainer is a file that defines a Docker environment that VS Code will detect and load. With the definition file you can pre-install extensions, define VS Code settings and run bootstrapping commands, all of which happen within a Docker container, isolating the environment from the host machine.

This contained, predefined environment is really useful when it comes to workshops. One of the hardest things with workshops is that before you can get someone to start tackling the exercises, you have to get them setup. This can mean installing a runtime, but _which_ version of the runtime? I've had plenty of workshops where someone has the wrong version of Node or .NET installed, and they fall behind as they have to setup their machine. When running a remote workshop this makes it a lot easier to get someone participating as you can't sit down with them and help setup their machine.

If your workshop requires a more complex environment than a runtime and some exposed ports, say you need a database, messaging queue, etc., you can even pre-install those in the Docker image (or define their install in the Dockerfile) and have them all setup and ready to go. You can even use [Docker Compose](https://code.visualstudio.com/docs/remote/create-dev-container?{{<cda>}}#_use-docker-compose) to define a more complex infrastructure setup that your participants will work from.

You can even leverage a [remote Docker host](https://code.visualstudio.com/docs/remote/containers-advanced?{{<cda>}}#_developing-inside-a-container-on-a-remote-docker-host) so people don't have to run the Docker container themselves, instead you configure a VM somewhere that they connect to, reducing load on their machine.

If you've got a workshop that is broken over multiple steps you can configure it so that each step has its own devcontainer, loading the extensions only as they are needed and allow someone to run steps side-by-side. This is an approach I've taken with my [GraphQL and TypeScript workshop](https://github.com/aaronpowell/graphql-typescript-workshop), which has a devcontainer for each step, as well as one for the whole repository.

### Codespaces

_[GitHub Codespaces](https://github.com/codespaces) are in beta at the time of writing._

While devcontainers solve a real problem faced by workshop facilitators (both remote and in-person), it does require participants to have Docker installed. While Docker and containerised development is becoming more common place, it's not uncommon to have someone who doesn't have it installed or can't install it.

Thankfully, there's another tool on the horizon that offers up some more interesting possibilities, [GitHub Codespaces](https://github.com/codespaces). Codespaces is hosted devcontainers accessed by VS Code in the browser (well, in an over simplified explanation at least). This means that you no longer need to have the requirement to install Docker or even have VS Code installed, participants can open the workshop in the browser on a device as simple as an iPad, but still get the full development experience.

With Codespaces, the barrier to entry is now as low as someone having a GitHub account and internet connection, the latter of which they should have to attend an online workshop... 🤔

## Live Share

I talked about [Live Share](https://visualstudio.microsoft.com/services/live-share/?{{<cda>}}) [in my last post]({{<ref "/posts/2021-03-08-your-open-source-project-needs-a-dev-container-heres-why.md">}}) and the more I use it, the more I'm convinced that this is an undervalued tool.

If you're unfamiliar with Live Share, it allows you to make your VS Code (or Visual Studio) instance available to anyone you invite in, making a collaborative editor experience, similar to the likes of Google Docs/Word Online/etc. (and with all the chaos that involves). If you don't want other messing with your code, you can make the share read-only.

But it's not just giving people a view into your code, they are also able to access any webserver you run and terminals you open (again, these can be read only), set breakpoints and debug alongside you. It even has the same browser-only experience, like you get with Codespaces, meaning that people can join without having to install anything other than a browser.

As a participant you are no longer fighting with the limits of technology-over-video. No doubt you've experienced watching code over a video conferencing platform, only to have bandwidth drop and the text become fuzzy, or you missed a step and just want to go to another file. With Live Share you can tweak the editor to how you want to see it, bump the font up, change contrasts, even go to a file you missed.

Then as a facilitator Live Share can be a two-way street. Something that is harder in remote workshops is that you can't sit down with a participant and help them work through a roadblock as you can't see their code, but with Live Share they can give you access to their editor and together you can pair-program through it, boosting their confidence in getting through the exercises, and helping you ensure everyone is still on pace with each other.

I like to add Live Share as an extension in my `devcontainer.json`, so that participants are all ready to go with it as soon as they run their environment.

## CodeTour

[CodeTour](https://marketplace.visualstudio.com/items?itemName=vsls-contrib.codetour&{{<cda>}}) is an extension I've only just started using, and I'm already loving the possibilities of it.

CodeTour allows you to define a script for someone to follow as they are guided around a workspace. Check it out in my GraphQL and TypeScript workshop:

![CodeTour demo](/images/2021-04-29-tools-to-make-remote-workshops-easier-codetour.gif)

The video shows CodeTour giving us a path to follow around our exercise, along with commands to run in the terminal and code to insert. Everything covered in the steps also exists in the README, but this helps put the participant in the right context for where something goes and what to do next.

This can be really useful when you have a self-directed workshop (such as one available as a GitHub repo) or for when people have to tackle an exercise after you have setup the context for but leaving them to "do it themselves". By having these tours in place, if someone gets lost, they have some guideposts that can get them back on track (again, since you can't come and sit with them as easily).

## Conclusion

These three tools I see are really going to make it easier people to deliver remote/online workshops and for participants of them to feel more confident in active participation.

Whether it's giving everyone a consistent, predefined environment so you're removing the "did you install the right version of _something_?" roadblock by using a devcontainer, giving people direct access into the facilitators editor and a remote facilitator being able to pair-program with a participant using Live Share, or having a built-in script that someone can fall back onto if they get lost without waiting for the facilitator to notice them with a CodeTour. Each of these tools makes it just that little bit more exciting and engaging for doing remote workshops.

Is there any tools you've found useful for remote workshops, either as a facilitator or a participant? Let me know in the comments below!
