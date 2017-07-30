---
  title: "ASP.NET WebForms Model-View-Presenter Contrib Project"
  metaTitle: "WebForms MVP Contrib"
  description: "An overview of WebForms MVP Contrib project"
  revised: "2010-05-30"
  date: "2010-04-12"
  tags: 
    - "asp.net"
    - "webforms-mvp"
    - "webforms-mvp-contrib"
  migrated: "true"
  urls: 
    - "/webforms-mvp-contrib"
  summary: "<a href=\"http://webformsmvp.com\" title=\"WebForms MVP\">ASP.NET WebForms MVP</a><br />\n<a href=\"http://webformsmvpcontrib.codeplex.com\" title=\"WebForms MVP Contrib\">ASP.NET WebForms MVP Contrib</a>"
---
## Overview ##

I'm a big fan of [ASP.NET WebForms Model-View-Presenter (MVP)][1] which is produced by [Tatham][2] [Oddie][3] and [Damien][4] [Edwards][5]. It's a really great way to achieve testable webforms development, along with doing good design with decoupled webforms design.

As an Umbraco developer you're somewhat limited with your options for testable development. You *can* use ASP.NET MVC, but it doesn't integrate quite the same way, it's not really possible drop them in as macros.

You could look at an isolation framework like [Typemock][6] to completely mock out the HttpContext and everything else, but then you're potentially creating too many fake expectations around how everything is going to work.

This is where WebForms MVP can come in, it's designed to fill this gap. I've used it on several Umbraco builds, and in fact I ran a webinar (screen cast [here][7]) and hopefully I'll be talking about it in a formal capacity at [CodeGarden10][8] this year.

I've been using MVP for WebForms for a number of years now, starting with home-grown frameworks so I was a bit familiar with what I liked with a framework. But because WebForms MVP is a *framework* it's not really meant to provide many out of the box components.

While driving to Canberra for Christmas 2009 I was thinking about how I was currently implementing WebForms MVP and realising that I was constantly writing the same set of views and presenters and though that others who are using this are probably doing the same thing. There's a number of things that seem very logical to need, such as validation, submit/ cancel eventing, etc. So I decided that it would be a great idea if theres common components were available.

So once I'd arrived at my destination I grabbed out my iPhone and started writing the initial concepts for what is now WebForms MVP Contrib.

## Why ##

As I stated the goal of this project was to give a bunch of defaults for people who are working with WebForms MVP. I also liked the extensibility of the project, the ability to change out the **PresenterBinder**, which is essentially the IoC container which is used internally of WebForms MVP. Now there's nothing wrong with the built in PresenterBinder, but *I like options*, so I set about producing a [Ninject][9] Binder, meaning that it's possible to use Ninject for all your IoC needs within WebForms MVP.

The other major goal was to make for more service-orientated presenters than the examples which are available as part of the source package. Service-orientated design is something we practice quite extensively at TheFARM and makes it very easy to abstract away data interactions from any business layer of your application. This in turn makes testing even easier.

## What's available ##

Although "full" documentation is available up on our [project codeplex page][10] (and I really should put it on the official site...) currently theres 2 available PresenterBinders, we support Ninject and StructureMap (thanks to [Lewis][11] [Benge][12]).

Additionally there's a handful of standard views, and view *extensions*, which are essentially interfaces which have some grouped functionality which is useful to implement in some instances.

Currently we're sitting at CTP6 as the [primary release][13], which uses the CTP6 release of WebForms MVP. With the recent check-in's to support StructureMap we'll be looking to do a CTP7 release to bring us in line with the current stable of WebForms MVP, but I'm more handing out for the exposure of the discovery strategy to see what funky stuff we can do with that.

## Helping out ##

As you can probably tell from the check-in's there hasn't been a lot from me recently on this project. It's by no means dead, but as I commit on several other projects as well my time can be spread pretty thin. If you have any ideas or any features you'd like to see please get in contact with me. You can find my contact information on the [About][14] page of this site, or additionally you can drop us a message on the codeplex site.


  [1]: http://webformsmvp.com
  [2]: http://blog.tatham.oddie.com.au/
  [3]: http://twitter.com/tathamoddie
  [4]: http://damianedwards.wordpress.com/
  [5]: http://twitter.com/DamianEdwards
  [6]: http://www.typemock.com
  [7]: http://vimeo.com/9438884
  [8]: http://codegarden10.com
  [9]: http://ninject.org/
  [10]: http://webformsmvpcontrib.codeplex.com/
  [11]: http://geekswithblogs.net/PointToShare/Default.aspx
  [12]: http://twitter.com/LewisBenge
  [13]: http://webformsmvpcontrib.codeplex.com/releases/view/40599
  [14]: /about
