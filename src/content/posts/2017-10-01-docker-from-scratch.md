+++
title = "Docker, FROM scratch"
date = 2017-10-01T18:38:36+10:00
description = "Learning Docker by starting at the basics and working our way up"
draft = false
tags = ["docker", "conference", "ndc", "speaking"]
+++

A perk of working at Readify is that we strive to be leaders in technology so we're always encouraged to learn new things. One such thing that I started getting into a year or so ago was [Docker](https://www.docker.com/). Now I'm not an infrastructure person, I left that part of IT a long time ago, so what I was interested in Docker for was how it can be used in a development experience and how it fits there before even beginning to look at running a containerised production environment.

So as a consultant (well, [former consultant]({{< ref "/posts/2017-09-27-readify-pc-12-months-on.md" >}})) I would often spend time coaching people around what Docker is and where to get started and what I realised was that too often those of us who've been working on a technology for a while forget that there's a lot of people who haven't started that journey yet. There's a long way from running Kubenetes clusters in production when you've not yet created your first container.

## Docker, FROM scratch

At [NDC Sydney](https://ndcsydney.com/) this year I presented a new talk I've been working on in this space called **Docker, FROM scratch**. You can watch the talk here:

{{< youtube i7yoXqlg48M >}}

In this talk I walk through a getting started guide to Docker, we start at the basic "Hello World" style example of running an Ubuntu container and dropping into a shell, then we go all the way through to running a multi-container architecture with multiple networks. I do this by walking through a git repository [which you can find here](https://github.com/aaronpowell/docker-from-scratch) (and there is a [walk through](https://github.com/aaronpowell/docker-from-scratch/wiki) of each step too).

I quite enjoy giving this talk so I hope you find this a useful introduction to Docker so you can get started on your journey.