﻿+++
title = "UIL v1.1 release, and some sadness"
date = "2009-02-25T20:14:20.0000000Z"
tags = ["Umbraco","Umbraco.InteractionLayer"]
draft = false
+++

<p>Well today I have produced the latest version of the UIL, v1.1, which can be downloaded here: <a href="http://www.codeplex.com/UIL/Release/ProjectReleases.aspx?ReleaseId=23765" target="_blank">http://www.codeplex.com/UIL/Release/ProjectReleases.aspx?ReleaseId=23765</a>. This version addresses a problem found with the <strong>IsDirty</strong> state when opening existing documents.<br />During a development implementation of it there it was noticed that when you opened existing documents the IsDirty always returned true.</p>
<p>This is now fixed, and I also addressed another problem which was realised. It was actually a design limitation, not a bug (per-say). I had the UIL relying on the ID's of the DocTypes <strong>at time of generation</strong>, this posed a problem when using the UIL on existing websites. When you tried to deploy the DocTypes into a new environment using Umbraco Packaging (or manually creating them), a <strong>new ID</strong> would be generated! This posed a big problem. Instead I have change it so the UIL relies on the <strong>alias at time of generation</strong>, which isn't 100% unique, but it's <em>unique enough</em> ;).</p>
<p>&nbsp;</p>
<p>But there is also a bit of sadness in this post, as this post signals the final installment of UIL being under active development (although I use the term active loosely :P). I will no longer be actively adding features to the UIL, unfortunately I no longer have the time to dedicate to the project and implement the features which I had intended to implement. I will <em>try</em> and implement fixes for any bugs which people find, but really I don't have enough time to work on anything new for the UIL.</p>
<p>But it's not all sad, there is a good reason which I no longer have the time to dedicate to the UIL, it is because I have taken on a bigger project. After speaking with Niels and the other guys who make up the Umbraco project I've been asked to develop a proper LINQ to Umbraco implementation. That's right, I'm currently working to produce what the UIL was originally going to become, a LINQ provider for Umbraco.</p>
<p>I'm going to keep some of the details secret, but I'll just say that at the moment the UIL isn't going to be <em>completely</em> replaced by LINQ to Umbraco, rather it's going to be <em>suplimented </em>by it. Where UIL is all about how to interact with <strong>Documents</strong> and <strong>Document creation</strong> LINQ to Umbraco is going to be all about interacting with <strong>published nodes</strong> and the Umbraco node cache.</p>
<p>So be on the lookout for some really interesting posts in the coming weeks/ months in which I'll provide more details on LINQ to Umbraco, or feel free to watch the progress of the of the code on Codeplex..</p>
<p>So sad times, with happy times.</p>