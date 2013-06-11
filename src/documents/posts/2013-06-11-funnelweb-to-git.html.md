--- cson
title: 'From FunnelWeb to Git in a few simple steps'
date: '2013-06-10'
description: """With the decision to go to Git from FunnelWeb I wanted to be able to maintain the history of the changes. Since many of my posts have multiple revisions I wanted them to be listed as revisions in Git.

In this post we'll look at how to get the content out of FunnelWeb (or any content database) and into Git as full history.
""" 
tags: ['funnelweb', 'scriptcs', 'git']
---

_Prelude: I'm going to assume you've got the database somewhere locally that you can work with, I wouldn't recommend doing it against a production database. We're not doing anything destructive against it but better safe than sorry!._

The scenario is that I'm wanting to be able to visualise the revision history of my posts in FunnelWeb as Git commits, each new revision of a post should be a new commit.

Without doing a full Git primer there's one really important aspect of Git that you need to be aware of. Git is basically a small linux file system so with file system theory under our belt we should know that there's a date associated with files (or in this case, commits). So at least _in theory_ we should be able to control when a commit happened right? After all I've got posts from 2010 and I'd like those commits to reflect that.

So armed with a bit of knowledge and [shiftkey's skype handle](http://twitter.com/shiftkey) I started digging.

# It's a date

Since my work on the time machine is running behind schedule (snap!) it's time to get an understanding of date's in Git. Each commit in Git will have two dates associated with it, `author date` and `committer date` and there's an important difference between these two dates.

**Author date** is the date when a commit was _originally authored_ (this is important) in the source repository.

**Committer date** is the date when a commit was _applied to the current repository_.

This is the important bit of information, generally speaking these two dates are the same **but they don't have to be**. Say I create a patch file from my repository and send it to you, this will contain an _author date_, which is the date that **I** created the commit, and in my repository it matches the _commit date_. At some future point in time you're going to add that patch to your repository and when you do that you'll receive my _author date_ but you'll have a different _commit date_, for you see the date that you committed it to the repository has changed, but the commit itself hasn't (if it did the whole commit would be invalid). [A more in-depth write up can be found here](http://alexpeattie.com/blog/working-with-dates-in-git/).

And this is where the power comes from, you can manipulate these dates. This means that I can extract my dates from FunnelWeb and author commits of a particular point in time, but commit them whenever makes sense.

_Side note: General wisdom says you shouldn't mess around with the committer date, only the author date._

# Manipulating Git

Well now that we know that we can, at least in theory, manipulate our Git history to match the information that I'd like it to be, the question is how?

A quick search found [this on Stackoverflow](http://stackoverflow.com/questions/454734/how-can-one-change-the-timestamp-of-an-old-commit-in-git), neat-o I can do something like this:

	>> git commit --amend --date="<Date from my post revision>"

Well isn't that nice, the command line exposes what I want, but that's a pain, it's via the CLI, not the friendliest thing to work with, especially as I create 100's of commits, sounds painfully manual.

Enter [LibGit2](http://libgit2.github.com/) or more specifically [LibGit2Sharp](https://github.com/libgit2/libgit2sharp)