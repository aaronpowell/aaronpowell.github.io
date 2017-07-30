---
  title: "From FunnelWeb to Git in a few simple steps"
  date: "2013-06-10"
  description: "With the decision to go to Git from FunnelWeb I wanted to be able to maintain the history of the changes. Since many of my posts have multiple revisions I wanted them to be listed as changesets in Git.\n\nIn this post we'll look at how to get the content out of FunnelWeb (or any content database) and into Git as full history."
  tags: 
    - "funnelweb"
    - "scriptcs"
    - "git"
---

_Prelude: I'm going to assume you've got the database somewhere locally that you can work with, I wouldn't recommend doing it against a production database. We're not doing anything destructive against it but better safe than sorry!._

The scenario is that I'm wanting to be able to visualise the revision history of my posts in FunnelWeb as Git commits, each new revision of a post should be a new commit. The history order should match the date that posts were created (or edited) so that it doesn't look like just a dump into Git, it looks like actual history.

Without doing a full Git primer there's one really important aspect of Git that you need to be aware of. Git is basically a small linux file system so with file system theory under our belt we should know that there's a date associated with files (or in this case, commits). So at least _in theory_ we should be able to control when a commit happened right? After all I've got posts from 2010 and I'd like those commits to reflect that.

So armed with a bit of knowledge and [Brendan Forster's skype handle](http://twitter.com/shiftkey) I started digging.

# It's a date

Since my work on the time machine is running behind schedule (snap!) it's time to get an understanding of date's in Git. Each commit in Git will have two dates associated with it, `author date` and `committer date`, and there's an important difference between these two dates.

**Author date** is the date when a commit was _originally authored_ in the source repository.

**Committer date** is the date when a commit was _applied to the current repository_.

This is the important bit of information, generally speaking these two dates are the same **but they don't have to be**. Say I create a patch file from my repository and send it to you, this will contain an _author date_, which is the date that **I** created the commit, and in my repository it matches the _commit date_. At some future point in time you're going to add that patch to your repository and when you do that you'll receive my _author date_ but you'll have a different _commit date_, for you see the date that you committed it to the repository has changed, but the commit itself hasn't (if it did the whole commit would be invalid). [A more in-depth write up can be found here](http://alexpeattie.com/blog/working-with-dates-in-git/).

And this is where the power comes from, you can manipulate these dates. This means that I can extract my dates from FunnelWeb and author commits of a particular point in time, but commit them whenever makes sense.

_Side note: General wisdom says you shouldn't mess around with the committer date, only the author date._

# Manipulating Git

Well now that we know that we can, at least in theory, manipulate our Git history to match the information that I'd like it to be, the question is how?

A quick search found [this on Stackoverflow](http://stackoverflow.com/questions/454734/how-can-one-change-the-timestamp-of-an-old-commit-in-git), neat-o I can do something like this:

	>> git commit --amend --date="<Date from my post revision>"

Well isn't that nice, the command line exposes what I want, but either having to manually run the commands on the CLI or calling the CLI fro mcode is not a particularly pleasent an idea.

Enter [LibGit2](http://libgit2.github.com/) or more specifically [LibGit2Sharp](https://github.com/libgit2/libgit2sharp). If you've done anything with Git programmatically you're probably familiar with these libraries. LibGit2 is an implementation of the Git core commands but being written in C it's not that much fun for .NET developers so that's where LibGit2Sharp comes in and it's what we'll be using.

# Exporting out data

I'll get back to Git in a moment as there's something important we need to do before we can work with Git and that's getting us some data.

For this I'm going to use [Dapper](https://github.com/SamSaffron/dapper-dot-net) which is a light-weight ORM to talk to the FunnelWeb database, but use whatever works best for you. The important part here is _how_ we run our code.

Well there's an obvious option, we could go `File -> New Console Application` and get cracking, NuGet install our dependencies, etc.

Nah console applications are so 2012, instead I'm going to use [ScriptCS](http://scriptcs.net/).

If you haven't heard of ScriptCS don't fret, it's a very new platform. ScriptCS is the brain child of [Glenn Block](https://twitter.com/gblock), which is taking his learnings from being heavily involved in Node.js of recent and bringing that to the .NET world. Basically making a way which you can execute a C# file without the need for Visual Studio, the C# compiler or any of those tools we're use to as .NET developers. Check out [Scott Hanselmans post on the topic](http://www.hanselman.com/blog/ProjectlessScriptedCWithScriptCSAndRoslyn.aspx) if you want to learn more.

_Note: You'll need ScriptCS version 0.5.0 at least as you need [my pull request](https://github.com/scriptcs/scriptcs/pull/250) included._

# Getting started

Now we have the idea sorted out, I'm going to start with a ScriptCS project which will use a Dapper to get our data out and LibGit2Sharp to push it into Git, seems nice and simple really. Let's break this down into the smaller parts.

## Opening our Git repo

The first step in our process will be to open up the Git repo so we can work against it. I've created a migrator folder which my migrator will reside within and then I'll go create a new file called `app.csx` which is my ScriptCS file (note the `csx` extension).

I'll need a using for `LibGit2Sharp` and then I'm going to create a method which will resolve our Git repository. So my file now looks like this:

	using LibGit2Sharp;

	static Repository InitOrOpen(string path) {
	    var gitBasePath = Repository.Discover(path);
	    if (gitBasePath == null)
	    {
	        Console.WriteLine("And we're creating a new git repo people!");
	        return Repository.Init(path);
	    }
	    Console.WriteLine("Found existing repo, keep on trucking");
	    return new Repository(gitBasePath);
	}

	using (var repo = InitOrOpen(@"C:\_Code\my-repo")) {
	    Console.WriteLine("It's time to rock and rooooooooll");
	}

So my method `InitOrOpen` will take a path to a folder which is to be our Git repository. In the method it'll use the `Discover` method of the `Repository` class which will locate the Git repository for the current folder or any of its parents. This means that I don't have to pass the repository root, which works well for me using DocPad as I want to put my posts in `src\documents\posts` where my repository root is where the `src` folder exists.

The result of `Discover` will be the path which the Git repository resides in, as a string, which is null if there was no repository found. Based on that result we can choose to initialise a new Git repository, `Repository.Init(path)`, or open the repository at the discovered path, `new Repository(gitBasePath)`. This `Repository` object is what we'll use to interact with Git from .NET.

Lastly the file will call the method in a `using` block which in turn just dumps out that we opened the repository.

## Package.config

Before we can run this ScriptCS file we'll need get LibGit2Sharp _installed_, so how do we go about it... [NuGet](http://nuget.org) of course!

For this we'll need a `package.config` file which defines our NuGet packages. Here's where we're at:

	<?xml version="1.0" encoding="utf-8"?>
	<packages>
	  <package id="LibGit2Sharp" version="0.11.0.0" targetFramework="net45" />
	</packages>

Now we just need to run the ScriptCS file and our little app will do some logging out of messages!

_Note: When I was writing this I came across a problem, LibGit2Sharp expects the native Git assemblies to be in the same folder as LibGit2Sharp's assembly. In a .NET app this is done by copying the `NativeBinaries` folder from the NuGet package into the `bin` folder as a post-build event in the csproj file. Since we don't have a csproj in ScriptCS you need to manually copy that folder._

## Preping our data

I'm not going to go into depth as to how to get your data out of your database to be pushing into Git, that'll somewhat depend on the database and ORM you're working with, you can find that from [here](https://github.com/aaronpowell/aaronpowell.github.io/blob/master/_migrator/app.csx#L25-L46) in my source code.

What is important to know is that ScriptCS **doesn't** support `dynamic` in C#, so you'll need to create a class which represents the object you're pulling out of the database (the reason for this is at present [Roslyn](http://msdn.microsoft.com/en-us/vstudio/roslyn.aspx), which ScriptCS uses to do its execution doesn't support it). I've done this by creating a [Posts.csx](https://github.com/aaronpowell/aaronpowell.github.io/blob/master/_migrator/Post.csx) file that is then loaded into ScriptSC.

But once we've got our data out of our database it's time to push it into Git.

## Git it in ya

We have our Git repository, we have our data, it's time to do something about joining the two things together. Remember I said that I wanted each revision in my FunnelWeb database to be an individual commit in Git? Well that will be quite easy to do. The object model that I have brought back out of FunnelWeb respects that, each object is a snapshot of the post at a particular point in time. Next I'm going to have to do a few things:

* Get the comma-separated list of tags into an array
* Clean up my URI schema (in FunnelWeb it was very free-flowing, I want to normalize it a bit to the standard `YYYY-MM-DD-name` format)
  * But I don't want to break my existing SEO so I need to be able to track those old links and 301 them
* If a file doesn't exist yet create a new file, otherwise update the existing one
  * This is where it's really cool, since we'll just override the existing file and Git is pretty smart about diff-detection it'll only track what changed between each version so we can then get nice clean diffs

Now DocPad uses the fairly common YAML-style meta-data headers, but it also supports something they wrote specifically called `cson` which is a CoffeeScript version of JSON. Since I've always found YAML a pain I'm going to use that for my post meta data headers.

Let's start writing our file to disk then:

    foreach (var item in items) {
        var tags = item.Tags.Split(',')
            .Select(x => x.Trim())
            .Where(x => !string.IsNullOrEmpty(x));
        var uriParts = item.Path.Split('/');

        if (uriParts.Count() > 1) {
            tags = tags.Union(uriParts.Take(uriParts.Count() - 1));
        }

        var postPath = Path.Combine(Settings.OutputPath, item.Published.ToString("yyyy-MM-dd") + "-" + uriParts.Last()) + ".html.md";
        if (!File.Exists(postPath))
            File.CreateText(postPath).Close();

        using (var sw = new StreamWriter(postPath)) {
            sw.WriteLine("--- cson");
            sw.WriteLine(Formatters.CreateMetaData("title", item.Title));
            sw.WriteLine(Formatters.CreateMetaData("metaTitle", item.MetaTitle));
            sw.WriteLine(Formatters.CreateMetaData("description", item.Desc));
            sw.WriteLine(Formatters.CreateMetaData("revised", item.Date));
            sw.WriteLine(Formatters.CreateMetaData("date", item.Published));
            sw.WriteLine(Formatters.CreateMetaData("tags", tags));
            sw.WriteLine(Formatters.CreateMetaData("migrated", "true"));
            sw.WriteLine(Formatters.CreateMetaData("urls", new[] {"/" + item.Path}));
            sw.WriteLine(Formatters.CreateMetaDataMultiLine("summary", item.Summary));
            sw.WriteLine("---");
            sw.Write(item.Contents);
        }

        //git stuff
    }

Ok, that'll do nicely, I've extracted my tags, cleaned up my URIs, so `/flight-mode/indexeddb` becomes `/posts/2013-05-27-indexeddb.html` for example, and I've built up a meta-data header which contains all the information that I found to be important (check out the [DocPad documentation](http://docpad.org/docs/meta-data) to get a better idea of what meta-data is available and for what purpose).

Now it's time to get it into Git, and more importantly, get it into Git with the right author date. Remember how I said there are two dates which a commit has, well I'm only going to concern myself with the `author date`, since that was when the revision was created, but the date it when into the repository isn't particularly important, for all it matters it could have been in another repository before now (which abstractly speaking it was).

Turns out that this is actually **really** easy to do! In fact LibGit2Sharp exposes the API to do just that as part of the commit API!

        var commitMessage = string.IsNullOrEmpty(item.Reason) ? "I should have given a reason" : item.Reason;
        repo.Index.Stage("*");
        repo.Commit(commitMessage, new Signature("Aaron Powell", "me@aaron-powell.com", (DateTime) item.Date));

First things first I've created a commit message based off of the revision reason in FunnelWeb, next I'll stage all changes in the repository (this is just so I can be lazy and not worry about the file name :P) and lastly commit the stage providing an author signature _which contains the author date as an argument_.

I was honestly shocked at just how easy that process turned out to be!

So now when we execute the code it'll build up a nice Git repository for us.

# Conclusion

And that's it, with only 100 lines of code (which contains a rather large SQL statement too) I was able to pull all the data out from FunnelWeb and then push each post revision as a separate Git commit.

You'll find the full code for my migrator [in my sites repository](https://github.com/aaronpowell/aaronpowell.github.io/tree/master/_migrator).

One final note though, I did have the following two problems:

* The migrator didn't like being run in the same repository as I was opening with LibGit2Sharp, I think the problem was related to ScriptCS locking the `/bin` folder which Git then didn't have any access to and it'd crash. I didn't look too deeply into this (C ain't my forte these days) and it was easily solved by having the migrator source in a separate location (and it also meant I didn't accidentally commit my real connection string)
* LibGit2Sharp didn't seem to like it when I wasn't in the `master` branch. I initially tried to use a separate branch to create all the commits that I'd then review and rebase into master, but whenever I did this it would create a new repository in the destination folder so I ended up with nested Git repositories. Again I didn't delve into the underlying reason, I left it for Brendan to entertain himself with, instead I just did it in master and deleted my clone the few times I stuffed up :P