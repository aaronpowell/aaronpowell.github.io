+++
title = "LINQ to Umbraco update"
date = "2009-03-20T15:14:27.0000000Z"
tags = ["LINQ","Umbraco","LINQ to Umbraco"]
draft = false
+++

<p>As I mentioned in <a href="/blog/february-2009/uil-v11-release,-and-some-sadness.aspx" target="_blank">a previous post</a> I'm working on a LINQ provider for Umbraco, a proper one, not one which is exploiting the operations on LINQ to Objects.</p>
<p>Well I thought I'd do an update on the progress that'd been made thus far on it. This comes on the back of yesterdays post where I eluded to something exciting.</p>
<p>I've completed the main codebase for the DocType Markup Language (DTML) generator last week. Currently it's stuck as a console application which you run, I'm going to be working on the Visual Studio tool, so it can generate like LINQ to SQL does with the DBML. That's proving to be a bit more of a problem than I had hoped, so it's popped on the backburner for the moment. Visual Studio integration is a "nice to have", not a "must have".<br />The DTML generator, as mentioned, is a console application which runs directly against the Umbraco database. It generates an XML file which represents the DocTypes in your site. This can then be used to generate .NET code in the form of C# of VB.NET (depending on your preferences). Documentation on how to run it will be provided in the future, but there is a <strong>help</strong> switch for the mean time! :P</p>
<p>But why generate an XML file <em>and</em> a .NET file? Well other than desire to have it work from Visual Studio it provides a different feature. The XSD for the DTML file is available within the LINQ to Umbraco source (and it's 85% of the exported DocType XML), and if you spend the time having a read of it you should be able to work out how to hand-code one of them.<br />This means that you'll be able to have your classes generated, code written and unit tested, without even having to install Umbraco. This means devs can get started while the UI/ front end guys are putting the site together.</p>
<p>But now for the exciting news, in the last week I've turned my attention to the most important section of the project, the LINQ provider. And in todays commit to Codeplex I added 6 new (passing) tests for LINQ select statements!</p>
<p>*holds for applause*</p>
<p>That's right, there is support for LINQ select statments in both Lambda and Query format. The following works:</p>
<ul>
<li>Select returning type of collection (ctx.CwsHomes)</li>
<li>Select returning single property (ctx.CwsHomes.Select(h =&gt; h.Bodytext))</li>
<li>Select returning annonymous (ctx.CwsHomes.Select(h =&gt; new { h.Bodytext, h.CreateDate} ))</li>
</ul>
<p>True that it's not super useful, there's no filtering yet, but what is done is a good start (and a whole lot sooner than I expected to get it working :P).</p>
<p>I'm not going to provide a package to download, you can get the full source code from the Umbraco project on Codeplex (under the 4.1 branch).</p>