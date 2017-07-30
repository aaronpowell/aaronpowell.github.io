---
  title: "The danger of the 'Just Use WebKit' mindset"
  date: "2015-01-25"
  tags: 
    - "web"
    - "browsers"
    - "internet-explorer"
  description: "Just use WebKit seems to be a common belief in web developers, but there's a danger involved in that mindset."
---

[![Sigh...](/get/just-use-webkit.png)](https://twitter.com/IanCeicys/status/559353740160167938)

_Sigh_

As a web developer working in the Microsoft space I hear this statement **a lot**. Go check out the [IE UserVoice](http://uservoice.modern.ie) and you'll find [this](https://wpdev.uservoice.com/forums/257854-internet-explorer-platform/suggestions/6509416-use-blink-or-other-open-rendering-engine-and-sta).

I want to talk about why this mindset of "just use WebKit" is a dangerous one.

# Chrome isn't WebKit

When a lot of people say this to me most of the time they are actually saying that they'd prefer IE to be Chrome. It's somewhat strange that so many web developers seem to have forgotten that [Chromium forked WebKit and made Blink](http://blog.chromium.org/2013/04/blink-rendering-engine-for-chromium.html) nearly 2 years ago. Blink just still uses the `-webkit` vendor prefix rather than creating their own because it turns out that web developers are pretty lazy with vendor prefixes, so much so Microsoft [supports `-webkit`](http://blogs.msdn.com/b/ie/archive/2014/07/31/the-mobile-web-should-just-work-for-everyone.aspx).

## Chrome's not WebKit, who is?

Right, if Chrome isn't WebKit then when you're using WebKit you must be using Safari right? Well... close but not quite. [Paul Irish](http://www.paulirish.com/) has a good write up [about the breakdown of WebKit](http://www.paulirish.com/2013/webkit-for-developers/). It's a bit old, pre-Chromium's fork, but a lot of it holds true still, most browsers still swap out parts and let's not forget that Safari's work is done in private before being pushed downstream to the OSS project, or at least that's the expectation.

*Editor note: Just to clarify Safari isn't WebKit, Safari is just a port of WebKit (see the link above). Apple (who produces Safari) is one of the primary contributors to WebKit, but that's not to say that everything in Safari is in WebKit, Safari uses a different JavaScript engine for example, nor is everything in WebKit in Safari. What I meant be 'Safari's work is done in private' is about Safair the browser, when features are included, etc, not that WebKit is developed in private by Apple.*

Alright, maybe I'm getting hung up on WebKit specifically, let's get back to the common point "be Chrome".

# The browser monoculture

As a web developer this is one of the most scary concepts, having a browser monoculture. I've been working in the web industry for 10 years, so I came in on the tail of the browser wars, just as IE6 had become the winner. I remember developing for Netscape but it was already becoming a rarity, we had entered an era of monoculture and the only browser was IE6.

In this era the web stagnated, there was no innovation going on, there was no incentive for innovation because after all there was no competition.

**I don't want to see this happening again.**

The belief that one browser engine is superior to another is a very subjective belief, for example check out the current ES6 compatibility table (sorted by number of features):

[![ES6 support](/get/es6-compatibility.png)](http://kangax.github.io/compat-table/es6/)

Currently IE vNext (which will be the core of Project Spartan) and Firefox 37 (currently nightly) are on par with Chrome 41 lacking a bit (although Chrome 42 which is the latest Canary has 52% coverage). Dropping Chakra for v8 would be a bit of a backwards step in terms of ES6 support wouldn't it?

Similarly Can I Use can produce a [good comparison](http://caniuse.com/#compare=ie%2B11%2Cie%2BTP%2Cfirefox%2B35%2Cfirefox%2B38%2Cchrome%2B40%2Cchrome%2B43%2Csafari%2B8) between the browsers on a broader feature set.

What we can see is that different browsers implement different features at different rates, and this leads to innovation. Browser A implements something, gets feedback on the implementation, other browsers implement it, problems are found, fixed, redesigned, rinse and repeat.

In fact [this is how standards happen](http://www.w3.org/2014/Process-20140801/).

In a monoculture an implementation is done and that's all there is. We still see this happening in the web platform today, [touch events are a great example](https://docs.google.com/document/d/12k_LL_Ot9GjF8zGWP9eI_3IMbSizD72susba0frg44Y/edit#). Now imagine that lack of design with everything driving the web. We'd end up with people doing crazy things like the [`<blink>` element](http://en.wikipedia.org/wiki/Blink_element), [VBScript instead of JavaScript](https://msdn.microsoft.com/en-us/library/3945y0f9.aspx) or [plenty of other whacky things](http://en.wikipedia.org/wiki/Comparison_of_layout_engines_(non-standard_HTML)).

# Conclusion

The trend of web developers thinking that there should be only a single browser engine is a dangerous one, we saw what happened after the last browser war.

Competition is an important part of any industry and the web is no different. Trident as it was in 2007 is very different to the Trident of 2014 and we know that [Spartan brings changes](/posts/2015-01-25-project-spartan-and-internet-explorer.html) to put the legacy in places that are even harder to get to, and this is thanks to competition.

So don't be narrow minded, understand how the web platform works and why multiple players are the only way we'll continue to evolve the web in the way we want it to.
