+++
title = "Did you forget something in your Umbraco site?"
date = "2008-09-15"
draft = false
tags = ["umbraco"]
+++

<p>
When deploying Umbraco into a new environment (a UAT, a production, etc) everyone has a check list that the tick off against. This will cover items like:
</p>
<ul>
	<li>Modifying the web.config to use the right connection string/ smtp/ etc</li>
	<li>Setting the permissions on the file system</li>
	<li>Remove the Install folder</li>
	<li>And so on&nbsp;</li>
</ul>
<p>
<em>Remove the Install folder</em>, huh? To be honest this is a step I often forget, the Install folder tends to float around like a bad smell simply cuz no one has gotten around to removing it, but it can't be that bad... can it?
</p>
<p>
Well yes, yes it can. First off, anyone clued in enough can get to your site and then go to /install/Default.aspx and run through the installer! Yeah, I'm sure you want that done...<br>
Or if you've got a really mallicious person they can start playing around with the installStep query string parameter.
</p>
<p>
The installStep query string parameter has this really nice feature, you provide it the path to an ASCX so it can load that into the installer. The idea is so you can quickly jump to the appropriate step, the down side is it allows you to jump to <strong>any</strong> ASCX on the site.<br>
Just for fun try this on your site:<br>
<strong>/install/Default.aspx?installStep=../../umbraco/controls/passwordChange</strong>
</p>
<p>
Well that just aint right now is it...
</p>
<p>
So I decided to see what else you can do, well for starters you've got:<br>
<strong>/install/Default.aspx?installStep=../../umbraco/create/content</strong>
</p>
<p>
See where I'm going with this, yep, you can bring up the create content window! Now we're getting dangerous.<br>
If you've been like a lot of lazy dev's and not set up a 500-error page you'll see a lovely yellow error with a stack trace showing you just why the parse failed, looks like we missed a query string parameter.<br>
Anyone with access to the Umbraco source code (it's open source, so that's like... everyone) can then work out what went wrong, turns out&nbsp;we need a query strong <strong>nodeId</strong>, so lets try again:<br>
<strong>/install/Default.aspx?installStep=../../umbraco/create/content&amp;nodeId=&lt;some node id&gt;</strong>
</p>
<p>
Well what do you know, I can create a page...
</p>
<p>
Obviously a random hacker will be slowed down by the fact that you need to actually know a node ID, but that's not hard to work out, trial and error will get you there eventually.
</p>
<p>
I tried this on a handful of Umbraco sites I know of (including some very high profile companies sites) and found this working on all but 1 of them.
</p>
<p>
&nbsp;
</p>
<p>
<strong>Moral of the story?</strong>
</p>
<p>
Delete the bloody Install folder before going live!
</p>