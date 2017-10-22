+++
title = "A LINQ observation"
date = "2009-03-19T12:44:44.0000000Z"
tags = ["LINQ","LINQ to SQL","Umbraco","LINQ to Umbraco"]
draft = false
+++

<p>Well I'm making good headway with LINQ to Umbraco, in the next few days I'll be doing a very interesting check in (which I'll also blog here about). My tweet-peeps already have an idea of what it entails, but there's a bit of a problem with it still which I want to address before the commit.</p>
<p>And that problem has lead to an observation I made about LINQ, well, about <em>Expression</em>-based LINQ (ie - something implementing IQueryable, so LINQ to SQL, or LINQ to Umbraco, etc).</p>
<p>I'll use LINQ to SQL for the examples as it's more accessible to everyone.</p>
<p>Take this LINQ statement (where <strong>ctx</strong> is an instance of my DataContext):</p>
<p>var items = ctx.Items;</p>
<p>That statement returns an object of Table&lt;Item&gt;, which implements IQueryable&lt;T&gt;, IEnumerable&lt;T&gt; (and a bunch of others that are not important for this instructional). So it's not executed yet, no DB query has occured, etc. Now lets take this LINQ statement:</p>
<p>var items2 = from item in ctx.Items select item;</p>
<p>This time I get a result of IQueryable&lt;Item&gt;, which implements IQueryable&lt;T&gt; (duh!) and IEnumerable&lt;T&gt; (and again, a bunch of others).</p>
<p>Both of these results have a non-public property called Expression. This reperesents the expression tree which is being used to produce our collection. But here's the interesting part,<strong> they are not the same</strong>. That's right, although you're getting back <em>basically</em> the same result, the expression used to produce that result is really quite different.<br />This is due to the way the compiler translates the query syntax of LINQ into a lambda syntax. In reality the 2nd example is equal to this:</p>
<p>var items2 = ctx.Items.Select(item =&gt; item);</p>
<p>&nbsp;</p>
<p>But is this really a problem, what difference does it make? In the original examples you actually get back the same data every time. You'll have <em>slightly</em> less overhead by using the access of Table&lt;T&gt; rather than IQueryable&lt;T&gt;, due to the fact that you're not doing a redundant call to Select. But in reality you would not notice the call.</p>
<p>This has caused a problem for me as my direct-access lambda syntax fails my current unit test, where as the query syntax passes. Now to solve that problem! ;)</p>