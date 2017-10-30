+++
title = "Paging data client side"
date = "2008-08-28"
draft = false
tags = ["ajax"]
+++

<p>
So in my last post I looked at how to use an UpdatePanel to do data paging and then optimising the HTML to get the best performance from our requests, but it still wasn't optimal. 
</p>
<p>
Although we can optimise the UpdatePanel response we can't do much about the request, and especially with regards to the ViewState within a page, which is the real killer.<br>
This is when we turn to doing client-side paging using client-side templates. This concept is basically the same as what we're familiar with for the ListView and Repeater ASP.NET controls, but they operate entirely in JavaScript using JSON object collections. 
</p>
<p>
There's plenty of ways to go about client-side templating, you can write your own templating engine, it's not hard, I had a crack at it and wrote a client-side repeater which consumed data from a webservice in only a few hours.<br>
Or you can use any of the premade template engines. I'm a fan of the <a href="http://jquery.com/" target="_blank">jQuery</a> plugin, <a href="http://plugins.jquery.com/project/jTemplates" target="_blank">jTemplates</a>&nbsp;or you can use the templating engine which is part of <a href="http://www.codeplex.com/aspnet/Release/ProjectReleases.aspx?ReleaseId=15511" target="_blank">Preview 1 of the Microsoft AJAX 4.0 library</a>. 
</p>
<p>
Lets have a look at both. 
</p>
<p>
<strong>Setting up the WebSerivce</strong> 
</p>
<p>
Well the first thing we need is to be able to get the data, so we'll create some webservices and set them up for JSON transmission on the data. 
</p>
<p>
<img src="/get/media/969/014.png" width="475" height="214" alt="014.png"> 
</p>
<p>
You'll notice there's 2 services, one for the returning of the People collection in a paged format, thanks to some lovely LINQ extensions, and one to get the total number in the collection (which we'll look at later). 
</p>
<p>
<strong>Using jTemplates</strong> 
</p>
<p>
Now we need to set up our client side template, jTemplates has its own expression format which is very similar to using an ASP.NET repeater, and it has lots of really nice inbuilt features for executing more functions when the template is being executed. I'm only going to be using a very basic features of jTemplates. Here's the template I've created for the example: 
</p>
<p>
<a href="/get/media/974/015.png"><img src="/get/media/974/015.png" width="493" height="125" alt="015.png"></a><br>
(Click for larger version) 
</p>
<p>
So theres our template, now we need to implement it. We'll use jQuery to do our AJAX requests on the initial page load, and then all subsiquent requests: 
</p>
<p>
<img src="/get/media/979/016.png" width="420" height="241" alt="016.png"> 
</p>
<p>
I've got a few global variables which will be used in the various locations within the JavaScript to maintain our page position. 
</p>
<p>
The <em>getPeople</em> method will handle the AJAX request and then I have a separate load method in the form of <em>loadPeople</em>. <em>getPeople</em> will be used when ever we want to refresh the pages data. When doing the AJAX request we need to pass in parameters the webservice requires. It's best to check out the jQuery documentation for how the various properties on the <em>$.ajax</em> function operates.<br>
The <em>loadPeople</em> is where we actually create the client template instance and load the data into it. 
</p>
<p>
<img src="/get/media/984/017.png" width="301" height="61" alt="017.png"> 
</p>
<p>
Yes, it's that simple to create a client template. Because the result is in JSON we don't need to worry about any kind of conversion. 
</p>
<p>
Now we have the client template displaying the data we need to have to work on the paging. First we need to know how many pages to make, so it's time to use the GetPeopleCount webservice 
</p>
<p>
<img src="/get/media/989/018.png" width="351" height="147" alt="018.png"> 
</p>
<p>
The <em>loadPaging</em> method is used to output our result and then the paging itself is set up. I've also got a few methods which are then used for the next and previous buttons: 
</p>
<p>
<img src="/get/media/994/019.png" width="300" height="456" alt="019.png"> 
</p>
<p>
Just to make it a bit cleaner I'm also disabling the buttons when they are not required. 
</p>
<p>
Well now that this is all set up, how does it perform? Well I'll just let the pictures do the talking 
</p>
<p>
<img src="/get/media/999/020.png" width="494" height="80" alt="020.png"> 
</p>
<p>
<img src="/get/media/1004/021.png" width="500" height="95" alt="021.png"> 
</p>
<p>
<img src="/get/media/1009/023.png" width="428" height="58" alt="023.png"> 
</p>
<p>
<a href="/get/media/1014/024.png" target="_blank"><img src="/get/media/1014/024.png" width="500" height="63" alt="024.png"></a><br>
(Click for larger version) 
</p>
<p>
I'm sure you can deduce from the above that it was much more efficient. We've got a much smaller page load, and then the request is only a fraction of what the UpdatePanel one is! 
</p>
<p>
And we don't have the problem of submitting the ViewState either! 
</p>
<p>
<strong>Microsoft AJAX 4.0 Preview 1</strong> 
</p>
<p>
So I'll just look at this briefly, first off we need to define our template: 
</p>
<p>
<a href="/get/media/1019/025.png" target="_blank"><img src="/get/media/1019/025.png" width="500" height="79" alt="025.png"></a><br>
(Click for larger version) 
</p>
<p>
I really like this template engine of jTemplates, it's much simpler (but evidently less powerful) to implement, there's no really wierd syntax needing to be remembered. The only wierdness is that the template much be a class named <em>sys-template</em> so the engine knows to now display it. 
</p>
<p>
<img src="/get/media/1024/026.png" width="500" height="175" alt="026.png"> 
</p>
<p>
As can be seen above the JavaScript is also fairly easy to work with. In the Microsoft AJAX format you define the control then use a pesudo-accessor to add the data and then invoking a render.<br>
Very much like a .NET DataBinder control. 
</p>
<p>
I wont bother showing the request/ response info as they are virtually identical to what was seen in the jTemplates example. 
</p>
<p>
<strong>Conclusion</strong> 
</p>
<p>
So now all our paging needs should be statisfied. We've seen standard UpdatePanel implementations, then made them as optimised as possible. And to finish it off we looked at doing it using JavaScript entirely (well, for display purposes it's entirely done :P). 
</p>
<p>
Hopefully this is gives a useful insight into the world beyond ASP.NET. 
</p>
<p>
<a href="/get/media/1031/updatepanelperofrmance.zip" target="_blank">And to wrap it all up here's the sample project to play with yourself.</a>
</p>