+++
title = "Fixing Issue When You Can't Connect to Docker Debugger in VS Code"
date = 2019-05-17T15:35:46+10:00
description = "Some Docker containers can't connect because they can't find the process, here's a fix"
draft = false
tags = ["docker", ".net", "vscode", "debugging"]
+++

I've [previously blogged about debugging .NET Docker containers in VS Code]({{< ref "/posts/2019-04-04-debugging-dotnet-in-docker-with-vscode.md" >}}) but recently I came across a problem with a container that I had a .NET Core application in failing to connect the debugger with the following error:

```
Executing: docker.exe exec -i sunshine-functions sh -s < /home/aaron/.vscode-remote/extensions/ms-vscode.csharp-1.19.1/scripts/remoteProcessPickerScript
Linux
stderr: sh: 1: ps: not found
Error Message: Command failed: docker.exe exec -i sunshine-functions sh -s < /home/aaron/.vscode-remote/extensions/ms-vscode.csharp-1.19.1/scripts/remoteProcessPickerScript
sh: 1: ps: not found
```

THe crux of the problem is that it's unable to list the processes that I need to pick from in VS Code.

The image I was using as my base image was the [Azure Functions Host](https://hub.docker.com/_/microsoft-azure-functions-base), specifically `mcr.microsoft.com/azure-functions/dotnet` and it turns out that this particular image doesn't have [`ps`](http://man7.org/linux/man-pages/man1/ps.1.html) anywhere in it!

Thankfully, this is an easy fix, you need to install `procps` using `apt install`, assuming your image is from a distro that supports `apt` of course. 😉

Once `ps` is installed into your image you'll now be able to list the processes and then debug your image.