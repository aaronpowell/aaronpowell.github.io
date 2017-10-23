+++
title = "Custom eventing with jQuery"
date = "2009-01-31"
draft = false
tags = ["jquery", "javascript"]
+++

<p>Last Thursday I attended a session through <a href="https://web.archive.org/web/20090209011726/http://www.victoriadotnet.com.au/" target="_blank">Victoria.NET</a> on <a href="https://web.archive.org/web/20090209011726/http://jquery.com/" target="_blank">jQuery</a> hosted by <a href="https://web.archive.org/web/20090209011726/http://damianedwards.wordpress.com/" target="_blank">Damian Edwards</a>.</p>
<p>It was a good beginner session on jQuery, I was familiar with most of it but there were a few sweet little gems shown.</p>
<p>During the session when Damian was talking about eventing with jQuery someone asked him a question about doing custom events. Damian wasn't sure how to go about this, or if it was possible.</p>
<p>Well it <strong>is</strong> possible and I'll go over how to achieve it.</p>
<p>Because of jQuery's nature it's very easy to add custom events to both dom objects and custom objects.<br>jQuery has lots of events built in, via the <a href="https://web.archive.org/web/20090209011726/http://docs.jquery.com/Events/click" target="_blank">click</a>(), <a href="https://web.archive.org/web/20090209011726/http://docs.jquery.com/Events/keydown" target="_blank">keydown</a>(), etc. But ultimately they all implement the <a href="https://web.archive.org/web/20090209011726/http://docs.jquery.com/Events/bind" target="_blank">bind</a>() method. The just provide <em>click</em>, <em>keydown</em>, etc as the type argument of the method.</p>
<p>But bind() can take <em>anything</em> as a type argument, try this:</p>
<pre>$('p').bind('HelloWorld', function() { 
  alert('Hello World event called'); 
});
</pre>
<p>Now all &lt;p /&gt; tags on the page have an event called HelloWorld which is just waiting to be called, so how do we do that?</p>
<pre>$('a').click(function() {
  $('p').triggerHandler('HelloWorld');
});
</pre>
<p>Yep, the <a href="https://web.archive.org/web/20090209011726/http://docs.jquery.com/Events/triggerHandler#eventdata" target="_blank">triggerHandler</a>() method will call any of the event handlers which are bound to the objects in the selector.</p>
<p>Obviously this is a bit of a sanitised example, doing that on all elements isn't exactly useful. But it does show that it can be done. With more powerful selectors it's quite possible to set up events similar to using the <a href="https://web.archive.org/web/20090209011726/http://msdn.microsoft.com/en-au/library/bb311019.aspx" target="_blank">$addHandler</a>() method within the ASP.NET AJAX library, like is done within the controls in the <a href="https://web.archive.org/web/20090209011726/http://www.codeplex.com/AjaxControlToolkit" target="_blank">AJAX Control Toolkit</a>.</p>
<p>It also means that it would be quite possible to set up a Client Event Pool similar to what I talked about in the recent post <a href="/posts/2009-01-17-fun-with-a-client-event-pool-and-modal-popups" title="Fun with a Client Event Pool and modal popups">Fun with a Client Event Pool and modal popups</a>.</p>