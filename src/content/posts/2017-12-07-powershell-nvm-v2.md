+++
title = "PowerShell nvm v2"
date = 2017-12-08T15:19:23+11:00
description = "Introducing PowerShell nvm v2, a cross-platform Node.js version manager"
draft = false
tags = ["node.js", "powershell"]
+++

:tada: TL;DR [PowerShell Node Version Manager](https://github.com/aaronpowell/ps-nvm) is 2.0 with semver support, autocomplete and it works on Windows, OSX and Linux PowerShell releases! :tada:

A little over 3 years ago I was annoyed that I couldn't easily run multiple versions of Node.js on Windows and that meant I could either install the stable version my project needed _or_ install a bleeding edge version, I couldn't easily do both. I knew that Linux/OSX had [nvm](https://github.com/creationix/nvm) but I was on Windows and short of using Cygwin *shudders* I didn't have any options. So I set about writing a PowerShell script to help me out (not a batch script, it's 2014 not 1990), which I then turned into a PowerShell module.

Over the years I added to it as I needed new things, like adding [io.js](https://iojs.org/en/) support, back in the days of the great Node.js stagnation, added distribution via the [PowerShell Gallery](https://www.powershellgallery.com/packages/nvm) and added an alternative install location to `$PSScriptRoot` to deal with long paths.

Then a few months ago [Felix Becker](https://github.com/felixfbecker) created an issue [Error on macOS](https://github.com/aaronpowell/ps-nvm/issues/21), about the fact that the module didn't work on PowerShell on OSX. Well, ok then, I'd never actually tried it on OSX (I don't have a current mac), so I left it to Felix to send a PR if he wanted to try and fix it.

And this started a flurry of work on ps-nvm! While the OSX shipped in the `1.5.1` release it was a little flaky, but it worked, Felix raised a bunch more things that would be great to get in there like tests, support for the `package.json` `engines` value, semver install support (being able to install with `>7.0.0`) and proper CI/CD.

## Testing

I got cracking on writing tests with [Pester](https://github.com/pester/Pester/), where I introduced a combination of unit and integration tests that look like this:

```ps
It "Gets known versions" {
    $tmpDir = [system.io.path]::GetTempPath()
    Mock Get-NodeInstallLocation { Join-Path $tmpDir '.nvm\settings.json' }
    Mock Test-Path { return $true }
    Mock Get-ChildItem {
        $ret = @()
        $ret += @{ Name = 'v8.9.0' }
        $ret += @{ Name = 'v9.0.0' }
        return $ret
    }

    $versions = Get-NodeVersions
    $versions.Count | Should -Be 2
    $versions | Should -Be @('v9.0.0'; 'v8.9.0')
}
```

This generates a mock of a couple of PowerShell commands (so we don't actually hit the disk) to check that we get a couple of versions found. All the tests can be found in [`nvm.tests.ps1`](https://github.com/aaronpowell/ps-nvm/blob/master/nvm.tests.ps1).

Doing this though I learnt a couple of things with Pester for cross-platform testing. When running on non-Windows platforms we had a bunch of problems with the temp directory that Pester creates so instead we just used `[System.IO.Path]::GetTempPath()` and managed it ourselves. Also the way the mock directory is cleaned is a bit of a pain so you have to do a bunch of stuff with the before/after test run functions.

But we got it all up and running, we have CI [![windows build](https://img.shields.io/appveyor/ci/aaronpowell/ps-nvm/master.svg?label=windows+build)](https://ci.appveyor.com/project/aaronpowell/ps-nvm)
[![macos/linux build](https://img.shields.io/travis/aaronpowell/ps-nvm/master.svg?label=macos/linux+build)](https://travis-ci.org/aaronpowell/ps-nvm) so that we can check across Windows, OSX and Linux. We also now do code coverage reporting [![codecov](https://codecov.io/gh/aaronpowell/ps-nvm/branch/master/graph/badge.svg)](https://codecov.io/gh/aaronpowell/ps-nvm) (and have 89% coverage at the time of `2.0.0`)!

## Going cross-platform

So this all started with Felix kicked all of this off wanting OSX support, but once that was in there it got me thinking about why I don't also expand it to cover Linux. The hard yards were done getting xplat working, so just a bit of a push to have the branch for Linux support would be easy.

Well the first thing you need to do is reliably work out what OS you're on, and, well, that's a bit more of a pain. Normally I'd just do `$env:OS` and check that, but unfortunately in PowerShell Core (the xplat release) that doesn't exist!

But, if you're on PowerShell core you get 3 global variables introduced, `$IsLinux`, `$IsMacOs` and `$IsWindows`. Great, we can use that... oh but now I have a Windows issue, you would **have** to be using PowerShell Core, but that's in preview, so people are unlikely to want that as their primary PowerShell version.

Also, if you're running in strict PowerShell mode like I do when you try and access a global variable that hasn't been defined your script will error out.

Now we're back to the drawing board, I need to:

- Check which OS you're on in a cross platform, cross PowerShell version way
- Can't rely on magic global variables without relaxing my rules

A bit of googling around told me that you can exploit `Test-Path` to check if variables are defined but doing `Test-Path variable:global:variable-name`, so that lead me to create some helper functions:

```ps
function IsMac() {
    return (Test-Path variable:global:IsMacOS) -and $IsMacOS
}

function IsLinux() {
    return (Test-Path variable:global:IsLinux) -and $IsLinux
}
```

That's great for PowerShell Core, but what about PowerShell 5? Well here we have to be a little trickier and use the `$PSVersionTable` as well:

```ps
function IsWindows() {
    if ($PSVersionTable.PSVersion.Major -lt 6) {
        # PowerShell less than v6 didn't work on anything other than Windows
        # This means we can shortcut out here
        return $true;
    }

    return (Test-Path variable:global:IsWindows) -and $IsWindows
}
```

Now within our module we can do `if (IsMac) { ... ` simply!

So a bit of branching logic with that and we can download a Linux package as well, then unpack the tar file and you're good to go!

## SemVer support

This is a pretty cool feature and something that I'd seen some requests for in the past. Basically you might want to depend on a range of node.js versions and now nvm can install from that range for you:

```
PS> Install-NodeVersion '>=5.0.0 <7.0.0'
```

With this nvm will work out what is the highest available Node.js version that you can install, and install it. SemVer also works for the `Set-NodeVersion` so if you have lots of local installs you can get the best fit for your current use case.

To achieve this we decided against writing it from scratch in PowerShell but instead depending on a NuGet package called [SemanticVersioning](https://www.nuget.org/packages/SemanticVersioning) which allows you to generate ranges and test versions within ranges.

Because I don't like committing binary files to source control we then had to find a way to get that package installed and loaded into the PowerShell host. All in a xplat way! Well thanks to netstandard 2.0 that should be easy right? Yeah... nah. Due to a bug in .NET we have to have a hard dependency on .NET 4.7.1 (or you have to do a bunch of futzing with .NET locally).

**You will need to have .NET Core 2.0 installed and .NET 4.7.1 for the easiest usage. That is our supported scenario.**

## Autocomplete

This is something I'm *really* excited about, you now get tab completion of the installed versions of Node.js in your machine when you use `Set-NodeVersion` and `Remove-NodeVersion`:

![nvm autocomplete](/images/ps-nvm/v2-autocomplete.gif)

I don't quite get how it all works, other than you override some magic functions in PowerShell, but you can see its implementation [here](https://github.com/aaronpowell/ps-nvm/blob/master/autocomplete-utils.ps1). What I find fun is that it's circular, the autocomplete actually uses nvm to do its own autocomplete!

## That's a wrap

This has been a lot of fun, I will admit that it's probably the most complex process behind a PowerShell module that you can think of, 3 separate builds, 3 OS's, lots of test coverage, etc. but as a result of that I've learnt quite a lot more about how to approach well designed PowerShell, maintainable PowerShell, how you can do testing, verification, multiple version support and a bunch of stuff like that.

I hope the code can act as a reference point for others to learn about how to do this as well.

Now go out and install v2!