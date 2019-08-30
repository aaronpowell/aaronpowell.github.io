+++
title = "More License Discovery With dotnet-delice"
date = 2019-08-30T10:16:20+10:00
description = "A new release of dotnet-delice with even more license discovery support"
draft = false
tags = ["dotnet", "fsharp"]
+++

In [my last post]({{<ref "/posts/2019-08-20-what-licenses-are-in-use.md">}}) I introduced you to a tool for looking up licenses of .NET projects called `delice`.

This week I released the first update, [version 1.1.0](https://www.nuget.org/packages/dotnet-delice/1.1.0), that brings a big improvement to the license detection for the legacy licensing format of many NuGet packages.

## Determine Licenses via the GitHub API

By-and-large the dependencies we rely on are the output of an OSS project and that project is more often than not hosted on GitHub. Because of this we can use the [GitHub License API](https://developer.github.com/v3/licenses/) to try and get the license information of a project, which `delice` now supports:

```
$> dotnet delice --check-github ~/my-project
```

The way this works is that when `delice` finds a project using the legacy `licenseUrl` nuspec property and that license isn't a hard-coded one in the cache, it'll look at the URL and determine if it's a URL to a license on GitHub.

Take the license for the package `Microsoft.AspNetCore`, which gives a url of `https://raw.githubusercontent.com/aspnet/AspNetCore/2.0.0/LICENSE.txt`. From here, `delice` will get the repository owner (`aspnet`) and the repository name (`AspNetCore`) to then call the GitHub API and get back the license information, which will tell me that the license is `Apache-2.0`. `delice` will then cache that internally for the run so if the URL is used across a number of packages, or that package is referenced in a number of projects in the solution, it'll only hit the API once.

The code to do this can be found [here](https://github.com/aaronpowell/dotnet-delice/blob/6fd4a45e13eed9ff176b9e87f50e0e0d1432a07e/src/DotNetDelice.Licensing/LicenseCache.fs#L168-L211).

It's worth noting that there is a known limitation of the API check, it'll **always** check the license against `master`, not any other branch or tag. This is a design choice, so while it does mean you _may_ get a different license if a project was re-licensed across versions, I expect the likelihood of that to be low, relative to the effort required to support it. After all, this is meant to be a workaround for packages that haven't been updated to use the new nuspec format, not a proper solution.

### Avoiding Rate Limiting

By default the API call is done anonymously and that means you have a limit of 50 calls per hour to the GitHub API, something that could be blown out in a single run if you have a lot of legacy-style NuGet packages. It's better to provide a GitHub Personal Access Token to the call like so:

```
$> token=abc123...
$> dotnet delice --check-github --github-token $token ~/my-project
```

When you provide a token the rate limit is increased to 5000 calls per hour, which should work for most scenarios. If you are hitting rate-limit issues I'd like to know so we can work out even smarter solutions (I have ideas but I only want to invest in the effort if it's actually needed!).

## Comparing with Common Templates

Relying on the GitHub API isn't foolproof, not all licenses are detected by GitHub and not all projects are hosted on GitHub. Also, if you embed the license file in the NuGet package, rather than just provide an SPDX identifier, it's still not possible to know what the license is.

To address this I've borrowed from the approach that GitHub uses for license detection and implemented some complex maths in the form of [Sørensen–Dice coefficient](https://en.wikipedia.org/wiki/S%C3%B8rensen%E2%80%93Dice_coefficient) to compare a license against a known template:

```
$> dotnet delice --check-license-content ~/my-project
```

When you provide this flag `delice` will download the file contents from the URL and compare it to some templates stored within itself. If any are a close enough match (the threshold is 90%) `delice` will assume that that is the license of the project.

The code to do this can be found [here](https://github.com/aaronpowell/dotnet-delice/blob/6fd4a45e13eed9ff176b9e87f50e0e0d1432a07e/src/DotNetDelice.Licensing/LicenseCache.fs#L215-L257), including the implementation of the Dice coefficient (which I found online 😝).

Presently I only have MIT and Apache-2.0 as templates to compare as they seemed to be the most common ones I've come across when doing my research, but if there are others let me know or send me a PR.

## Showing License Conformance

When trying to be aligned with Tiereny's [`delice`](https://github.com/cutenode/delice) I needed to add one missing piece, showing the license conformance to the SPDX list. I've added this to the 1.1.0 release of `delice` and now you can see which of your projects are licensed using OSI or FSF approved licenses, and whether any licenses are using a deprecated license format:

```
Project dotnet-delice
License Expression: MIT
├── There are 10 occurances of MIT
├─┬ Conformance:
│ ├── Is OSI Approved: true
│ ├── Is FSF Free/Libre: true
│ └── Included deprecated IDs: false
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

This will help you ensure that you understand more about the licenses in use with a quick scan, without having to know the details of each license type.

## Extracting Out the Core

Another change I introduced in the 1.1.0 release was to extract the core of `delice` out into a separate NuGet package, [DotNetDelice.Licensing](https://www.nuget.org/packages/DotNetDelice.Licensing/). While you don't need this package when you install the CLI tool (tools are self-contained) it's available if you want to integrate it into any other tool or system you're building.

Be aware though that I've written this in F# and it's using F# styling and types, so expect to deal with them.

## Conclusion

That's a lap around what's new in release 1.1.0 so be sure to check it out as it'll, hopefully, give you more coverage of what licenses you have in your projects.

If you're using it I'd love to know what you think of these updates and what other features you'd like to see from `delice` going forward.
