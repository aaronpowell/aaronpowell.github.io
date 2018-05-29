---
  title: "An uninformed overview of NuGet"
  metaTitle: "An uninformed overview of NuGet"
  description: ""
  revised: "2011-03-29"
  date: "2011-03-28"
  tags: 
    - "nuget"
  migrated: "true"
  urls: 
    - "/nuget/an-uninformed-overview"
  summary: "This post stems out of a discussion last night with Demis Bellot (<a href=\"http://twitter.com/demisbellot\">@demisbellot</a>) on twitter.\n<br />\nKeep in mind that a) I don't work on the NuGet team (or for Microsoft) and b) these are my opinions alone and possibly wrong :P. I'm just someone who's got opinions and has played around with NuGet a bit."
---
In case you've been living under a rock for the last few months you should have heard about [NuGet][2], and if you have been here's the abridged version.

NuGet is a package manager for .NET projects. Basically think Ruby Gems, NPM for Node.js, etc and you'll come up with NuGet for .NET.

NuGet isn't the first attempt at a unified package management system, [OpenWrap][3] was here first, but it didn't seem to have the reach that NuGet seems to have (yes this could be because you've got the official Microsoft stamp of awesome, lots more *Microsoft shills* blogging about it, etc), but that shouldn't be important, what's more important is there is actually a package management story for .NET now.

## How does NuGet work though? 

Well NuGet is made up of two parts, first there is the [NuGet Gallery][4] which packages are uploaded, packages can be downloaded, etc. This is data provided to connecting clients using [OData][5] (which allows cool things like [querying with LINQPad][6]). You can also create your own NuGet server using the [NuGet.Server][7] package.

Consuming NuGet can be done a couple of ways. As mentioned above you can use an OData reader such as LINQPad. You can write your own consumer that uses the [NuGet.Core][8] package (which I covered in detail in [this post][9]) or you can use the [Visual Studio 2010 tool][10].

The Visual Studio tool also include a set of Powershell scripts which mean that you can call out to NuGet from Powershell, although I'm not entirely sure how well it'd work outside of Visual Studio as it does seem to use some of the VS API to add references to a project. But the Powershell tools are cool, they allow you to do things like [this][11].

## What makes up a NuGet package

A NuGet package, or **nupkg** file, it really just a ZIP file with a manifest within it. The [nuspec format][12] is documented and can easily be implemented. The way the files are treated has also [been documented][13] and most of it is based off of conventions. Really the main two you need to know are:

* /lib files go into the project references
* /Content files go into the root of the project (and folder nesting is allowed)

There's also a [Package Explorer tool available][14] if you want to dig around the internals of existing packages.

## Should you care?

I think that NuGet is something that is very vital to the .NET ecosystem. The lack of a unified package management system has been the bane of .NET development for a long time. Yes NuGet wasn't the first, but does that really matter. I don't care for the arguments that were waged when NuGet first came out. Accept that it's here to stay and move on.

And with that said I'm of the opinion that **if it's not on NuGet then it doesn't exist**. Harsh as this may seem but I've got better things to do than:

* Find the latest stable build
* Monitor a project for new versions
* Update my version when new releases are out 

Ask any Rubiest if they'd use something that wasn't a gem and you'll pretty much always receive a **no**.

## Is NuGet just for Open Source?

This was a question asked at a developer event recently, and although it seems that most of the projects which are on NuGet are OSS I don't see why NuGet would be confined to OSS.

I don't think that you could really do anything truly commercial from the official NuGet feed, but I can't see why you couldn't have a trial version of a library on there and as part of the install process' T&C's state that it's got restrictions.

## NuGet and Mono

Something that was a topic of discussion last night with Demis was "Does NuGet work on Mono?" and from the quick searching I did it would seem that there isn't a Mono version of the "Add Library Reference" dialog that the Visual Studio tools provide. From what I read there is some limitations to running NuGet on Mono (and I'm referring to the Mono CLR) due to some CLR 4 features that NuGet uses which aren't available on Mono yet.

Demis argued that if Microsoft was really serious about NuGet being a way to deliver open source projects to developers then they should be ensuring that it has Mono tooling.

I beg to differ on this point. Microsoft have done (mostly) the right things so far, the [source is available][15], there are [contribution guidelines][16] if you want to fix issues and there is documentation on the package format. This is about as open source as you're going to find from Microsoft these days and it's a heck of a lot better than the Microsoft of old, but as for actually building the tools for MonoDevelop, I think that's something they should stay away from.

If Microsoft was to add the support to MonoDevelop then it could be seen very much as an overbearing effort to push the platform (not that it's not being pushed hard already :P).

## Want to know more?

If you're wanting to know more about NuGet I suggest that you keep an eye on [David Ebbo][17] and [David Fowler][18].


  [1]: http://twitter.com/demisbellot
  [2]: http://nuget.codeplex.com
  [3]: http://www.openwrap.org/
  [4]: http://nuget.org
  [5]: http://odata.org
  [6]: https://www.aaron-powell.com/nuget/linqpad
  [7]: http://nuget.org/List/Packages/NuGet.Server
  [8]: http://nuget.org/List/Packages/NuGet.Core
  [9]: https://www.aaron-powell.com/creating-a-nuget-plugin-engine
  [10]: http://visualstudiogallery.msdn.microsoft.com/27077b70-9dad-4c64-adcf-c7cf6bc9970c
  [11]: https://www.aaron-powell.com/nuget/global-install-package
  [12]: http://nuget.codeplex.com/documentation?title=Nuspec%20Format
  [13]: http://nuget.codeplex.com/wikipage?title=Package%20Conventions
  [14]: http://nuget.codeplex.com/releases
  [15]: http://nuget.codeplex.com/SourceControl/list/changesets
  [16]: http://nuget.codeplex.com/documentation
  [17]: http://blog.davidebbo.com/
  [18]: http://weblogs.asp.net/davidfowler/