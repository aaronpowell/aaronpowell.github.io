---
  title: "Unit Testing with Umbraco"
  metaTitle: "Unit Testing with Umbraco"
  description: "A wrap up from my talk on doing unit tested ASP.NET with Umbraco"
  revised: "2011-01-20"
  date: "2010-06-29"
  tags: 
    - "umbraco"
    - "asp.net"
    - "unit-testing"
    - "webformsmvp"
  migrated: "true"
  urls: 
    - "/unit-testing-with-umbraco"
  summary: ""
---
At [CodeGarden 10][1] I did a presentation on Unit Testing with Umbraco which was primarily looking at doing Unit Testing with ASP.NET and then have you can take those principles into doing development with Umbraco.

Unfortunately the session ran way over time, but we have a good open space the following morning to look deeper into the stuff I didn't have a chance to cover.

The crux of my session was around using [ASP.NET WebForms MVP][2] which I've doing [articles on in the past][3], including how to do presenters in F# :P.

##Unit Testing with Umbraco

When doing unit testing with Umbraco there's a few things you need to take into account:

 - Reliance on the HttpContext
 - Static methods

Because of these things it's quite hard to stub out a type which is reliant on static methods it's quite a tricky thing, you really need to use some kind of an isolation framework like [Typemock][4]. And if you're relying on the HttpContext then you need to either spin up Cassini/ IIS, or try and mock it out.

NodeFactory is a tricky beast, it expects the XML cache, so if you don't have it where it thinks it should be, then it's not going to make your life easy.

###Looking into Snapshot

In the past I've blogged via my work blog, [FarmCode.org][5], we're working on a new product called [Snapshot][6] which is designed to push out a plain ASP.NET website with no Umbraco reliances at all. During CodeGarden 10 we decided to release part of Snapshot for free, the CMS API, which is designed to abstract away the Umbraco aspect and gives you the ability to do unit testing.

Snapshot exposes most of what can be done with NodeFactory, Media and `umbraco.library`, but does so via interfaces. This means that they can be stubbed out and used for testing.

##Working with ASP.NET WebForms MVP

So I wasn't just using the standard ASP.NET WebForms MVP install, I was also using the Contrib project which I contribute on. I was using this for the [Autofac][7] integration, as I wanted to be able to dependency inject more than just the view.

##Resources from the presentation

Here's what you'll need from my presentation to be able to dig into it yourself:

- [Slide Deck][8]
- [Source Code][9]
- [Video][10]

Hopefully this gives you a good start for doing unit testing your own Umbraco development.


  [1]: /codegarden-10
  [2]: http://webformsmvp.com
  [3]: /webforms-mvp
  [4]: http://www.typemock.com
  [5]: http://farmcode.org
  [6]: http://farmcode.org/page/Snapshot.aspx
  [7]: http://code.google.com/p/autofac
  [8]: /get/umbraco/cg10/UnitTestableUmbraco-Slides.zip
  [9]: /get/umbraco/cg10/CodeGarden10.zip
  [10]: /unit-testing-with-umbraco/video