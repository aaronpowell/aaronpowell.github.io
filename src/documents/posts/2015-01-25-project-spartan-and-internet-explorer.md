---
  title: "Microsoft's Project Spartan and speculating Internet Explorer's future"
  date: "2015-01-25"
  tags: 
    - "internet-explorer"
  description: "On the 21st of January Microsoft showed off their new browser code named Project Spartan, so let's have a look at what it's about."
---

_Before we dive in, I **don't** work for Microsoft but I am an Internet Explorer MVP and a member of the IE userAgent's, so what I'm discussing here is based on what is publicly available and my own speculations._

On the 21st January Microsoft had an event to show off what is coming next in their Windows 10 platform, the future of Windows and importantly for us Web Developers talked about Project Spartan which had previously been speculated about.

If you missed what's what with Spartan [go read the IE team's blog post](http://blogs.msdn.com/b/ie/archive/2015/01/22/project-spartan-and-the-windows-10-january-preview-build.aspx).

# What is Spartan?

The first logical question is what's Spartan all about? Basically what it is is Microsoft has taken their rendering engine (Trident) and JavaScript engine (Chakra) and produced a brand new browser chrome (the UI) for it (for the most part, there's a few more things I'll touch on shortly). Now the name Spartan is a code name so what it finally get's named is unclear, but what is clear is that it's unlikely to use the Internet Explorer brand. This is really quite interesting as [I've previously suggested the Internet Explorer brand can't survive](/posts/2013-01-17-should-internet-explorer-be-killed.html).

Also considering a new chrome is really exciting as the IE chrome that we're familiar with still has a lot of similarity with the first versions of IE. Starting this from scratch rather than continuing with the existing chrome gives a chance to rethink how users use the browser, which we saw with things like the lack of toolbars and Cortana integration.

# A browser by any other name

Trident and Chakra are very capable engines, if you look at some of the new features in the [Windows 10 Preview](http://blogs.msdn.com/b/ie/archive/2014/11/11/living-on-the-edge-our-next-step-in-interoperability.aspx) as well as looking at [status.modern.ie](http://status.modern.ie) for whats [shipped, in preview or in development](https://status.modern.ie/?iestatuses=indevelopment,iedev,implemented&browserstatuses=notsupported,indevelopment,implemented&browsers=chrome,firefox,opera,safari&ieversion=11) there's a lot the latest releases contain.

But what's interesting about Trident, or more specifically, how Trident ships, can be seen in the animation about half-way down the [IE team's blog post](http://blogs.msdn.com/b/ie/archive/2015/01/22/project-spartan-and-the-windows-10-january-preview-build.aspx). The core is `mshtml.dll` (which resides in `Windows\System32`) and on my Windows 8.1 machine contains the ability to run as IE11, IE10, IE9, IE8, IE7 and IE5.5. That's 6 different browsers IE can run at, or at least [attempt to emulate](http://sampsonblog.com/768/ie-doesnt-have-an-emulation-feature). I've been a developer for a while and I know I don't like dealing with code written the previous year (especially if it's my code) let alone dealing with code that is at least [14 years old](http://en.wikipedia.org/wiki/Internet_Explorer_5). Change something here and have side effects over there and the more legacy pathways you need to support the harder it gets.

But `mshtml.dll` is used for a lot of different things, like Outlook desktop. Kind of don't want to make big changes that impact that! And of course there's all those shitty enterprise applications that think Windows XP is the pinical of web development...

What's interesting about Spartan is that while `mshtml` is still there is isn't responsible for rendering websites, it's only responsible for intranet sites. Instead for public websites a new assembly, `edgehtml.dll` contains just the latest work from the IE teams without the overhead of multiple versions of flexbox, old vendor prefixes or a box model that was fixed years ago.

Also because the changes aren't in the (now) old rendering engine they can (in theory at least) be revised and released faster, hopefully getting us to the point where version numbers are no longer important, you build for the spec and only the spec.

# The future of IE?

Well then, we've got a new browser chrome and a forked browser engine, what does that mean for IE? IE will be around in Windows 10 from what we know but Spartan seems to be the default browser with IE being just another choice of browser on the platform. Whether IE continues beyond Windows 10 is something that I'm going to be watching with interest. After all there's still people out there making extensions for IE, ActiveX controls, etc, all of which are tied to the current chrome and `mshtml`.

Now let's move on to what they haven't talked about and start speculating.

# Plugins

Nothing was talked about plugins, during the demo they showed off things like inking support (which looks really useful), but not about writing 3rd-party extensions. A lot of people don't realise that creating extensions for IE [is possible](https://msdn.microsoft.com/en-us/library/aa753587.aspx), it's just not particularly nice. It's [been speculated](http://www.neowin.net/news/microsoft-spartan-chrome-extensions-targeted-for-native-support) that Chrome extensions will be supported in Spartan and I really hope that's the case, or at least they are highly interoperable, so we don't have a case of reinventing the wheel and allow us web developers to have a common platform for browser extensions.

# It'll be v1

While the rendering engine will be the latest from Trident, the UI is being done from sratch. Remember Firefox v1? Chrome v1? These weren't what they are today. To push out a new browser chrome, handle multi-loading of the rendering engines adding new features all of that stuff, there's only a finite amount of time. We can expect things to be _v1_. That's not to say that I expect it to be sub-standard or anything but I know I'll be [submitting feedback](http://uservoice.modenr.ie) to help direct the browsing experience. After all it's not every day you get a brand new browser chrome is it?

We already know F12's Dev Tools will be there which is all I really want!

# Conclusion

I'm really looking forward to this coming and trying Spartan out. We know it's not coming just yet in the Window's 10 builds, but really the chrome isn't what I'm interested in, it's the browser engine. That's already available in the IE builds on Windows 10 and [remoteIE](http://remote.modern.ie).

The future of the web looks good.
