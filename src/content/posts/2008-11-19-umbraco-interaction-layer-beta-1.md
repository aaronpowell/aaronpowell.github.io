+++
title = "Umbraco Interaction Layer - Beta 1"
date = "2008-11-19"
draft = false
tags = ["Umbraco.InteractionLayer", "umbraco"]
+++

<p>
Well loyal readers I am proud to announce the release of the Umbraco Interaction Layer... <strong>Beta 1</strong>! Yep that's right, I've completed my primary set of features and now it's just a matter of testing and a full testing and v1 will be out the door.
</p>
<p>
This release brings a few new features, it also brings in a few breaking changes from the preview releases. An as with Preview 3 this release supports Umbraco v3 and v4 (although it's only been tested againt v4 Beta 2 Take 2, but from my understanding of Take 3 there are no changes to the API sections the UIL relies upon).
</p>
<p>
So what new features can be found in Beta 1?
</p>
<ul>
	<li>User specified namespace</li>
	<li>More Umbraco API pass-throughs</li>
	<li>Unpublish</li>
	<li>Delete</li>
</ul>
<p>
<strong>User specified namespace</strong>
</p>
<p>
This was a feature I have been wanting to put into since the earliest version of the UIL but it'd been on my back list of features. Well it's in there. Finally.
</p>
<p>
<strong>More Umbraco API pass-throughs</strong>
</p>
<p>
So in an effort to make the UIL code a complete replacement for the Umbraco document API (sorry Umbraco guys, it's nothing personal ;)) I have added a few more pass throughs, now you can access the user who created the document, unpublish and delete. Yep, finally I have complete CRUD supprt, not just CRU which it has been since Preview 1.
</p>
<p>
<strong>Notification of generation complete</strong>
</p>
<p>
&nbsp;
</p>
<p>
Yeah this was something else on the "things I had to do" list, now when you generate your code you'll get a lovely little Umbraco bubble to tell you that it has completed. Aww aint it pretty!
</p>
<p>
<strong>Breaking changes</strong>
</p>
<p>
As I mentioned there are several breaking changes in this release, these are just around the settings for the UIL generator and the UIL generated code. Previously I was using the appSettings collection for some of settings but now they have been promoted to their own settings section. There is an included config file in the Beta 1 packages which shows it's use.
<br>
Also I have included a config section for the User ID of the user responsible for the creating of new nodes and the publishing of nodes. These are newly exposed properties within the generated UIL code. This just gives more control over the data that is ultimately visible from within the CMS.
</p>
<p>
And to finish it off here are the links:
</p>
<ul>
	<li><a href="/get/media/1555/umbracointeractionlayer.beta1.v3.zip" target="_blank">UIL Beta 1 for Umbraco 3</a> </li>
	<li><a href="/get/media/1558/umbracointeractionlayer.beta1.v4.zip" target="_blank">UIL Beta 1 for Umbraco 4</a> </li>
</ul>