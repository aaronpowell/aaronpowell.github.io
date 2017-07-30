---
  title: "How I develop Umbraco"
  metaTitle: "How I develop Umbraco"
  description: "How I do my development of Umbraco web applications."
  revised: "2010-12-26"
  date: "2010-12-22"
  tags: 
    - "umbraco"
  migrated: "true"
  urls: 
    - "/how-i-developer-umbraco"
  summary: ""
---
## Overview

In this article I'm going to cover the way that I setup my system for developing against Umbraco. I'm putting this together as everyone seems to have their own flavor to doing development so I thought I'd throw my hat into the arena with *yet another setup* to give new (and experienced) developers another way to go about it.

And hey, this has worked quite well for me for a while, maybe other can benefit from it ;).

## Environment

So for this I'm going to be running the following software:

 * Visual Studio 2010
  * I use Cassini as a development database, not IIS. I don't use IIS as it requires (under Vista and 7) that you use an admin account to debug. Since my day-to-day Windows account isn't an admin (seriously, you don't need an admin for day-to-day work!) Cassini makes a lot more sense
 * SQL Server Express

Although I'm running Windows 7 I've used this setup on Windows XP and Vista as well, so don't fear if you're running an archaic OS :P.

*Side note: I'm using the Umbraco Juno (4.6) beta release, but again this is a moot point, it works with any Umbraco 4.x instance*

## Getting Umbraco running

So once you've [downloaded Umbraco][1] and extracted it fire up Visual Studio. First thing I do is create a blank Visual Studio project

For development I use **Web Application** projects, so create a new empty Web Application (ensuring you've got the right version of .NET selected too ;)) using the naming schema of `SolutionName.Web`:

![New WAP][2]

Once I've added a Web Application I create the solutions required for [WebFormsMVP][3] projects, a `Logic` and `Services` project (which I then remove the `Class1.cs` file) and a Test project (omitted from here as it's not important to the overall post). This will end you up with an empty Visual Studio solution (well, except for a web.config file):

![Look ma', no files][4]

Now we have to copy all the files, except for the /bin folder, into Visual Studio:

![Files to copy][5]

There's already a web.config in the project, so we'll just replace it with the one that Umbraco supplied us, otherwise we wont have any of the config settings for Umbraco wont work, and we don't want that.

Now that Visual Studio is looking nicely filled out I exclude the following folders from the solution:

 * data
 * install
 * media
 * umbraco
 * umbraco_client

I also delete the App_Code folder.

There is method to this madness, I copy them across so I can ensure that they are in my project folder when I add it to source control. But the reason that I exclude it is so that Visual Studio wont include them in the JIT compilation when you fire up the debugger. This is most important with the /umbraco folder, as that contains ASP.Net files, the other folders (data, media, etc) don't contain files that I want in source control, so that's why I don't need them in Visual Studio.

Now the Solution Explorer looks a bit more useful:

![Solution with Umbraco][6]

It's almost done, there's just 1 more problem, we need to handle the Umbraco assemblies. As you'll remember we excluded that from being copied into Visual Studio. This is because the assemblies are a dynamic feature, so including them into the project directly is a bad idea, also, the /bin folder should never be included in source control!

So I close off Visual Studio so I can do some restructuring in Windows, basically I want the following structure in source control:

 * /src
  * /UmbracoDemo3.* (where the projects resides)
  * /UmbracoDemo3.sln
 * /lib
  * /umbraco-4.6

Now I copy across all the assemblies into the **umbraco-4.6** folder, then upon reopening Visual Studio I add the assemblies as references into the Web project. Now when the project is compiled it will then copy all the assemblies into the local /bin for the web application. I recommend deleting the `App_Global.asax.dll` (and the reference to it) as it just becomes a royal pain in the ass when working with WebFormsMVP.

Any external assemblies which I need to include as a reference to a project that can't be obtained via [NuGet][7] I'll also put into there.

*Note: You don't have to reference all of them, there is a subset of assemblies which you need to add and they will pull in the rest but I've never really sat down and worked out what ones they are.*

**Done**, now you can spin up Cassini and then you're good to install Umbraco and start developing.

## Conclusion

So that brings us to a finale of how I go about doing Umbraco setup with Visual Studio. Here's a few notices of things which I didn't cover in this article but can be useful to know:

 * I share databases, since the CI process of Umbraco isn't exactly great it's simpler to use a shared database for development
 * I use Visual Studio for pretty much all file editing (css, masterpages, IronRuby, etc), but I create them through the Umbraco UI as it will set up the database records nicely


  [1]: http://umbraco.codeplex.com
  [2]: /get/umbraco/how-to-umbraco/how-to-umbraco-01.png
  [3]: /webforms-mvp
  [4]: /get/umbraco/how-to-umbraco/how-to-umbraco-02.png
  [5]: /get/umbraco/how-to-umbraco/how-to-umbraco-03.png
  [6]: /get/umbraco/how-to-umbraco/how-to-umbraco-04.png
  [7]: http://nuget.codeplex.com/