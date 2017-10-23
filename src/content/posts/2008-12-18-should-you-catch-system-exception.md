+++
title = "Should you catch System.Exception?"
date = "2008-12-18"
draft = false
tags = ["generic .net"]
+++

<p>
System.Exception is a funny class, it's a class that on its own isn't really that practical. In the talk that <a href="https://web.archive.org/web/20081220045116/http://blogs.msdn.com/brada/default.aspx" target="_blank">Brian Abrams</a> talk on <a href="https://web.archive.org/web/20081220045116/http://channel9.msdn.com/pdc2008/PC58/" target="_blank">Framework Design Guidelines from PDC 2008</a> (a really interesting video) he mentions that if they could do it over again they would make System.Exception an abstract class.
</p>
<p>
And I completely agree. I hate nothing more than seeing code like this:
</p>
<pre><span class="keyword">throw new</span> <span class="const">Exception</span>(<span class="string">"Something bad happened!"</span>);
</pre>
<p>
This line of code does not provide any insight into what has happened to produce the exception (ok, sure it's out of context, but I'm sure you've seen that used in context somewhere). It really comes about from a lack of understanding of the different exception types, and when they are appropriately used.
</p>
<p>
This then leads into the question I posed with this post, should you actually catch System.Exception?<br>
I'm of the belief that you <em>shouldn't</em> catch this exception. All too often in exception handling I see code like the following:
</p>
<pre>try{
// do something
} catch (Exception ex) {
// do some exception handling
}
</pre>
<p>
This exception handling isn't really that useful, from here all I have done is catch anything that's gone wrong, I have no opportunity to do anything unique with the different exception types nor could I appropriately handle an exception being thrown.
</p>
<p>
Take email sending, web apps frequently have email sending in them and obviously you'll need have some kind of error handling. The most likely exception to be thrown is the <span class="const">SmtpException</span> so when catching that you want to inform the user that there was a problem sending their email. But there are other possible exceptions like null if you didn't set all the data appropriately. But that you may want a different message to the users. If all you're catching is <span class="const">Exception</span> then how do you provide a different message?
</p>
<p>
But should that mean that you don't catch System.Exception? I say yes, you <em>don't</em> catch it, if you're appropriately catching <em>known possible exceptions</em> you shouldn't need System.Exception, that should be handled by the application-wide exception handling (within the Global.asax).
</p>
<p>
Appropriate exception handling means actually understanding <strong>just what could go wrong</strong> and handling those senarios, not just catching everything and not really understanding what could go wrong.
</p>
<p>
Moral of the story, the more you understand about what could go wrong within the application with make your life easier in the long run. 
</p>