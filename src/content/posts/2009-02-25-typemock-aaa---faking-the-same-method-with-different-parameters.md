+++
title = "Typemock AAA - Faking the same method with different parameters"
date = "2009-02-25T20:36:49.0000000Z"
tags = ["Unit Testing","Umbraco","Typemock"]
draft = false
+++

<p>As I stated in my <a href="http://tinyurl.com/uil-v1-1" target="_blank">last post</a> (oh so 5 minutes ago! :P) I'm working on a new project for the Umbraco team, one thing I'm really focusing hard on with LINQ to Umbraco is Test Driven Development (TDD), and with that I'm using <a href="http://www.typemock.com" target="_blank">Typemock</a> as my mocking framework (since I scored a <a href="/{localLink:1291}" target="_blank" title="Mocking with SharePoint">free license</a> I thought I should use it).</p>
<p>The Arrange, Act, Assert (AAA) is really sweet, but it does have a problem, it doesn't support mocking a method call with different parameters. I can't call the same method 3 times and have a different output depending on what was passed in.</p>
<p>Makes for a bit of a problem when you want to test conditionals against your mock. <a href="http://www.typemock.com/community/viewtopic.php?t=1174" target="_blank">I have requested the feature</a>, but for the time being I found a nice little work-around, <strong>Extension Methods</strong>!</p>
<p>So I'm mocking the <span class="const">IRecordsReader</span> from the Umbraco DataLayer, and I want to have something different returned depending on the parameter of the GetString method, so I created extensions like this:</p>
<pre><span class="keyword">public</span> <span class="keyword">static</span> <span class="keyword">string</span> GetName(<span class="keyword">this</span> <span class="const">IRecordsReader</span> reader){<br />  <span class="keyword">return</span> reader.GetString(<span class="string">"Name"</span>);<br />}<br /></pre>
<p>Now I can easily do this:</p>
<pre><span class="const">Isolate</span>.WhenCalled(() =&gt; fakeReader.GetName()).WillReturn(<span class="string">"Name"</span>);<br /><span class="const">Isolate</span>.WhenCalled(() =&gt; fakeReader.GetString(<span class="string">"SomethingElse"</span>)).WillReturn(<span class="string">"Not Name"</span>);<br /><br />// do something with fakeReader<br /><br /><span class="const">Isolate</span>.Verify.WasCalledWithExactArguments(() =&gt; fakeReader.GetName());<br /><span class="const">Isolate</span>.Verify.WasCalledWithExactArguments(() =&gt; fakeReader.GetString(<span class="string">"SomethingElse"</span>));<br /></pre>
<p>This obviously isn't the best way to do it, does mean that you have to then use extension methods when you are writing the code to use it.<br />But that's not really a problem for me at the moment, I'm doing a lot of the same data reading from the IRecordsReader so I can easily do the extension method.</p>
<p>Now if they will just add the support like Rhino Mocks has then it'll be sweet!</p>