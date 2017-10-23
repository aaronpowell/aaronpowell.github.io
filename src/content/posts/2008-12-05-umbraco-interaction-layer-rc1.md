+++
title = "Umbraco Interaction Layer - RC1"
date = "2008-12-05"
draft = false
tags = ["Umbraco.InteractionLayer", "umbraco"]
+++

<p>
Well I've gone and beaten the Umbraco guys to RC1, although I'm sure v4 RC1 is just around the corner.
</p>
<p>
But, none the less I'm happy to have RC1 of the UIL ready for download. There's actually very little changed between <a href="/posts/2008-11-19-umbraco-interaction-layer-beta-1" target="_blank">Beta 1</a> and RC1. There's a little bit of a code clean up, and I've addressed a bug which was found by a colleague of mine. She found that if you didn't generate all the Doc Types an exception was thrown if you'd omitted a Doc Type which was a child relation of anyother.
</p>
<p>
Something which I had initially planned to do was produce an Umbraco package for the UIL so it was easier to install into Umbraco. I have now decided against doing so. <br>
This isn't <em>really</em> because I'm just too lazy to get around to it, I do actually have a good reason for this.
</p>
<p>
The idea of an Umbraco package is it is something which should always be apart of the Umbraco site. The UIL is <strong>not</strong> designed for that. The UIL is only meant to be on the development version, and only for a short period of time.<br>
It's the same reason you wouldn't have a DBML file on a production site, nor would you have a C# file.<br>
The UIL isn't meant to be installable by knowledgable end-users. It's a developer tool and adding it should require someone who's smarter than the average bear.
</p>
<p>
So although it's not a lot of changes in the code base there is actually a change in the project format, the project is now <strong>completely open source</strong>! That's right, you can now find the <a href="https://web.archive.org/web/20081207070804/http://www.codeplex.com/UIL" target="_blank">UIL on CodePlex</a> :D.
</p>
<p>
So you can easily check out the mess which is my source code, in all its spaghetti glory!<br>
Yes, at the moment there is no real comments (I'm a stickler for commented code as anyone I work with will atest to).<br>
Yes, there is a demo application in there so you can see <em>one I prepared earlier</em> ;).
</p>
<p>
You will find the download links on the CodePlex project.
</p>
<p>
Happy Hacking!
</p>