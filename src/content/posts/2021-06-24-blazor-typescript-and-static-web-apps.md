+++
title = "Blazor, TypeScript and Static Web Apps"
date = 2021-06-24T00:30:52Z
description = "Let's look at how we can solve the deployment when using Blazor and TypeScript in a single SWA project"
draft = false
tags = ["javascript", "webdev", "dotnet"]
tracking_area = "javascript"
tracking_id = "12582"
+++

While Blazor can most things that you need in a web application, there's always a chance that you'll end up having to leverage the [JavaScript interop feature](https://docs.microsoft.com/aspnet/core/blazor/javascript-interoperability/?view=aspnetcore-5.0&{{<cda>}}), either to call JavaScript from the .NET code or something in .NET from JavaScript.

I was recently asked about how we can handle this better with [Static Web Apps (SWA)](https://docs.microsoft.com/azure/static-web-apps/?{{<cda>}}), especially in the case when you're using TypeScript.

Let's talk about the problem and how to solve it.

## The problem

The problem that we hit when using TypeScript and Blazor together is how SWA's build pipeline works. We consume the build and deploy process using a GitHub Action (or Azure Pipelines task) like so:

```yaml {hl_lines=["10-22"]}
jobs:
    build_and_deploy_job:
        if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
        runs-on: ubuntu-latest
        name: Build and Deploy Job
        steps:
            - uses: actions/checkout@v2
              with:
                  submodules: true
            - name: Build And Deploy
              id: builddeploy
              uses: Azure/static-web-apps-deploy@v1
              with:
                  azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_GENTLE_SEA_0D5D75010 }}
                  repo_token: ${{ secrets.GITHUB_TOKEN }} # Used for Github integrations (i.e. PR comments)
                  action: "upload"
                  ###### Repository/Build Configurations - These values can be configured to match your app requirements. ######
                  # For more information regarding Static Web App workflow configurations, please visit: https://aka.ms/swaworkflowconfig
                  app_location: "Client" # App source code path
                  api_location: "Api" # Api source code path - optional
                  output_location: "wwwroot" # Built app content directory - optional
                  ###### End of Repository/Build Configurations ######
```

This job is a wrapper around the [Oryx build engine](https://github.com/microsoft/Oryx), and this is what does the heavy lifting in terms of building the app ready for deployment to Azure.

Oryx works by looking at the folder to build and finding specific files, like a `csproj` or `project.json`, to work out what runtime/SDK is needed to build the app. In this hypothetical case of a Blazor + TypeScript application, we'll have both of those files and this causes some confusion for Oryx, what should it build?

Let's take a look at a build log:

```
---Oryx build logs---


Operation performed by Microsoft Oryx, https://github.com/Microsoft/Oryx
You can report issues at https://github.com/Microsoft/Oryx/issues

Oryx Version: 0.2.20210410.1, Commit: e73613ae1fd73c809c00f357f8df91eb984e1158, ReleaseTagName: 20210410.1

Build Operation ID: |A51vi7/GHfw=.702339dd_
Repository Commit : 9d372641619c66a1251375ce5fcd5ed11399fa49

Detecting platforms...
Detected following platforms:
  nodejs: 14.15.1
  dotnet: 3.1.13
Version '14.15.1' of platform 'nodejs' is not installed. Generating script to install it...
Version '3.1.13' of platform 'dotnet' is not installed. Generating script to install it...


Source directory     : /github/workspace/Client
Destination directory: /bin/staticsites/ss-oryx/app


Downloading and extracting 'nodejs' version '14.15.1' to '/tmp/oryx/platforms/nodejs/14.15.1'...
Downloaded in 0 sec(s).
Verifying checksum...
Extracting contents...
Done in 2 sec(s).


Downloading and extracting 'dotnet' version '3.1.407' to '/tmp/oryx/platforms/dotnet/3.1.407'...
Downloaded in 2 sec(s).
Verifying checksum...
Extracting contents...
Done in 5 sec(s).


Using Node version:
v14.15.1

Using Npm version:
6.14.8

Running 'npm install --unsafe-perm'...

npm notice created a lockfile as package-lock.json. You should commit this file.
npm WARN Client@1.0.0 No description
npm WARN Client@1.0.0 No repository field.

up to date in 0.232s
found 0 vulnerabilities


Running 'npm run build'...


> Client@1.0.0 build /github/workspace/Client
> tsc

Preparing output...

Copying files to destination directory '/bin/staticsites/ss-oryx/app'...
Done in 0 sec(s).

Removing existing manifest file
Creating a manifest file...
Manifest file created.

Done in 9 sec(s).


---End of Oryx build logs---
```

Excellent, we've detected that there is both nodejs and dotnet needed, but if we look at it a bit further, we'll see that it only ran `npm run build`, it didn't run a `dotnet publish`, which we need to get the Blazor artifacts.

And here is the problem, Oryx only builds a single platform, meaning our application can't be deployed.

## The solution

Oryx knows about the two different platforms required and has gone ahead and installed them, but it doesn't know that we want to do a multi-platform build.

Thankfully, this is something that we can solve using [Oryx's configuration](https://github.com/microsoft/Oryx/blob/master/doc/configuration.md), specifically `ENABLE_MULTIPLATFORM_BUILD`. All we need to do is add this to the `env` of the SWA job and we're off and running:

```yaml {hl_lines=["13-14"]}
jobs:
    build_and_deploy_job:
        if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
        runs-on: ubuntu-latest
        name: Build and Deploy Job
        steps:
            - uses: actions/checkout@v2
              with:
                  submodules: true
            - name: Build And Deploy
              id: builddeploy
              uses: Azure/static-web-apps-deploy@v1
              env:
                  ENABLE_MULTIPLATFORM_BUILD: true
              with:
                  azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_GENTLE_SEA_0D5D75010 }}
                  repo_token: ${{ secrets.GITHUB_TOKEN }} # Used for Github integrations (i.e. PR comments)
                  action: "upload"
                  ###### Repository/Build Configurations - These values can be configured to match your app requirements. ######
                  # For more information regarding Static Web App workflow configurations, please visit: https://aka.ms/swaworkflowconfig
                  app_location: "Client" # App source code path
                  api_location: "Api" # Api source code path - optional
                  output_location: "wwwroot" # Built app content directory - optional
                  ###### End of Repository/Build Configurations ######
```

Now, when the job runs, it'll build as many platforms as it finds!

```
---Oryx build logs---


Operation performed by Microsoft Oryx, https://github.com/Microsoft/Oryx
You can report issues at https://github.com/Microsoft/Oryx/issues

Oryx Version: 0.2.20210410.1, Commit: e73613ae1fd73c809c00f357f8df91eb984e1158, ReleaseTagName: 20210410.1

Build Operation ID: |aGA1C0DlxfI=.73b3d0f3_
Repository Commit : 9cbf3cd5964436820377935e5ba176f72bbcda11

Detecting platforms...
Detected following platforms:
  nodejs: 14.15.1
  dotnet: 3.1.15
Version '14.15.1' of platform 'nodejs' is not installed. Generating script to install it...
Version '3.1.15' of platform 'dotnet' is not installed. Generating script to install it...


Source directory     : /github/workspace/Client
Destination directory: /bin/staticsites/ss-oryx/app


Downloading and extracting 'nodejs' version '14.15.1' to '/tmp/oryx/platforms/nodejs/14.15.1'...
Downloaded in 1 sec(s).
Verifying checksum...
Extracting contents...
Done in 2 sec(s).


Downloading and extracting 'dotnet' version '3.1.409' to '/tmp/oryx/platforms/dotnet/3.1.409'...
Downloaded in 1 sec(s).
Verifying checksum...
Extracting contents...
Done in 4 sec(s).


Using Node version:
v14.15.1

Using Npm version:
6.14.8

Running 'npm install --unsafe-perm'...

npm notice created a lockfile as package-lock.json. You should commit this file.
npm WARN Client@1.0.0 No description
npm WARN Client@1.0.0 No repository field.

up to date in 0.231s
found 0 vulnerabilities


Running 'npm run build'...


> Client@1.0.0 build /github/workspace/Client
> tsc

Using .NET Core SDK Version: 3.1.409

Welcome to .NET Core 3.1!
---------------------
SDK Version: 3.1.409

Telemetry
---------
The .NET Core tools collect usage data in order to help us improve your experience. It is collected by Microsoft and shared with the community. You can opt-out of telemetry by setting the DOTNET_CLI_TELEMETRY_OPTOUT environment variable to '1' or 'true' using your favorite shell.

Read more about .NET Core CLI Tools telemetry: https://aka.ms/dotnet-cli-telemetry

----------------
Explore documentation: https://aka.ms/dotnet-docs
Report issues and find source on GitHub: https://github.com/dotnet/core
Find out what's new: https://aka.ms/dotnet-whats-new
Learn about the installed HTTPS developer cert: https://aka.ms/aspnet-core-https
Use 'dotnet --help' to see available commands or visit: https://aka.ms/dotnet-cli-docs
Write your first app: https://aka.ms/first-net-core-app
--------------------------------------------------------------------------------------
  Determining projects to restore...
  Restored /github/workspace/Shared/Shared.csproj (in 817 ms).
  Restored /github/workspace/Client/Client.csproj (in 1.58 sec).

Publishing to directory /bin/staticsites/ss-oryx/app...

Microsoft (R) Build Engine version 16.7.2+b60ddb6f4 for .NET
Copyright (C) Microsoft Corporation. All rights reserved.

  Determining projects to restore...
  All projects are up-to-date for restore.
  Shared -> /github/workspace/Shared/bin/Release/netstandard2.0/Shared.dll
  Client -> /github/workspace/Client/bin/Release/netstandard2.1/Client.dll
  Client (Blazor output) -> /github/workspace/Client/bin/Release/netstandard2.1/wwwroot
  Client -> /bin/staticsites/ss-oryx/app/
Preparing output...

Removing existing manifest file
Creating a manifest file...
Manifest file created.

Done in 29 sec(s).


---End of Oryx build logs---
```

You'll now see in the build output that we did our TypeScript compile step, followed by the appropriate dotnet steps.

## Conclusion

With Static Web Apps being generally available we're seeing people tackling more complex scenarios, and this can lead to using multiple platforms together in the same project. By default the SWA build job won't build all platforms, but by setting `ENABLE_MULTIPLATFORM_BUILD` to `true` on it, we can solve those problems.
