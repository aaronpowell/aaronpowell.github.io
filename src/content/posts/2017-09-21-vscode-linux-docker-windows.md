+++
title = "VS Code, Linux, Docker for Windows"
date = 2017-09-21T13:41:09+10:00
description = ""
draft = false
tags = ["linux", "docker"]
+++

I'm currently writing a blog post on VS Code for Linux, running inside a Linux docker container, hosted by Docker for Windows (on my Windows 10 machine), with the UI being piped across to Windows using a X11 server.

Why? Because why not!

![Blog-ception!](/images/vscode-linux-windows.gif)

## What the hell is this all about?

Back when I was first getting into computers I was a Linux kid, I ran a Linux server at home to do local DHCP/squid proxy/etc. and I ran Linux on my laptop (a lovely 486 laptop with an external network card) which was always fun to get drivers for. I was compiling my own kernel, experimenting with every different distro that I could get my hands on and living mostly on the terminal.

As I moved to becoming a web developer I found myself developing on ASP.NET 1.1 (well, started with ASP, then moving to .NET :stuck_out_tongue:) so my Linux machines would get less and less love, eventually finding themselves relegated to the back of the closet.

So what's this trip down memory lane got to do with anything? Well unless you've been living under a rock you'll be aware of [Docker](https://www.docker.com/) which makes it really easy to run containerised Linux applications on Windows (and Windows containers, but that's not relevant for this post).

I'm a big fan of Docker, I find it really useful not just for working out how to deploy something through to production, but also for running applications you don't want to install, I use if when I come across single-use applications like 7zip (because someone once sent me a `.7z` file)!

And also if you know me you'll know that I quite like to do things that people would think are, well, dumb. And when talking to some people when I have done Docker training they've asked about GUI applications. Now naturally I said this was probably not possible as you can only really drop internal a terminal session.

Well I was then talking to another friend of mine, [Jason Stangroome](https://twitter.com/jstangroome), who does a lot of work in Docker pointed out that it's totally possible. This is when I got a TIL on how GUI's work for applications using [X11](https://en.wikipedia.org/wiki/X_Window_System). It turns out that X11 actually works across network protocols to draw the display. Now in hindsight this actually makes a lot of sense because if you've ever worked with a remote Linux (or Unix) server you can connect to GUI applications it runs, I remember doing that with PuTTY back in the day.

This then got my brain turning, if you could work out how put something with a GUI into a container and launch it, it's just a matter of starting an X11 server that it connects to. Like any good idea it turns out that others have already done it, and Jason pointed to me to the works of [Jessie Frazelle](https://twitter.com/jessfraz). Jessie wrote a blog about how she [runs applications in containers](https://blog.jessfraz.com/post/docker-containers-on-the-desktop/), including applications with GUI's.

From this I decided it was time to work out how to make this work on Windows.

## Running Linux GUIs on Windows from Docker

The first thing you need to do is go out and find yourself a X server for Windows. Now it seems there's a number of different options available, unfortunately it seems that a little more unpleasant than you'd like because all the OSS servers I found are hosted on SourceForge and, well, I refuse to trust anything that comes from there! So instead I went with the free version of [MobaXterm](http://mobaxterm.mobatek.net/) and doesn't even require an install.

Now you're ready to go, fire up MobaXterm and configure its X server, I left it running on the defaults using 'Multiwindow Mode' so each application that I run through it can be managed independently.

The only thing left for me to do is to actually run something against it. I headed over to Jessie's [Dockerfiles on GitHub](https://github.com/jessfraz/dockerfiles) to find something to play with. To ensure my craziness was properly justified I thought I'd grab VS Code, and it's also quite a basic container to run.

And running it was simple:

```
PS> docker run --rm -e DISPLAY=192.168.2.13:0.0 -v "$(Get-Location):/code" jess/vscode
```

I ran this from my PowerShell terminal and the above is what you saw! The only thing I changed from [the example](https://github.com/jessfraz/dockerfiles/blob/master/vscode/Dockerfile) is that I don't mount `/tmp/.X11-unix` as a volume (I don't have that on Windows), the `DISPLAY` environment variable doesn't require the `unix` prefix and I don't include `--display /dev/dir` (mainly because I don't know what it does :stuck_out_tongue:).

So there you go, we are now running a GUI application from a Docker container running on Docker for Windows launched from PowerShell, mounting a folder from your Windows OS.

Sure the font doesn't look quite right, it's somewhat laggy when your typing (making writing a blog a bit odd) and I don't have my VS Code settings, but I've got it containerised damnit!

## Running Linux GUIs on Windows from Docker in WSL

Sofar I've managed to get everything running through a number of layers, but there's one more layer I wanted to add, Windows Subsystem for Linux, aka WSL. This is a native Linux implementation running on Windows allowing you to run Linux binaries. My first step was to install Docker in WSL, which is just a matter of following the [standard install instructions](https://docs.docker.com/engine/installation/linux/docker-ce/ubuntu/). But one thing you can't do is run Docker containers on WSL, but that's not a problem, the Docker client just points at a running daemon somewhere, so we can point the Linux client to the daemon running in Windows (you have to disable TLS over TCP too, not sure why, you just do)!

So we can now run this:

```
$ docker -H localhost:2375 run --rm -e DISPLAY=192.168.2.13:0.0 -v pwd:/code jess/vscode
```

And there you have it, you're using a Linux `docker` binary to connect to Docker running on Windows to run a Linux container on a VM in Hyper-V, to connect to an X Server running on Windows to run a text editor writing in JavaScript.

**Because why the hell not!**