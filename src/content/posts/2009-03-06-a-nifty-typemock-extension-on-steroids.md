+++
title = "A nifty Typemock extension on steroids"
date = "2009-03-06T13:04:47.0000000Z"
tags = ["Unit Testing","Typemock"]
draft = false
+++

<p>So in my last post I showed a nifty Typemock extension for doing repetition within Typemock's AAA syntax on the WhenCalled method. When I wrote that extension it was only done in a rush and it had 1 flaw, you couldn't do method chaining to do the n+1 action, you had to do it on a separate line.</p>
<p>Well I spent another 5 minutes on it and added this feature (plus a repeat on CallOriginal). Here's the updated extension set:</p>
<pre>    <span class="keyword">public</span> <span class="keyword">static</span> <span class="keyword">class</span> Extensions
    {
        <span class="keyword">public static</span> <span class="const">ActionRepeater</span>&lt;TReturn&gt; WillReturnRepeat&lt;TReturn&gt;(this <span class="const">IPublicNonVoidMethodHandler</span>&lt;TReturn&gt; ret, TReturn value, <span class="keyword">int</span> numberOfReturns)
        {
            <span class="keyword">for</span> (<span class="keyword">var</span> i = 0; i &lt; numberOfReturns; i++)
                ret.WillReturn(value);

            <span class="keyword">return new</span> <span class="const">ActionRepeater</span>&lt;TReturn&gt;(ret);
        }

        <span class="keyword">public static</span> <span class="const">ActionRepeater</span>&lt;TReturn&gt; CallOriginalRepeat&lt;TReturn&gt;(this <span class="const">IPublicNonVoidMethodHandler</span>&lt;TReturn&gt; ret, <span class="keyword">int</span> numberOfReturns)
        {
            <span class="keyword">for</span> (<span class="keyword">var</span> i = 0; i &lt; numberOfReturns; i++)
                ret.CallOriginal();
            
            <span class="keyword">return new</span> <span class="const">ActionRepeater</span>&lt;TReturn&gt;(ret);
        }
    }

    <span class="keyword">public class</span> <span class="const">ActionRepeater</span>&lt;TReturn&gt;
    {
        <span class="keyword">private</span> <span class="const">IPublicNonVoidMethodHandler</span>&lt;TReturn&gt; _actionRepeater;
        <span class="keyword">public</span> <span class="const">ActionRepeater</span>&lt;TReturn&gt;(<span class="const">IPublicNonVoidMethodHandler</span>&lt;TReturn&gt; actionRepeater)
        {
            _actionRepeater = actionRepeater;
        }

        <span class="keyword">public</span> <span class="const">IPublicNonVoidMethodHandler</span>&lt;TReturn&gt; AndThen()
        {
            return _actionRepeater;
        }
    }
</pre>
<p>&nbsp;</p>
<p>I'll admit that I have made it a touch verbose to use, but I think it's better to convey what is happening to other people reading the tests (it's a lot like Rhino Mocks in verboseness I guess). So to use it now all you need to do is:</p>
<pre><span class="const">Isolate</span>.WhenCalled(() =&gt; someMock.SomeMethod()).WillReturnRepeat(<span class="keyword">true</span>, 3).AndThen().CallOriginal();
//or, chained repeats!
<span class="const">Isolate</span>.WhenCalled(() =&gt; someMock.SomeOtherMethod()).WillReturnRepeat(<span class="string">"Hello World"</span>, 2).AndThen().WilLReturnRepeat(<span class="keyword">"Good-bye World"</span>, 2).AndThen().CallOriginal();
</pre>
<p>Makes for some really crazy mocks ;)</p>
<p>&nbsp;</p>
<p>PS: You can use the <em>Repeat</em>&nbsp;extensions with a repeat number of 1 if you want just method chaining too:</p>
<pre><span class="const">Isolate</span>.WhenCalled(() =&gt; someMock.SomeMethod()).WillReturnRepeat(<span class="keyword">true</span>, 1).CallOriginalRepeat(1).ReturnRecursiveFakes();</pre>