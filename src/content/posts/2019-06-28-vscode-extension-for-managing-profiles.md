+++
title = "A VS Code Extension for Managing Profiles"
date = 2019-06-28T11:29:54+10:00
description = "I've created a little VS Code extension for swapping between different profile setups"
draft = false
tags = ["vscode"]
+++

Part of my job as a Cloud Developer Advocate is to present, whether that is at a lunch and learn session, a user group, a conference or a screen cast. One thing that's become second nature to me with presenting is tweaking my editor font size, theme, etc. so that it is optimal for the audience. But this becomes a bit tedious, because I then have to go back and undo all my changes again and the constant change back and forth is annoying.

So with that I decided to create an [extension for VS Code](https://code.visualstudio.com/api/get-started/your-first-extension?wt.mc_id=aaronpowell-blog-aapowell) called [Profile Switcher](https://marketplace.visualstudio.com/items?itemName=aaronpowell.vscode-profile-switcher).

![Profile Switcher in action](/images/vscode-profile-switcher-demo.gif)

## How It Works

When you save a profile with the extension it will create a copy of the `settings.json` file that exists for your user (on Windows this is `%APPDATA%\Roaming\Code\User\settings.json`) and then store it in the `settings.json` file in settings property that the extension knows about.

_Side note: It doesn't clone the extension settings, just everything else, wouldn't want you to have recursive settings saved!_ 🤣

Then when you load the a profile it will merge your current `settings.json` with the previously saved one, updating the properties that are different (and not touching the ones that didn't change). Because it updates your user `settings.json` all open VS Code instances will have the changes applied, handy if you're running demos across multiple VS Code instances!

A nifty side-effect of how this works is that if you're using the [Settings Sync extension](https://marketplace.visualstudio.com/items?itemName=Shan.code-settings-sync) your profiles will be synchronised with that, so when you jump between machines you can bring your profiles along with you!

This also means that it's not just for presenting, it's for any scenario where you might want to quickly jump between settings changes in VS Code.

## Conclusion

I hope you find this extension useful and I've love to get some feedback on what it could also be used for. I've made the code available [on GitHub](https://github.com/aaronpowell/vscode-profile-switcher) so you can create an issue for me or propose an update. 😁
