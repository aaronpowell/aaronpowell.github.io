---
  title: "Are Extension Methods Really Evil?"
  metaTitle: "Are Extension Methods Really Evil?"
  description: ""
  revised: "2010-04-08"
  date: "2010-04-08"
  tags: 
    - "c#"
    - ".net"
    - "extension-methods"
  migrated: "true"
  urls: 
    - "/are-extension-methods-really-evil"
  summary: "The blog post referred to is no longer available, I'll see about updating this to not require that"
---
Ruben (of Umbraco fame) recently wrote a post entitled Extension Methods: Silent static slaves which was in response to a comment I'd left on a previous post about static classes and static method being evil.

If you haven't read Ruben post then I suggest you do before continue on with mine as a lot of what I'll be saying is in counter argument to him (including the comments).

Done? Good, continue on!

Ruben has produced a demo which is great for illistrating his point, but is it an example of good design turning bad or just bad design from the start?

The first thing I want to look at is that his extension methods are on the interface and implementation class.
This is bad design to start with, but it's not just bad design if you're using extension methods, this could manifest itself as bad design if you did it as helper methods in a separate class, eg:

	class Helpers {
	  public static int CalculateShoeCount(Animal animal) {
	   //do processing
	  }
	  public static int CalculateShoeCount(Monkey animal) {
	   //do processing
	  }
	}

So this would fall into the same trap if we don't re-cast Animal to Monkey before calling the helper.

But does this prove Ruben's initial point, that static's are just plain evil?
Well no, design isn't possible without statics. If you try and design without statics you end up with nothing but instance memebers. If that's the case where do I find the current method int.TryParse, does this become 0.TryParse?

Ruben's demo is an example of bad design producing worse design. In good design the CalculateShoeCount would be a member of the Animal interface, particularly since the implementation changes per interface implementation type.

So how can we use extension methods to produce good design? Well first you really need to understand what an extension method is. As Ruben quite correctly pointed out an extension is just syntactic suger and extension methods should be treated as such. Developers need to understand that extension methods are only designed to provide functionality to a classes public instance members; they are stateless.
(This is why I don't understand why so many people of Stack Overflow want extension properties added to the compiler, this is where people are missing the point of the extension concept)
And if you're expecting a stateful nature from the extension methods then you've missed their goal.

Lets look at some good examples of using extension methods. Here's a fav of mine for Umbraco:

	public static string Url(this Node node) {
	  return umbraco.library.NiceUrl(node.Id);
	}

(Hey look, a static calling a static ;)).

Or how about this one:

    public static IEnumerable<ListItem> SelectedItems(this ListControl ctrl) {
      return ctrl.Items.Cast<ListItem>().Where(item => item.Selected);
    }

Now we're using an extension method with an extension method.

But both of these examples are using actual class implementations, not interfaces, does that make a difference?
Yes, and a big one. When you are putting extensions on an interface there needs to be no possibility of confusion about what the extensions are for. And if you are also providing an extension of an implementation of the class they need to be in separate namespaces. If they aren't, you will end up with what Ruben shows, misrepresentation of the methods abilities.

IQueryable<T> is a perfect example of how to use extension methods on top of an interface. If you have a look at the construct of the interface there's actually no constructs within it! This means that "all" the functionality is provided by extension methods, allowing anyone to write their own extensions.
If I was to not include the namespace System.Linq I can then write my own query extensions, eg a Where that does return a bool, or negate operators which I don't want to support.

So in my opinion extension methdos are no more evil than anything else in programming; they can easily be abused and misused, but find something that it'd not possible to misuse to prove bad design.