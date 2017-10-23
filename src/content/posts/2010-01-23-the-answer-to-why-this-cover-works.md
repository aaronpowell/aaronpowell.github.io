+++
title = "The answer to why this code works"
date = "2010-01-23"
draft = false
tags = ["generic .net", "umbraco"]
+++

<p>So at the start of this week I put up a blog asking <a href="/web/20100125185113/http://aaron-powell.com:80/blog/january-2010/why-does-this-code-work.aspx" target="_blank">Why this code works</a>, and to be honest I've
grown quite a bit of an ego since then as no-one has been able to
answer the question correctly.</p>

<p>One person did get close, but close doesn't quite cut it ;).</p>

<p>Well the answer is actually very simple, and it's a really handy
feature of the C# language, <a href="http://msdn.microsoft.com/en-us/library/xhbhezf4.aspx" target="_blank">explicit operators</a>.<br>
Explicit operators allow you to define explicit casting between
types. So the code that was missing from my original post was
this:</p>

<div class="syntaxhighlighter " id="highlighter_518007"><div class="bar"><div class="toolbar"><a href="#viewSource" title="view source" class="item viewSource" style="width: 16px; height: 16px;">view source</a><a href="#printSource" title="print" class="item printSource" style="width: 16px; height: 16px;">print</a><a href="#about" title="?" class="item about" style="width: 16px; height: 16px;">?</a></div></div><div class="lines"><div class="line alt1"><code class="number">1.</code><span class="content"><span class="block" style="margin-left: 0px !important;"><code class="keyword">public</code> <code class="keyword">static</code> <code class="keyword">explicit</code> <code class="keyword">operator</code> <code class="plain">UmbracoPage(XElement x) {</code></span></span></div><div class="line alt2"><code class="number">2.</code><span class="content"><code class="spaces">&nbsp;&nbsp;&nbsp;&nbsp;</code><span class="block" style="margin-left: 16px !important;"><code class="keyword">return</code> <code class="keyword">new</code> <code class="plain">UmbracoPage(x);</code></span></span></div><div class="line alt1"><code class="number">3.</code><span class="content"><span class="block" style="margin-left: 0px !important;"><code class="plain">}</code></span></span></div></div></div>

<p>What I've done here is defined how the compiler is to treat a
casting of an XElement to an instance of UmbracoPage, and since
UmbracoPage inherits IUmbracoPage there is already a defined
casting to it.</p>

<p>Inside the body of my explicit operator I can do anything I
desire, here I'm just returning a new instance, passing the
XElement to the constructor.</p>

<p>I find it really quite elegant, and that it reduces code smell
quite nicely.</p>

<p>But explicit operators also have a buddy, in the form of <a href="http://msdn.microsoft.com/en-us/library/z5z9kes2.aspx" target="_blank">implicit operators</a> (which was the
close-but-no-cigar answer). These work by the type being defined by
the assignment target, eg:</p>

<div class="syntaxhighlighter " id="highlighter_193199"><div class="bar"><div class="toolbar"><a href="#viewSource" title="view source" class="item viewSource" style="width: 16px; height: 16px;">view source</a><a href="#printSource" title="print" class="item printSource" style="width: 16px; height: 16px;">print</a><a href="#about" title="?" class="item about" style="width: 16px; height: 16px;">?</a></div></div><div class="lines"><div class="line alt1"><code class="number">1.</code><span class="content"><span class="block" style="margin-left: 0px !important;"><code class="plain">UmbracoPage page = xElement;</code></span></span></div></div></div>

<p>I'm personally not a fan of implicit operators though, I find
them less obvious when you're reading code.</p>

<p>So there you have it, a slightly obscure language feature to
play with!</p>
