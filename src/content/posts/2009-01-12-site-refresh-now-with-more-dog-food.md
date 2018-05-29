+++
title = "Site refresh, now with more dog food"
date = "2009-01-12"
draft = false
tags = ["umbraco"]
+++

<p>Any astute visitors to my website will have noticed a few changes today. And for those who didn't I don't <em>really</em> blame you, they aren't that obvious.</p>
<p>First off, I've upgraded my site to be running Umbraco 4 RC 1. It's been out for a while so I thought it was time I joined the hip crowd and started running it. I have been using it since Beta 2 on another site, but now I have my own running it as well.</p>
<p>Secondly I have refreshed the <a href="/web/20090127032545/https://www.aaron-powell.com:80/home.aspx" target="_blank">home page</a>, no longer does it have a pointless blurb, now it shows the latest blog post.</p>
<p>Thirdly I have removed most of the AJAX loading from the blog component. I wrote it originally as a bit of a trial-and-error to see if I could do it, but it was really quite pointless, and ultimetly a real bitch to deal with. Plus it rendered the site useless when you had JavaScript turned off!<br>I've kept it for the comment submission because I was simply too lazy to re-write the whole thing last weekend, as odd as it may seem I <strong>do</strong> leave my computer sometimes!<br>Additionally I have changed the URLs to actually work with the standard Umbraco URLs. Now the post perm-links are the URL's generated from Umbraco, and you can navigate to months via the folder URL. Categories still work off a query-string parameter, but getting around that is more effort than I could be bothered with!</p>
<p>Forthly I am finally <a href="http://en.wikipedia.org/wiki/Eating_one%27s_own_dog_food" target="_blank">Dog Fooding</a>&nbsp;with the <a href="http://www.codeplex.com/uil" target="_blank">UIL</a>&nbsp;on this site. I wrote the blog engine with custom classes to represent my doc types originally, but now I have started using the UIL to provide it all.<br>I'm really happy at the way it did work as well and am preparing for a new release of the UIL, but I have also found some limitations with it which I will be addressing when looking at the v-Next of the UIL.</p>
<p>So I'm quite happy with the way it came together, even if it did take a hell of a lot longer to do this refresh than I had originally hoped (good thing the better half was busy for most of the weekend so I'm not in too much trouble!).</p>