---
  title: "Using Lazy<T> with KeyedCollection"
  metaTitle: "Using Lazy<T> with KeyedCollection"
  description: "How to create and return KeyedCollection which use Lazy<T> under the hood"
  revised: "2010-09-22"
  date: "2010-09-22"
  tags: 
    - ".net"
    - "collections"
  migrated: "true"
  urls: 
    - "/lazy-keyedcollections"
  summary: ""
---
For a project which I'm currently working on I've got a few custom collections which I need to return from various methods on a data repository. There's a bit of heavy lifting that is done in each of the repository methods so I wanted to have a way which each of them could be lazy loading the items into the collection. This would also mean that if you're only wanting a subset of the collection you don't create all the objects.

Since the collections are representing a data model I decided that I'd go with the [KeyedCollection][1], as it's a well designed collection for what I need, similar to a List but had a key for each item. And since we're representing a data model having a key is important.

There's a handy class in the .NET 4.0 framework which I wanted to use, [Lazy&lt;T&gt;][2] which is handy as it takes a lambda statement into the constructor so that I defer the object creation.

## Introducing KeyedCollection

If you haven't worked with KeyedCollection before it's quite a handy class. It's an abstract class so you have to implement it when ever you want to use it. The reason for this is that you have to implement a method called [`GetKeyForItem`][3] which tells the collection how to resolve the key for each item. This is where KeyedCollection differs from the [Dictionary][4] class; for a Dictionary you need to pass in the key value each time.

I'm sure you can see the advantage of the KeyedCollection now for what I'm doing, it can reduce code smell quite nicely.

## Getting Lazy

So let's get started with making a collection which is lazy and we'll have a look at something which tripped me up when implementing it.

For the purpose of this blog I've got some stubbed out classes that could represent a data entity, one called `Id`:

    class Id
    {
        public string Alias { get; set; }
        public string Name { get; set; }
    }

This will be the key in our collection, and an `Entity` class:

    class Entity
    {
        public Id Id { get; set; }
        public DateTime CreatedDate { get; set; }
    }

We'll be creating an implementation of `KeyedCollection` and lets start with our basic class:

    class LazyKeyedCollection<T> : KeyedCollection<Id, Lazy<T>>
            where T : Entity
    {
        protected override Id GetKeyForItem(Lazy<T> item)
        {
            throw new NotImplementedException();
        }
    }

In this implementation I've made the collection a generic so that you can sub-class out the `Entity` object (which is likely if we were implementing this into a full-scale application, as I'm doing). You'll notice that `KeyedCollection` actually is `KeyedCollection<Id, Lazy<T>>`, which is wrapping our generic argument into the `Lazy` object.

As I mentioned above we need to implement a method which tells it how we're going to get the key from the object (our `Entity`), so let's implement that:

    protected override Id GetKeyForItem(Lazy<T> item)
    {
        //access the real item from the lazy object
        return item.Value.Id;
    }

So here's how the collection object will determine what is the key is for each item. But we're after something that's happening in a lazy fashion, so let's write a little application to use it and we'll make sure that it is lazy like we expect:

    class Program
    {
        static void Main(string[] args)
        {
            var range = Enumerable.Range(0, 10);

            var lkc = new LazyKeyedCollection<Entity>();
            foreach (var item in range)
            {
                var i = item;
                Console.WriteLine("Adding item " + i + " to LazyKeyedCollection");
                lkc.Add(new Lazy<Entity>(() =>
                {
                    var e = new Entity();

                    e.Id = new Id
                    {
                        Alias = i.ToString(),
                        Name = "LazyKeyedCollection item " + i
                    };
                    e.CreatedDate = DateTime.Now;

                    Console.WriteLine("Created entity '" + e.Id.Name + "'");
                    return e;
                }));
            }
        }
    }

> Adding item 0 to LazyKeyedCollection

> Created entity 'LazyKeyedCollection item 0'

> Adding item 1 to LazyKeyedCollection

> Created entity 'LazyKeyedCollection item 1'

> Adding item 2 to LazyKeyedCollection

> Created entity 'LazyKeyedCollection item 2'

> Adding item 3 to LazyKeyedCollection

> Created entity 'LazyKeyedCollection item 3'

> Adding item 4 to LazyKeyedCollection

> Created entity 'LazyKeyedCollection item 4'

> Adding item 5 to LazyKeyedCollection

> Created entity 'LazyKeyedCollection item 5'

> Adding item 6 to LazyKeyedCollection

> Created entity 'LazyKeyedCollection item 6'

> Adding item 7 to LazyKeyedCollection

> Created entity 'LazyKeyedCollection item 7'

> Adding item 8 to LazyKeyedCollection

> Created entity 'LazyKeyedCollection item 8'

> Adding item 9 to LazyKeyedCollection

> Created entity 'LazyKeyedCollection item 9'

Oh crap, look at that, we're evaluating the lambda expression way to early, in fact it's happening as soon as we add the item into the collection. That doesn't sound very lazy now does it?

So why did this happen? Well the problem is the `GetKeyForItem` method. Because we have to tell the collection how to find the key it has to *create the object* before it can resolve the key! Well shit, that's not good, we're completely missing the point of creating a lazy collection.

This is where I got tripped up in my implementation, so I needed to find another way around what I was doing...

## Getting Lazier

We've got a problem, we need to know the ID of the object, but we don't want to create the object. So how to do this... We'll do a different implementation of our lazy collection:

    class LazyKeyedCollectionMark2<T> : KeyedCollection<Id, KeyValuePair<Id, Lazy<T>>>
        where T : Entity
    {
        protected override Id GetKeyForItem(KeyValuePair<Id, Lazy<T>> item)
        {
            throw new NotImplementedException();
        }
    }

There's a very subtle change in this implementation, now the *value* type argument of the `KeyedCollection` is no longer just `Lazy<T>` but instead it is `KeyValuePair<Id, Lazy<T>>` and this means that our implementation of `GetKeyForItem` is refactored to look like this:

	protected override Id GetKeyForItem(KeyValuePair<Id, Lazy<T>> item)
	{
		return item.Key;
	}

Well now our `item` object already knows about the key without having to request it from our lazy object, so this should be nice and easy to work with, let's add test it to make sure that we're really lazy with this new code:

	var lkcm2 = new LazyKeyedCollectionMark2<Entity>();
	foreach (var item in range)
	{
		var i = item;
		Console.WriteLine("Adding item " + i + " to LazyKeyedCollectionMark2");
		Id id = new Id
		{
			Alias = i.ToString(),
			Name = "LazyKeyedCollectionMark2 item " + i
		}; 
		
		lkcm2.Add(new KeyValuePair<Id, Lazy<Entity>>(id, new Lazy<Entity>(() =>
		{
			var e = new Entity();

			e.Id = id;
			e.CreatedDate = DateTime.Now;

			Console.WriteLine("Created entity '" + e.Id.Name + "'");
			return e;
		})));
	}

And what does it output:

> Adding item 0 to LazyKeyedCollectionMark2

> Adding item 1 to LazyKeyedCollectionMark2

> Adding item 2 to LazyKeyedCollectionMark2

> Adding item 3 to LazyKeyedCollectionMark2

> Adding item 4 to LazyKeyedCollectionMark2

> Adding item 5 to LazyKeyedCollectionMark2

> Adding item 6 to LazyKeyedCollectionMark2

> Adding item 7 to LazyKeyedCollectionMark2

> Adding item 8 to LazyKeyedCollectionMark2

> Adding item 9 to LazyKeyedCollectionMark2

Fantastic! We're not creating the object when we're adding it to the collection, and that's what we wanted to see. Now let's test iterating through the collection, and just output the `CreatedDate` property:

    foreach (var item in lkcm2)
    {
        Console.WriteLine(item.Value.Value.CreatedDate.ToString("hh:mm:ss.ffffzzz"));
    }

Eww, that's ugly, cuz we're getting back a `KeyValuePair` object we have to grab out the through the `Value` property, and then cuz we've still got our `Lazy<T>` object we have access its `Value` property. This has really added some code-smell back in so let's see if we can clean it up a bit. We'll override the `GetEnumerator` of our collection:

    public new IEnumerator<T> GetEnumerator()
    {
        foreach (var item in this.Dictionary.Values)
            yield return item.Value.Value;
    }

Now we'll be getting back the actual instance of `T` rather than our double-wrapped version of it. Now our foreach looks like this:

    foreach (var item in lkcm2)
    {
        Console.WriteLine(item.CreatedDate.ToString("hh:mm:ss.ffffzzz"));
    }

And the result looks like this:

> Created entity 'LazyKeyedCollectionMark2 item 0'

> 09:23:59.1277+10:00

> Created entity 'LazyKeyedCollectionMark2 item 1'

> 09:23:59.1807+10:00

> Created entity 'LazyKeyedCollectionMark2 item 2'

> 09:23:59.1827+10:00

> Created entity 'LazyKeyedCollectionMark2 item 3'

> 09:23:59.1847+10:00

> Created entity 'LazyKeyedCollectionMark2 item 4'

> 09:23:59.1857+10:00

> Created entity 'LazyKeyedCollectionMark2 item 5'

> 09:23:59.1877+10:00

> Created entity 'LazyKeyedCollectionMark2 item 6'

> 09:23:59.1887+10:00

> Created entity 'LazyKeyedCollectionMark2 item 7'

> 09:23:59.1907+10:00

> Created entity 'LazyKeyedCollectionMark2 item 8'

> 09:23:59.1907+10:00

> Created entity 'LazyKeyedCollectionMark2 item 9'

> 09:23:59.1927+10:00

And you can see from the time stamp we're not creating each object until it's requested from the collection. This means that if we were to grab a subset we'd not have some of the created at all!

## Conclusion

Here we've looked at how to use the `KeyedCollection` and `Lazy<T>` to create a lazy loaded collection which we can work with, and how we can ensure that the collection items are lazy loaded at time of enumeration.

You can grab the source from this blog post off [my bitbucket][5].

### Footnote

Although this implementation *works* it's not without drawbacks. If you're wanting to use LINQ you'll find that it works a little bit differently, you need to have an **explicit implementation* of `IEnumerable<T>`, so you can replace the one which is defined by the superclass. This is all the committed code.

You'd be much better off doing an implementation of `IDictionary` and `IList` on the same object, rather than trying to work with `KeyedCollection`. Because of the way the .NET framework classes implements the `IEnumerable` interface it's a lot harder to get access to the methods (they aren't virtual) so to override them you have to do your own explicit implementations of the interface and use the `new` keyword when you can.


  [1]: http://msdn.microsoft.com/en-us/library/ms132438.aspx
  [2]: http://msdn.microsoft.com/en-us/library/dd642331.aspx
  [3]: http://msdn.microsoft.com/en-us/library/ms132454.aspx
  [4]: http://msdn.microsoft.com/en-us/library/xfhwa508.aspxBlockquote
  [5]: http://bitbucket.org/slace/lazy-collections/