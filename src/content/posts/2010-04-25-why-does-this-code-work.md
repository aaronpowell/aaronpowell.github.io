---
  title: "Why does this code work?"
  metaTitle: "Why does this code work?"
  description: "A neat trick with operators in .NET"
  revised: "2010-04-25"
  date: "2010-04-25"
  tags: 
    - ".net"
    - "c#"
    - "operator-overload"
  migrated: "true"
  urls: 
    - "/why-does-this-code-work"
  summary: ""
---
In the discussion on the Umbraco forum about using LINQ to Umbraco I posted a short code snippet of something we write fairly frequently at [TheFARM using our version of LINQ with Umbraco][1].

I thought I'd post the challenge to my trusty followers, for them to see if they know why the code works. First off the code:

    IEnumerable<XElement> nodes = UmbXmlLinqExtensions.GetNodeByXpath(...); 
    IEnumerable<IUmbracoPage> pages = nodes.Select(n =>(IUmbracoPage)(UmbracoPage)n);

What the XPath being evaluated isn't important, what is important is you'll notice that we have a collection of `System.Xml.Linq.XElement`'s, but then it's directly casting each XElement to `IUmbracoPage`.

Here's the skeleton for the class and interface:

    public interface IUmbracoPage { ... } 
    public class UmbracoPage : IUmbracoPage { ... }

Again the body of the interface isn't important, what is important is that the class only inherits from the interface, it does not inherit from XElement.

###Why does this work###

Well the answer is actually very simple, and it's a really handy feature of the C# language, [explicit operators][2].

Explicit operators allow you to define explicit casting between types. So the code that was missing from my original post was this:

    public static explicit operator UmbracoPage(XElement x) {
        return new UmbracoPage(x);
    }

What I've done here is defined how the compiler is to treat a casting of an XElement to an instance of UmbracoPage, and since UmbracoPage inherits IUmbracoPage there is already a defined casting to it.

Inside the body of my explicit operator I can do anything I desire, here I'm just returning a new instance, passing the XElement to the constructor.

I find it really quite elegant, and that it reduces code smell quite nicely.

But explicit operators also have a buddy, in the form of [implicit operators][3] (which was the close-but-no-cigar answer). These work by the type being defined by the assignment target, eg:

    UmbracoPage page = xElement;

I'm personally not a fan of implicit operators though, I find them less obvious when you're reading code.

So there you have it, a slightly obscure language feature to play with!

  [1]: http://www.farmcode.org/post/2009/02/24/Linq-to-Umbraco.aspx
  [2]: http://msdn.microsoft.com/en-us/library/xhbhezf4.aspx
  [3]: http://msdn.microsoft.com/en-us/library/z5z9kes2.aspx
