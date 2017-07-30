+++
title = "Site Rebuild"
date = 2017-07-27T07:18:34+10:00
description = ""
draft = false
tags = ["website"]
+++

Well it's finally happened, I've finally listened to the advice I've quite often received from readers that my website layout isn't great, the code examples are hard to read and it generally wasn't great.

On top of the feedback I often received about my site just working on it has been a pain, which is one of the main reasons why I haven't been blogging much over the past 6 months (although I have a lot of backed up content). This was mainly due to the pain that DocPad caused when trying to install locally (my god, the dependencies!), the time it took to regenerate the site on each publish (seriously, 5+ minutes every time) and just the general cumbersome nature of it.

So while being away on a skiing holiday with the family and having some down time in the evening where I was sitting by the fire drinking a beer I decided it was time to rebuild it from scratch. This time I've used a proper static site generator called [Hugo](https://gohugo.io) combined with a slightly overridden theme [Osprey](https://themes.gohugo.io/osprey/).

The result of this is a site that I can build a lot easier, I can publish simply to Azure AppServices and writing in it is simpler. The one downside is that I've probably broken a lot of my old deep linking/referrers. I've done my best to keep the URL structure the same, but I use to have **a lot** of custom redirects in place that are no longer there (maybe I'll add them back in the future, we'll see). I've still got a couple of tweaks to do but overall I'm much happier and should finally get back to my blogging.