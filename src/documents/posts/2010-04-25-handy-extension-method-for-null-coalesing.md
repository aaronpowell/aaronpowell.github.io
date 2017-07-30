---
  title: "Handy extension method for null-coalesing"
  metaTitle: "Handy extension method for null-coalesing"
  description: ""
  revised: "2010-04-25"
  date: "2010-04-25"
  tags: []
  migrated: "true"
  urls: 
    - "/handy-extension-method-for-null-coalesing"
  summary: ""
---
Today a colleague asked me a question:

"How do you do a null-coalesce operator which will return a property of an object when not null?"

If you're not familiar with the null coalesce operator it's the [??][1] operator and it can be used for inline expressions when the test object is null.

You use it like so:

    string test = null;
    Console.WriteLine(test ?? "The string was null");

So it either returns itself or it returns your value, but what if you want to return a property of the object not itself, well you can't use the ?? operator.

But never fear, extension methods are here! I wrote this quick little one for him:

    public static TResult NullCoalese<TTarget, TResult>(this TTarget o, Func<TTarget, TResult> func, TResult whenNull) {
      return o == null ? whenNull : func(o);
    }

Stick this in a namespace, maybe restrict the type of `TTarget` (or leave it as anything in .NET land, what ever takes your fancy, but if you don't restrict it maybe don't leave it in a common namespace!) and use it like this:

    string test = null;
    test.NullCoalese(x => Console.WriteLine(x), "Null was suppled");

Enjoy :).

  [1]: http://msdn.microsoft.com/en-us/library/ms173224.aspx