+++
title = "Optimising UpdatePanels"
date= "2008-08-28"
draft = false
tags = ["asp.net", "ajax"]
+++

<p>
So it can be generally agreed that UpdatePanels are evil. Plenty of people have blogged about this, there's a good post <a href="http://encosia.com/2007/07/11/why-aspnet-ajax-updatepanels-are-dangerous/" target="_blank">here</a>&nbsp;which goes over it in more details. 
</p>
<p>
To give a brief background the reason they are not a great idea is because of what they are, just a wrapper for the standard PostBack request to force it via XHttp rather than normal. 
</p>
<p>
This results in more data being submitted and returned than is really needed, so on big pages, or big requests this can negate the point of using AJAX as you're still submitting a lot of data. 
</p>
<p>
But there are instances where an UpdatePanel can be a viable choice, these are generally based around paged data. 
</p>
<p>
I came across this the other day when taking an implemented ListView control and wanting to make it paged and AJAX-y. So an UpdatePanel was in order. 
</p>
<p>
Lets have a look at a basic implementation of an UpdatePanel for a paged solution. 
</p>
<p>
<strong>The back end</strong> 
</p>
<p>
First off we're&nbsp;going to need a data source to display in our UpdatePanel. I've created a simple collection of people: 
</p>
<p>
<img src="/get/media/905/007.png" width="464" height="344" alt="007.png"> 
</p>
<p>
I'm going to be implementing this&nbsp;in an ASP.NET ListView control,&nbsp;which will&nbsp;be paged. So here's the ASPX: 
</p>
<p>
<a href="/get/media/910/008.png"><img src="/get/media/910/008.png" width="500" height="179" alt="008.png"></a> 
</p>
<p>
And we're going to get the resulting&nbsp;page like this: 
</p>
<p>
<img src="/get/media/915/001.png" width="500" height="143" alt="001.png"> 
</p>
<p>
<strong>Inspecting the response</strong> 
</p>
<p>
So lets look at what we're transfering back and forth on the server. I'll be using the FireBug plugin for FireFox to look at the request/ response but Http Fiddler would work just as well if you're an IE person. First we hit the page 
</p>
<p>
<a href="/get/media/920/002.png"><img src="/get/media/920/002.png" width="466" height="30" alt="002.png"></a><br>
(Click for larger version) 
</p>
<p>
That's not exactly what we want to see. Sure it's not a big amount but 62kb is a lot to have received for such a small page. Now lets go to the next page of the data and get the UpdatePanel to do some work. 
</p>
<p>
<img src="/get/media/925/004.png" width="500" height="79" alt="004.png"> 
</p>
<p>
Again, that's not exactly appealing, 4kb just to get another 5 rows!? It's also worrying when we look at the time taken 
</p>
<p>
<img src="/get/media/930/005.png" width="327" height="18" alt="005.png"> 
</p>
<p>
Ouch, 2 seconds is a long time for such a small amount of data... But why is this happening? Well lets inspect the response with FireBug 
</p>
<p>
<a href="/get/media/935/006.png"><img src="/get/media/935/006.png" width="498" height="420" alt="006.png"></a><br>
(Click for larger version) 
</p>
<p>
Now it starts to make sense, we're get a large, well formatted code block back. Now I am a huge fan of formatting documents. There's nothing worse that looking at a big code slab, I'm forever hitting Ctrl + K + Ctrl + D to reformat my document, but in this case it's having a very negative effect on our pages performance. 
</p>
<p>
<strong>Optimising the requests</strong> 
</p>
<p>
So now we've seen our simple little demo in action, the submit is a little heavy, even for what you'd like on an UpdatePanel, is there anything we can do about it? 
</p>
<p>
Well there's several things we can do, as you may notice from the screen shot we are submitting and receiving the ViewState each time. This is the <strong>major</strong> problem with an UpdatePanel, especially on complex pages. So the first thing is to turn off ViewState on anything you don't need it on. Eg - Label controls, the overhead of submitting their ViewState is higher than that of repopulating the attributes during a postback (and if you're properly AJAX-ing the page, you may not even need to do that as the PostBack isn't ever done!). 
</p>
<p>
But what else? Well, looking at the response there is a lot, and I mean <em>a lot</em> of whitespace, this adds considerable weight during submits. So what if we were to remove it?
</p>
<p>
Say I changed my ASPX to look like this
</p>
<p>
<img src="/get/media/940/009.png" width="500" height="155" alt="009.png">
</p>
<p>
Sure, it's not overly readable, but how does it perform on the inital page load
</p>
<p>
<img src="/get/media/945/010.png" width="500" height="80" alt="010.png">
</p>
<p>
Hmm... down 1kb! How about the UpdatePanel request?
</p>
<p>
<img src="/get/media/950/011.png" width="500" height="90" alt="011.png">
</p>
<p>
Down a few more kb, but was it faster?
</p>
<p>
<img src="/get/media/955/012.png" width="386" height="20" alt="012.png">
</p>
<p>
Yes it was. Keep in mind that the time is a little subjective as I'm running this on my laptop so it can have performance fluctations, but none the less you should notice a decrease in the request time. And what does our response look like?
</p>
<p>
<a href="/get/media/960/013.png"><img src="/get/media/960/013.png" width="499" height="215" alt="013.png"></a><br>
(Click for larger version)
</p>
<p>
Hmm... not really readable, but are we after readability...
</p>
<p>
<strong>Conclusion</strong>
</p>
<p>
So my example may be some-what sanitised, we don't really have a complex page, there not much in the way of other controls bar the UpdatePanel so the ViewState isn't really coming into effect in request weight. But this should give you an idea on if an UpdatePanel is the option you're going with then here is a few tricks to make it a bit less unpleasent.
</p>
<p>
But that's not all, shortly we'll look at achieving this without the need to an UpdatePanel, or even ASP.NET controls!
</p>