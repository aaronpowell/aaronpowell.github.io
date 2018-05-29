---
  title: "I helped kill Umbraco 5"
  metaTitle: "I helped kill Umbraco 5"
  description: "Hi, my name's Aaron Powell and I was involved in killing Umbraco 5."
  revised: "2012-06-27"
  date: "2012-06-25"
  tags: 
    - "umbraco"
    - "umbraco-5"
    - "opinionated"
  migrated: "true"
  urls: 
    - "/umbraco/i-helped-kill-umbraco-5"
  summary: ""
---
Hi, my name's Aaron Powell and I was involved in killing Umbraco 5.
 
# Background
 
If you're new to this blog you may not have heard of my before so here's a bit of background. I've been involved with Umbraco for about 4 years now. I originally joined the project to create LINQ to Umbraco, a somewhat ill-fated experiment into Code First development. I've presented at every CodeGarden since my first one in 2009 on a range of topics from LINQ to Umbraco to unit testing Umbraco and  this year on Signalr and RavenDB.

I was also involved in some of the initial design and development of Umbraco 5 and worked with Shannon (mostly) as a sounding board when he needed to bounce ideas off someone while working on Umbraco 5.

But late last year I announced that I was [leaving the project](https://www.aaron-powell.com/umbraco/so-long-and-thanks-for-all-the-fish) and it was bred out of frustrations towards  the direction Umbraco 5 was going and the role that someone like myself, an outsider to the HQ, could maintain on the project. Ultimately I didn't believe I could contribute in the way I saw as useful to so it was decided that I would leave the project.

Even after leaving the project I still stayed in contact with many of the people on it, I had a lot of respect for Niels, Shannon, Matt, etc and they are all people I consider friends who I'd often chat with on Skype or various other mediums. I then decided to build a commercial extension for Umbraco 5 as a way to provide feedback on the way the project was shaping up (and to make some money on the side :P).

# Returning to Umbraco

A few months ago Niels contacted me with a proposition, I come to CodeGarden 12 and the retreat before hand to help work through the issues that the HQ was having with Umbraco 5 and the issues I had which caused me to leave in the first place. I was quite taken aback by this, I'd done a bit of venting on twitter while building my commercial package and I hadn't thought that I'd consider going back to CodeGarden. But after a few discussions I believed that I could do something useful for the tens of thousands of Umbraco users out there by bringing my voice to the table.

But it was clear that just because I was coming to "kick up a storm" didn't mean that I would return to the project in the manner I previously had been involved.

# The retreat

First off I'm happy to say at this retreat no one saw my naked ass and I think everyone who attended was grateful for that.

Secondly this year we had a good mixed bag of people at the retreat, there was everyone from HQ employees to contributors to package developers to site builders and people just passionate about open source and we all were involved in various discussions.

## What is Umbraco?

One of the discussions I was involved in was (from my point of view) really important in helping define where Umbraco would go in the future, we had a discussion about what *is* Umbraco? While you might think that this is an easy question to answer "It's a CMS" but that's really only a small part of the picture. Here's some of the learnings which came out of this discussion:

* Umbraco is a piece of software
 * Yes this is a logical conclusion, Umbraco is a project that is released as Open Source that allows you to run a CMS. But most importantly is it's a simple piece of software. Unlike many other CMS's available you don't have mark-up generated for you, someone said Umbraco respects the web in this manner, it gives you freedom to do that crazy design that your designer has come up with. Also through it's simplicity it becomes really powerful, you can build anything from a 5 page brochureware site to a thousand view per second site because there's so many extensibility points available for different kinds of developers while still regaining some level of control
* Umbraco is community
 * This may sound a bit wanky at first, a bit like marketing fluff but having been involved with Umbraco for so long I am still always amazed at just how passionate the people who use it are, and just how willing Umbraco users are to help other Umbraco users. [Doug Robar](https://twitter.com/#!/drobar) made a point about this, that when it's late at night for him and he's stuck with a project there's always someone around that he can ping for advice even if they are on the other side of the world; no matter what time of day it is there always seems to be someone around willing to help out
* Umbraco is the packages
 * Niels touched on this in the keynote this year but when people thing Umbraco they also thing things like uComponents and DAMP, these kinds of things are almost invaluable to the Umbraco developer and without them we'd waste a lot of time doing the boring stuff over and over again
 
 So really Umbraco is a sum of its parts, without these three aspects it wouldn't be the same, we wouldn't get behind it in the way that can have 380 people attend a conference. Then when we turned this learnings at Umbraco 5 we could see we didn't have the same things there which is why it never really *felt* like Umbraco.
 
## What's awesome about v5
 
Another discussion I was involved in (yes I'm aware that I keep saying things like *"Discussions I was involved with"* as though I was a critical factor in them, that's not the case, we had plenty of other discussions going on which were equally as important I just wasn't in them so can't talk about them :P) was looking at what made v5 such a good project (this was also an open space topic from CG12 coincidently!) and the more we looked at it the more we started to see that the things that made v5 compelling were really just approaching v4 concepts with 8 years of learning, things like:

* Property editors can save multiple values natively
* Trees/ applications/ macros and templates reside on disk
* Simple back-office sections
* There's a defined structure to where packages reside

Really what we were seeing is that most people didn't care that the underlying systems could be swapped from nHibernate to something else, or that there was this really cool new unit-of-work concept, people spend their time configuring and extending the back office and the 1% of times that they really need to scale across multiple virtual servers on the cloud Umbraco may not even be the best fit for the project.

## The community needed a better voice

While the community has had [Our](http://our.umbraco.org) for a few years now it has always been focused on the *user* community, how do I solve problems *with* Umbraco but it was never very good when it came to solving the problems *in* Umbraco. This topic was more born out of discussions with various people and not a structured discussion but ultimately contributors, HQ and implementers alike wanted a way to discuss the direction of Umbraco itself, people have businesses built around it so when changes happen that they don't understand (the what or the why) it can be a nervous time.

Some of this is what happened throughout the v5 development process, decisions were made that the community felt they didn't have a say in, that they assumed was for the best but they didn't really know; ultimately they felt out of control. To this end we decided to set up the [Umbraco-dev mailing list](https://www.aaron-powell.com/umbraco/introducing-umbraco-contributor-list) so that the community has somewhere they can raise concerns directly to the people developing the product.

# The downfall of v5

Hopefully you've started to see the picture I've been painting. There were many other discussions but I think these three really highlight how the decision was reached. Umbraco is a cool piece of software but without the community involved in it to them it was an unknown. There was lots of cool things in v5 but generally speaking they were evolutions on what people use day-to-day and as cool as other parts of v5 might have been it didn't really bothered most people as it didn't impact their average Umbraco project.

So we started to think about **how to rectify this** and **we discussed this more than anything**. We looked at could we remove parts of v5 to make it simpler, to make it more enticing to your average Umbraco user. We looked at how to get more people involved in the processes, take the project back from being a HQ-owned initiative and get more community members involved. Many angles were looked at what would be needed to ensure v5's success, and believe me I very much pushed for this having a vested commercial interest in this. But the more we looked the more we began realise that forcing v5 to go on *wouldn't* be in the best interest of everyone no matter how hard we tried.

In the end there was only a single decision that sat just right, **Umbraco 5 would be discontinued**.

# Along came CodeGarden

I can tell you that the lead up to the keynote this year was the most surreal experience I've had in a long time. We knew what was going to be announced but we had no idea how it would be taken by the community. CG12 had been touted as a v5 conference so on a scale of 1 to murderous just what was the crowed going to be like after the announcement? I applaud Niels for how he handled it, I can't imagine it's easy being up in front of that many people and delivering the news that Umbraco 5 was to be discontinued (if you haven't yet I recommend watching the [keynote](http://umbraco.com/follow-us/blog-archive/2012/6/13/cg12-keynote-video.aspx)) and I was standing with some of the HQ and retreat guys just waiting for the angry mob.

**But it never came.**

While I'm **not** saying that it was all sunshine and rainbows, there are people who are really annoyed at the decision, there are people who wont ever use Umbraco again, but having been at CodeGarden, in the room with the other 380 attendees I can tell you that without a doubt by the end of day one the mood was positive, the weird tension during registration and before the keynote was gone and people honestly seemed happy with the decision, there was a sense of relief in the room.

# Conclusion

As I said at the start my name is Aaron Powell and I was involved with killing Umbraco 5. I know that there are people mad out there about the decision but I also know that for every angry person there's a dozen happy people and that was why I came back this year to be involved with a project that makes people happy. I don't deny that the next few months will be rough while the v4 project "restarts" but I'm excited to be apart of it again.

I hope that this story has given you another insight on just how the decision came to be because the more open everyone is about this the better people can understand the reasoning behind it.