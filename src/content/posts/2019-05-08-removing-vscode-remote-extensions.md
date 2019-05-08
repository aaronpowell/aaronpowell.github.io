+++
title = "Removing VS Code Remote Extensions"
date = 2019-05-08T10:37:32+10:00
description = "Fixing problems with a corrupt vscode remote instance"
draft = false
tags = ["vscode"]
+++

If you missed the announcement last week the VS Code team have released some [remote development extensions](https://code.visualstudio.com/docs/remote/remote-overview?{{< cda >}}) which allow you to run VS Code against a remote environment, whether that's WSL, SSH or running in a container. This is a **fantastic** extension and I'm totally in love with it, but there's always the possibility of something going wrong (that's what happens when you're living on the edge).

Today I went to start writing a blog post (not this one!) and in doing so I installed [Spell Right](https://marketplace.visualstudio.com/items?itemName=ban.spellright&{{< cda >}}), the extension I use for spell checking. As soon as VS Code reloaded things went wrong, it wouldn't connect to WSL anymore, and it turns out [there's a bug in Spell Right](https://github.com/bartosz-antosik/vscode-spellright/issues/279) that causes VS Code Remote Extensions to hang.

This isn't really a problem with Spell Right, I am using a preview version of VS Code and a preview extension pack, I'm just surprised I hadn't hit a problem sooner! 🤣

Anyway, we have a problem now and I need to remove that extension from the remote host, but here's the catch, you use VS Code to manage remotely installed extensions and if it can't connect to the remote host then you can't manage the extensions!

## Deleting Remote Extensions without VS Code

I started reading through the docs to work out how to remove the extension, with no luck. My next step was to try and unpack the extension and hope I could find something in there, but that wasn't sounding like a fun idea... Thankfully I work with a really knowledgable team and my colleague [Bruno Borges](https://twitter.com/brunoborges) came to my rescue.

It turns out that extensions are installed on the remote host at `~/.vscode-remote/extensions`, so I fired up WSL, went there and removed the offending extension. And if you need to completely remove the extensions you can `rm` all folders within there.

Thanks Bruno!

Also, if you poke around in the `~/.vscode-remote` folder you'll find a bunch of interesting things in there like the user profile for your remote environment and such. I wouldn't advise editing them, but they can be a good place to look if you want to try and diagnose issues.

So with that extension removed I can write this post about how to remove remote extensions, then get back to the post I _actually_ came here to write! 😜