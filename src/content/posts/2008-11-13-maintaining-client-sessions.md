+++
title = "Maintaining client sessions"
date = "2008-11-13"
draft = false
tags = ["ajax", "asp.net"]
+++

<p>
In my recent blog browsing I came across an interesting post from Joel at <a href="https://web.archive.org/web/20081207070804/http://seejoelprogram.wordpress.com/" target="_blank">See Joel Program</a> on <a href="https://web.archive.org/web/20081207070804/http://seejoelprogram.wordpress.com/2008/11/10/maintaining-aspnet-session-state-in-an-ajax-application/" target="_blank">maintaining an ASP.NET session within an AJAX application</a>.
</p>
<p>
It's a very good post and a very good solution Joel has come up with. I'm a big fan of Joel's work, I love the client event pool, it's such a useful way to have cross-eventing in RIA's.
</p>
<p>
In the end of his post though he states that it's not an overly useful solution and that you can increase the session timeout rather than using client eventing to refresh the session.<br>
To an extent I do agree with this, really short timeouts and then constantly refreshing the session isn't a good solution, you don't get any real performance increases.
</p>
<p>
But I can see a good use for timed-session refreshing. A lot of the project I work on are CMS heavy projects. We'll have a big CMS backed with functionality dotted all around the place.<br>
Recent I worked on a website which has a login component to it, it's built on top of Umbraco and we used the Umbraco membership provider.<br>
When logging in we use the session to store the logged in information (the Umbraco members do support cookies but we wanted a really short login period plus the cookies login has a few problems).
</p>
<p>
So we need to ensure that the session stays active. There's some very content-heavy sections of the site so we don't want people to be reading stuff and then go to navigate away only to find themselves logged out.<br>
We combated this with a large session timeout. This means we do have additional presure on the server to cater for the scenario where a page is left active for a long time. 
</p>
<p>
Generally speaking people move around a site very frequently so the session is constantly being kept alive by postbacks and new requests, so we're really adding load for the small percentage.
</p>
<p>
This is an example where I think that Joel's solution is a good idea as it can allow for an unobtrusive <em>keep alive</em> on these kind of pages.<br>
It would also mean you can have a more appropriate session timeout and use the nature of the site (frequent movement) to do the standard session keep alive.
</p>
<p>
I like this solution from Joel, it's a good example of how you can keep active servers from a client. It's also a good example of the power of a client event pool. 
</p>