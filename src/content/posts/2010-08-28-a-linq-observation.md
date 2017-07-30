---
  title: "A LINQ observation"
  metaTitle: "A LINQ observation"
  description: ""
  revised: "2010-08-28"
  date: "2010-08-28"
  tags: 
    - ".net"
    - "linq"
  migrated: "true"
  urls: 
    - "/a-linq-observation"
  summary: "This article was migrated from old website, originally dated 19 March 2009"
---
Well I'm making good headway with LINQ to Umbraco, in the next few days I'll be doing a very interesting check in (which I'll also blog here about). My tweet-peeps already have an idea of what it entails, but there's a bit of a problem with it still which I want to address before the commit.

And that problem has lead to an observation I made about LINQ, well, about Expression-based LINQ (ie - something implementing IQueryable, so LINQ to SQL, or LINQ to Umbraco, etc).

I'll use LINQ to SQL for the examples as it's more accessible to everyone.

Take this LINQ statement (where ctx is an instance of my DataContext):

    var items = ctx.Items;

That statement returns an object of `Table<Item>`, which implements `IQueryable<T>`, `IEnumerable<T>` (and a bunch of others that are not important for this instructional). So it's not executed yet, no DB query has occurred, etc. Now lets take this LINQ statement:

    var items2 = from item in ctx.Items select item;

This time I get a result of `IQueryable<Item>`, which implements `IQueryable<T>` (duh!) and `IEnumerable<T>` (and again, a bunch of others).

Both of these results have a non-public property called Expression. This reperesents the expression tree which is being used to produce our collection. But here's the interesting part, they are not the same. That's right, although you're getting back basically the same result, the expression used to produce that result is really quite different.

This is due to the way the compiler translates the query syntax of LINQ into a lambda syntax. In reality the 2nd example is equal to this:

    var items2 = ctx.Items.Select(item => item);

But is this really a problem, what difference does it make? In the original examples you actually get back the same data every time. You'll have slightly less overhead by using the access of `Table<T>` rather than `IQueryable<T>`, due to the fact that you're not doing a redundant call to Select. But in reality you would not notice the call.

This has caused a problem for me as my direct-access lambda syntax fails my current unit test, where as the query syntax passes. Now to solve that problem! ;)
