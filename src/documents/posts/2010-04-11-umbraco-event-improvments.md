---
  title: "Umbraco Event Improvements"
  metaTitle: "Umbraco Event Improvements"
  description: "A look at the events changes in Umbraco versions"
  revised: "2010-04-11"
  date: "2010-04-11"
  tags: 
    - "umbraco"
    - "eventing"
  migrated: "true"
  urls: 
    - "/umbraco-event-improvments"
  summary: ""
---
As I mentioned in a previous article [there's a problem with the 4.0 eventing][1]. But not everything is bad news, there's a light at the end of the tunnel!

## Background ##

If you're wanting to learn more about *why* this is the way then I suggest you have a look at [this article about data types][2].

The crux of it really comes down to the design of Data Types and how they are designed.

## Umbraco 4.1 changes ##

When I first noticed the problems I outlined in [the great Umbraco API misconception][1] I decided the look into what I could do about it, but still maintain backwards compatibility with Umbraco 4.0. 

At the very least I changed Umbraco 4.1 to **raise the BeforeSave event before any saving occurs**! It only works when you're using the Document.BeforeSave event, not the other objects which inherit from Content (where the event originates from). Also, this change **only happens when you're using the CMS front-end**.

If you're using the Document API yourself to create documents I've changed the constructor Document(int id, bool optimizedMode) to use deferred saving. This means the save method does actually do the saving!

I didn't not change anything to reduce the number of SQL calls, it just performs the saving after the BeforeSave event fires from within the Save method.

In addition to deferred saving I've also added an indexer to the Document object so you can do:

    var doc = new Document(1234, true);
    var something = (string)doc["MyProperty"];

Personally I think this is much more obvious than the getProperty operation, and it's how I'd expect to interact with them in the future.

Internally the indexer wraps the getProperty method so you can use it in any instance. **But** when you're using it is used with optimized mode it will also **cache the properties**! Every time you call getProperty you go into the database (or so I could gather). When you use the indexer and optimized mode the property accessor looks into an internal cache, sees if it's there and if it isn't gets it from the database, adds it to the cache and saves it for later. This is how the deferred saving works, it looks into the cache to set the property values.

Hopefully this makes the eventing in 4.1 a lot more useful if you need to control the flow better.


  [1]: /the-great-umbraco-api-misconception
  [2]: /umbraco-data-type-design
