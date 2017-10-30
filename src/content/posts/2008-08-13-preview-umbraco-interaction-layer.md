+++
title = "*Preview* - Umbraco interaction layer"
date = "2008-08-13"
draft = false
tags = ["umbraco"]
+++

<p>
So I've been doing more and more work with the Umbraco API of recent (particularly in regards to my website) but I'm getting more and more frustrated at the interaction which occurs at an API level (not to mention that it's rather ugly in some places). 
</p>
<p>
When you're working with documents which are using extended document types (and how often will Id and Text be enough data?). You're constantly populating code with getProperty(<em>alias</em>) and performing null checks, default data handling, etc. 
</p>
<p>
This is why I wrote the <a href="/posts/2008-08-07-extending-umbraco-members.html" target="_blank">Umbraco Member class</a>, as members are the one thing that is most commonly interacted with from a code level. 
</p>
<p>
So to make it easier to interact with Umbraco documents at a code level I have a preview of the Umbraco Interaction Layer. 
</p>
<p>
<strong>The what?</strong>
</p>
<p>
This project aims to create a code generator for Umbraco document types. It aims to take the complexity out of interacting with the Umbraco API.<br>
Another goal is to bring Umbraco closer to a viable choice as a data storage mechanisum, not just a CMS. Most projects I have worked across have had some form of Data content tree which contains content which is non-navigatable, just CMS manageable, such as people profiles, news articles or photo gallery items.
</p>
<p>
Quite frequently interacting with this Data content structure is done via .NET and via the Umbraco API. So having an easier way to interact with an actual representation of my document types at a code level would be a whole lot nicer.
</p>
<p>
<strong>Preview</strong>
</p>
<p>
At the moment I'm still in early stages of development, but I thought it'd be nice to share. Lets say I have the following document type (it's actually one from my site <em>and</em> used in my Data content tree :P):
</p>
<p>
<img src="/get/media/837/001.png" width="494" height="185" alt="001">
</p>
<p>
Well now I can generate some lovely .NET code, say C#?
</p>
<p>
<img src="/get/media/842/002.png" width="500" height="530" alt="002">
</p>
<p>
Or maybe you're a VB person?<br>
Well you can join in too!
</p>
<p>
<img src="/get/media/847/003.png" width="500" height="470" alt="003.png">
</p>
<p>
You may notice all properties decorated with an <strong>UmbracoInfo</strong> attribute, well that will be used to provide feedback about how the object relates back to it's Umbraco instace.
</p>
<p>
Well there we have it, a nice little tease of things to come ;)
</p>