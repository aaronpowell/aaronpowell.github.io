---
  title: "XAML by a web guy"
  metaTitle: "XAML by a web guy"
  description: "So I'm starting to learn XAML..."
  revised: "2012-08-20"
  date: "2012-08-20"
  tags: 
    - "xaml"
  migrated: "true"
  urls: 
    - "/xaml/xaml-by-a-web-guy"
  summary: ""
---
A few weeks ago a new project came up at work which I moved onto, a project which is XAML based. More specifically Windows 8 XAML and having built a Windows 8 app using HTML and JavaScript I was keen to give it a crack.

Now I'm very much a web guy. If you read my blog you'll know that I spend more time blogging about JavaScript than anything else. But in an effort to be a better developer I thought it was worthwhile diving into the other kind of angled brackets and give this thing ago and I want to share some thoughts of mine having spent two weeks doing XAML development (for the record this isn't the first time I've looked at XAML, I looked at it back in about early 2010, did some playing with XAML 1.0, I even own a book on it, but I never got very far :P).

## XAML is verbose

Oh... my... god.

I've spent my entire development career doing HTML, and quite a lot of that I spent doing HTML with Umbraco, which obviously meant that I was writing a lot of XSLT (this was about 4 - 5 years ago, when there was [no alternative][1]) and in comparison to XAML XSLT is a shinny pillar of conciseness.

I can only assume that this is why there are two GUI tools for generating XAML, having to hard-craft complex XAML files would be time consuming beyond belief (although from my understanding most people *do* hand craft them as the GUI tools are pretty flaky). Here's an example:

    <ObjectAnimationUsingKeyFrames Storyboard.TargetProperty="(UIElement.Visibility)" Storyboard.TargetName="someElement">
        <DiscreteObjectKeyFrame KeyTime="0">
            <DiscreteObjectKeyFrame.Value>
                <Visibility>Visible</Visibility>
            </DiscreteObjectKeyFrame.Value>
        </DiscreteObjectKeyFrame>
    </ObjectAnimationUsingKeyFrames>

That's a snippet from a visual state to change an element from hidden to visible. Now this is how to do it in XAML, which leads me to my next point.

## A dozen ways to skin a cat

Visual states are really cool, they are quite powerful to do the various amounts of animations that we're using in our application but to me they are really clumsy to write (seriously, you're looking at dozens of lines of XAML to make even a simple state of hiding a few elements and showing a few elements). This is where something like Blend comes into play (when it's not crashing), it's quite easy to create a simple visual state.

Alternatively I could use code to manually manipulate those properties, it's much more concise to do so (1 line vs the above 7) but then you're ending up with stuff in your code behind or you're loosing the power of animations.

And then there's binding...

## Bindings

Oh... my... god.

I don't understand how XAML, in any of it's four incarnations, doesn't have a better solution for this. Back on our Visual States, say I've got a multi-stage form, each stage has a new Visual State to show the appropriate fields, well logically I'd want to use an enum to set the current step and be able to tie that back to the UI... Right?

Yeah you'd think so, but no. There's no way in the box to do the mapping between an enum and a Visual State. You end up with a lovely whack of code behind that watches for property change events and calls visual state transitions. Woo...

## Events

I come from a world of the DOM where event wireup is pretty fucked. IE always did it one way, really old IE did it another and then there was the spec. The only nice thing was there was only one *type* of events. XAML though seems to have two independent eventing models, *traditional* .NET events and commands. Both seem to be first-class citizens, but commands seem to have been conceived outside of wedlock and thus treated like a bastard.

Some elements seem to implement commands as well as events, others just implement events. It's quite frustrating, the fact that bindings are a common way to wire up commands to actions (like button clicks). But events can't be bound, so you end up having to rely on code-behind or custom solutions. Neither of these are a great resolution, I just don't get why it's not in the box.

## Controls

Now this just baffles ms, as I said at the top this is Windows 8 XAML so I'm sure it's a bit different in the other flavours but controls available is just whacky.

Here's an example, there's no built-in control that restricts an input to just containing numerical values. Maybe I'm use to the web but I think this makes sense:

    <input type="number" />

In a HTML5-enabled browser this does a few things:

* It will only allow numerical values
* It switches keyboards on soft-keyboard devices

But there's nothing built in that will do this in Windows 8 XAML. Or how about a date picker? You know that's kind of a common scenario in an application, to be able to select a date... And apparently that didn't make it [until .NET 4.0 anyway][2].

## Validation

The fact that there's no built in validation floored me. This is a problem that was solved in ASP.Net in what, version 1.0? You know the idea of a required field shouldn't be that hard... MVC did a great job including data annotations and building up that client side to integrate with jQuery validation (or their own validation framework as it was back in the day).

But there's nothing in XAML for validation, no required fields, no regex validation, no data annotations for building up validation rules for your view model. It's all up to you to solve on your own.

## Bindings

I must say that bindings are pretty sweet, coming from HTML and JavaScript I can see why things like Knockout.js were written, the ability to componentise a UI and link data up is very nice. I also think value converters are a pretty neat, a good way to produce a global solution to consistent bindings.

I have one major problem with bindings, debugging. It's 2012 and the "debugging" experience for bindings is to look at the Visual Studio Output window. I shit you not! I've managed to pretty much avoid needing the Output window ever since VS2003 except when I was looking into compiler errors but instead I've been keeping my eye on it every time a binding doesn't do what I expect it to do.

How on earth does this not have a debugging experience? I remember the demos from Silverlight 5 showing it off but it's apparently not in VS 2012 from what I can see, it seems like a massive oversight.

This leads me to the next WTF I've found in Windows 8 XAML (I think it's only the case in Windows 8 XAML), **you can't bind `Nullable<T>`**. You would *not* believe how long that took me to find out but yep, if you have a nullable DateTime, int, float, etc don't expect to be able to bind to it. I've had mixed success with Dependency Properties over INotifyPropertyChanged but the majority of my tests have shown it to fail.

## Wrap up

Although my "full time" XAML experience is still fairly limited I can't help but keep looking at it in a completely bemused fashion. While my experience is localised to Windows 8 XAML, I'm constantly shocked at how half-baked it feels. Some people might argue that Windows 8 XAML is a v1 product and should be treated as much but seriously this is the **forth** incarnation of XAML, **forth** (WPF, Silverlight, Windows Phone 7 and now Windows 8)!

But don't get me wrong, I'm having a *heap* of fun, this is all relatively new to me, but the fact that XAML is in the state that it's in I can see why HTML is a first-class citizen in Windows 8, at least it's a fully featured markup engine.

*PS: Yes I know many of my problems can be solved with existing open source projects. My point is that a lot of the problems I've come across are not edge cases, they are things I'd expect my UI layer to do out of the box.*


  [1]: http://umbraco.com/help-and-support/video-tutorials/umbraco-fundamentals/razor.aspx
  [2]: http://msdn.microsoft.com/en-us/library/system.windows.controls.datepicker.aspx