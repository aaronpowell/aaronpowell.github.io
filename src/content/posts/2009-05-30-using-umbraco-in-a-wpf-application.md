+++
title = "Using Umbraco in a WPF application"
date = "2009-05-30T10:40:27.0000000Z"
tags = ["Umbraco","LINQ to Umbraco"]
draft = false
+++

<p>One of the goals of LINQ to Umbraco is to be able to have Umbraco applications which are done without a web context, starting to using Umbraco as a service.</p>
<p>Now there's been plenty of ways to do this in the past, you can quite easily have a web service which pushes out the data you require, but I wanted to do it entirely without web stuff.</p>
<p>With Code Garden coming up in a few weeks I decided to have a look into writing something to show off the concept I was thinking of, that you could write a WPF application which is entirely driven from Umbraco content.<br />When reading a recent <a href="http://www.hanselman.com/blog/DemoDashboardAndIDEExtensionsWhirlwindTourAroundNET4AndVisualStudio2010Beta1.aspx" target="_blank">blog post from Scott Hanselman</a> in which he talks about a tool he uses when doing presentations&nbsp;which reads Twitter hash tags and he can get audience feedback. So I thought, why not do that, but using Umbraco for the messages rather than Twitter.</p>
<p><strong>Enter the Umbraco Notifier</strong></p>
<p>So my concept was decided, you would have a small WPF app that sits in the system tray and check an Umbraco XML file for changes.<br />To go along with that I would have an Umbraco instance running which has a simple web form that people can submit their notification to me.</p>
<p>Now I'm not going to give away the code here, thats a secret for CG, but pictures are worth 1000 words, so how many words is a <a href="/get/media/2541/notification demo.swf" target="_blank">screen cast worth</a>? Follow the link to see the notifier in action!</p>
<p>You'll probably want to turn your computer speakers <strong>off</strong>, I'm still learning how to use the software and the background noise is well... backgroundy :P.</p>
<p>&nbsp;</p>
<p>So there you have it folks, an Umbraco driven WPF application, with LINQ to Umbraco in full operation.&nbsp;</p>