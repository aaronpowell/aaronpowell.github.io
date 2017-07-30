---
  title: "Mercurial 101 as an Umbraco developer"
  metaTitle: "Mercurial 101 as an Umbraco developer"
  description: "A Mercurial primer for Umbraco developers"
  revised: "2010-12-23"
  date: "2010-12-11"
  tags: 
    - "umbraco"
    - "mercurial"
  migrated: "true"
  urls: 
    - "/mercurial-101-for-umbraco-developers"
  summary: ""
---
# Mercurial 101 as an Umbraco developer

You may have read the post that the Umbraco codebase is being moved from a CodePlex TFS server to CodePlex Mercurial ([link][1]) but what does that mean as an Umbraco community member?

## First up, a Mercurial primer

While there are fancy GUI tools for working with Mercurial (such as [TortoiseHg][2]) I'm going to do a quick run down on what you need to be able to use from the command line to work with Mercurial. Personally I find it easier (and quicker) to work on the command line, but if you'd prefer to learn about TortoiseHg jump over to their doco, or read [Shannon's][3] [guide to using TortoiseHg][4] :).

### Commands you need

There are three things you need to be able to do if you're grabbing the code from Mercurial, clone, update and view history: (Note: This is not covering doing changes, just how to get the code and navigate around it)

 * hg clone [https://hg01.codeplex.com/umbraco][5]
  * This how you get a copy of the codeplex repository onto your machine. This may take a little while, we've got a lot of history (sic) in there that you'll be getting
 * hg update <version you want>
  * This is how you'll get to the release that you want to view the code for. Say you want to work with v4.5.2 then you want to do `hg update Release-4.5.2`
 * hg serve
  * This is an interesting command as it'll spin up a webserver (http://localhost:8000 by default) which allows you to view the repository history. You can hit the url in your browser and browse change sets, commits, etc. This is a handy way to find out what you want to update to without having to go to CodePlex

### A command line tip

One of the really nice things about the Mercurial command line tools is that you can use *shorthand* to execute a command. Basically when you type a command in shorthand Mercurial will try and find the command that matches it, so for example if I was to type `hg up Release-4.5.2` Mercurial will see that I've typed `up` and that `up` only matches the `update` command.

If you don't supply enough characters, ie: `hg c https://hg01.codeplex.com/umbraco` then Mercurial will tell you that it doesn't know what you were trying to execute.

## Named branches as awesome

Anyone who's tried to bugfix Umbraco or wanted to compile a version themselves will appreciate the pain which the TFS structure was causing (this isn't a bash at TFS, it wasn't entirely TFSs fault that it was hard, it was a combination of different factors, so don't take this as a diss at TFS). Now with the migration it should be a whole lot easier.

Say you find a bug in your 4.5.2 install and you want to try and debug it yourself. Here's how you'd go about it:

1. Open up your favorite console (cmd.exe, powershell, etc) and navigate to a folder you want to put the Umbraco source
2. Execute: `hg cl https://hg01.codeplex.com/umbraco; hg up Release-4.5.2;`
3. Open the .sln file in Visual Studio

Yes, it's *just that easy*! Now you can debug the code to your hearts content.

## Conclusion

This was just a quick walkt through of how the move to Mercurial with Umbraco is going to make it simpler for developers to interact with the Umbraco source code.

Happy Hacking :)


  [1]: http://umbraco.org/follow-us/blog-archive/2010/12/8/heads-up-umbraco-sourcecode-at-codeplex-to-switch-to-mercurial
  [2]: http://tortoisehg.bitbucket.org/
  [3]: http://shazwazza.com/
  [4]: http://shazwazza.com/post/A-UI-guide-to-using-Umbracoe28099s-new-repository-format-Mercurial.aspx
  [5]: https://hg01.codeplex.com/umbraco