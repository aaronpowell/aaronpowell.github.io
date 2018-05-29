---
  title: "KnockoutJS plugin for Glimpse"
  metaTitle: "KnockoutJS plugin for Glimpse"
  description: "A new release of a KnockoutJS plugin for Glimpse"
  revised: "2013-03-25"
  date: "2013-03-25"
  tags: 
    - "knockoutjs"
    - "glimpse"
  migrated: "true"
  urls: 
    - "/glimpse/knockoutjs"
  summary: ""
---
When I was recently in Seattle for MVP Summit I was hanging out with [Anthony van der Hoorn](http://twitter.com/anthony_vdh) and [Nik Molnar](http://twitter.com/nikmd23) of the [Glimpse](http://getglimpse.com) fame. Anthony, knowing my passion for JavaScript has been bouncing ideas around the client-side code for Glimpse for a while and wanting me to have a crack at building a client-side plugin for them. Well it seemed like the perfect time to get to it and not just because I had both the guys on hand to bug when things went wrong ;).

Having decided to write a plugin I next had to work out what the plugin would be for and I settled on [KnockoutJS](http://knockoutjs.com). While I'll admit that I've had a [love-hate relationship with Knockout](https://www.aaron-powell.com/tagged/knockoutjs) the problem space it's in is very real and it does solve it very well, but when you have Knockout on a page it can be very difficult to work out where you're actually using it and what's actually happening in it.

To that end I've started a [Glimpse KnockoutJS](http://nuget.org/packages/glimpse-knockout) plugin. It's still in its early days (and I'd love feedback *hint hint*) but so far what it aims to do is:

* Show you what ViewModels are on a page and what DOM element(s) they are bound to
 * The idea here is that you can see if a ViewModel is reused across multiple DOM elements
* Capture new ViewModels being added to the page and show them in the plugin
 * This can be handy if you're creating ViewModels in popups or from Ajax requests
* Show you the properties of the ViewModels, and if they are observable properties track their changes
 * This should work for any kind of observable, be it a simple observable, an observable array or a computed observable

Like I said this is a very early release, but it's more I wanted it out there and to get feedback ASAP to work out what to focus on. I've only done some basic testing so if you're using it on large Knockout VM's I'd like to hear how it goes.

The code is all [up on GitHub](https://github.com/aaronpowell/glimpse-knockout) so feel free to send PR's or raise issues so I can get to work on it!

