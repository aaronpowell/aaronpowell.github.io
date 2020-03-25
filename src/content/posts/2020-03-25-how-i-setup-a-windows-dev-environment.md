+++
title = "How I Setup a Windows Dev Environment"
date = 2020-03-25T14:08:06+11:00
description = "I get asked occasionally how I setup my machine, so here we are"
draft = false
tags = ["random"]
+++

Earlier this year I was tagged into a Twitter thread by [Amy Kapernick](https://twitter.com/Amys_Kapers) of someone looking to setup a dev environment on Windows:

{{<tweet 1219827746219544576>}}

_Aside: Amy [has done one too](https://amygoestoperth.com.au/setting-up-a-windows-computer-for-dev) that you should also check out._

I've done development primarily on Windows for over 15 years now so setting up an environment is something I'm rather familiar with, and coincidentally in the past week I've setup 3 machines because, first up, my primary work machine was having some issues so I thought it's best for a refresh, which turned out to actually be a hardware failure. Next, I setup an old device while I wait for a replacement to be shipped, and finally, my replacement arrived a lot sooner than expected so I've just set that one up. All in all, I've done 3 machine setups in the past week so I'm getting the hang of it! 🤣

## What I Need

To get started let me explain a bit about my requirements and how I like to have my machine running. I'm a minimalist when it comes to my machine, I don't keep tabs open in the browser (right now I have 3 tabs open, Twitter, Amy's post and this posts preview), I don't have apps running I'm not using (Outlook, Edge Canary, VS Code, Terminal, Slack and Teams are all that are open right now) nor do I have software that I "might" need installed (if it's transient, there's a Docker image for that).

Given that I'm primarily writing either .NET or Node apps I'm not going to waste time installing languages and runtimes that I'm not actively working with. Also, I do this primarily in [Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/about?{{<cda>}}), specifically [WSL2](https://docs.microsoft.com/en-us/windows/wsl/wsl2-install?{{<cda>}}), so I really have two machines to setup.

For me, the OS install is a transient state, nothing on the machine is meant to last so if it's not in a git repo or on OneDrive, it's not something I actually care about, because I'll blow the machine away periodically and start from scratch.

## Script All The Setups

Because of this I script the setup as much as I can, I don't want to spend hours finding software, I want to hit the big red "deploy dev environment" button. Conveniently, I have those scripts available in my [system-init repo](https://github.com/aaronpowell/system-init) on GitHub.

### Script 1 - Windows

Occasionally I came across tools or codebases that don't work well in WSL, or maybe there's a GUI that I need and I can't be bothered with an X11 server, so that means I do setup Windows for dev and for that I have a [PowerShell script](https://github.com/aaronpowell/system-init/blob/master/windows/setup.ps1).

To simplify the install of software on Windows I use [Chocolatey](https://chocolatey.org) for most of the stuff I want to install:

-   Git
    -   My `.gitconfig` is [in the repo](https://github.com/aaronpowell/system-init/blob/master/common/.gitconfig) so I download that too
-   VS Code Insiders (I want the bleeding edge!)
    -   I sign into the preview [Settings Sync](https://code.visualstudio.com/docs/editor/settings-sync) feature and VS Code is all setup for me
-   .NET Core SDK (latest version)
-   [Fiddler](https://www.telerik.com/fiddler) (web proxy/network debugger)
-   [Postman](https://www.postman.com/)
-   [LINQPad](https://www.linqpad.net/)
-   Firefox
-   Google Chrome

I manually install Edge Canary as it's the first thing I install (until it just ships in the box!) so I add the other browsers just for cross-browser testing.

There's a few other things I'll manually install as they ship via the Windows Store and automating installs from that is a bit trickier:

-   Windows Terminal (I want a decent terminal)
    -   I keep my [settings for Terminal in the repo](https://github.com/aaronpowell/system-init/blob/master/windows/profiles.json) and copy them in once installed
-   Cascadia Code PL font
-   Ubuntu as my WSL distro
-   Visual Studio Preview (I'm too lazy to work out how to automate the install of that)

Once the applications are installed I install a few PowerShell modules from [PowerShell Gallery](https://www.powershellgallery.com/):

-   [Posh-Git](https://github.com/dahlbyk/posh-git)
    -   Show the git status in the PowerShell prompt
-   [PowerShell nvm](https://github.com/aaronpowell/ps-nvm)
    -   A Node Version Manager using PowerShell semantics that I wrote

The `README.md` has the command to run to install it (from an admin PowerShell prompt) and I kick back for a period of time while it does its thing.

### Script 2 - WSL

With Windows setup it's time to setup my WSL environment. I don't automate the activation of WSL2, mainly because it requires a reboot so I have to interact with the machine anyway and then I can control when I do it, but once WSL2 is activated and the Ubuntu distro installed I kick off the [`setup.sh`](https://github.com/aaronpowell/system-init/blob/master/linux/setup.sh) bash script I've written. This was originally written to setup WSL _or_ Linux as a primary OS, so there's some old code in there, but the main stuff I run is:

```sh
install_git
install_shell
install_docker
install_devtools
```

_I also kick off an `sudo apt-get update && sudo apt-get upgrade` to ensure I am all up to date._

This installs:

-   git
    -   I pull down the same `.gitconfig` as I use on Windows but change `autocrlf` to `false` and set the path of the credential helper to the [Git Credential Manager for Windows](https://github.com/microsoft/Git-Credential-Manager-for-Windows) which allows me to use the same git credentials from WSL2 and Windows, and also gives me the nice MFA prompt through to GitHub (I prefer username/password/MFA over ssh keys)
-   [zsh](http://www.zsh.org/) and [oh my zsh](https://ohmyz.sh/)
    -   My [`.zshrc`](https://github.com/aaronpowell/system-init/blob/master/linux/.zshrc) is in the repo
-   [tmux](https://github.com/tmux/tmux/wiki) (a terminal multiplexer, basically makes my terminal more powerful)
-   Docker (using the standard Ubuntu install)
-   .NET Core SDK (2.2 LTS and 3.1 LTS)
    -   I prompt to install the v5 preview too
-   Optionally install Golang
-   [fnm](https://github.com/Schniz/fnm) which is a simple Node Version Manager

And after a little bit more time my script completes and all my stuff is setup.

## Conclusion

There we have it folks, this is how I setup my dev environment as a Windows user across Windows and WSL. Again, the scripts are [all on GitHub](https://github.com/aaronpowell/system-init) so feel free to use/fork my scripts as you like.

I hope it's been helpful to see how you can automate most of the environment setup.
