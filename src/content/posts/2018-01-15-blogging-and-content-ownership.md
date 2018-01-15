+++
title = "On blogging and content ownership"
date = 2018-01-15T16:43:07+11:00
description = "My thoughts about getting into blogging and how to manage your content"
draft = false
tags = ["random"]
+++

Recently the question came up within Readify about how to get into blogging. As someone who blogs (obviously) and has blogged for a while now, I decided to share my thoughts on the topic. In fact it's a question that I've been asked a few times, I'd been considering writing a post about it and someone suggested that I do it, so it's time for a meta post on blogging on my blog.

## Why blog?

Plenty of people have written blog posts about why it is important for your career to have a blog, how it'll give you a leg up in the job market, etc. but in my opinion most of this is a load of rubbish. All of this focuses the conversation in the wrong way, what can _you_ push out to everyone else, not what can you do for **you**.

See for me, blogging is about writing down something that _I_ want to write down, not what others want me to write down, and that's why on this blog you'll see everything from JavaScript to Docker, things that you can use it production to things you really shouldn't use in production (or, maybe anywhere!).

If you write something because you want to write it and you enjoyed writing it, then who's to say it wasn't valuable? You're not measured by the number of page views in Google Analytics, the number of retweets the post gets or anything thing other than "did I have fun?".

## What do I blog about?

Admittedly, this is pretty intertwined with the pervious point, but don't feel like you need to have a theme to your blog. I originally did start that way, hence the name **LINQ to Fail**, a lot of my early work was in LINQ and looking at how to do things with it, but the risk of a theme is cornering yourself in where the blog will go. It's nearly a decade since I started blogging and if I was still trying to focus on LINQ there'd be a heck of a lot less posts 😛.

And your career with grow and evolve, what I was doing 10 years ago is very different to what I'm doing now, so again that feeds into the over time evolution of your blog.

Now sure, you don't want a huge swing post-to-post of what you're blogging about, having trends is a good idea. My blog is heavily swayed in the JavaScript and Umbraco space, but I'll still blog about Docker if that's something that's taking my fancy at the time.

## What platform should I use?

*opens can of worms and waits*

Ok, so this is something that everyone will have a different opinion on, so feel free to skip!

**TL;DR** Markdown files in a git repo with a static site generator like Jekyll, Hugo, etc.

_Long form answer_

Like I said, I've been blogging for almost 10 years, but I'm not 100% sure when I started (and I'll get to that shortly).

When I started I created a website in Umbraco, wrote some C# Web Service and cobbled together some JavaScript to call them so that I could make a cool AJAX-y site. This was hosted on a webserver at the company I worked, with the database running on one of their SQL Servers.

I'd occasionally open up the codebase on my laptop (it wasn't in source control!) and edit the code, I broke the comments engine for a while doing this, and then copy the files to production.

I realised how terrible this was for SEO I rewrote the ASPX pages, showed the latest posts on the home page and I think chucked in a bunch of `<UpdatePanel>`'s to keep up the awesome AJAX.

When I moved to Sydney I took my website with me, I backed up the SQL database, copied the files via FTP and then put them onto my new companies servers.

After a while of rewriting the page templates I decided to move off Umbraco and into a dedicated blog engine that [Paul Stovell](https://twitter.com/paulstovell) had written, and we'd eventually open source as [FunnelWeb](https://github.com/funnelweblog/FunnelWeb). Now guess what, I needed to write a content migrator to get the content from Umbraco and into FunnelWeb, and from HTML to Markdown (ok, I didn't actually do that, I just dumped HTML in the Markdown).

And thus the first of three migration engines I've written started.

I also decided it was time to stop mooching off my company and pay for hosting (also, I'd moved to Readify who didn't have a webserver I could use 😛), so I found a company I liked and put it on their web/SQL Server (this was pre-cloud days, no Azure for me).

And this worked for a while for me, but I started to hit a problem, I wanted to write posts offline, something you can't do with an online-only editing experience.

This was when I first decided to move to a static site generator, so I wrote a migrator to convert the SQL-stored content into flat Markdown files, picked a Node.js-based static site generator, picked a template and got going (I also moved hosting, no need to pay for a SQL DB anymore!).

Unfortunately I made a poor decision in the static site generator I chose to use, and it was pre-`yarn` days so I would clone onto a new machine, `npm install` only to find everything broken again. This caused my blogging to suffer, the constant maintenance I needed to just get the site running to preview a post meant I was less inclined to post.

And thus began the last of my great migrations, this time to a different static site generator. This time I picked one that had a bigger community but more importantly it has no external dependencies (seriously, the binary for Hugo is in my git repo!) so I can clone and run locally with no effort.

### It's your content, it's your responsibility

This is something that it took me a long time to learn, and I learnt it the hard way. Over the years of using a hosted platform, not a SaaS platform but something akin to hosting WordPress yourself, is that you are responsible for owning that content. Sure you've got SLA's in place around the DB being backed up, but have you tested it? What happens if your hosts DB server dies? What happens if something gets corrupted in the DB? Can you get your content back?

I learnt this the hard way. I can tell you that I started blogging approximately 10 years ago. I **know** I published a post on the 6th June 2008, but I don't think that's my first blog post, but I don't know for certain. Late last year while going through some old OSS projects I stumbled on a link to a post on my website that 404'ed. Now this wasn't surprising, I've changed URL schemes many times, but I couldn't find a blog of that title anywhere in my repo. Then I started looking at the time stamps on my posts, there were some huge gaps, gaps that didn't make sense.

And this is where I found out that I was missing a lot of my early content. In fact I was missing pretty much all content from 2008 and the first half of 2009!

So I had a mild freak-out, I didn't have DB backups anywhere and it's not like I have the DB on these hosts anymore (if they even exist!), so how was I going to recover this lost content? Well thankfully a bit of poking around in [wayback machine](http://archive.org/web/web.php) I was able to find a bunch of the old posts (~70) that I didn't previously have.

### Static sites ftw

Throughout this process I've come to realise that a static site is just the best way to go about managing your content. This puts you in the control, how it's published, where it's published, how you manage the workflow of draft -> release, all that stuff.

SaaS platforms come and go, and the last thing you want to be doing is trying to pull your content before somewhere is shutdown.

Another advantage of a static site is that you aren't just restricted to it being a blog, I can easily host things like demo code for articles, or just things I want to play around with.

## Monetisation

While I'm on the train of dissing the way people blog I'm going to talk about ads on blogs. You can run an Azure AppService for ~$10 per month (Basic), which is nothing, or you can run it free easily on places like Heroku or even out of an S3 bucket. So the idea of monetising just seems silly. Maybe when I get to the traffic levels of someone like Scott Hanselman or Troy Hunt I might think differently, but really, invest in yourself. And anyway, most people have ad-blockers on these days so is it really going to do much?

## Conclusion

So this post was a bit musing, bit ranting, but mostly some of my thoughts on how and why I blog.