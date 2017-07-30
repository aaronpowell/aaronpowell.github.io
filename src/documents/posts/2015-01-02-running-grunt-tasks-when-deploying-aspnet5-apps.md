---
  title: "Running grunt tasks when deploying ASPNet5 apps to Azure"
  date: "2015-01-02"
  tags: 
    - "aspnet"
    - "aspnet5"
    - "grunt"
    - "gulp"
  description: "How to run grunt (or gulp) tasks when deploying ASPNet5 applications to Azure Websites."
---

After MVP Summit this year the ASPNet team held a hack-day where we were encouraged to build something using ASPNet5 to help test out the platform. During that time I decided to build a website for when you can't think up your own commit message, instead it'll grab the last 50 commit messages from a GitHub [using GitHub search](https://help.github.com/categories/search/) called [What the Commit](http://whatthecommit.azurewebsites.net).

I finally decided to throw it up [GitHub](https://github.com/aaronpowell/what-the-commit) and deploy it to Azure. Since the app is a SPA I went down the route of using [grunt](http://gruntjs.com/) and [bower](http://bower.io/) to manage the client side dependencies and build process (which is the recommended approach in ASPNet5 too).

Naturally I don't want to add all my node modules or bower components to the git repo, instead I'll want to restore them before build, just like I do with my NuGet dependencies.

Well how do you go about doing that?

# Project scripts

Part of the [`project.json`](https://github.com/aspnet/Home/wiki/Project.json-file) is a `scripts` section which allows you to run arbitrary commands at various stages of the pipeline.

For restoring any packages from `npm` I find the most logical event to hook into is `postrestore`, which I believe runs when the NuGet packages have been restored, so you're done with the .NET restore, now to the Node restore.

Next you'll need to run your `grunt` task(s) (or `gulp` if you're using that) and to do that I went with the `postbuild` event as I'm running my client-side build process (which for me is doing little more than restoring some `bower` packages).

All completed my `scripts` property looks like this:

    "scripts": {
        "postrestore": [ "npm install" ],
        "postbuild": [ "grunt default" ]
    }

First I run `npm install` to get the Node dependencies down, then I run `grunt default` which will restore my `bower` components, but could also do things like transpile, combine, minify, etc your scripts.

# Watch your path lengths

Anyone who has done Node development on Windows will have hit the fun "path exceeds 260 characters" and you can hit this on Azure too with ASPNet5 applications because you're using Node for client builds. The reason for this is that a deployment happens into a temp folder before copying it over to the hosting folder. This is when you'll hit your path length error, but you know you probably don't have any need to have your `node_modules` folder (or `bower_components` for that matter) in your production instance and to avoid this you want to work with another part of the `package.json` file, `packExclude`.

The `packExclude` property allows you to specify files and folders which you don't want included when the app is packaged for deployment (or packaged for other reasons), so you'll probably want it looking something like this:

    "packExclude": [
        "bower.json",
        "package.json",
        "gruntfile.js",
        "bower_components/**/*.*",
        "node_modules/**/*.*",
        "grunt/**/*.*",
        "**.kproj",
        "**.user",
        "**.vspscc"
    ]

Now when Azure copies your app around it won't copy the files you have no need for on a production instance.

# Conclusion

When deploying an ASPNet5 app to Azure (and likely any other hosting platforms) hooking into the events is the best way to combine the .NET and client build process.

Also make sure that you exclude from the package anything you wouldn't want on the production instance.
