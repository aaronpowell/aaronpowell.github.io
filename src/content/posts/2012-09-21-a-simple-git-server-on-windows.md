---
  title: "Running a simple git server on Windows"
  metaTitle: "Running a simple git server on Windows"
  description: "How to setup a basic git server for Windows"
  revised: "2012-09-21"
  date: "2012-09-21"
  tags: 
    - "git"
  migrated: "true"
  urls: 
    - "/a-simple-git-server-on-windows"
  summary: ""
---
While [Mercurial][1] still hold a special place in my heart it can't be denied that [Git][2] has well and truly won the war. Because of this I've been using it more extensively in the projects that I work on.

Recently I started on an engagement at work that was using [TFS][3] as its SCM, but wanting to avoid some of the pain of TFS 2010 I decided to use [git-tf][4]. Things all went smoothly, git was communicating nicely to TFS and children danced around the world.

When the partner who owned the TFS instance rolled off the project the SCM went with them which left me in a pickle, I still had a few weeks left and was looking at the prospect of being SCM-less. For various security reasons I can't utilise any of the normal hosted SCM's that I'd go with, so I was left with a problem, I have a complete git history of the project but the only place it lived was on my desktop.

# Making my own server

Having used Mercurial for around 3 years now I'm quite familiar with the [hg serve][5] command, this is ideal as you run that and you immediately have a basic Mercurial server running that you can push and pull to. This is exactly what I want for git, I'd have a simple server that I can work against and so can the other developer who was coming in few a few days. Unfortunately _there is no such command_, you do instead have the [git daemon][6], and with a simple command like this:

    git daemon --reuseaddr --base-path=. --export-all --verbose

You've got yourself a git server. Yeah go on, remember *that* off the top of your head (yes you just type it once in as an alias I know I know :P)!

So I run my command, have my server ready for connections and then shit gets ugly.

As it turns out [msysgit][7], the de-facto Windows git tools, has some real problems with `git daemon`. I was continuously seeing this while trying to clone:

    fatal: read error: Invalid argument

Eventually a clone would go through (it's only a 10mb repo!) but then you'd get a whole different set of problems.

Again, as it turns out msysgit doesn't support pushing to `git://` repositories on Windows. Well that just sucks then doesn't it, it left us with [sneakerneting][8] our `.git` folder so I could maintain the master repository.

And that got old fast!

# Next up, cygwin

So now that msysgit was out the next idea was to use [cygwin][9]. I've been avoiding installing cygwin on any machines for quite some time now as it really frustrates the hell out of me but I got sent [this stack overflow post][10] which made it seem quite easy to get it up and running.

Well I followed the instructions and started up my sever and it all seemed good, I could pull from it without any problems. Yay!

But of course it was time for another problem, I kept having `git push` hang at [100% of writing objects][11].

Again this seems to be a fairly common problem with git on Windows pushing to cygwin git daemons and to which there's no decent solution.


# Ditching Windows

Basically all my research has suggested to me that the idea of trying to host a git server on Windows is just a bad idea. Sure there were other avenues that I hadn't tried, such as using a network share to store my git repository and push/ pulling over that, but I didn't want to futz around with network security here for this task (people also suggested using Dropbox but that is nullified by the fact that the source can't be hosted outside of the local network), I just wanted a damn git server and my only remaining option that I could see was Linux.

Since my machine is running Windows 8 I've got Hyper-V built in so that's one problem down, I didn't have to install VirtualBox (its installer wants me to trust Oracle, I just can't do that :P) or VMWare Player or anything like that, just enable a Windows feature. The next question, what distro to use...

Wow, there's a can of worms you can open, ask people what Linux distro to use... I'll admit that it's been quite a few years since I last used Linux so I'm not really up with what the kids are using these days but all I want are:

- Something light-weight, I'm running a Git server on it, that's all
- Something easy to setup, I don't have time (or the desire) to really get in and configure Linux
- I don't need a GUI, I'm happy on the command line

So [ArchLinux][12] and [PuppyLinux][13] were two of the top recommended distros, but they'd require a bit of setup to get running. Then a colleague of mine recommended [GitLab][14], a variation of Turnkey that is basically just a pre-built git server. Sweet that sounds exactly like what I want.

I downloaded GitLab, booted Hyper-V, attached the ISO and kicked off the installer. After being prompted for some credentials to log in and having to use the **Legacy Network Adapter** in Hyper-V (apparently Turnkey supports the standard one but 5 minutes of configuring modules didn't work for me so I went 'meh, legacy it is' :P) my git server was up and running!

_For the record my VM specs are a 5GB hard drive and it has 512mb RAM dedicated to it. I was tempted to drop it down to 256mb as it really just idles mostly but I've got RAM to spare._

Next step was to log into the web portal, setup a git project on the server and add my public key and _it just worked_. Seriously, I was **shocked** that it was that simple!

I even managed to get the other developer (who prefers GUI tools over command line, weirdo!) setup to use [GitHub for Windows][15] against my GitLab server.

# Conclusion

Want to run a git server on Windows? Don't bother, install GitLab, it takes about 10 minutes to be up and running with that in a VM.

The more I've been using GitLab the more I'm liking it, it's got a nifty little web UI, we can see the repository information, all that fun stuff that distracts you from actually doing work.


  [1]: http://mercurial.selenic.com
  [2]: http://git-scm.com/
  [3]: http://en.wikipedia.org/wiki/Team_Foundation_Server
  [4]: http://gittf.codeplex.com/
  [5]: http://mercurial.selenic.com/wiki/hgserve
  [6]: http://www.kernel.org/pub/software/scm/git/docs/git-daemon.html
  [7]: http://msysgit.github.com/
  [8]: http://en.wikipedia.org/wiki/Sneakernet
  [9]: http://www.cygwin.com/
  [10]: http://stackoverflow.com/questions/233421/hosting-git-repository-in-windows
  [11]: http://stackoverflow.com/questions/7104182/git-push-halts-on-writing-objects-100
  [12]: http://archlinux.org
  [13]: http://www.puppylinux.com
  [14]: http://www.turnkeylinux.org/gitlab
  [15]: http://windows.github.com/