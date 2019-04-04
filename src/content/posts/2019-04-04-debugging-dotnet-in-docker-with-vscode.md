+++
title = "Debugging your .NET Core in Docker applications with VS Code"
date = 2019-04-04T11:54:45+11:00
description = "Using VS Code to debug a .NET Core application running within a Docker container"
draft = false
tags = ["docker", ".net", "vscode", "debugging"]
+++

One of the nicest things about building applications of .NET Core is that its cross-platform support means that we can deploy our application [as a Docker container](https://docs.microsoft.com/en-us/dotnet/core/docker/intro-net-docker?{{< cda >}}). If you're using Visual Studio it has [built in support for Docker](https://docs.microsoft.com/en-us/aspnet/core/host-and-deploy/docker/visual-studio-tools-for-docker?view=aspnetcore-2.2&{{< cda >}}) but that's not going to work if you're on Mac or Linux, of if like me, you prefer to use [VS Code](https://code.visualstudio.com/?{{< cda >}}) as your editor.

So if you create your `Dockerfile` for .NET it looks something like this:

```Dockerfile
FROM mcr.microsoft.com/dotnet/core/sdk:2.2
WORKDIR /app
COPY ./bin/Debug/netcoreapp2.2/publish .
ENTRYPOINT ["dotnet", "MyApplication.dll"]
```

Great! We can run our application now by building that image and starting the container, but what happens if we want to debug it?

## Enabling remote debugging

If you think about it logically, when running an application in Docker it's essentially being run remotely. Sure, it might be remotely on the same machine, but it's still "remote", and this is how we need to think about debugging!

To do this we'll need to install [MIEngine](https://github.com/Microsoft/MIEngine) into our Docker image as it's being built, and to do that we'll add a new layer into our `Dockerfile`:

```Dockerfile
FROM mcr.microsoft.com/dotnet/core/sdk:2.2
RUN apt update && \
    apt install unzip && \
    curl -sSL https://aka.ms/getvsdbgsh | /bin/sh /dev/stdin -v latest -l /vsdbg
WORKDIR /app
COPY ./bin/Debug/netcoreapp2.2/publish .
ENTRYPOINT ["dotnet", "MyApplication.dll"]
```

The new `RUN` layer will first update `apt` to get all the latest package references, then install `unzip` and finally execute `curl` which pipes to `/bin/sh`. It might seem a bit confusing, but that's because we're chaining three commands together into a single layer to reduce the size of our Docker image. Really the most important part is this line:

```sh
curl -sSL https://aka.ms/getvsdbgsh | /bin/sh /dev/stdin -v latest -l /vsdbg
```

This downloads a `sh` script from `https://aka.ms/getvsdbgsh` and pipes it straight to `/bin/sh` for execution and provides a few arguments, most importantly the `/vsdbg` which is where the remote debugger will be extracted to.

Now our image has the debugger installed into it we need to setup VS Code to attach to it.

## Attaching VS Code to a remote debugger

We're going to add a new entry to our `launch.json` file that is of `"type": "coreclr"` and `"request": "attach"`. This will cause VS Code to launch the process picker and allow us to pick our .NET Core process.

But wait, that's running in a Docker container, how do I pick that process?

Well, thankfully the process picker dialogue is capable of executing a command to get the list of processes and can do it against a remote machine.

Under the hood it will execute `docker exec -i <container name> /vsdbg/vsdbg` to list the processes within the container, but we'll do it a little bit nicer:

```json
{
    "name": ".NET Core Docker Attach",
    "type": "coreclr",
    "request": "attach",
    "processId": "${command:pickRemoteProcess}",
    "pipeTransport": {
        "pipeProgram": "docker",
        "pipeArgs": [ "exec", "-i", "sunshine-downloader" ],
        "debuggerPath": "/vsdbg/vsdbg",
        "pipeCwd": "${workspaceRoot}",
        "quoteArgs": false
    }
}
```

Now if you run your container and then launch the debugger in VS Code you'll be able to pick the `dotnet` process within the container that your application is using.

## Conclusion

And there you have it, you can now use VS Code as your editor of choice and also debug applications running in Docker containers. There are more advanced scenarios you can tackle with this including debugging via SSH, all of which are covered on [OmniSharp's wiki](https://github.com/OmniSharp/omnisharp-vscode/wiki/Attaching-to-remote-processes).

In fact, I'm using this to debug an F# application I'm building to run on .NET Core. 😉

Happy debugging! 😁

## Bonus Idea: Removing the additional layer with volumes

When I shared this post internally my colleague [Shayne Boyer](https://twitter.com/spboyer) brought up an idea on how to tackle this without adding a new layer to your `Dockerfile`, and in fact, making it possible to debug pre-built images (assuming they have the debugging symbols in them).

You can do this by downloading the vsdbg package for the distro your image is based off (Ubuntu, Alpine, ARM, etc.), which you can determine by reading the shell script (or download into a container 😉) onto your machine and then mounting the path as a volume when starting your container:

```sh
docker run --rm -v c:/path/to/vsdbg:/vsdbg --name my-dotnet-app my-dotnet-app
```

Now you've inserted the debugger into the container when you start it rather than bundling it into the image.