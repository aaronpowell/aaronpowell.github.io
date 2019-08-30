---
  title: "Dynamic Dictionaries with C# 4.0"
  metaTitle: "Dynamic Dictionaries with C# 4.0"
  description: "Using the C# dynamic features to make it easier to work with Dictionary objects"
  revised: "2010-07-27"
  date: "2010-06-28"
  tags: 
    - "c#"
    - ".net"
    - "dynamic"
    - "umbraco"
  migrated: "true"
  urls: 
    - "/dynamic-dictionaries-with-csharp-4"
  summary: ""
---
Have you ever been working with the `Dictionary<TKey, TValue>` object in .NET and just wanted to find some way in which you can do this:

    var dictionary = new Dictionary<string, string> { { "hello", "world!" } };
    ...
    var something = dictionary.hello;

It'd be sweet, but it's not possible. The dictionary is just a bucket and there isn't a way it can know at compile type about the objects which are within it. Damn, so you just have to go via the indexer of the dictionary.

But really, using dot-notation could be really cool!

Well with the .NET 4.0 framework we now have a built in DLR so can we use the dynamic features of the C# 4 to this?

##Introducing the DynamicObject

Well the answer is yes, yes you can do this, and it's really bloody easy, in fact you can do it in about 10 lines of code (if you leave out error checking and don't count curly braces :P).

First off you need to have a look at the [`DynamicObject` which is in System.Runtime][1]. There's a lot of different things you can do with the `DynamicObject` class, and things which you can change. For this we are going to work with [`TryGetMember`][2], with this we just need to override the base implementation so we can add our own dot-notation handler!

So lets start with a class:

	using System;
	using System.Collections.Generic;
	using System.Dynamic;

	namespace AaronPowell.Dynamics.Collections
	{
		public class DynamicDictionary<TValue> : DynamicObject
		{
			private IDictionary<string, TValue> dictionary;

			public DynamicDictionary(IDictionary<string, TValue> dictionary)
			{
				this.dictionary = dictionary;
			}
		}
	}

Essentially this is just going to be a wrapper for our dynamic implementation of a dictionary. So we're actually making a class which has a private property which takes a dictionary instance into the constructor.

Now we've got our object we need do some work to get it handle our dot-notation interaction. First we'll override the base implementation:

        public override bool TryGetMember(GetMemberBinder binder, out object result)
        {
            var key = binder.Name;
            if (dictionary.ContainsKey(key))
            {
                result = dictionary[key];
                return true;
            }
			throw new KeyNotFoundException(string.Format("Key \"{0}\" was not found in the given dictionary", key));
        }

And you know what, we're actually done! Now all you have to do:

	var dictionary = new Dictionary<string, string> {
		{ "hello", "world!" }
	};

	dynamic dynamicDictionary = new DyanmicDictionary(dictionary);

	Console.WriteLine(dynamicDictionary.hello); //prints 'world'

I'm going to be releasing the source for this shortly (well, an improved version), along with a few other nifty uses for `dynamic`. So keep watching this space for that ;).

##Umbraco

While we were working on some sexy features for Umbraco 5 over the CodeGarden 10 retreat we kept saying that we should look at using as many of the cool new .NET framework features which we can possibly get away with. To this extent we kept saying we need to work out how to implement the `dynamic` keyword in some way.

Well that's where the idea for the above code came from, in fact we've got a similar piece of code which will be usable within the framework of Umbraco 5 and entity design. But the full info on that will belong to another post ;).

##Released!

I've rolled the above code (with some improvements mind you) into a new project that I've been working on for making working with dynamics in .NET a whole lot easier. You can check out my [Dynamics Library][3] and get dynamacising.


  [1]: http://msdn.microsoft.com/en-us/library/system.dynamic.dynamicobject.aspx
  [2]: http://msdn.microsoft.com/en-us/library/system.dynamic.dynamicobject.trygetmember.aspx
  [3]: {{< ref "/posts/2010-07-05-dynamics-library.md" >}}