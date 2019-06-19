+++
title = "Home Grown IoT - Local Dev"
date = 2019-06-19T09:24:38+10:00
description = "A look at how you can do local development with IoT solutions"
draft = false
tags = ["fsharp", "iot"]
series = "home-grown-iot"
series_title = "Local Dev"
+++

Now that we're starting to build [our IoT application]({{< ref "/posts/2019-06-12-home-grown-iot-data-downloader.md" >}}) it's time to start talking about the local development experience for the application. At the end of the day I use [IoT Edge](https://docs.microsoft.com/en-us/azure/iot-edge/?{{< cda >}}) to do the deployment onto the device and manage the communication with [IoT Hub](https://docs.microsoft.com/en-us/azure/iot-hub/?{{< cda >}}) and there is a very comprehensive development guide for [Visual Studio Code](https://docs.microsoft.com/en-us/azure/iot-edge/how-to-vs-code-develop-module?{{< cda >}}) and [Visual Studio 2019](https://docs.microsoft.com/en-us/azure/iot-edge/how-to-visual-studio-develop-module?{{< cda >}}). The workflow of this is to create a new IoT Edge project, setup IoT Edge on your machine and do deployments to it that way. This is the way I'd recommend going about it yourself as it gives you the best replication of production and local development.

But as you might have guessed I **didn't** follow that guide myself, mainly because I didn't integrate with IoT Edge (or IoT Hub for that matter) until _after_ I'd started building my solution, instead I retrofitted them back into a standard .NET Core project, and this is what I'll talk about today.

## Defining Our Moving Parts

Another reason that I didn't go back and completely integrate IoT Edge into my project for local development is because I have a single git repo that contains three main pieces, the Downloader that runs on the Raspberry Pi, some Azure Functions that run in Azure and a webserver that I use as a mock of my inverter API that is only used to support local development.

This has meant that my git repo looks like this:

```
/src
    /Sunshine.Downloader
    /Sunshine.Functions
    /Sunshine.MockAPI
```

And everything kind of assumes that you're doing 1 project per repo, so the only thing that is there is IoT "stuff", which isn't my case.

With all of this in mind it was easier to have a local development setup that works _for my scenario_ than shoehorn in the recommended guidance.

## Docker All The Things

I'm a huge fan of using Docker for local development and given that IoT Edge deployments use Docker images to run on the device it was a convenient decision that I made early on to do my development this way! But here's the kicker, I have 3 different containers that I'll need to run (_yes_ I could put it all into a single container, **no** you shouldn't do that) so how do we effectively do that in Visual Studio Code? A `launch.json` file tends to be around [debugging](https://code.visualstudio.com/Docs/editor/debugging?{{< cda >}}), so we'll have to stick to just using [tasks](https://code.visualstudio.com/Docs/editor/tasks?{{< cda >}}).

### Building Images

This is the first thing that we'll need to do, build the three different images that are needed for local development. But here's the interesting problem, it's a single .NET Core solution that shares some code files across the projects (mostly type definitions so I can do type-certainty across the wire) meaning I really only want to do a compile once. That is a bit of a pain with Docker, I'd normally use [multi-stage builds](https://docs.docker.com/develop/develop-images/multistage-build/) and do the compile step in there, spitting out the image with the compiled files, but that won't work easily when I spit out three images!

To combat this I do the compilation (and publish) step on my host machine first and then pull the build artifacts into the images. This comes with a slight overhead as I have to run a few tasks manually in VS Code.

### Orchestrating With Tasks

I have three main tasks that I use in VS Code for running locally. The first does the publish ([`publish:debug`](https://github.com/aaronpowell/sunshine/blob/c1005c8bf8ec1d295f05398556bd1bf8dccd7e36/.vscode/tasks.json#L34-L40)) of the .NET solution so I get the artifacts to be used in the Docker images ([`docker build`](https://github.com/aaronpowell/sunshine/blob/c1005c8bf8ec1d295f05398556bd1bf8dccd7e36/.vscode/tasks.json#L109-L118)) and finally is a task that creates the three images and finally a task that starts all three containers ([`docker run`](https://github.com/aaronpowell/sunshine/blob/c1005c8bf8ec1d295f05398556bd1bf8dccd7e36/.vscode/tasks.json#L119-L128)). You'll find the [`tasks.json`](https://github.com/aaronpowell/sunshine/blob/c1005c8bf8ec1d295f05398556bd1bf8dccd7e36/.vscode/tasks.json) in the GitHub repository.

All of these tasks are [Compound Tasks](https://code.visualstudio.com/Docs/editor/tasks?{{< cda >}}#_compound-tasks), meaning they are tasks that run other tasks. One thing to remember about compound tasks is that the tasks you list in the `dependsOn` property are executed in parallel, so if you want a task that runs an image it has to depend on a task that builds the image and it depends on the .NET publish. This was a slight annoyance for me since I have 3 tasks (image creation) that depend on 1 task completion (.NET publish), so I have to run them manually.

### Debugging

I've previously written about [debugging .NET Core in Docker from VS Code]({{< ref "/posts/2019-04-04-debugging-dotnet-in-docker-with-vscode.md" >}}) and a challenge I had [debugging the Azure Functions base image]({{< ref "/posts/2019-05-17-fixing-cant-connect-to-docker-debugger.md" >}}) and this is the process I use for local development, start the containers with tasks, use `launch.json` to attach to containers as required. The biggest pain is that you can't connect the debugger to multiple containers at one time, but this is just a limitation in the debugger in VS Code (and not a major pain).

## Conclusion

The approach I'm taking for local development isn't really tied to this project being an IoT project, instead, it's more running a few small .NET applications, all using Docker containers. Using Docker means that I can easily control the environment I'm using for development but also replicates how the IoT part of the project will run in production.

If I was building a project to run on more devices than just my own (and for use in a team environment) I'd use the approach described on the Microsoft docs for [Visual Studio Code](https://docs.microsoft.com/en-us/azure/iot-edge/how-to-vs-code-develop-module?{{< cda >}}) and [Visual Studio 2019](https://docs.microsoft.com/en-us/azure/iot-edge/how-to-visual-studio-develop-module?{{< cda >}}) as it's a lot more robust. But this works just fine for my needs. 😉