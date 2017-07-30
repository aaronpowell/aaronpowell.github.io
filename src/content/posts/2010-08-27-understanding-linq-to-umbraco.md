---
  title: "Understanding LINQ to Umbraco"
  metaTitle: "Understanding LINQ to Umbraco"
  description: "A look what LINQ to Umbraco is and what it isn't"
  revised: "2010-09-06"
  date: "2010-08-27"
  tags: 
    - "umbraco"
    - "linq-to-umbraco"
  migrated: "true"
  urls: 
    - "/understanding-linq-to-umbraco"
  summary: ""
---
When LINQ to Umbraco dropped with Umbraco 4.5.0 there was a lot of excitement around it and everyone started using it. Personally I was thrilled about this, LINQ to Umbraco was the culmination of 6 months of really solid development effort and I was glad to see that it was paying off.

But like all new technologies there can be miss-conceptions about what it is and what it isn't and hopefully I'll shed a bit of light on what the goal of LINQ to Umbraco is, what it is and what it isn't.

##Project Goals

When I set about writing LINQ to Umbraco it was because I was frustrated at the lack of type safety coming from the NodeFactory API. This combined with the proliferation of magic strings to represent the properties made me think that there had to be a better way to go about it. Initial I achieved this with a project I dubbed the **Umbraco Interaction Layer** which was basically a wrapper for the Document API as I was doing a lot of creating and editing of nodes at the time using the API and I wanted it strongly typed.

Once I did the initial version of that I realised that people were wanting to do *reads* with it too, but this was **not** what the UIL was designed for, in fact reading was a REALLY bad idea with it as it relied on the Document API and did a hell of a lot of database calls.

So I set about doing a new version, a *real* version of LINQ to Umbraco, and something that looked a lot like LINQ to SQL.

While doing the initial design for LINQ to Umbraco I decided on a few core ideas:

* No reliance on any underlying API
* Extensibility
* Testability
* Close resemblance LINQ to SQL (which I was heavily working with at the time, and this was before it was killed :P)

And for the most part LINQ to Umbraco that we see today does match with what I set out to achieve.

##Removing the reliance on underlying API's

This was really a core goal of mine with LINQ to Umbraco, I didn't want to be tied to the Umbraco XML, nor did I want to be tied to the Document API, I'd made that mistake before and it cost me with the extensibility of the UIL, so I wanted to work out a way around this.

While doing research into how LINQ to SQL works I came across something interesting, LINQ to SQL does *kind of* have the ability to swap out the data source. Seriously, if you check out the DataContext class in Reflector you'll see that there's a private field called `provider` which is the way it connects to the database. So LINQ to SQL could have been a more extensible framework ([well, you can make it so via reflection][1]) why not follow the same idea and make LINQ to Umbraco provider based?

And that's essentially what I did, in the form of the `UmbracoDataProvider` class. Since I figured that 99% of the time people are going to want to work with LINQ to Umbraco and not have to think about it I decided that I should create a default one that would work with the XML, as that's what most people would be doing with it, replacing NodeFactory. This goal was achieved by creating the `NodeDataProvider`, which the default constructor for the `UmbracoDataContext` will use. Note that it's called the `**Node**DataProvider`, implying that it works with the idea of `Node` in Umbraco, which is read-only (we'll come to this shortly).

So ultimately what we've ended up with is a read-only way of accessing data in a strongly typed fashion in Umbraco.

##Extensibility and LINQ to SQL

As I mentioned about LINQ to SQL had the initial design to be extensible (but since it's being killed off at the moment in favor of Entity Framework I can understand the lacking desire to maintain to provider-based ORM's :P) I wanted to have something similar with LINQ to Umbraco. By having the `UmbracoDataProvider` a class which you pass into the `UmbracoDataContext` you could easily swap this out for something else that you've written (at [CodeGarden 09 I did a PoC of this][2] with a ***very*** early version of LINQ to Umbraco and reading an RSS feed, this code **will not work with 4.5** but is designed to get your brain working).

And because I was going for LINQ to SQL as the original model for what I wanted I decided that I should try and maintain as much of the LINQ to SQL features as I wanted, one of the features that I ported is the `SubmitChanges` method.

##CRUD with LINQ to Umbraco

This has caused a bit of confusion and it's a lot to do with me not having written this section of my blog post already.

On the question of "Does LINQ to Umbraco support CRUD?" the short answer is Yes, with the long answer being "Yes, but only if your UmbracoDataProvider supports it".

If you try doing `SubmitChanges` in LINQ to Umbraco with the `NodeDataProvider` you'll wind up with a `System.NotSupportedException` being thrown. The reason for this is, as I mentioned earlier, the `NodeDataProvider` is **read-only**. Remember it maps to the concept of `Node` in Umbraco.

At the moment there is no released `UmbracoDataProvider` that I'm aware of which supports writing to the Umbraco database (or any database for that matter) but it is something that I hope to one day write about, it's on my ever-increasing TODO list :P.

So basically out of the box LINQ to Umbraco will throw errors (and hopefully relevant errors) indicating that you're not allowed to do CRUD.

##Testability

Another equally high priority feature of LINQ to Umbraco that I wanted was the ability to test it. Umbraco is notoriously hard to test, [I've written about it in the past][3], so I didn't want to introduce anything with LINQ to Umbroco which would make it harder to do testing, in fact I wanted to introduce something that would make it easier to test.

To this end everything that you (should) need to be able to override in a unit testing scenario can be overridden in a unit testing scenario.

I wont go into how to do that here, it's something that deserves an entire set of articles but if you're interested in unit testing with Umbraco I recommend you check out the article linked above.

##Right tool for the right job

LINQ to Umbraco was never designed to be a full replacement for everything Umbraco does, in fact it's really designed as an alternative to XSLT's.

You wouldn't (well at least you shouldn't) use XSLT to output a property from the current node in a page, and additionally you shouldn't use LINQ to Umbraco for that. That is the role of &lt;umbraco:Item /&gt; and don't take that away from it!

Something that people are starting to notice with LINQ to Umbraco is there is no built-in way to get the current page as a LINQ to Umbraco object. The reason for this is that LINQ to Umbraco is flat, it doesn't *really* understand hierarchies, because hierarchies is something that is really a concept of the published Umbraco data (and to a lesser extent the database).

With LINQ to Umbraco you can easily access data from anywhere in the site, the `UmbracoDataContext` gives you list of all your types and you can grab all your data there, it's not until you have an object can you start understanding hierarchies. From a single object you can go down and up it's object graph, because now you have a contextual point to work with.

So when you're thinking "Is LINQ to Umbraco right for me?" think about what you're trying to achieve, if you want to work with just the current node then it's probably not the right tool for you, in fact you're probably even better off with just the standard Umbraco displaying of a node.

##To dispose or not to dispose?

Something that you may notice with LINQ to Umbraco is that the `UmbracoDataContext` and the `UmbracoDataProvider` are both disposable objects, this was also ported from the LINQ to Umbraco idea, but generally it's a bit less-than-desirable to achieve full disposal constantly.

The `NodeDataProvider` itself has quite a bit of caching built into it. Every time you request an object it will be looked up in its internal cache before it's created, just in case it has previously been found. So deciding if you should be disposing of your object at the end of the unit of work really depends on how big your site is. A lot of the implementations which I've worked on we've actually chosen to run a singleton instance of the objects, and the reason for this is that we've got large sites.

There is nothing *wrong* with running a singleton for the `UmbracoDataContext` and `UmbracoDataProvider` objects, just keep in mind that you may get stale data. On the `NodeDataProvider` there is a `Flush` method, this will essentially force the cache to be cleared within it so that next time you'll get new objects from the XML. The reason that the `Flush` method doesn't reside on the `UmbracoDataProvider` is because it should be up to the implementor of the `UmbracoDataProvider` to decide if/ how they are caching objects.

##IQueryable

LINQ to Umbraco doesn't implement IQueryable, instead it implements IEnumerable. If you're interested in understanding why IEnumeraable was used rather than IQueryable I have [covered that in its own article][4].

##Conclusion

Hopefully this article has given you a bit of an insight into how LINQ to Umbraco was designed, what it was designed for and how you should be use it.

Everyone who's using it keep your feedback coming so that we can look to expand and evolve LINQ to Umbraco in Umbraco 4.5 and Umbraco 5.


  [1]: http://blogs.msdn.com/b/mattwar/archive/2008/05/04/mocks-nix-an-extensible-linq-to-sql-datacontext.aspx
  [2]: /rssdataprovider-for-linq-to-umbraco
  [3]: /unit-testing-with-umbraco
  [4]: /iqueryable-linq-to-umbraco