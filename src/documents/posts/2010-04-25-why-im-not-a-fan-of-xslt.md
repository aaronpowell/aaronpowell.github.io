---
  title: "Why I'm not a fan of XSLT"
  metaTitle: "Why I'm not a fan of XSLT"
  description: "XSLT has a place in development and Umbraco, here's why I think a lot of people miss understand its place"
  revised: "2010-04-25"
  date: "2010-04-25"
  tags: 
    - "umbraco"
    - "xslt"
    - "linq-to-umbraco"
  migrated: "true"
  urls: 
    - "/why-im-not-a-fan-of-xslt"
  summary: "Sorry, yet to migrate the comments from my old blog :P"
---
When I first joined the Umbraco team with the goal of bringing LINQ to Umbraco to the core framework there was some excitement and quite a bit of the early excitement was from Umbraco MVP [Warren Buckley][1].
And with the recent beta release the focus has come back onto LINQ to Umbraco, myself and XSLT.

While preparing to write this post I was tossing up with the name. Although I've entitled it "Why I'm not a fan of XSLT" it would have been just as apt to name it "Why write LINQ to Umbraco?".

As you read through this post I was you to keep in mind that I'm not someone who is really that good at XPath and XSLT. In fact, my dislike for XSLT is why I wrote LINQ to Umbraco!

But why, being an Umbraco user, don't i like XSLT? After all, it's a fairly core part of Umbraco!

##Compile time checking##

That's right, I'm very much a developer, and very much a compiler-driven developer. Runtime errors really are the worst to try and debug, and that's what you really get with XPath. XPath is evaluated at runtime (yes, that's a bit generalized :P), so if you have something wrong in your syntax you wont find it immediately.

Compare that to .NET code, it's very hard to write .NET code which wont compile. True that you can still get runtime errors, but they are a lot harder to achieve in the scenario's we're looking at for LINQ to Umbraco vs XSLT.

##Strong typing##

Again, another example of me being very much a developer, I would much rather look at an object with properties which knows of the type of the data.

If you're not careful you can mistake the type and then you, again, have a runtime error :P.
The .NET compiler wont let you assign a string to an int.

#Readability##

This one will cause a bit of a stir, but I simply don't find XPath & XSLT readable. Take these two examples:

    //node[nodeTypeAlias='home_page']/node[nodeTypeAlias='contact_us' nodeName='Contact Aaron']

    ctx.HomePages.ContactUs.Where(c => c.Name == "Contact Aaron");

My example is very basic, but if you look into a more complex XSLT file (such as many which exists in Warrens CWS package). In fact, in the unit tests for LINQ to Umbraco there is a replication of a few of them (have a look in the source on Codeplex if you want to see them).

A very important component of code for me is readability. When debugging, especially if the code isn't yours to begin with, readability is a vital component. You don't want to have to waste time trying to understand what's going on in the code before trying to solve it.
And if you can't work out the code properly then there's a chance you'll just make the problem worse.

##API Design##

Again I'll probably cause a stir with this one again but it's another thing that is very dear to my heart. I am a strong believer in proper API design, and if it's done wrong then it can make your life hell in the future.

I also like abstractions. LINQ to Umbraco is an example of that... provider model! Here at The FARM we've got a great level of abstraction which we use, we don't pass classes around, only interfaces, which means that your UI is dumb, really really dumb.
There isn't any business logic contained there, and there's nothing more complex than a method call.

But too often when I see an XSLT it's containing more than just UI code. And this isn't really a fault of XSLT, but of how it's perceived. When you look at an ASPX/ ASCX people have a different mindset, you don't put anything really in the front-end file other than the markup as there is a CS file associated which you think to put the other complex code into.
But with an XSLT there isn't another file, so everything ends up there.

Then it becomes too complex to try and achieve with XSLT *cough variable incrementing cough* so an XSLT extension is written. And I've seen some really scary XSLT extensions, which allow you to do things which just make me want to cringe.

XSLT should only be concerned with formatting data to output markup...

##XSLT's produce better markup##

Anyone who says that is ill-informed. If you don't think you can write valid, XHTML markup with ASP.NET Web Forms then you're not doing it right!

Control Adapters, Repeaters, List View, inline script blocks, etc can all be used to produce what ever markup you so desire.
And it doesn't take much effort to produce good markup with ASP.NET. In fact, with Visual Studio 2008 it's really hard to use the standard editor to produce crappy markup.

The biggest problem is ID's of elements, but you only have that problem if the element is:

Inside a naming container
Set to runat="server"
And you should only be setting runat="server" on elements you need server-side access to, but that's a topic for another night.

##Conclusion##

So this brings me to the end of another post. Hopefully it's been enlightening and I haven't upset too many people :P

  [1]: http://www.creativewebspecialist.co.uk/
