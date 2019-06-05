+++
title = "Cutting Azure Costs"
date = 2018-06-21T16:53:50+02:00
description = "How I went about slashing Azure costs for DDD Sydney from $60 to $1.50 per month"
draft = false
tags = ["azure", "dddsydney"]
+++

> Only a couple of weeks after I posted this article Azure announced that they have support for [static websites in preview](https://azure.microsoft.com/en-us/blog/azure-storage-static-web-hosting-public-preview/?{{< cda >}}). Obviously this supersedes what I do here, but it doesn't make it any less accurate 😉.

As you likely know, I'm one of the organisers of [DDD Sydney](https://next.dddsydney.com.au), a not for profit conference in Sydney. Being a not for profit I'm always looking at how we can slash our costs because every dollar counts and this year I decided to look at how we can slash our Azure costs.

Why do we need to do this? Well over the last few years we've starts to get compound costs of running the web assets. I like the idea of having all the previous years websites still up and running because it gives people a view on what we've done over the years as an event and it's also useful as a marketing tool when we speak to sponsors.

For the last two years the DDD Sydney website has used a fork of the [DDD Melbourne](https://dddmelbourne.com) website which was an ASP.NET MVC application. Because I like simplicity it was deployed as an Azure AppService running the standard tier so we get custom domains (it was then backed by Azure Table Storage for the session submission and voting). This works fine, it's costs ~$15 AUD per month to run and because of annoyances with banks it was going on my personal credit card (and I was too lazy to expense it back to SydDev Inc, our business entity).

But we're starting to get growth in our web presence, this year would see a third AppService running and I wanted to do a blog using [Hugo](https://gohugo.io) like mine which would be forth AppService. Now we'd be running a bit of $60 per month and it's to the point that I can't just absorb that cost and it's starting to get a bit more pricey for us as an event to run.

It was time to cut costs!

## Going static

Realistically the DDD Sydney web presence is a static experience, nothing really changes on the website for a long time, we have session submissions for a few weeks (which we used Sessionize for this year) and then voting. Nothing that _really_ needs a dynamic webserver to be running. Because of this I wanted move to some kind of a static site for it, but I'm also time poor (read: lazy) so I wanted to do it with minimal effort.

Conveniently the [DDD Perth](https://dddperth.com) team were building a new website using React and I jumped at the idea to use it. But they were going to run it in an AppService which seemed overkill so we just use Server Side Rendering and generate a bunch of HTML pages (and the React over the top so it has some dynamic stuff to it).

## Where to host?

Now I've got a bunch of static assets where can I host them? I'd like to **not** open a new account somewhere so using Azure made sense (it's already setup, it's integrated with our O365 for security, etc.). I know that I can push all these files up to Azure Blob Storage, turn on anonymous authentication and voila, you've got a static website... running at a pretty horrible URL.

## Making the URLs pretty

So you've got your site running in Azure Blob Storage but the URL isn't great, it's definitely not `dddsydney.com.au`, so now we need to do something to fix that up.

My first thought was [Azure Function Proxies](https://docs.microsoft.com/en-us/azure/azure-functions/functions-proxies?{{< cda >}}), they are an easy way to front a route with a nice URL and it supports SSL + custom domains, so, win!

But it turns out to not be quite as simple as that. I can't for the life of me work out how to do some decent wildcard mapping in the proxy definition to get the pages all mapped. My only solution was to create a proxy for each page which is less than ideal, especially when the blog is thrown into the mix.

My next thought was [Azure CDN](https://azure.microsoft.com/en-us/services/cdn/?{{< cda >}}). Now I have **zero** experience in Azure CDN and in fact I couldn't find anyone I know who had experience with Azure CDN (that I work with, or know externally, I'm sure there are people who use it :stuck_out_tongue:), so there's no time like the present to learn it now is there!

Azure CDN as it turns out is really just a front for two other CDN providers, Verizon and Akamai, but integrated into the Azure portal... sort of. I was going to need to use the Premium tier because I need to create custom rules, which means I'm using Verizon under the covers.

I came across [this article](https://blog.lifeishao.com/2017/05/24/serving-your-static-sites-with-azure-blob-and-cdn/) that goes through the basics of what I needed.

There are some gotcha's, or at least things to be aware of when using Azure CDN, first is the rules ordering with forced HTTPS. You need to make sure you do your forced HTTPS _before_ the URL rewrite. This took me a while to get sorted and it is a few hours turn around each time you change a rule, so a good one to catch early.

Here's what our rules look like (for the blog):

```xml
<rules schema-version="2" rulesetversion="15" rulesetid="753098" xmlns="http://www.whitecdn.com/schemas/rules/2.0/rulesSchema.xsd">
  <rule id="1210941" platform="http-large" status="active" version="5" custid="84F94">
    <description>HTTP -> HTTPS</description>
    <!--If-->
    <match.request-scheme value="http">
      <feature.url-redirect code="301" pattern="/8084F94/blog-dddsydney/website/\d*/(.*)" value="https://%{host}/$1" />
    </match.request-scheme>
  </rule>
  <rule id="1210878" platform="http-large" status="active" version="0" custid="84F94">
    <description>Wildcards</description>
    <!--If-->
    <match.always>
      <feature.url-user-rewrite pattern="/8084F94/blog-dddsydney/((?:[^\?]*/)?)($|\?.*)" value="/8084F94/blog-dddsydney/$1index.html$2" />
      <feature.url-user-rewrite pattern="/8084F94/blog-dddsydney/((?:[^\?]*/)?[^\?/.]+)($|\?.*)" value="/8084F94/blog-dddsydney/$1/index.html$2" />
    </match.always>
  </rule>
</rules>
```

The next thing to be aware of is that setting up SSL takes **ages**, seriously, it's around 8 hours to get a certificate deployed across all CDN nodes, but the beauty is that it's free and I don't have to manage cert expiry or anything!

And don't forget that you will often have to purge the cache, and that can take a while, which will then result in some slowness initially.

## Conclusion

Over the last two months, since we've moved to running the 3 websites and blog as static websites in blob storage using Azure CDN in front it's cost a total of $3.26. Yep, I'm pretty happy with that!

Now sure, I could've done a static website in AWS using S3 buckets, or using CloudFlare as the CDN provider, or GitHub pages, or, or, or... but they all would've required a set of new accounts that we don't want to manage. DDD Sydney is low cost because we keep things light weight, and the more overhead I add through different platforms we have to push to, the more painful, and thus expensive, it become. So in the end getting it all setup in Azure is good for us, and really, it wasn't that complex once I knew what I was doing.