---
  title: "Query Syntax vs Method Syntax"
  metaTitle: "Query Syntax vs Method Syntax"
  description: "What's the difference with LINQ to using query syntax to pure lambda expressions?"
  revised: "2010-04-08"
  date: "2009-05-19"
  tags: 
    - "linq"
    - "c#"
    - ".net"
  migrated: "true"
  urls: 
    - "/query-syntax-vs-method-syntax"
  summary: ""
---
While working on an IQueryable&lt;T&gt; provider I was having a problem when doing LINQ statements via the Query Syntax that wasn't happening when using the Method Syntax (chained lambda expressions).

And that problem has lead to an observation I made about LINQ, well, about Expression-based LINQ (ie - something implementing IQueryable, so LINQ to SQL, etc).

I'll use LINQ to SQL for the examples as it's more accessible to everyone.

Take this LINQ statement (where ctx is an instance of my DataContext):

    var items = ctx.Items;

That statement returns an object of Table&lt;Item&gt;, which implements IQueryable&lt;T&gt;, IEnumerable&lt;T&gt; (and a bunch of others that are not important for this instructional). So it's not executed yet, no DB query has occured, etc. Now lets take this LINQ statement:

    var items2 = from item in ctx.Items select item;

This time I get a result of IQueryable&lt;Item&gt;, which implements IQueryable&lt;T&gt; (duh!) and IEnumerable&lt;T&gt; (and again, a bunch of others).

Both of these results have a non-public property called Expression. This reperesents the expression tree which is being used to produce our collection. But here's the interesting part, they are not the same. That's right, although you're getting back basically the same result, the expression used to produce that result is really quite different.

This is due to the way the compiler translates the query syntax of LINQ into a lambda syntax. In reality the 2nd example is equal to this:

    var items2 = ctx.Items.Select(item => item);

But is this really a problem, what difference does it make? In the original examples you actually get back the same data every time. You'll have slightly less overhead by using the access of Table&lt;T&gt; rather than IQueryable&lt;T&gt;, due to the fact that you're not doing a redundant call to Select. But in reality you would not notice the call.

This has caused a problem for me as my direct-access lambda syntax fails my current unit test, where as the query syntax passes. Now to solve that problem! ;)