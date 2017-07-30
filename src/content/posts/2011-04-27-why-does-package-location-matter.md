---
  title: "Why do you care where your packages are?"
  metaTitle: "Why do you care where your packages are?"
  description: "Warning - the following is an opinionated piece and based on my experience. It doesn't reflect that of any of my employers or of any sane human beings"
  revised: "2011-04-28"
  date: "2011-04-27"
  tags: 
    - "nuget"
  migrated: "true"
  urls: 
    - "/nuget/why-does-package-location-matter"
  summary: "Warning - the following is an opinionated piece and based on my experience. It doesn't reflect that of any of my employers or of any sane human beings"
---
As a consultant I've had an opportunity to see the way different project manage their external dependencies, and being an active member of in open source projects has given me a good view on this as well. From all this I've noticed an interesting trend, **there's no agreed standard for where to put external dependencies**.

At previous companies I've worked with structures like a folder above the solution root called `lib`, a `dll` folder at the root of the solution or a common folder on the file system which every project gets its assemblies from.

Open source projects are much better, [FunnelWeb][1] has both a `lib` folder (above solution root) and the NuGet `packages` folder, [WebForms MVP][2] has a `Dependencies` folder and a NuGet one, where as [Umbraco][3] 4.7 has a `foreign dlls` (at solution root) and Umbraco 5 has `Resources/References` above the solution root.

So as you can see there's not a lot of commonality between projects, and the more projects you sample the more you'll see this trend; some overlap by generally speaking each project has its own flavor. Even Umbraco doesn't keep it consistent between the two versions (yes this can be argued with the legacy nature of 4.x but it's a bit of a weak excuse, they are *drastically* different).

## A look at other communities

Over the last few months I've been playing around with both Ruby and Node.js and one of the first things you'll notice when working with these technologies is that this *confusion* doesn't exist.

It wasn't until a few months after I started with these technologies that I actually learnt where external dependencies actually exist on your computer, and there's a really good reason for that.

Take Ruby for example, Ruby has had the `gem` tool for a long time and you use `gem` to download an open source library and include it into your project. Say I want to build a site using [Sinatra][4], I run:

    gem install sinatra

Now I have Sinatra on my machine (assuming I didn't previously) and I can include it into my project. If I throw my project up on [GitHub][5] and someone else grabs it they can install the gems I required themselves (or not if they already have them). And if I'm a really proactive developer I can create a Gemfile file and they can use `bundler` to install all the gems I specified. But where these gems *install* to is not important, in fact you're encouraged to not care by the fact that there is no feedback regarding that in `gem install` process.

Noe.js has a similar story using `npm`, and it works in a similar manner, you install packages but dont' concern yourself as to where they actually go on disk.

## Then there was NuGet

So what we've seen with Ruby and Node.js is that the focus around a package management tool really helps getting around the problem of where to put your dependencies. As is often the case .NET is late to the party, but now it's here with its shiny new tool, [NuGet][6].

When you work with NuGet you find that it has a very gem-like feel to it, when you install a NuGet package it doesn't tell you where the file(s) end up on disk, *they just end up somewhere*. Well it turns out that it's not very hard to work out where they were, they reside in a `packages` folder existing at the level of the solution. This is not quite as nice as the global gem or npm, it's still including them in the scope of a particular project, but to an extent you can see why it is this way, the Visual Studio tools probably needed an easy way in which they can find somewhere that is scoped to the solution.

Fantastic, with NuGet we've now got one less thing that'll be different between .NET projects (there's still coding standard, project naming, etc to deal with :P), right... right? Well apparently not. While having a browse around the NuGet issue list I noticed that the top-voted NuGet issue is on this topic, [that the package location should be customizable][7].

This smacks of developers thinking that they don't like change. That they have always done something some way and that it should always be done that way. Don't get me wrong, I'm not saying that the NuGet `packages` folder is perfect and that we should just blindly follow it, I'm just saying that **it doesn't matter**, it can be in a folder at the root of the solution, in a folder in a users Documents folder or hard-coded into the Windows directory, it shouldn't matter.

## Conclusion

.NET developers often get hung up on *doing it their way* and not being willing to change. One such hang up is the location of external references, but it shouldn't matter, let the package manager dictate it for you and have one less standard that you are maintaining for yourself.

  [1]: http://www.funnelweblog.com
  [2]: http://webformmvp.com
  [3]: http://umbraco.codeplex.com
  [4]: http://sinatrarb.com
  [5]: http://github.com
  [6]: http://nuget.org
  [7]: http://nuget.codeplex.com/workitem/215