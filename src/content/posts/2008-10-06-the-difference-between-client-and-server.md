+++
title = "The difference between client and server"
date = "2008-10-06"
draft = false
tags = ["asp.net", "ajax"]
+++

<p>
Recently I've been doing a lot of AJAX work, I'm preparing a presentation on best practices. I've also been helping some people at work who has been working on a very AJAX rich website.
</p>
<p>
One thing I've found a lot over the years is that people seem to get confused about the different between server and client and what can be done from one or the other.<br>
And being web developers not understanding the differences can be a big issues. So I'm going to address some of the most commonly asked questions.
</p>
<p>
<strong>Why doesn't my JavaScript execute?<br>
</strong>
</p>
<p>
I can't count the number of times I've seen this code:
</p>
<pre>Page.ClientScript.RegisterStartupScript(this.GetType(), <span class="string">"js"</span>, <span class="string">"alert('hey!');"</span>, <span class="keyword">true</span>);
Response.Redirect(<span class="string">"/some-page.aspx"</span>);
</pre>
<p>
And had the developer ask "Why doesn't my JavaScript execute?". <br>
*sigh* 
</p>
<p>
This is an example of a developer not understanding the difference between client and server. Client code is not executed until every point of the server life cycle has completed, and then the client life cycle begins.<br>
The client life cycle will vary depending on what (if any) JavaScript framework is being used.
</p>
<p>
With ASP.NET the server life cycle is always the same, information on it can be found <a href="https://web.archive.org/web/20081014180245/http://msdn.microsoft.com/en-us/library/ms178472.aspx" target="_blank">here</a>. 
</p>
<p>
If you want to do a redirect after showing something in the client scope a <strong>window.location.href</strong> needs to be used. Something such as this is best:
</p>
<pre>Page.ClientScript.RegisterStartupScript(this.GetType(), <span class="string">"js"</span>, <span class="string">"alert('hey!');" setTimeout(2000, function() { window.location.href='/some-page.aspx'; });</span>, <span class="keyword">true</span>);
</pre>
<p>
Why use a <strong>setTimeout</strong>? It means that the redirection is not automatic, so if you're showing something that wont pause page execusion (ie, not an alert) then it'll show your client info before redirecting. 
</p>
<p>
<strong>Where do I put my client event handlers?</strong>
</p>
<p>
This is a point of conjecture, where do you put your client event handlers? Do you register them server side by adding them to the Attributes collection, do you add them to the markup of the server control or do you use your JavaScript framework to register an event handler?
</p>
<p>
I'm from the school of though which states "What happens on the client, stays on the client". My preference, using your JavaScript framework.
</p>
<p>
Why? Well I don't think that it can be expected that your UI developers, who are generally in charge of the JavaScript, need to dig around to find how all the client components come together.<br>
Now it's starting to make sense that JavaScript shouldn't be in the .NET.
</p>
<p>
But how do you find the ASP.NET server control ID? ASP.NET generates its ID's on the fly.
</p>
<p>
$get(<span class="string">'&lt;%= myTextBox.ClientID %&gt;'</span>);
</p>
<p>
Easy! 
</p>
<p>
Or are you a jQuery fan?
</p>
<p>
$(<span class="string">'#&lt;%= myTextBox.ClientID %&gt;'</span>); 
</p>
<p>
Each framework has a different way in which events are attached, the Microsoft AJAX framework has its <strong>$addHandler</strong>, jQuery has <strong>.bind</strong>, etc.
</p>
<p>
<strong>Which JavaScript framework library should I use?</strong>
</p>
<p>
This is a massively subjective question it really comes down to what you are familiar with and what you want to do.
</p>
<p>
I'm a Microsoft AJAX and jQuery fan, especially since the past weeks announcement that Microsoft will be supporting jQuery along side their own framework (sweet!), I like the design pattern of Microsoft AJAX (which is built heavily on the prototype framework) but that comes back to being a .NET developer, I'm use to namespaces, classes and interfaces. All of which the MS framework brings in.
</p>
<p>
But jQuery is fantastic in animation, plugin library and an awesome set of selectors.
</p>
<p>
But this is because I've never played with mootools or the Yahoo! library, both of which I'm sure are great choices.
</p>
<p>
&nbsp;
</p>
<p>
So hopefully these few common questions can be of reference or something you can point someone to next time they ask a question you can't be bothered answering. 
</p>