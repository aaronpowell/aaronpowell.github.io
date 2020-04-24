+++
title = "A Walk Through of My Terminal Setup"
date = 2020-04-24T11:05:11+10:00
description = "A few videos showing how I configured my terminal for WSL2"
draft = false
tags = ["random"]
+++

Recently, I blogged about [how I setup a Windows dev environment]({{<ref "/posts/2020-03-25-how-i-setup-a-windows-dev-environment.md" >}}) in which I talked about some of the specific tools I install to get things working on both PowerShell and WSL2.

On the back of it I was asked if I could show it off in action so I did a couple of quick videos where I walk through some of the setup that I have.

## WSL2 + VS Code

In this video I show off the basics of how I setup and use [tmux](https://github.com/tmux/tmux/wiki), which is a terminal multiplexer. Basically, this allows me to do a lot of really powerful things from the terminal such as split panes, run nested windows (kind of like tabs) and show some useful information about my machine. I also off the [VS Code Remote WSL](https://code.visualstudio.com/docs/remote/wsl?{{<cda>}}) extension which I use to do the majority of my work.

{{<youtube V64KbADgwis>}}

## tmux URL View Plugin

I did this video mainly because I was finding a particular tmux plugin, [urlview](https://github.com/tmux-plugins/tmux-urlview), so amazingly productive I just had to show it off. The plugin scans the terminal output for URLs and then will give you a list of them to launch into a browser (which I configure to be MS Edge back in Windows). I find it super handy if you're working with forks of GitHub repos as I can, with a few keystrokes, launch into the 'New Pull Request' screen one I push changes to my fork!

{{<youtube 0tOuGXyOjDo>}}

## Wrap Up

Like many of us, I'm starting to play around with streaming and other forms of "snackable" video content, so if there's anything you've been wondering about how I do dev, or any tools you've seen my show off in presentations that you want to know more about, do reach out and let me know as I'm happy to throw together a video that covers it off.
