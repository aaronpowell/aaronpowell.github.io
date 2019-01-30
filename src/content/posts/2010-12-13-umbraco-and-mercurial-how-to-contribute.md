---
  title: "Umbraco & Mercurial - How to contribute"
  metaTitle: "Umbraco & Mercurial - How to contribute"
  description: "A quick guide on how to contribute to Umbraco using Mercurial"
  revised: "2010-12-14"
  date: "2010-12-13"
  tags: 
    - "umbraco"
    - "mercurial"
  migrated: "true"
  urls: 
    - "/umbraco-and-mercurial-how-to-contribute"
  summary: ""
---
# Umbraco & Mercurial - How to contribute

Now that Umbraco's source code is being moved away from TFS and into Mercurial ([and you've read the primer][1]) it will be easier than ever for anyone to provide patches, bug fixes or even potential new features back to the Umbraco core team for review. Although you haven't had to have TFS access in the past to get the code out and work with it the SVN bridge wasn't a great way in which you could send patches back to the Umbraco core team, but with Mercurial we hope this will be even easier.

## Get Forked!

Something that is very different in the world of DVCS is the idea of forks. Essentially a fork is a copy of the repository which someone has created for their own needs. A fork contains a full copy of the source repository but is completely isolated so what you do in your fork is your business, and a fork doesn't have to be pushed back into the main repository, you may have a fork which you just want to have a small change for your own site needs.

Let's assume you found a bug in Umbraco and you want to fix it, here's what to do:

1. You need to create a fork, so navigate to [http://umbraco.codeplex.com/SourceControl/list/changesets][2] and click the Create Fork option
2. Enter a name for the fork and a description and click Save

Now you're done, you have your own copy of the repository which you can clone and edit to your hearts content. Also, this repository is stored on the CodePlex servers, meaning that you've now got your own online repository, so your changes can be pushed to CodePlex and accessed anywhere, no more worrying about what'll happen when your laptop blows up and your personalized version of the Umbraco source code is lost.

## Working with your fork

*Note: The following will use the Mercurial command line tools, you can use [TortoiseHg][3] if you prefer though, refer to the TortoiseHg doco for the UI interactions :).*

Now that you've created your fork, let's set to work on fixing that bug. To do this we need to do the following steps, clone our fork, update to the right codebase and start working:

1. `hg cl <url of your fork>`
2. `hg up Release-4.5.2` (or what ever revision you want to use)
3. Launch Visual Studio

That' it, you're now working in your own personalized copy of the Umbraco repository.

### Mercurial commands to know

Just to interrupt I'll jump in and add a few more commands to your Mercurial toolbox:

* `hg addremove` (`addr`)
 * This will add any files to the repository which weren't previously included and remove any that it can't find (but thinks it should). You can also us `hg add` and specify the file(s) explicitly too
* `hg commit` (`com`)
 * This will commit any outstanding changes **to your local repository** (There's some useful links from the [Umbraco blog][4] for understanding DVCSs)
* `hg push` (`pus`) 
 * This will send all change sets since you last pushed up to CodePlex
* `hg status` (`sta`)
 * This lists all the files which have some kind of change, either added, removed, modified or unknown (new files not listed for add) since the last commit
* `hg outgoing` (`o`)
 * Lists all the change sets which will be pushed to CodePlex the next time you do a push
* `hg incoming` (`inc`)
 * Lists all the change sets which will be downloaded when you do a pull
* `hg merge` (`me`)
 * Merges the last change set committed into the local repository with the last change set from the remote repository (generally run after a `hg pul`). You can merge to a specific change set by adding the `-r` flag

*Back to our original programming*

Now that you've fixed the bug, what do you do? Well we need to ensure that your code gets back to the core, for that we need to ensure that all files are included in the repository (if you added or removed any), the code is committed and you've sent it back to codeplex:

1. hg addr
2. hg com -m "Fixing bug #1234. The problem was caused by XYZ so I did ABC and have tested it on my machine under the circumstances outlined in the bug"
 1. If you get an error here about your username see below
 2. Make sure that you're providing a useful commit message, `fixed` is **not** a useful commit message ;)
3. hg pus
 1. You'll probably have to supply your password at this point
 2. You can configure Mercurial to remember your password, I'll get to that shortly

Congratulations, you've just done a change and pushed it up to CodePlex! This change resides only in your fork at the moment though (this is what i meant by you can do forks which are just for your own needs that are never sent to the core), but you want to see this bug fixed in the core, so what's next? Well you need to send the core team a **pull request**. To do this you need to go back to CodePlex and view your forks. On this screen there is a **Send Pull Request** link, click it, provide some information about why you're sending the pull request and you're done.

Hopefully this process is a lot simpler for people to provide changed to Umbraco than the previous patching system :).

## Troubleshoot and advanced tips

In an ideal world everything will go as smoothly as outlined, but we don't live in an ideal world, so let's have a look at some other things which you may need to know.

### I get an error when committing about my username not being set

If this is your first time using Mercurial chances are you haven't got the environment 100% configured to do changes. One thing that is required when you do a change is that you provide a username (remember, this isn't integrated with Windows so it wont grab that one). But don't worry, it's a very easy problem to fix.

**Manually supplying usernames**

When you execute a `hg com` command you can specify the username there, like so: `hg com -m "some commit message" -u 'Aaron Powell'`. 

**Setting a default username for the clone**

If you're doing a lot of commits you may want to set the username for this particular repository, to do so navigate into your `.hg` folder (in the root of the clone) and open the `hgrc` file (or create it if it doesn't exist), and add the following section:

    [ui]
    username = "Aaron Powell"

Save the file and now when you do `hg com -m "some commit message"` the username will be pulled from that file automagically!

**Setting a global username for Windows**

If you're using a lot of Mercurial clones you may not want to have to specify your username each time, instead you want something set globally for all of them. To do this you need to edit your global `hgrc` file. You need to add the section listed above to the global file, which the locations of it listed here: http://www.selenic.com/mercurial/hgrc.5.html.

### Storing your password

Each time you push you need to authenticate against the CodePlex servers, but if you're doing a lot of pushes then it may get annoying to have to type in your password each time (or if you're like me and don't know your password it's even more of a pain!). Luckily it's easy to have your password automatically included. Navigate into you `.hg` folder and open the `hgrc` file. You should have a section like this:

    [paths]
    default = http://../

This is the URL of your repository, and here you can configure it to automatically include your username & password, change the URL to be like this:

    https://username:password@ur.of.my.repository

Save the file and now each time you commit your credentials are included :).

### Staying in sync with the core

If you're a really awesome dude who fixes a lot of bugs for us you may find that your fork gets out of sync with the core, but don't fear, you can keep your fork in sync by **pulling from multiple sources**. What this allows you to do is define multiple repositories which you want to be able to get updates from (selectively).

Open your trusty `hgrc` file and navigate to the `[paths]` section. In here you can add multiple paths, each with a different name. Most likely your fork will be labeled `default`, so we'll add a new one which is the core:

    [paths]
    default = https://hg01.codeplex.com/forks/slace/my-repository
    core = https://hg01.codeplex.com/umbraco

Now when you do a pull you can specify where you want to pull from:

    hg pull core

This will get all the latest change sets form the Umbraco core repository. You can then merge (`hg me`) them into your local fork and patch against it again!

## Conclusion

Here we've looked at how the move to Mercurial for Umbraco will make life easier for people outside of the Umbraco core team that want to contribute back. Hopefully this more streamlined process will mean that we see more fixes from the community so we can create even better a product :).

  [1]: {{< ref "/posts/2010-12-11-mercurial-101-for-umbraco-developers.md" >}}
  [2]: http://umbraco.codeplex.com/SourceControl/list/changesets
  [3]: http://tortoisehg.bitbucket.org/
  [4]: http://umbraco.org/follow-us/blog-archive/2010/12/8/heads-up-umbraco-sourcecode-at-codeplex-to-switch-to-mercurial