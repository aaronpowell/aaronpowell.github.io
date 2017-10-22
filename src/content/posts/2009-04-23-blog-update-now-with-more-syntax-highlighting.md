+++
title = "Blog update, now with more syntax highlighting"
date = "2009-04-23T09:06:37.0000000Z"
tags = []
draft = false
+++

<p>I finally go around putting a proper syntax highlights on my blog, to fix up that I was previously hand-doing the UI for any code that I was putting into my blog.</p>
<p>I've gone with the JavaScript tool <a href="http://alexgorbatchev.com/wiki/SyntaxHighlighter" target="_blank">Syntax Highlighter</a>. It's really neat and very simple to add into a site and use.</p>
<p>I've chosen the dark theme, to keep it closer to my actual Visual Studio theme (<a href="/{localLink:1294}" title="Once you go black...">see this post as to why I use a black VS theme</a>).</p>
<pre class="brush: js">&lt;script type="text/javascript"&gt;
alert("Hey, JavaScript highlighting!");
&lt;/script&gt;</pre>
<pre class="brush: csharp">public void Alert() {
    Console.WriteLine("And C# as well!");
}</pre>
<p>The next thought is that I really should look into Windows LiveWriter to make posting even easier.</p>