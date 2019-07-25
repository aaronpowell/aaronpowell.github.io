+++
title = "VS Code Profile Switcher Extensions Support"
date = 2019-07-25T13:46:04+10:00
description = "Adding extension management to the VS Code Profile Switcher"
draft = false
tags = ["vscode"]
+++

I've just released some updates to my [VS Code Profile Switcher extension](https://marketplace.visualstudio.com/items?itemName=aaronpowell.vscode-profile-switcher&{{<cda>}}) which adds the feature that was most required when I first announced it, extension support!

## Extension Support

When creating a profile you might want to have different extensions loaded, say you're doing some React work, maybe you don't want the Vue extensions loaded, the more extensions you have installed, the more that VS Code has to activate, all of which takes time.

Now when you save a profile (either new or overriding an existing) the extension will look at all the extensions that you have and add them to your extensions profile. Then when you next load that profile the extension will look at what extensions are loaded in VS Code, compare that to the list of extensions that the profile says you should have, and installs the missing ones while removing the excess ones.

This is slightly different to the way settings are handled, settings are **addative**, meaning that any settings a profile has will be merged over the top of existing settings, but this didn't seem right for extensions.

## Performance Considerations

I'll often flick between a number of profiles so I wanted to ensure that it performs decently. To this end when a profile removes an extension it moves it to [`globalStorage`](https://code.visualstudio.com/api/references/vscode-api?{{<cda>}}#ExtensionContext.globalStoragePath) and then when it's needed again it'll copy it back in. If the extension doesn't exist in `globalStorage` it will then install it from the marketplace. Installing from the marketplace does take time, and if you've got a lot of extensions that need to come from there it'll take longer, but that shouldn't happen too frequently.

## Ignoring Extensions

There may be extensions that you **always** want installed, your preferred themes for example. There are also some extensions that the removal of can be problematic or they are quite large, such as Live Share.

You don't really want to make sure they are in every single profile, so instead I've added a setting called `profileSwitcher.extensionsIgnore`. This is an array of extension ID's that you want to be in every profile and by default I have these set to be ignored:

```
shan.code-settings-sync
ms-vsliveshare.vsliveshare
ms-vsliveshare.vsliveshare-audio
ms-vsliveshare.vsliveshare-pack
```

If you want to add more you'll need to edit your `settings.json` file and add the setting. If you do manually set the setting you'll need include those 4 above (assuming you want to keep ignoring them), as that's the default until manually set.

## Note on Upgrading

Just a quick note when upgrading to the latest release, if you saved a profile _prior_ to `0.3.0` it will have no extensions associated with it, so you'll want to resave that profile, otherwise when you switch it'll think you don't have any associated extensions in the profile and remove all of yours (see [bug #6](https://github.com/aaronpowell/vscode-profile-switcher/issues/6#issuecomment-513090629)).

## Wrap Up

I was really happy to get this feature landed because nearly everyone asked me about it when I first released it! It was a little tricky, VS Code doesn't really provide an API for doing this kind of stuff with extensions (can't blame them, you don't want to make it easy for extensions to manipulate other extensions!) but it seems to be working well now in the `0.3.3` release.

If you are using the extension I'd love to hear about it, know the kinds of things it's helping you with and what features you'd like to see in the future.
