---
  title: "How to install a package into all projects of a solution"
  metaTitle: "How to install a package into all projects of a solution"
  description: ""
  revised: "2011-03-24"
  date: "2011-02-26"
  tags: 
    - "nuget"
  migrated: "true"
  urls: 
    - "/nuget/global-install-package"
  summary: ""
---
This is a script that I've been keeping in my toolbox since [NuGet][1] was first released.

Ever now and then I need to do an install of a package across all projects in a solution. [log4net][2] is an example of the kind of thing you'd want to globally install, so is [Autofac][3].

Well here's a script to run from the **Package Management Console**:

    Get-Project -All | Install-Package packageName

This is also available as a [gist][4].

*Note: replace `packageName` with what you want to install ;).*

*Challenge to the reader*

**Update: With a tip-off from [David Fowler][5] you can compress the script even more. If you want to see the original just check out the gist history.*

# Installing into a project subset

Since this is just a powershell script you can also apply filters, so if you have say multiple test projects you do run this:


    Get-Project -All | where { $_.Name.EndsWith(".Test") } | Install-Package NSubstitute

Woot!

  [1]: http://nuget.org
  [2]: http://nuget.org/Packages/Packages/Details/log4net-1-2-10
  [3]: http://nuget.org/Packages/Packages/Details/Autofac-2-4-4-705
  [4]: https://gist.github.com/843288
  [5]: http://twitter.com/#!/davidfowl/