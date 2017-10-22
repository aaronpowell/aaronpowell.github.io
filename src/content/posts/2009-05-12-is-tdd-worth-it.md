+++
title = "Is TDD worth it?"
date = "2009-05-12T23:07:54.0000000Z"
tags = ["Unit Testing"]
draft = false
+++

<p>Today&nbsp;<a href="http://adeneys.wordpress.com" target="_blank">Alistair&nbsp;Denyes</a>&nbsp;finally gave the presentation on Integration Testing which he's been saying he'd give for something like 12 months, so I thought it'd be a good idea to get around to doing this post which I've been putting off for quite a while.</p>
<p>First off I'll start by saying that this isn't about the concept of testing, I do think that testing (both Unit and Integration) is a good idea, it's Test Driven Development (TDD) which I have some problems with.</p>
<p>One of the goals when I started LINQ to Umbraco was to ensure that I had high test coverage and that I followed TDD.<br />Well that turned out to be not such a good idea.&nbsp;</p>
<p>Maybe I'll start with some background of what TDD is, just to make sure that we're all on the same page.</p>
<p>TDD is the idea of writing a test, watching it fail and then implementing the code to make the test past.<br />You do this over and over again, writing more and more code each time until you have all the scenarios completed.</p>
<p>And this is where I found the problem, while writing LINQ to Umbraco I had <em>some idea</em>&nbsp;of what I was doing, but not a huge idea. A lot of the code was prototyping before becoming the real code which got committed to CodePlex.<br />Starting to see why I don't think TDD works?</p>
<p>When you're going on theories your tests are often wrong, which means you write a test to validate an assumption which then turns out to be the wrong, when then makes the test invalid.</p>
<p>Also something else that I found out was that when I would go to write my first test I would then realise that I had a lot of missing classes/ methods/ etc so I would have to write a bunch of boilerplate code before I can even have compilable assertions!</p>
<p>And then while trying to write the code which would validate my assertion I realised that unless I was to design myself into a corner I would have to write <strong>even more</strong>&nbsp;boilerplate code!</p>
<p>So now the half a dozen lines required to valid an assertion has become dozens of lines over multiple classes.</p>
<p>Maybe I'm doing it wrong?</p>
<p>&nbsp;</p>
<p>But I did find some value to TDD, when trying to write a LINQ provider which uses IQueryable&lt;T&gt; there's not a while lot of documentation, this meant that I was going to need some way to work out how to understand Expression Trees work. Thanks to TDD I did manage to write tests which would then run and I could follow their stack trace to determine what code was actually being executed!<br />This is how I worked produced <a href="/blog/march-2009/a-linq-observation.aspx" target="_blank">A LINQ observation</a>,&nbsp;oddly there isn't anything else I've found that explains that.</p>