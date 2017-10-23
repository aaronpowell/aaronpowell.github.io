+++
title = "Dude, where's my Canvas?"
date = "2009-01-05"
draft = false
tags = ["umbraco"]
+++

<p>
Although there's been big praise for the <a href="http://www.codeplex.com/umbraco/Release/ProjectReleases.aspx?ReleaseId=18660" target="_blank">Umbraco 4 RC release</a>, and after I upgraded a site I'm working on to it, I had high hopes. One of the things I wanted to really play with is Canvas (formerly Live Edit). 
</p>
<p>
But it wasn't to be, when ever I went to load up Canvas there was nothing happening. Well, I had a few points which I could see I needed to click on, but clicking them did nothing.<br>
Nor was I able to see the Canvas Toolbar which is always shown in the demos. 
</p>
<p>
Hmm, now that's not right... 
</p>
<p>
So I whipped out the source for Umbraco, and got debugging. But oddly enough none of the break points within the associated Umbraco Canvas controls were being hit. 
</p>
<p>
I had a UmbracoContext, and it was telling me&nbsp;Canvas was enabled.&nbsp; 
</p>
<p>
And I kept digging, and then I noticed the folly of my mistake. 
</p>
<p>
<strong>I wasn't referencing the base Umbraco master page!</strong> 
</p>
<p>
There are two options: 
</p>
<ol>
	<li>Set your master page to have a master of <strong>/umbraco/default.master</strong> and wrap your entire master page in a ContentPlaceholder with the ContentPlaceholderID of <em>ContentPlaceHolderDefault</em></li>
	<li>Inherit your master page from <strong>umbraco.presentation.masterpages._default</strong> instead of System.Web.UI.MasterPage (<em>this is my prefered option</em>)</li>
</ol>
<p>
There's still another bug which I am yet to find the cause of, when you have a macro which programmatically adds a file to the pages ScriptManager it doesn't work at all, the added file doesn't get added...<br>
I'm still digging on that one...
</p>
<p>
Oh, and I noticed that the ItemEditor class inherits UpdatePanel, good thing we don't expect peak performance from Canvas :P
</p>