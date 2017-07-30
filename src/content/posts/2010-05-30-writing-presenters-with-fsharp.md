---
  title: "Writing Presenters with F#"
  metaTitle: "Writing Presenters with F#"
  description: "This may not be the best idea, but hey, why not, let's writing Presenters with F#!"
  revised: "2010-05-30"
  date: "2010-05-30"
  tags: 
    - "webformsmvp"
    - "f#"
    - "fsharp"
  migrated: "true"
  urls: 
    - "/writing-presenters-with-fsharp"
  summary: ""
---
*Disclaimer: I'm not an F# developer, I'm really only just learning and having a bit of a play around.*

#What

After a few beers the other day I had a great idea, why not write a demo of using WebForms MVP and F#. Sure, seems fun, seems crazy, seems like a silly idea! :P

But there was method in my (alcohol induced) madness, looking in F# as an option for development isn't a bad idea. F# as a functional languages offers some advantages which can't be achieved with a static language like C# or VB.NET, and since it does have some OO principles we can define types, use inheritance, all the stuff we can do with the other languages, so why can't we use it in a web scope?

I'm not the first people who's tried using [F# with ASP.NET][1], it's more about applying it in a different manner, in the scope of the WebForms MVP.

Hey, if this really works why couldn't you work with F# and Umbraco ;).

#Getting Started

First step is the need to create a F# Class library (I'm going to separate my UI into a standard C# web project for this):

![New Project][2]

So for this I'm going to create a very simple little `Hello World` demo, so for this I'm going to require 2 classes, I need a Presenter and a Model. Clear out the default files and next I make one called `HelloWorldPresenter`, it's just a standard F# Script file. Then I create a separate one called `HelloWorldModel`.

Keep in mind that the order of types does matter in F#, so since (as I've stated) the Model file is created 2nd it'll appear in the project 2nd. You'll need to move it up to above the other file so that the type does get created by the time we actually need it.

Let's define our types:

	namespace WebFormsMvp.FSharp.Views.Models

	type HelloWorldModel = class
		val mutable private msg : string

		new() = {
			msg = ""
		}

		member self.Message
			with get() = self.msg
			and set (value) = self.msg <- value
	end

So here I'm just defining a simple class with a string property which can be modified (hence the `mutable` keyword). It's a very basic Model, it's not really complex but it'll give you the idea of what can be done.

Next let's make a Presenter:

	namespace WebFormsMvp.FSharp.Presenters

	open WebFormsMvp
	open WebFormsMvp.FSharp.Views.Models
	open WebFormsMvp.FSharp.Wrapper

	type HelloWorldPresenter = class
		inherit PresenterBase<IView<HelloWorldModel>>

		new (view) as self = {
			inherit PresenterBase<IView<HelloWorldModel>>(view)
		}

		override self.OnLoad(sender, e) = 
			self.View.Model.Message <- "Hello World!"
		
		override self.ReleaseView() = ()	
	end

First we need to import and few namespaces, we need the WebFormsMvp namespace, the namespace for my Model class, and I've also imported the namespace of a base class which I've made to help. For some reason (most likely my lack of knowledge around F#) I was getting a compile error when creating the event handler, you should be able to do this in the constructor:

    self.View.Load.Add(fun (sender:obj) (args:EventArgs) -> self.View.Model.Message <- "Hello World!")

But as I said, that was creating a compile error so I created a base class (in C#) which assigned the event handler for me which I can then override.

That aside we can use the base class method to write to the Model.Message property, which ultimately, is what we want to do.

All that's left is that we need to create a C# Web Application Project and start the final implementation. Let's see how that looks:

	using WebFormsMvp;
	using WebFormsMvp.FSharp.Presenters;
	using WebFormsMvp.FSharp.Views.Models;
	using WebFormsMvp.Web;

	namespace WebformsMvp.FShap.Web.UserControls
	{
		[PresenterBinding(typeof(HelloWorldPresenter))]
		public partial class HelloWorld : MvpUserControl<HelloWorldModel>, IView<HelloWorldModel>
		{
		}
	}

It looks exactly like the `HelloWorldPresenter` came from any other language class library!

![It works!][3]

It just works like you'd expect it to.

##Now What?

Well this was really just a thought experiment, looking at how we could be a bit unconventional in your development approach. Whether or not this is viable in a real-world scenario is a matter of perspective. Currently for me it's not viable, but that's really because I don't have much in the way of F# skills.

If you were an F# developer this is an easy way to go about integrating F# into an ASP.NET Web Forms application, and in a unit-testable manner.


  [1]: http://tomasp.net/articles/aspnet-fsharp-intro.aspx
  [2]: /get/web-dev/fsharp-01.PNG
  [3]: /get/web-dev/fsharp-02.PNG