---
  title: "Problems with Assembly Trust"
  metaTitle: "Problems with Assembly Trust"
  description: "Something to be careful of with downloading assemblies"
  revised: "2010-04-08"
  date: "2010-04-08"
  tags: 
    - ".net"
    - "trust-level"
    - "autofac"
    - "fail"
  migrated: "true"
  urls: 
    - "/problems-with-assembly-trust"
  summary: "Related Links:<br />\n<a href=\"http://www.hanselman.com/blog/FavIconsInternetZonesAndProjectsFromATrustworthySource.aspx\" title=\"FavIcons, Internet Zones and Projects from a Trustworthy Source\">FavIcons, Internet Zones and Projects from a Trustworthy Source</a>"
---
When I was migrating PaulPad to ASP.NET MVC2 I decided that I wanted to also upgrade it to Autofac2. The main reason for it was the type registration is much nicer with it's lambda syntax than it was in the 1.4 release which PaulPad previously used.

So I set about downloading the latest version of [Autofac][1] and getting it up and running.

Because Autofac2 supports both MVC1 and MVC2 I needed to use [Assembly Binding][2] to ensure that it worked properly. And this is where everything started to go bad. I kept getting weird a weird runtime error, an [EntryPointNotFoundException][3] was being thrown.

At the time I couldn't get Autofac2 to compile for .NET 3.5 ([I've since produced a patch to fix that][4]) so I was in a world of pain.

I did manage to get it working by implementing my own controller registration and my own [IControllerFactory][5] and then it was working fine, even though I used the source of the AutofacControllerFactory! By now I was scratching my head massively, I mean, I'm doing exactly what they are doing, but why does mine not work?

From the limited debugging I was able to do (kind of hard when you don't have the Autofac PDB's) I found out that when calling **builder.RegisterControllers** nothing was happening. The controllers weren't being found. Huh? But they were in the assembly, so it wasn't making sense.

Once I got Autofac to compile though I did some debugging and was getting a weird error when it run the following code:

    typeof(IController).IsAssignableFrom(controllerType);

The error was:

> Type IController exists in System.Web.Mvc.dll and System.Web.Mvc.dll

(Well, something to that effect anyway)

So I was sitting there with a completely dumbfounded looked on my face, of course it exists in that assembly, by why does it look there twice? The only logical thought was that it wasn't doing the assembly binding properly. But how can that be? I've not had assembly finding fail before, if it failed it shouldn't have compiled.

Shit wasn't making sense.

So I rolled back to my downloaded version of Autofac and decided to check the version number, but immediately upon opening up the properties dialog I say the message "This file came from another computer and might be blocked to help protect this computer", and then there was the **Unblock** button.

**facepalm**

So I clicked Unblock, compiled and magic happened. It all worked, no problems what so ever.

### Moral of this story ###

Trust everyone


  [1]: http://code.google.com/p/autofac/
  [2]: http://msdn.microsoft.com/en-us/library/7wd6ex19(VS.80).aspx
  [3]: http://msdn.microsoft.com/en-us/library/system.entrypointnotfoundexception.aspx
  [4]: http://code.google.com/p/autofac/issues/detail?id=208
  [5]: http://msdn.microsoft.com/en-us/library/system.web.mvc.icontrollerfactory.aspx
