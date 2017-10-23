+++
title = "ASP.NET Virtual Earth control"
date = "2008-08-13"
draft = false
tags = ["ajax", "asp.net"]
+++

<p>
So I was going through my blog feeds the other and came across a post about the CTP release of an ASP.NET Virtual Earth server control (<a href="http://channel9.msdn.com/posts/Mark+Brown/Virtual-Earth-ASPNET-Control-CTP-Release/" target="_blank">Channel9 video here</a>).
</p>
<p>
I'm doing quite a bit of work with Google Maps at the moment so I was interested in seeing what was available in this Microsoft incarnation.
</p>
<p>
Well to be honest I was really quite dissapointed in the attitude of the people doing this, in regards to what an ASP.NET developer should be capable of knowing/ doing.
</p>
<p>
Essentially the control is an ASP.NET server control you put into your page and can program against using C# directly, rather than having to interact through JavaScript. Great idea in theory, poor idea in practice.<br>
The video goes on then to show how "cool" it is to integrate with the UpdatePanel to "completely remove the need to code JavaScript".
</p>
<p>
Sorry... what? There was also some comment along the lines that ASP.NET dev's don't have the time to do JavaScript.<br>
Again... what?
</p>
<p>
I don't believe any good ASP.NET developer, or any web developer for that matter, can survive without having knowledge of JavaScript. For making rich web UI's it can't be beaten (unless you're going down the flash/ silverlight path, but then they aren't <em>entirely</em> web UI's).
</p>
<p>
Another thing was a glimse of the source of the page and a <em>quick</em> scroll past the ViewState, which was... large.<br>
Combine a large ViewState with an UpdatePanel as they do any you're into a world of poor performance.
</p>
<p>
Kudos to Microsoft for triyng to make Virtual Earth more accessible to web developers, but poor form in thinking that an ASP.NET server control is the best way to go about it.
</p>