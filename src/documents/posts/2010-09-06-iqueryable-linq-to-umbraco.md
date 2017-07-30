---
  title: "Why no IQueryable in LINQ to Umbraco?"
  metaTitle: "Why no IQueryable in LINQ to Umbraco?"
  description: "Why does LINQ to Umbraco not implement the IQueryable interface?"
  revised: "2010-09-06"
  date: "2010-09-06"
  tags: 
    - "umbraco"
    - "linqtoumbraco"
  migrated: "true"
  urls: 
    - "/iqueryable-linq-to-umbraco"
  summary: ""
---
In the theme of blogs answering questions which aren't being asked I though I would have a bit of a look at why LINQ to Umbraco isn't an IQueryable-based LINQ implementation. 

With a previous article I covered [Understanding LINQ to Umbraco][1], but the topic of IQueryable wasn't in it, partially because it's an involved topic.

So let's have a look at why LINQ to Umbraco isn't using IQueryable.

##Understanding IQueryable

To understand why we're not using IQueryable we need to have a bit of an understanding of IQueryable. IQueryable is a super-set of IEnumerable, allowing you to inspect what query is being and transform it into your underlying query language.

This is why it is good for something like LINQ to SQL or Entity Framework. You can take the strongly typed version of the query (expression tree), generated in C# or VB.Net, and then pull it apart and turn it into SQL.

So this is quite a handy feature if you have an underlying query language which you want to work against.

But this can also cause some problems, if you're not careful, one of the biggest hurdles is performance.

Since IQueryable requires transforming your expression tree into the "real" language, executing it and then turning the resulting dataset back into the .Net types required you can loose a bit in performance. You can't not have performance drawbacks from this.

##The decision in Umbraco

So while building LINQ to Umbraco we did analysis of what the most common use for it would be, and that would be as an alternative to the NodeFactory API. This meant working with the XML cache, and the question is would there be a benefit to IQueryable. Ultimately it turned out that the answer to that is no. With .NET 3.5 it was apparent that the LINQ to XML API was the way which Microsoft was going to go with for working with XML, but that had an inherit problem. LINQ to XML is actually an implementation of IEnumerable, *not* IQueryable. This means that implementing IQueryable in LINQ to Umbraco would be having to translate the IQueryable queries into IEnumerable queries.

This isn't *that* hard a task (it just requires compiling the expression tree), but you'd be loosing quite a bit of performance. It was a lot quicker to work with in-memory collections, rather than trying to "lazy load" the XML into LINQ to Umbraco objects.

It is true though that this can have memory issues, and still have performance problems especially if you're working a really large website. But analysis shows that the majority of sites are of a size that the performance loss of IQueryable would be less than the in-memory implementation.

##The other problem...

There's one other problem with using IQueryable, it's a **huge** thing to implement. We wanted LINQ to Umbraco to be fully featured, but to achieve that you have to think about what expression tree branches are going to be covered. Take this query for example:

	var pages = from page in ctx.TextPages
				where page.BodyText.Contains("Umbraco")
				select page;

So to implement this you need to:

* Look at the type you require
* Find the `BodyText` property
* Look at the method invocation to `string.Contains`
* Find the argument being passed to `string.Contains`
* Select the items back into LINQ to Umbraco types

And that's just a basic query, imagine:

* Join statements
* GroupBy
* Ordering
* Multi-conditional Where clauses

There's a lot of things which can be done with LINQ, and that's not to mention handling CLR methods, simple arithmetic operators, etc. Writing a fully-fledged IQueryable provider is a big task!

##Conclusion

So this was just a bit of a look as to why we didn't go the route of IQueryable for LINQ to Umbraco.

But if you're really keep, you can implement IQueryable yourself when you're writing your own custom LINQ provider, who knows, I might even look at that at some point ;).


  [1]: /understanding-linq-to-umbraco