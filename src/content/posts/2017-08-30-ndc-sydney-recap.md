+++
title = "NDC Sydney Recap"
date = 2017-08-30T11:46:02+10:00
description = ""
draft = false
tags = ["ndc", "ndc-sydney", "conference"]
+++

In August this year I was lucky enough to speak at NDC Sydney for the 2nd time,
this year I use the material from my [redux series](/tags/redux) for one talk
and did a second talk about getting started with Docker (which I'll write about separately).

But this isn't a post about _my_ talks, instead I walk to talk about some of the
things that I learnt at NDC. I tried to get to a variety of talks, some directly
relate to what I do day-to-day, some less so.

# Web vNext

Logically I went to a few web talks, they are obviously very related to my
area of expertise and passion, so I jumped into the two sessions from
[Patrick Kettner](https://twitter.com/patrickkettner), one on Service Workers
and one on progressive web applications (or more accurately, doing progressive
enhancements in web applications).

## Service Workers

Service Workers interest me as a technology, I've always been looking at ways
that we can do offline-first applications (see my
[Flight Mode](https://www.aaron-powell.com/tags/flight-mode/) series, which
is a bit dated now), but I've never had time to get into the basics of it.
Well that's just what a conference is for ey! It was a good intro, covered
off the basics of the API and features that it can give you while looking at
some initial scenarios that you might want Service Workers in.

Some key tips to take away from Service Workers are:

- Make sure you feature detect first (`if ('serviceWorker' in navigator) { ... }`)
- Use ES2015+ code, all browsers that support Service Workers support that!
- [The Service Worker Cookbook](https://serviceworke.rs/) is a great getting started resource

Now I need to find some time to play around with the ideas that I've got for using
them. Maybe I'll put together some blog posts of my own, extending the Flight Mode
series.

## Progressive web applications

This wasn't a talk to be confused with [PWA's](https://developers.google.com/web/progressive-web-apps/)
and while it did talk about PWA's a bit, it was more about generate 'how to make
a web application with progressive enhancements'. There wasn't anything particularly
revolutionary in this talk, but there was some fun takeaways like how
[Pokedex.org](https://www.pokedex.org/) uses a WebWorker to do virtual DOM diffs
rather than the UI thread, essentially pushing the expensive processing portion
of an application to a 'background' thread. I can see this technique being useful
when working with large datasets in the browser.

# Breaking my brain with .NET

There were a few speakers at NDC that I'd always wanted to see speak, or have
seen speak and always have something enjoyable to learn about.

## Pushing C# to the limit

If you get a chance to see [Joe Albahari, aka, Mr LINQPad](https://twitter.com/linqpad)
speak, go check it out. This session he walk talking about something that I
don't think I'll ever need to do, but it's nice to know how to do it, but,
he was basically covering things like pointers, unsafe memory and
writing your own cross-process communication framework. I walked out of there
with a lot more of an appreciation of what it takes to do an application that
has performance critical operations and how complex it is to do memory management.

## Serverless and FSharp

An F# talk from [Mathias Bradewinder](https://twitter.com/brandewinder), well of
course you have to attend that. A talk on Azure Functions in F#? That is a great
combination (and it's a frustration I've come up against a number of times), so
I headed off to that one to learn about how best to go about it.

The outcomes I have is that C# and Node.js are still the ones getting the most
love from the Azure Functions team (sad, but not surprising), but you can get
F# working nicely in a scripting manner through some `#if` directives to `open`
the right namespaces. Ultimately though you're better off going down the path of
compiled functions if you want F#, as then it's a lot more obvious what dependencies
you have included, rather than relying on the magic of the hosting environment.

Mathias said he'll publish some info around what he presented, since I didn't
scribble my notes fast enough 😜.

## Planning for failure

[Jimmy Bogard](https://twitter.com/jbogard)'s talk to me was less about the
technical side of what he was talking about and more about framing solutions for
a business.

The crux of the talk was that you have a system that does a few things as a single
unit of work:

- Save an order to your DB
- Process a payment via Stripe (or any payment provider)
- Send an email
- Update the order as paid
- Drop a message into a message queue

Now treating this as a single unit of work introduces a problem, how do you handle
failure in any of those? "distributed transactions" I hear you say? Yeah... we've
all tried that in the past haven't we 😕.

Jimmy went through each of the steps in the process, broke them down into the
_true_ goal of the step, and then how we can handle failure to the business. For
some of the things, a complete failure is acceptable, others might have a retry option
and others are something that we can handle in more of a background job.

Really, the core takeaway from this talk shouldn't have been how to use technology
to solve failure points, but instead understand just _where_ those failure points
are and how do you present to the business your options to handle them?

- Can they accept a complete failure?
- Can it be pushed across to a manual process in the event of failure?
- Can you perform a retry?
- Does the action have to be done **immediately**?

Knowing your options, the pros and cons, and then being able to articulate them
to the business is key.

# Not all tech

While NDC is a tech conference not every talk there was about tech, there were talks
about career growth, leadership and workplace happiness.

So on the last day of the conference I went to [Kylie Hunt](https://twitter.com/KylieMHunt)'s
talk on workplace happiness (and not just because of the [promise of TimTams](https://twitter.com/slace/status/898350152582283265)).
Being a leader within Readify means that I do whatever I can to ensure a happy and
healthy working environment for my colleagues. Kylie shared her experience as a
workplace happiness coach on how to handle different types of bad bosses, that we
need to stop celebrating overwork, that constant 10 hour days are dangerous,
how unconscious (or conscious) bias, resulting in unfairness (perceived or real)
can impact peoples productivity and an important topic at Readify, how to embrace
change (either being change within our clients or change within Readify). Do
yourself a favour and watch the video [from NDC Oslo](https://www.youtube.com/watch?v=4nL1sW-u098&list=PL03Lrmd9CiGewi0lbnahxEpisoP5WZocX&index=126).

# Wrap up

I really enjoy NDC Sydney, it's such a different scale event to most conferences
around, and there's such a variety of talks to get to. All the talks were recorded
so we can expect the videos to appear online over the coming months, and I've
got a bunch of sessions that I'm going to go back and watch!