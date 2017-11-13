+++
title = "Debugging PowerShell from VS Code on Linux using Docker containers"
date = 2017-11-13T17:08:45+11:00
description = "A valid(?) use case for using a Docker Linux container to run a GUI application on Windows"
draft = false
tags = ["linux", "docker"]
+++

I've previously blogged about [running a Docker Linux container on Windows to run VS Code on Linux]({{< ref "2017-09-21-vscode-linux-docker-windows.md" >}}) and at the time I was really just doing it because I wanted to work out if it was actually possible, which it was! But in reality it was really a solution just looking for a problem.

Well, good news, I have found the problem that this is a valid solution for! Well, as valid a solution as I can come up with at least.

One of my pet projects is a PowerShell module for managing different Node.js versions, called [nvm](https://github.com/aaronpowell/ps-nvmw). This little module has been floating around for a few years now, I add things to it whenever I find a problem, or someone reports one.

The other month someone raised an issue, the module [didn't work on OSX](https://github.com/aaronpowell/ps-nvmw/issues/21). Well I wasn't surprised, I'd never tried it on OSX but Felix was willing to give it a go. After a bit of back and forth it was all up and running. We then worked on a few other steps that saw automated tests written and CI setup on AppVeyor and Travis-CI.

And then what's next, well adding Linux support of course! It's being tracked [here](https://github.com/aaronpowell/ps-nvmw/issues/35). There was a problem though, an error is reported when running the tests, an odd error about version numbers. I figured that the error was coming something in the test framework but I don't know where so I needed to do some investigation.

But how do you do that when a) PowerShell is running on Linux and b) I don't run Linux?

**Docker!**

So I know you can run [PowerShell in a Linux container](https://store.docker.com/community/images/microsoft/powershell) and I previously proved I could run VS Code on a Linux container with X11 forwarding to Windows, so why don't we combine them, install the PowerShell VS Code extension and debug the tests! It beats trying to work out how to setup remote debugging.

It was just a matter of taking [Jessie's VS Code Dockerfile](https://github.com/jessfraz/dockerfiles/tree/master/vscode), changing the `FROM` to be `from microsoft/powershell` and then you're good to go!

[![Debugging PowerShell on Linux in VS Code in a Docker Container from Windows](/images/2017-11-13-debugging-powershell-from-vscode-on-linux-01.png)](/images/2017-11-13-docker-guis-on-windows-with-reasons-01.png)

Aww yeah! :grinning:

_For the record I did find the cause of the bug, it was a type conversion issue due to the order of precedence in PowerShell equality tests within Pester, as reported [here](https://github.com/pester/Pester/issues/864). Good to know JavaScript isn't the only one with type conversion issues :stuck_out_tongue:_