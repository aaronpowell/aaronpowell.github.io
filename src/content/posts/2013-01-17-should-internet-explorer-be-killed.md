---
  title: "Should Internet Explorer be killed?"
  metaTitle: "Should Internet Explorer be killed?"
  description: "Is it time for the IE brand to end-of-life?"
  revised: "2013-01-17"
  date: "2013-01-17"
  tags: 
    - "internet-explorer"
    - "opinionated"
  migrated: "true"
  urls: 
    - "/should-internet-explorer-be-killed"
  summary: ""
---
# Warning - Opinions

In my [last post](https://www.aaron-powell.com/web-dev/ie10-console-thoughts) I explored some of the issues I have with the IE developer tools that basically prevents me from using IE as a primary browser for web development.

While writing that post it got me thinking about how _I_ would go about solving those problems if I was in charge of the project.

And yes, I am an IE MVP but from my perspective an important role of an MVP is to ask the hard questions and not just be another [Yes Man](http://en.wikipedia.org/wiki/Sycophancy), how do I think the IE team will react to this post? Well if I stop blogging and [tweeting](http://twitter.com/slace) send help :P.

## Defining IE

First off I want to define what I mean when I'm talking about Internet Explorer is the browser "shell" that you see. It's what you get when you click the blue E. What it is **not** is Trident or Chakra, which are the rendering engine and JavaScript engine respectively. While these are core components that make up IE they are not where I think the problem lies.

## Serving two masters

So the main problem I see with IE is that it is trying to serve two masters, you have the personal computing user who uses IE. This is your parents, your grandparents, your next door neighbor, the person with a Surface RT. Generally speaking these are the people who are surfing the internet for personal reasons. These people don't care about legacy stuff, they don't care that your internal time scheduling application only works in IE6 running quirks mode. They just know that they are wanting to go to a page and it works.

And then you have enterprise. Like it or not IE in the enterprise is really popular for a few reasons. There's the obvious "it never got updated" reason which is why IE6 inside of big companies is still popular. But more than that IE from a sys admin point of view can be _really_ stripped down. You can change some crazy things in the registry to restrict users (like [disabling the developer tools](http://stackoverflow.com/questions/944323/disable-internet-explorer-8-developer-tools)). A lot of sys admins like this as it helps create a controlled environment, a "more secure" environment *cough cough*.

## The web developer

Then there's the web developer. They are people like you and me who want to build applications that make use of the latest technologies, web sockets, webgl, offline, CSS3 animations, etc. We don't give a damn about legacy browsers, that's not be our target market, we just want browsers to be pushing forward and implementing these emerging standards rather than waiting until they are approved by W3C which can take a very long time.

## IE est mort, vive IE!

Now to the crux of this post, the death of Internet Explorer. As I see it you have two real audiences of IE, the people who want it to _just work_ and the people who want it controlled. These are two _very_ distinct groups and the latter impacts the former.

The biggest problem that IE faces when trying to go to a faster release cycle is stability. What a lot of people don't realise about IE is just how embedded in the OS the parts (Trident in particular) are. Trident, or MSHTML.dll, is really heavily used within Windows itself to do different things. Take the help system, it actually runs a web control which displays the content. This web control is powered by Trident. It's also why you can't have multiple IE versions installed at the same time, the assemblies would clash.

And then you have Windows 8 which we see an even greater level of embedding of Trident and Chakra than before so they can power the HTML/JavaScript Windows 8 applications. While this isn't running IE it's running the same MSHTML.dll and other components.

So adopting a Chrome "release every other day" model would be a really risky venture, you need to be making sure that the releases don't suddenly break anything (remember [SharedView](http://en.wikipedia.org/wiki/Microsoft_SharedView)? It stopped working when you installed IE9...).

At the same time tying IE feature releases to major versions in the way it's been done recently it equally risky. Sure IE has improved its release schedule over the past few years, but there was still ~18 months between RTM of IE9 and RTM of IE10 (and that was only IE10 for Windows 8, Windows 7 is still in preview). Even though there are preview releases in this time, calling something a preview actively discourages its use day-to-day (and often the preview release was lacking important features). Also think about how the web changed over that time period, WebSQL was the offline storage proposed. It was then scrapped for IndexedDB (which itself changed in spec several times [causing breaks](https://www.aaron-powell.com/indexeddb-changed-ie10pp6), imagine if an RTM had been released not a preview then). CSS animations went through a good amount of change with what arguments could get passed to the different transforms. This like this can be hard to react with a slow release cycle.

Then there's the backwards compatibility story. I think it's quite amusing that there's ways you can [force IE to run as a specific version](http://msdn.microsoft.com/en-us/library/jj676915(v=vs.85).aspx) or that [removing conditional comments](http://blogs.msdn.com/b/ie/archive/2011/07/06/html5-parsing-in-ie10.aspx) had people really upset. Radical changes just aren't possible in a brand with as much history as IE has.

And finally, while they say that any press is good press IE has copped _a lot_ of negative press in recent years. Even Microsoft is actively trying to [embrace the hate](http://browseryoulovedtohate.com/) they receive, most notably [through this video](http://browseryoulovedtohate.com/post/36807433541/do-you-know-this-guy). But all of this is too late in my opinion, the damage is done.

And this is why I think IE can't survive.

## From the ashes

As I've said I think Trident and Chakra are **great** engines, and from this we could get a new direction. Essentially what I want to see is a fork of the IE project, an entirely new browser using the same underlying rendering and JavaScript engine, it's just in a new outfit. Let's call this mythical browser John (bah, [naming things is hard](http://martinfowler.com/bliki/TwoHardThings.html) and we can't go with [Bob](http://en.wikipedia.org/wiki/Microsoft_Bob) again can we...).

So you go and install John, it installs into Program Files just like any other stand-alone piece of software and has everything it needs kept in there. John has a new UI shell so we can start revisiting things which [really need an overhaul](https://www.aaron-powell.com/web-dev/ie10-console-thoughts), but most importantly John can be updated without it impacting the core components of Windows which rely on HTML/JavaScript engines, particularly on Windows 8. John is a new take on how you would build a browser using the lessons learn in the [last 12 years](http://en.wikipedia.org/wiki/Internet_Explorer_1) so it **can** be more agile and it **can** have new experimental features added behind flags.

## So that's it, no more IE?

Completely end of life-ing a product that has such a long rich heritage that IE has is not exactly a realistic proposal. Instead I think that IE would live on in the manner which it is currently doing. IE maintains its current release cycle, 12 - 18 months between "major versions" which sees the addition of new features and the removal of old ones. But instead of being the driver of Microsoft's web platform it becomes a consumer, a consumer of features introduced into John that are then accepted as stable, are tested for impacts to the whole Windows ecosystem, have registry settings to disable them, and so forth.

This means people are able to keep with a brand they have known for over a decade, it's predictable to them and it just works but at the same time Microsoft is freed from the limitations of having a 12+ year legacy behind them with the pros and cons that brings to the table.

## The fractured web

Chances are you're reading this and thinking "doesn't this just fracture the browser market even more?". The answer is "to a point yes", but realistically it's not that much different to the fracturing that we already have. The two main browser vendors besides Microsoft both have "bleeding edge" versions, Firefox has [Aurora](http://www.mozilla.org/en-US/firefox/aurora/) and Chrome has [Canary](https://www.google.com/intl/en/chrome/browser/canary.html) and essentially what I'm proposing is a Microsoft version of that, just under a new brand name.

As we're losing OldIE from the supported stack of our browsers we're finding the idea of a fractured web to be less and less relevant. When targeting IE10, Firefox stable and Chrome stable it's not particularly hard to get things looking the same and working the same. The only times it really become noticeable is when you're doing some really whacky edge-case stuff and this is something that is only solvable by getting to a single browser, and that didn't work out so well last time.

It's not a perfect solution, but it does lessen the attitude of "modern browsers... and IE" that I commonly hear at user groups (despite IE10 trumping other browsers in some areas).

# Conclusion

I think the role of IE on the Windows platform needs to change. IE needs to be released from the shackles of Windows integration in the way it has been.

Unfortunately I can't see this happening while still maintaining an IE branding. The only alternative is the John approach, an entirely new browser, using the same stack, that can act as a conduit to IE and taking on the other browsers in the fast-evolving web that is today.
