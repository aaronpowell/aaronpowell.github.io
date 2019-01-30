+++
title = "Managing Packages With Chauffeur"
date = 2018-02-23T14:43:05+10:00
description = "Searching and installing packages from the Umbraco feed with Chauffeur"
draft = false
tags = ["chauffeur", "umbraco"]
+++

Something that I'm really proud of with Chauffeur is how easy it is to extend, and I do a lot of little experiments to validate that the extensibility.

Last year I was working on some Umbraco stuff and needed to install a package from the Umbraco package feed. Now normally I'd want to use NuGet to manage my external dependencies but with Umbraco you might require something that isn't really a .NET distributable, it's something that modifies Umbraco itself.

Now this poses an issue for me with Chauffeur, I want to script everything, but installing a package from the package feed is a very manual process. So I decided to look into whether I could do it from Chauffeur.

Today on the back of the [Chauffeur 1.0 release]({{< ref "/posts/2018-02-23-chauffeur-goes-v1.md" >}}) I released v1.0 of [Chauffeur.ExternalPackages](https://github.com/aaronpowell/Chauffeur.ExternalPackages)!

![Searching for packages](/images/chauffeur-external-package.gif)

Here's the plugin running, I'm searching for a PDF package, then downloading it and finally unpacking it (basically unzipping the archive).

While the search is useful it's more designed to be used with a `delivery` that scripts the download, unpack and eventual install. Here's an example of installing the default starter kit:

```
external-package starter-kit ced954d1-8c0f-4abe-bdda-99e7a787d052
external-package unpack ced954d1-8c0f-4abe-bdda-99e7a787d052
pkg package -f:$ChauffeurPath$\ced954d1-8c0f-4abe-bdda-99e7a787d052-unpack
external-package actions ced954d1-8c0f-4abe-bdda-99e7a787d052-unpack\package.xml
```

Let's break it down:

1. Install a starter kit by the ID of it (you can find that by using `external-package starter-kit`)
2. Unpacking the package based on its ID
3. Using the "core" `package` deliverable to install it, but we're using the `-f` flag to override the lookup path (since the zip is unpacked into a nested location)
4. Running the package actions that are provided

And there you have it, now you can easily install a package from the Umbraco package feed and run its package actions using Chauffeur!