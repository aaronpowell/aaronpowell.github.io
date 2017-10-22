+++
title = "A nifty Typemock extension"
date = "2009-03-03T22:49:47.0000000Z"
tags = ["Unit Testing","Typemock"]
draft = false
+++

<p>Using AAA with Typemock there's a bit of a problem if you want to repeat the returned value a number of times before then doing something different. It's very useful if you are accessing a mocked object within a loop and want to know the number of loop execution.</p>
<p>So I've put together a simple little Typemock extension (but I'm sure it'd adaptable for any mock framework supporting AAA):</p>
<pre><span class="keyword">public</span> <span class="keyword">static</span> <span class="keyword">void</span> WillReturnRepeat&lt;TReturn&gt;(<span class="keyword">this</span> <span class="const">IPublicNonVoidMethodHandler</span> ret, TReturn value, <span class="keyword">int</span> numberOfReturns)
{
    <span class="keyword">for</span> (<span class="keyword">var</span> i = 0; i &lt; numberOfReturns; i++)
        ret.WillReturn(value);
}
</pre>
<p>You then just use it like this:</p>
<pre><span class="const">Isolate</span>.WhenCalled(() =&gt; mockObject.SomeMethod()).WillReturnRepeat(true, 3);
<span class="const">Isolate</span>.WhenCalled(() =&gt; mockObject.SomeMethod()).CallOriginal();
</pre>
<p>So the mock will return <strong>true</strong>&nbsp;3 times and it will do the original call (for the purpose of this demo we'll assume it would return <strong>false</strong>).</p>
<p>Anyone else got some nifty Typemock extensions? &nbsp;</p>