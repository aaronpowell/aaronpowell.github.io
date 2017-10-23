+++
title = "Umbraco 4 broke my project!"
date = "2009-02-05"
draft = false
tags = ["umbraco"]
+++

<p>Umbraco 4 may have been out for a week now but I've been busy and I am only slowly getting to upgrading a project I've been working on to the current build.</p>
<p>But I finally got around to it, and because there's a big custom .NET component to it I compiled against the upgraded DLL's, but there was a problem, I got the following compile error:</p>
<p><strong>The referenced assembly 'businesslogic, Version=1.0.3317.32687, Culture=neutral, PublicKeyToken=null' could not be found. This assembly is required for analysis and was referenced by: 'MyProject.dll', 'cms.dll'.</strong></p>
<p>Well that's no good, and from looking at the cms.dll it's right, it expects that, but businesslogic.dll is only version 1.0.3317.17186.<br>Crap.</p>
<p>So I re-download the package, may I did something wrong. Nope, that's not it. So I check another person running v4 final. Nope, that's not it.<br>Crap!</p>
<p>So I create a new project, add the references. This one compiles.<br>Crap!!</p>
<p>Then I take a closer look at the output window; doing this I see that the problem is caused during the running of <strong>FxCop</strong>. Then it hits me, FxCop is trying to bring in all the references, probably via reflection. Because cms.dll is using a difference version it then freaks out!<br>No one else was using FxCop, nor was the new project I created!</p>
<p>Well there you have it, if you're doing development againt the Umbraco API's be careful that they have released the correct versions to you!</p>