+++
title = "What Licenses Are in Use?"
date = 2019-08-20T08:57:59+10:00
description = "Ever wondered what licenses are in use of your project? Here's a tool to help you out"
draft = false
tags = ["dotnet", "fsharp"]
+++

Have you ever wondered what licenses the dependencies of your .NET project are? In the ever-expanding world of open source software usage ensuring that your being compliant with the licenses of your dependencies is becoming harder. Do you have copyleft dependencies? Are you abiding by their licensing terms? Maybe there's some legally grey licenses like [WTFPL](http://www.wtfpl.net/) that you need to watch out for.

This can become even trickier when you look into transient dependencies. You know what dependencies you **directly** consume, but what about the ones that you _indirectly_ consume as they are a dependency of a dependency?

## Enter `dotnet-delice`

**TL;DR**: I created a [`dotnet` global tool](https://docs.microsoft.com/en-us/dotnet/core/tools/global-tools?{{<cda>}}) called [`dotnet-delice`](https://www.nuget.org/packages/dotnet-delice) to help you with this.

`dotnet-delice`, or `delice` for short, is a tool that will look at the dependencies you have in your project and attempt to determine what license they use and display the results for you. This is a port of the Node.js utility [`delice`](https://github.com/cutenode/delice), created by [Tierney Cyren](https://github.com/bnb).

You can install it from NuGet:

```shell
> dotnet tool install --global dotnet-delice --version 1.0.0
```

And then run it by pointing to a folder, a solution file or a `csproj`/`fsproj` file:

```shell
> dotnet delice ~/github/DotNetDelice/DotNetDelice.sln
```

Here's a snapshot of the output it will generate:

```plain
Project dotnet-delice
License Expression: MIT
├── There are 10 occurances of MIT
└─┬ Packages:
  ├── FSharp.Core
  ├── Microsoft.NETCore.App
  ├── Microsoft.NETCore.DotNetAppHost
  ├── Microsoft.NETCore.DotNetHostPolicy
  ├── Microsoft.NETCore.DotNetHostResolver
  ├── Microsoft.NETCore.Platforms
  ├── Microsoft.NETCore.Targets
  ├── NETStandard.Library
  ├── Newtonsoft.Json
  └── System.ComponentModel.Annotations
```

`delice` will scan the dependency graph of the project and output the license information in a human-readable format (above) or generate JSON (to stdout or a file). The JSON could be used in a build pipeline to fail a build if there are unexpected licenses detected.

You'll find the source code on [GitHub](https://github.com/aaronpowell/dotnet-delice) if you want to have a dig around in it yourself.

## A Note on Package Licenses

While I was doing my research into how this works I came across [this NuGet issue](https://github.com/NuGet/Home/issues/4628). This issue raised a concern about the license information in the [nuspec file](https://docs.microsoft.com/en-us/nuget/reference/nuspec?{{<cda>}}) being just the `licenseUrl`. Since the license is _external to the package_ the URL could conceivably change without changing the package, thus changing the license you agreed to originally without your knowledge.

This resulted in the [deprecation of `licenseUrl` in favour of a `license` property](https://github.com/NuGet/Announcements/issues/32). Now the solution is to store the license expression (ideally in [spdx](https://spdx.org) format) _or_ embed the license file within the package. [Here is how it's set in my project](https://github.com/aaronpowell/dotnet-delice/blob/120cb43096c27739da9cc1cc7d925ee1b5294d38/src/DotNetDelice/DotNetDelice.fsproj#L10).

By taking this approach the license is now tied to the release of the package and thus you're unlikely to have it changed without you knowing, since a change requires an updated package.

As this is quite a large change to the NuGet ecosystem many packages are still using the legacy licensing format. This makes it a little more challenging for `delice` to work out what license a package uses. Currently, the tool has a "cache" of known license URLs and which license it maps to (and the packages that use it), but when a license is found that isn't known it'll be marked as _"Unable to determine"_ and show the URL in the output. Feel free to submit a PR to add the URL to the cache!

Hopefully, the increased visibility will help encourage package authors to update their license information or encourage people to submit PR's to update.

## Conclusion

`delice` aims to empower you with information so that you understand what's in use by your projects and make the appropriate decisions about the dependencies you use.

There's a bit of a roadmap on the [projects GitHub repo](https://github.com/aaronpowell/dotnet-delice) but I'd like to hear what you would want from this tool.
