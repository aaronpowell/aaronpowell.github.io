---
  title: "Macros in packages"
  metaTitle: "Macros in packages"
  description: "Wanting to include a Macro in your v5 package, where do you start?"
  revised: "2012-01-25"
  date: "2012-01-25"
  tags: 
    - "umbaco"
    - "umbraco-5"
    - "umbraco"
  migrated: "true"
  urls: 
    - "/umbraco/macros-in-packages"
  summary: ""
---
So you're working on an Umbraco 5 package and you want to be able to ship your own Macro with it. Seems like a common scenario you want to do yeah? It's something that's possible in v4 right? So how do you go about doing it in v5?

# Some background

In v4 Macros were a bit of a pain to ship, in case you didn't know they were stored in the database and their data model was... less than ideal mainly as they evolved from being XSLT components to also supporting .NET, Iron* and eventually Razor.

Well here's a fun fact about v5 Macros **they aren't in the database**, Macros in v5 are actually stored in Hive. Out of the box they will be run of the file system Hive provider but since they are in Hive you could (in theory) stick them into the Database, on a FTP or anywhere crazy that you want. But really, them being on the file system is pretty fantastic as it means that it's really easy to include them in Source Control, something that was a huge problem with the Umbraco projects I'd worked with in the past.

You will find your macros (by default) at the location `~/App_Data/Umbraco/Macros` and this contains a serialized XML version of your macro, which looks a lot like the exported Macro definitions in v4, just not quite as confusing. Also this is a configuration value that comes from the `/configuration/umbraco/macros[@rootPath]` section of the web.config. Again this is something that you can change but you probably shouldn't :P.

# Installing Macros from your package

In my [last post][1] I introduced tasks and again this is what you'll want to use to install your macro with your package.

The first thing you want to do is copy your macro file from the Macros folder into somewhere that'll include it in your package. I use a folder called **Macros** that sites at the root of my package, but it's ultimately a personal preference thing so you can put that folder anywhere inside your package.

*Side note Matt Brailsford has a great post on [how to create v5 packages][2], a must-read until there's a UI to do it.*

Part of the v5 source includes a task that can help you with this and it's called `CopyFileTask` and it allows you to copy a single file from one location to another. You'll see this task used as part of the *DevDataset* that's shipping with the RC builds but what you want to do is something like this:

      <add type="Umbraco.Cms.Web.Tasks.CopyFileTask, Umbraco.Cms.Web.Tasks" trigger="post-package-install">
        <parameter name="source" value="Macros/MyMacro.macro" />
        <parameter name="destination" value="~/App_Data/Umbraco/Macros/MyMacro.macro" />
      </add>

Adding that to your web.config in your packages (as described in my last post) will copy the file from the **Macros** folder in your package (or what ever folder you've put them into) to the Umbraco Macros folder.

# Conclusion

**Yes, that's it.**

Seriously, it's so much easier to ship Macros in v5 that v4 and the fact that they are running off disk (don't be a dick and use some crazy Hive provider for them like Examine!) makes installing them as simple as copying a file.

But I think there's some room for improvements around this still and as I work on my v5 tasks set I'm going to be doing a simpler task for installing Macros, but in the meantime the above will work nicely **today**.


  [1]: https://www.aaron-powell.com/umbraco/creating-an-installer-task
  [2]: http://blog.mattbrailsford.com/2011/09/30/automating-umbraco-v5-package-creation-using-msbuild/
