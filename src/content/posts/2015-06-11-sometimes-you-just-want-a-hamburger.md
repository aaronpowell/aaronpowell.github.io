---
  title: "Sometimes you just want a hamburger"
  date: "2015-06-11"
  tags: 
    - "web-dev"
  description: "A tongue in cheek look at JavaScript framework analogies."
  urls: 
    - "/posts/2015-06-11-sometims-you-just-want-a-hamburger.html"
---

_My friend [Chris Love](http://twitter.com/chrislove) wrote an article stating that [Large JavaScript Frameworks are like Fast Food Resturants](http://love2dev.com/#!article/Large-JavaScript-Frameworks-Are-Like-Fast-Food-Restaurants) and a related article [Why Micro JavaScript Should Be Used In Your Next Application](http://www.codemag.com/Article/1501101). I want to write a bit of a rebuttal to these posts but it'll be in my typical serious manner :P._

* 300g of beef mince with a good fat content
* 1 egg
* Breadcrumbs
* Salt
* Pepper
* Worcestershire
* Mustard
* Garlic
* Oregano

* Lettuce
* 1 tomato
* 2 eggs
* Bacon
* 2 pickles
* Tomato sauce (not ketchup)
* Mustard
* Beetroot
* Cheese
* 2 burger bun

In case you haven't worked out we're making a hamburger (well, 2 actually, a 300g patty would be a little excessive!) and here are my base ingredients. Now I have to construct my burger, go through the process of combining ingredients, cooking the patty, constructing the burger, making sure there is _just the right amount of beetroot_ (we're making a proper Aussie burger after all) and eventually consuming it.

Now if I ever want to reproduce it I have to make sure that it's written down somewhere, a recipe or 'documentation' if you will. What if I want to share the load and have someone do some of the work with me? I better make sure that I have the process written down too. Say I walk away from the cooking part way through, I want to make sure someone can easily pick up from where I left off without having to scrap everything they've previously learnt or worse, throw out my attempt because it's too complex to follow.

Right about now you might be asking yourself "Why am I reading a post about making hamburgers?" and it's probably because I'm doing a poor job of drawing a parallel between cooking and JavaScript frameworks.

## Fast doesn't mean unhealthy

One of the main points in Chris's argument is that we need to avoid obesity and that large JavaScript frameworks are a root cause of this within web applications. While it is true that frameworks like Ember, Backbone, Angular and React (or wait, is React [_not_ a framework?](https://news.ycombinator.com/item?id=8792974) I confused...) are large may do more than you need from your application it doesn't mean that they are inherently unhealthy for your application. Instead what they tend to do is give are options and solve problems that people smarter than me have already solved.

Let's take for example the `$http` service in AngularJS. I've [blogged before about the basics of AJAx](/posts/2013-08-02-ajax-without-jquery.html) and on the surface it's pretty simple, but it very quickly becomes complex. Take a look at what's needed to POST form data, you have to construct the `FormData` object, set it's values, set the appropriate HTTP headers, etc. Then there's the response side, are you going to use promises or callbacks? How about content negotiation, parsing the response to the right type, etc.

Not so simple now is it?

## I have all the raw ingredients

Over the last few years browsers have become more and more powerful with more and more features available natively, from `querySelectorAll` to give us CSS querying from JavaScript, WebGL if we want to do 3D, Web Audio for sound, Canvas for drawing, IndexedDB for complex data stores and that's on top of the standardisation of features like events, element manipulation, etc.

To go back to our hamburger analogy I could go out and get myself some [chuck](http://en.wikipedia.org/wiki/Chuck_steak), grab my mincer (yes I do own a mincer) and create my own mince to start my patty. I have all the building blocks I need but really, am I going to mince my own meat ever time, probably not.

Now don't get me wrong, I'm a long-time advocate of [Vanilla.js](http://vanilla-js.com/). I strongly believe that you **should** learn the fundamentals but that doesn't mean they are your only tool, the frameworks people build on top of these fundamentals are powerful and can save you a lot of development effort. jQuery is a great example of this, yes the DOM in today's browsers gives us the power to do everything you want from jQuery but there's things it does that simplify this for us. Take the even bubbling and filtering, jQuery makes it very easy to provide an event handler at a common root but filter on the source of said event. It's a thin wrapper over DOM events but it's highly convenient.

## I'll make it my own way

To address the points in Chris's 2nd article, we should use micro frameworks where possible, single purpose libraries that do one thing and one thing well. I'll go out and grind my mince, add my spices and then it's the patty I'm after. I'll get my sauces and mix them up to the desired tomato-to-mustard ratio.

But now here's the problem, I have a one-of-a-kind burger that to know how it came together, how to recreate it, how to disassemble it, find what's missing and reassemble it, is making the enjoyment of my burger harder.

And this is where micro frameworks start to fall apart. You're building a SPA so you go and grab an AJAX library, a thin DOM library, some custom eventing (or pubsub) to make you application disconnected, add DI, templating, security, data state management, promises and so on. Congratulations you've created something that doesn't have a massive framework behind it, or does it? Have you traded AngularJS for your own equally as bloated combination of micro frameworks?

Then once you've completed your _non framework_ application you have another problem, maintenance. This unique collection of micros only exists in its current configuration in a single application, yours. How do you find solutions to your problems? We no longer have the communities to contact, it's up to us to work out how to fix it ourselves (which isn't _necessarily_ a bad thing, but knowledge sharing **is** powerful).

Then what happens if you, or one of your team members, leave this project? Now the number of people who understand this application design has decreased. As a consultant this is a very real problem that I face when my role wraps up and I walk out with knowledge. There's only one real solution to this, documentation and while this knowledge drain can happen on **any** project the more custom a solution the more you need to document and we all know how well developers document projects. Is that few kb you're saving just being replaced by dozens of pages of documentation and levels of complexity? What if you need to hire someone new? Is someone with Ember skills easier to find than 'generic JavaScript' and giving them a pile of documentation to learn your _non framework_?

## Conclusion

I like to cook (or at least I like the _idea_ of cooking, the actuality might not really be what people want :P) but I also like my fried chicken.

While it might be nice to sit back and say that we should avoid these large JavaScript frameworks because they bring bloat to our applications we need to also should avoid the other extreme, thinking that completely custom _non framework_ applications are superior. You might be trading one kind of bloat for another. An application is more than what you wrote today, it's the code you haven't written, the bugs you haven't found, the documentation you haven't done.

Know how your food is made, what goes into your frameworks and how you can leverage years of chefs and cooks just like we leverage the development community.

An application built on a paleo diet is just as unhealthy as one built on fast food.

_PS: Don't just eat fast food, that would be stupid._
