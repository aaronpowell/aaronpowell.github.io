---
  title: "Reflection And Generics"
  metaTitle: "Reflection And Generics"
  description: "Oh the pain, OH THE PAIN"
  revised: "2010-04-08"
  date: "2010-04-08"
  tags: 
    - ".net"
    - "reflection"
    - "searing-pain"
  migrated: "true"
  urls: 
    - "/reflection-and-generics"
  summary: ""
---
Or to name this another way… **Oh my god the pain**.

Anyone who’s been brave enough to delve into the bowels of the Umbraco Interaction Layer will have been able to see just how much Reflection I’m using, for those who haven’t think about this.
With the UIL I needed a way to find all the properties of a generated class and be able to either populate all of them or save from all of them. To do that I’ve got some custom attributes which decorate the properties which I look out for.

Now this in itself isn’t a problem, all my properties are strongly typed, it’s all sweet. The problem was around the populating of the data when you open an existing Umbraco document object. I have two generic methods in my Helper library (which have many an appearance in my Umbraco Membership class too!) which have the construct:

    public static T GetPropertyValue<T>(Document doc, string key);
    public static T GetPropertyValue<T>(Document doc, string key, T defaultValue);

ou’ll notice that one is an overload, and the overload parameter is a generic. This is where the problem arises.

Because the generic is defined at use-time there’s no type in the .NET framework which can represent something as a generic like you can with an Int32 or a String, and this is where the problem arises, how do you find the overloaded method using reflection, and once it’s found how do you invoke it!?

## First things first, finding the method ##

There’s no simple way in which you do this, in fact, it’s actually rather hacky. If you’re not familiar with finding methods with Reflection you should probably have a read of this [http://msdn.microsoft.com/en-us/library/system.reflection.aspx][1].

You’d be mistaken for thinking that you can just pass in the method name, cuz it’s an overload Reflection doesn’t know what you want. So the most likely one you need is [Type.GetMethod Method (String, BindingFlags, Binder, array\[\]()\[\], array\[\]()\[\])][2], but you notice something, you need to pass in the type of ALL the parameters for the method.
Crap, one is a generic type, so it can’t be specified!
This is where I hit a snag, and from all my research the only solution was a dirty little hack.

We know what’s different between the two methods, one has two parameters, the other has three, and this is how we’re going to find the sucker. On the Type class there’s another method, Type.GetMethods() or as I prefer to use (to improve performance) Type.GetMethods(BindingFlags bindingAttr). This will get you an array of methods with the right access levels.

Now let’s pull out our old friend LINQ and find the sucker in the array, we end up with something like this:

    MethodInfo method = typeof(Helper).GetMethods(BindingFlags.Public | BindingFlags.Static).First(m => m.Name == "GetPropertyValue" && m.GetParameters().Count() == 3);

## Invoking the method ##

Ok, so we found the method but how do we invoke it if it’s generic? That’s actually quite easy:

    int methodResult = (int)method.MakeGenericMethod(typeof(int)).Invoke(null, new object[] { doc, “SomeAlias” }); 

So I make a generic instance of the method using a specified type as the generic type and then invoke it! This is the best and most optimised solution I’ve been able to come up with so far, if anyone can think of something better I’d love to hear it!


  [1]: http://msdn.microsoft.com/en-us/library/system.reflection.aspx
  [2]: http://msdn.microsoft.com/en-us/library/5fed8f59.aspx
