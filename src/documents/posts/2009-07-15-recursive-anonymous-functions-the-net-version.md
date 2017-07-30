---
  title: "Recursive anonymous functions - the .NET version"
  metaTitle: "Recurvie anonymous functions - the .NET version"
  description: "To know recursion you must first know recursion"
  revised: "2010-04-08"
  date: "2009-07-15"
  tags: []
  migrated: "true"
  urls: 
    - "/recursive-anonymous-functions-the-net-version"
  summary: ""
---
When playing around with JavaScript I decided to have a look at creating [recursive anonymous functions][1], which are a good bit of fun.

Well I decided to have a challange, could you do it in .NET? Well lets ignore the pointlessness of the exercise and just enjoy the challenge.

Well, I did it, it's sure as shit isn't pretty but hey, it works. In this post I'll show off how it works, but to sum it up - **Reflection**. But not where near as much as you'd think.

Part of why I wanted to try it was for LINQ to Umbraco, see the performance of how we're loading nodes at the moment and if we could optimise it (and this isn't the way if there is one!).
I'm doing a recursive call against a XML file, trying to find a node which is at a depth I don't know.

With JavaScript functions there's the really nice argument.callee which is a reference to the method executing the current method, sadly in .NET we don't have that, so we have to find it ourselves.
Remember, this is an anonymous function, but .NET doesn't have true anonymous functions, the compiler creates it on our behalf. The method name is something like "<>b__0", but it's compile time generated so I don't really know (I'm sure if you read the documentation on the C# compiler you may be able to work it out, good luck with that :P).

We need to look into the stack frame to work out where we are, like this:

    var thisMethod = new StackFrame(0).GetMethod();

This will return an object representatnion of the current method, which we can invoke ourselves!

    return (XElement)thisMethod.Invoke(e, new object[] { ee });

But what's the invoke doing? Well we're passing in an instance of the current XElement (e) and we're doing it for each of that XElements children (e.Elements(), represented by ee). Here's the recursive part of the method.

So lets put it all together:

	if (e.Name == "what_i_want")
	{
		return e;
	}
	else
	{
		if (e.Elements().Count() != 0)
		{
			var thisMethod = new StackFrame(0).GetMethod();
			foreach (XElement ee in e.Elements())
				return (XElement)thisMethod.Invoke(e, new object[] { ee });
		}
		return null;
	}

So that's the body of the anonymous function, where the variable **e** is a XElement object. We check the name against the one we want, if it's not we'll check it's children.
Alternatively you could do this as a Func<XElement, bool> which would only return the items into the IEnumerable<>, but by returning null we can see how many trees were followed which turned out to be duds. Just change the return statements to boolean values and pass it to anything that takes Func<XElement, bool> (like Where, First, etc).

So how do we use it? Like this:

	var nodes = root.Elements().Select(e =>
	{
		if (e.Name == "what_i_want")
		{
			return e;
		}
		else
		{
			if (e.Elements().Count() != 0)
			{
				var thisMethod = new StackFrame(0).GetMethod();
				foreach (XElement ee in e.Elements())
					return (XElement)thisMethod.Invoke(e, new object[] { ee });
			}
			return null;
		}
	});

And how does it perform, well it's about 10x slower, but hey, there's nothing wrong with trying to achieve something crazy! :P

  [1]: /Recursive-anonymous-functions