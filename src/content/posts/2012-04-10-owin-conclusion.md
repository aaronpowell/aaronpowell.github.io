---
  title: "OWIN series conclusion"
  metaTitle: "OWIN series conclusion"
  description: "Wrapping up the OWIN series"
  revised: "2012-04-10"
  date: "2012-04-10"
  tags: 
    - "owin"
    - "web"
  migrated: "true"
  urls: 
    - "/web/owin-conclusion"
  summary: ""
---
Over the last few weeks I've done a small series of blog posts looking at the [Open Web Interface for .NET, aka OWIN](http://owin.org/).

The series was made up of:

* [A Hello World introduction](https://www.aaron-powell.com/web/hello-owin)
* [Introducing middleware](https://www.aaron-powell.com/web/owin-and-middleware)
* [Routing](https://www.aaron-powell.com/web/owin-routing)
* [Responses](https://www.aaron-powell.com/web/owin-responses)
* View Engines in both [simple](https://www.aaron-powell.com/web/owin-view-engines) and [advanced](https://www.aaron-powell.com/web/owin-view-engines-part-2) forms
* A [github](https://github.com/aaronpowell/Owin.HelloWorld) repository with all the code

I started look at OWIN after bitching at [Damian Edwards](https://twitter.com/#!/damianedwards) over the poor documentation and he told me to stop bitching and work it out. So I did and while doing it I though I'd do my best to contribute back so that others have a better starting point.

## Major take away points

I had a lot of fun playing with OWIN but most importantly I think I've learnt a thing or two and here are my major take away points from the last few weeks:

**Learn your web stack.** This is something that I found really important; while WebForms is a very high level abstraction on the web MVC has really changed that, it's quite close to the wire. But even then it's sometimes not close enough. I've worked on projects where we've had to work around the gates put up by MVC to protect developers from doing something really stupid so sometimes you want something else. I can see where OWIN would fit in there, especially if you combine it with something like Nancyfx you can still get all the ASP.Net powers but also skip around it when required.

**Middleware is your friend.** Sure I'd [done it before](https://www.aaron-powell.com/ole) when it comes to middleware but I've always been interested as to how you'd approach it in .NET. JavaScript is a very nice language especially when it comes to functional-esq programming so being able to try a similar idea in .NET and compare the experience was interesting. Generics and delegates can be a **bitch** in .NET, but it's generally a problem you wont have to face.

**You don't need everything up front.** While it may seems very convenient that I had a series of blogs that expanded on the ideas of the ones before it that was initially an accident. I started with the intention of just doing the first post but as I wrote the code our I could see it evolving. I didn't even think about a View Engine until I'd already exhausted the routes and response sections, both of which somewhat relied upon an understanding of middleware. You can easily cut out sections of the series of you don't need an application that has a View Engine (say a RESTful service). Modularity is power, it's something that the Node.js and Ruby guys have known for a long time but projects like OWIN as making it more accessible in .NET.

## Wrapping up

Hopefully you've enjoyed the journey too and learnt a thing or two along the way. This series has been by no means an extensive dive into all parts OWIN, I'll freely admit there's things I ignored as I didn't think them interesting enough (like how do you serve out statics like CSS and JavaScript?) and there's other things that I didn't even work out (like how Firefly works!). My goal was to give anyone who wants to play with OWIN a starting location and I think I've done that.