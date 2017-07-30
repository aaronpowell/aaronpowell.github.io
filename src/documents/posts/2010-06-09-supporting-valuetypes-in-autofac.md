---
  title: "Supporting ValueTypes in Autofac"
  metaTitle: "Supporting ValueTypes in Autofac"
  description: "Autofac doesn't support injection of value types as properties, here's how to support it."
  revised: "2010-06-14"
  date: "2010-06-09"
  tags: 
    - "autofac"
    - "c#"
  migrated: "true"
  urls: 
    - "/supporting-valuetypes-in-autofac"
  summary: ""
---
Today I had an interesting problem with Autofac in which I was registering an `Enum` that I wanted to inject into my different objects. Some of the injection was being done on the properties, as this is an ASP.NET project and I wanted to inject into are UserControls.

But when ever I was doing it, I wasn't getting the registered value. My component registry was working file, if I manually tried to get it out it worked fine, but the property was not set!

This was getting really frustrating, so after a bit of debugging into the Autofac source I found that the problem was that during the wiring up there is a check of each property of the object to see if it is able to be injected. One of the conditions to ignore the property is whether it's a ValueType.

Now I'm not going to speculate about why it's this way, I have a hunch but that's beyond the scope of what I want to answer here, what I want to answer is the *how* to do it.

##Working with Autofac events

Autofac has a very nice feature of firing events during the component life cycle, for this we'll use the `OnActivating` event which takes a delegate. The argument that gets passed into the method has all the data you could need to perform your changes to the object.

Well here's the delegate that you can use to inject ValueType properties:

	.OnActivating(x =>
	{
		var instance = x.Instance;
		var instanceType = x.Instance.GetType();
		var context = x.Context;
		foreach (Reflection.PropertyInfo property in instanceType.GetProperties(Reflection.BindingFlags.Public | Reflection.BindingFlags.Instance | Reflection.BindingFlags.SetProperty))
		{
			var propertyType = property.PropertyType;
			//only look for ValueType's which are actually registered!
			if (propertyType.IsValueType && context.IsRegistered(propertyType))
			{
				object propertyValue = context.Resolve(propertyType);
				property.SetValue(instance, propertyValue, null);
			}
		}
	})

Hopefully this will solve a problem if you come across it yourself.
