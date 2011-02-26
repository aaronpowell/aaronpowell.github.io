--- cson
title: "How to install a package into all projects of a solution"
metaTitle: "How to install a package into all projects of a solution"
description: ""
revised: "2011-02-26"
date: "2011-02-26"
tags: ["nuget"]
migrated: "true"
urls: ["/nuget/global-install-package"]
summary: """

"""
---
This is a script that I've been keeping in my toolbox since [NuGet][1] was first released.

Ever now and then I need to do an install of a package across all projects in a solution. [log4net][2] is an example of the kind of thing you'd want to globally install, so is [Autofac][3].

Well here's a script to run from the **Package Management Console**:

    Get-Project -All | %{ Install-Package -Id packageName -Project $_.Name }

This is also available as a [gist][4].

*Note: replace `packageName` with what you want to install ;).*

*Challenge to the reader*

Since this is PowerShell you can run filters against it so you could globally install to a sub-set based on a filter of the `Get-Project -All` command.


  [1]: http://nuget.org
  [2]: http://nuget.org/Packages/Packages/Details/log4net-1-2-10
  [3]: http://nuget.org/Packages/Packages/Details/Autofac-2-4-4-705
  [4]: https://gist.github.com/843288