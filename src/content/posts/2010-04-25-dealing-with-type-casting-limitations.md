---
  title: "Dealing with type-casting limitations"
  metaTitle: "Dealing with type-casting limitations"
  description: "Looking at a limit with type casting in .NET 3.5 and how .NET 4.0 can help solve it."
  revised: "2010-04-25"
  date: "2010-04-25"
  tags: 
    - ".net"
    - "c#"
    - "c#-4"
    - "dynamic"
    - "type-casting"
    - "umbraco"
  migrated: "true"
  urls: 
    - "/dealing-with-type-casting-limitations"
  summary: ""
---
    Well this is the first post involving the .NET 4.0 framework, woo :D.

Something I've had a problem with from within the abstract service lay which we use at TheFARM.
It's a limitation of the .NET framework and how you can do type casting within the .NET framework.

The way we use our service layer is to never return classes, we only return interfaces, so you can't write a method which looks like this:

    public IEnumerable<IProduct> GetProducts() { 
      return ctx.Products.AsEnumerable();
    }

This will throw an exception, even if the class Product implements the IProduct interface. To achieve it you need to do this:

    public IEnumerable<IProduct> GetProducts() { 
      return ctx.Products.Cast<IProduct>();
    }

This is a bit of a pain if you're doing complex type conversion though, particularly with our [LINQ to Umbraco framework][1] (*not the actual LINQ to Umbraco framework coming in Umbraco 4.1*).

The problem really came up when I decided I wanted to change from using a constructor which takes an XElement, so you could write cleaner code like this:

    public IEnumerable<IUmbEvent> GetEvents() 
    { 
        XElement xNode = UmbXmlLinqExtensions.GetNodeByXpath(EventContainerXPath); 
    
        var eventData = xNode 
            .UmbSelectNodes() //selects all descendant "node" nodes 
            //selects nodes of a certain alias 
            .UmbSelectNodesWhereNodeTypeAlias(EventNodeTypeAlias) 
            //This does the object conversion 
            .Select(x => (UmbEvent)x) 
            //ensure we don't return events with no start date 
            .Where(x => x.FromDate != DateTime.MinValue); 
    
        return eventData.Cast<IUmbEvent>(); 
    } 

Still we're doing a Select and a Cast, since now I've got an [explicit operator][2] defined for doing the conversion between XElement and UmbEvent, so I thought, why can't I just do this:

    public IEnumerable<IUmbEvent> GetEvents() 
    { 
        XElement xNode = UmbXmlLinqExtensions.GetNodeByXpath(EventContainerXPath); 
    
        var eventData = xNode 
            .UmbSelectNodes() //selects all descendant "node" nodes 
            //selects nodes of a certain alias 
            .UmbSelectNodesWhereNodeTypeAlias(EventNodeTypeAlias) 
            //This does the object conversion 
            .Cast<UmbEvent>() 
            //ensure we don't return events with no start date 
            .Where(x => x.FromDate != DateTime.MinValue); 
    
        return eventData.Cast<IUmbEvent>().ToList(); 
    } 

But alas that wont work, due to the way the [Cast<TResult>][3] method works it's not possible, very annoying.
So I can't directly return a collection of types which implement the required interface, and I can't use the Cast method to just do all the conversions, I have to write select methods.
This just means I have a bunch of code smell, it's not really causing any problems, it's just ugly. I do love some clean code, and this isn't really it :(

So I thought, why not write my own extension method to do the casts, something that has a return statement like this:

    yield return (TInterface)(TType)item;

Assuming that `TType` inherits `TInterface`, you can write generic constrictions which handles that, but you will receive a compile error, it can't be confirmed by the compiler that the type of item implements an explicit operator to cast it as TType.

Damn, looks like we can't do it with .NET 3.5.

##Enter the world of .NET 4.0##

So I decided to see if I can actually achieve it, no matter what was required, but I didn't want the code to look *too terrible*.

As I'm sure you're all aware .NET 4.0 is bringing in a new keyword, `dynamic`, which then in turn works with the DLR to do the runtime operation. And you know what, we can leverage the runtime feature to delay the conversion.

Lets have a look at the extension method, and then we'll break it down:

    public static IEnumerable<TInterface> AsType<TType, TInterface>(this IEnumerable source)
        where TInterface : class
        where TType : TInterface, new()
    {
        if (!typeof(TInterface).IsInterface)
        {
            throw new ArgumentException("TInterface must be an Interface type");
        }
    
        foreach (var item in source)
        {
            dynamic d = item;
            yield return (TInterface)(TType)d; 
        }
    }

So I've got an extension method which has 3 types in it:

 - Type for the collection items
 - Type of the class
 - Type of the interface

I'm doing a check of the `TInterface` type to make sure it is an Interface, if it's not then we'd have a problem :P

The really exciting part is this:

    foreach (var item in source)
    {
        dynamic d = item;
        yield return (TInterface)(TType)d; 
    }

Here we enumerate through our collection, *but turn each item into a `dynamic` version*! This means we can then do the complete type conversion and `delay its evaluation until runtime`!

Woo! Now I can have code like this:

    IEnumerable<int> numbers = Enumerable.Range(0, 10);
    IEnumerable<IMyType> casted = numbers.AsType<MyType, IMyType>();

Sweet, now I can make my service method like this:

    public IEnumerable<IUmbEvent> GetEvents() 
    { 
        XElement xNode = UmbXmlLinqExtensions.GetNodeByXpath(EventContainerXPath); 
    
        return xNode 
            .UmbSelectNodes() //selects all descendant "node" nodes 
            .AsType<UmbEvent, IUmbEvent>()
            .Where(x => x.FromDate != DateTime.MinValue); 
    } 

So pretty, I'm much happier... well once I can get to use more .NET 4.0.
Oh, and yes, there is a performance hit for this, since we're using the DLR the conversion is evaluated at runtime, not compile time. It's probably not huge (I didn't do any performance testing), but just something to be kept in mind.

  [1]: http://farmcode.org/post/2009/02/24/Linq-to-Umbraco.aspx
  [2]: /why-does-this-code-work
  [3]: http://msdn.microsoft.com/en-us/library/bb341406.aspx