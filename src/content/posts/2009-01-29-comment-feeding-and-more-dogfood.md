+++
title = "Comment feeding and more dogfood"
date = "2009-01-29"
draft = false
tags = ["ajax"]
+++

<p>Well I've been doing some more changes to my website (and not breaking it... much :P) and I've finally got round to adding a feature that <a href="https://web.archive.org/web/20090209011726/http://ruben.3click.be/blog" target="_blank">Ruben</a> was nagging for, a <a href="https://web.archive.org/web/20090209011726/http://feeds.feedburner.com/LinqToAaronPowellComments" target="_blank">comment RSS feed</a>.</p>
<p>Now it's easier to stay up to date with the comments that are bouncing around posts (in particular like we saw on the recent post around extension methods.</p>
<p>I also decided to dogfood an old post I did about <a href="/posts/2008-08-28-paging-data-client-side" target="_blank" title="Paging data client side">client side templating</a>, so to go with a new comment RSS I have updated the comment engine to use jTemplates, and I've also added <a href="http://en.gravatar.com/" target="_blank">Gravatar</a>. Proof that I haven't been taking your email addresses just for sale to spam companies ;).</p>
<p>My blog has never looked so polished!</p>
<p>As any Umbraco developers are (or should be) aware <a href="https://web.archive.org/web/20090209011726/http://umbraco.org/24928" target="_blank">Umbraco 4 ships this Friday</a>, which is Saturday for us people <em>in the future</em>. I plan to be hot on the heals of the v4 release with v1 of the <a href="http://www.codeplex.com/uil" target="_blank">Umbraco Interaction Layer</a>. I've been doing a lot of work with it and on it recently. There's been a number of bug fixes, but now it's in a stable condition with one bug which I'm still to fix (go on, generate a doc type with a child relationship to a doctype which has a name ending in "y", it gets a bit funny there!).</p>