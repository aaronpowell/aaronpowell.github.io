---
  title: "Dynamics Library"
  metaTitle: "Dynamics Library"
  description: "A series of helper methods for working with the DLR in C# 4.0"
  revised: "2010-07-05"
  date: "2010-07-05"
  tags: 
    - "dynamic"
    - ".net"
    - "c#"
  migrated: "true"
  urls: 
    - "/dynamics-library"
  summary: ""
---
When playing with the `dynamic` keyword and the DLR at CodeGarden 10 I realised that I wanted to do more with it so I started to dig deeper into it. This is where I came up with the idea which I covered in [Dynamic Dictionaries with C# 4.0][1].

As some people I've talked to since then pointed out what I did was lacking a few things. I told them to be quiet as the blog was only meant to be a quick introduction into the `DynamicObject` and some of the power which it brings to the table. But really, I was keeping some stuff in reserve, I was working on a more complete API for working with dynamic dictionaries.

##Introducing AaronPowell.Dynamics

I decided to put together a set of handy extensions for working with the DLR, a more complete version of the dynamic dictionary which I talked about, and a fluent dynamic XML API.

I've checked the code up on [bitbucket][2] so you can grab a copy yourself and get playing with it (or provide me with feedback :P). [You can grab it here][3]. And if you want to just get started with the API [grab it here][4].

##Working with the API

So obviously if you're going to grab a copy you probably want to know what it is. The API contains:

 - AaronPowell.Dynamics.Collections.DynamicDictionary
 - AaronPowell.Dynamics.Collections.DynamicKeyValuePair
 - AaronPowell.Dynamics.Xml.XmlNode
 - AaronPowell.Dynamics.Xml.XmlNodeList

Additionally each namespace contains [extension methods][5] to allow you to convert your static objects into dynamic objects.

###DynamicDictionary

This is what the API is really all about, and it's using some of the code which I started with in my other article, but I've added more to it, like the ability to write to it, and perform standard dictionary operations. I've got a series of tests which show what it can do, such as:

        [TestMethod]
        public void DynamicDictionaryTests_Key_Maps_To_Property()
        {
            //Arrange
            Dictionary<string, string> items = new Dictionary<string, string>();
            items.Add("someKey", "someValue");

            //Act
            dynamic d = items.AsDynamic();

            //Assert
            Assert.AreEqual(items["someKey"], d.someKey);
        }

So you can access via a key in the dictionary. Or maybe you want to add new keys:

        [TestMethod]
        public void DynamicDictionaryTests_New_Key_Added_Via_Property()
        {
            //Arrange
            Dictionary<string, string> items = new Dictionary<string, string>();

            //Act
            dynamic d = items.AsDynamic();
            d.hello = "world";

            //Assert
            Assert.AreEqual("world", d.hello);
        }

That's right, it's mutable (assuming the source dictionary was mutable, the AsDynamic extension method is on IDictionary<string, TValue> so you can use custom dictionaries).

And `DynamicDictionary` inherits from IDictionary<string, TValue> so all other standard dictionary object modifiers can be used, it's an Enumerable object, it's got count, etc.

####Performance

Just a bit of a footnote **don't turn all dictionaries into dynamic ones!** Unsurprisingly performance does take a hit when working with the `DynamicDictionary` object, it's ~4 times slower than the static one when doing 1 million iterations (you can check out the demo app).

###Dynamic XML

This I can't actually take credit for, it's actually modeled off a piece of code by [Nikhil Kothari][6] which he wrote for [working with RESTful API's][7]. The problem was that his code doesn't work with the RTM of C# 4.0, so I've made that happen, and I've added a few more features, like better handling of children node sets.

Again I have a few tests which cover this, and it makes working with XML a much nicer experience, like:

        [TestMethod]
        public void XmlNodeTests_Attribute_Exposed_As_Member()
        {
            //Arrange
            var xdoc = XDocument.Parse("<node attr='something'></node>");
            dynamic node = xdoc.Root.AsDynamic();

            //Act

            //Assert
            Assert.AreEqual("something", node.attr);
        }

Fluent attribute access, or how about fluent element access?

        [TestMethod]
        public void XmlNodeTests_Elements_Exposed_As_Members()
        {
            //Arrange
            var xdoc = XDocument.Parse("<node><child>value of child</child></node>");
            dynamic node = xdoc.Root.AsDynamic();

            //Act

            //Assert
            Assert.AreEqual("value of child", node.child);
        }

But I've decided to knock it up a notch (BAM!) and added a cooler way to interact with collections. I mean, if you have many children called *other*, you just want the *other**s*** right?

        [TestMethod]
        public void XmlNodeTests_Pluralized_Children_Via_Pluralized_Word()
        {
            //Arrange
            var xdoc = XDocument.Parse("<node><other /><other /><other /></node>");
            dynamic node = xdoc.Root.AsDynamic();

            //Act
            var others = node.others;

            //Assert
            Assert.IsNotNull(others);
            Assert.IsInstanceOfType(others, typeof(XmlNodeList));
            Assert.AreEqual(3, others.Length);
        }

The pluralization isn't an exact science (I've used the same logic which is used the same logic which is used by SqlMetal) so something like Child doesn't become Children.

##Conclusion

So that raps it up for the introduction to my new API. It's just a bit of fun, something to be used carefully (like all of the DLR :P) and hopefully someone finds it a bit of fun.


  [1]: /dynamic-dictionaries-with-csharp-4
  [2]: http://bitbucket.org
  [3]: http://bitbucket.org/slace/aaronpowell.dynamics
  [4]: /get/csharp/AaronPowell.Dynamics.zip
  [5]: /are-extension-methods-really-evil
  [6]: http://www.nikhilk.net/
  [7]: http://www.nikhilk.net/CSharp-Dynamic-Programming-REST-Services.aspx