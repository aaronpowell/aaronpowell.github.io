+++
title = "Edge On iOS And Android"
date = 2017-10-05T20:14:02+11:00
description = "Microsoft Edge on iOS and Android, what does it mean?"
draft = false
tags = ["ms-edge"]
+++

If you missed the tech news this morning Microsoft announced that the [Edge browser is coming to iOS and Android](https://blogs.windows.com/msedgedev/2017/10/05/microsoft-edge-ios-android-developer/). This, on the surface, seems like quite an unexpected move but digging deeper it isn't that unexpected.

So with it announced I want to talk about about what it is, why I'll be installing it for a play but don't know if I'd move to it as my primary browser on my Pixel.

## Edge but not Edge

As an MVP something that I've been asked more times than I can remember is "When is Edge coming to ..." and my answer to this is always "don't bank on it". Does that mean that I'm now eating my words?

No.

When you think about a browser there are really three core pieces that come together to make it work, the browser UI, the JavaScript engine and the Layout engine. In Edge this is a UWP (that as best as I know doesn't have a name of its own), Chakra (extensions on top of ChakraCore) and EdgeHTML (a slimmed down version of Trident).

Another thing that you need to understand is the restrictions on the mobile platforms, particularly iOS. With iOS you're unable to have a default browser other than Safari, nor can you run an application that does its own JIT. If you look at Chrome or Firefox for iOS they both sit on top of the WebView, rather than using Blink or Gecko as the rendering engine.

Android is less restrictive, you can run your own layout engine, which Firefox for Android does. Edge though relies on the Chrome engine, similar to how the Samsung browser works.

So where does this leave Edge, if it's not using the same layout engine or JavaScript engine? **The UI and associated systems**.

## Not so unexpected

If you've been following what Microsoft has been doing over the last few years you'll have seen their push into a platform agnostic software provider, with Office across iOS and Android, Cortana appearing on mobile and partnering with Amazon on Alexa, .NET going cross platform and so on.

So an integrated Edge experience, syncing your browsing across multiple platforms (like Chrome or Firefox, and to a lesser extend Safari) makes sense, it's all about data. You see by tracking what you're doing on the web across all your devices, not just one, companies can produce a more complete profile of you as a web users and that feeds into... well I try not to think about what they know about me and can do with that into :stuck_out_tongue:!

## The browsing experience

What does this all mean as an user browsing the web? Well it means that the version of Edge you're using on iOS or Android you'll have a different layout engine to the desktop version. This means that you might have different features, making UA sniffing even less viable and it's yet another justification for feature detection.

## Conclusion

Unsurprisingly there's been a bunch of internet trolling out on this already, "why don't you just use Blink on desktop" (which I've [blogged about before]({{< ref "/posts/2015-01-26-the-danger-of-the-just-use-webkit-mindset.md" >}})), "fix/add/remove feature X" (maybe [vote for it](https://wpdev.uservoice.com/forums/257854-microsoft-edge-developer)), etc. but it's pretty par for the course these days.

Edge of iOS and Android it's meant to be for everyone, it's targeted at people who are already using Edge as their primary browser and want to have their favorites, reading list, passwords, etc. roaming across multiple devices.