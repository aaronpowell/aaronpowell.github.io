--- cson
title: "Xamlizer - How to implement something silly in JavaScript"
metaTitle: "Xamlizer - How to implement something silly in JavaScript"
description: ""
revised: "2011-10-25"
date: "2011-10-24"
tags: ["javascript","doing-it-wrong"]
migrated: "true"
urls: ["/javascript/xamlizer-implementing-something-silly-in-javascript"]
summary: """

"""
---
I've never done much Xaml development, I started reading a WPF book and played around with it only to realise I didn't have any understanding of this concept of a stateful application or how layouts were going to work. And as a web developer who never saw the appeal of Flash I also never got into Silverlight as there was never a problem in my life that it would solve.

The one thing I do remember from my brief foray into that scary other world is the reliance on `INotifyPropertyChanged` and `INotifyPropertyChanging` interfaces. I've always thought that the idea behind these two interfaces was a good one, the primary problem though is how you actually have to implement them. Seriously, there's a lot of shit code you have to implement.

So I decided to do something a bit silly, I decided to implement the two interfaces in JavaScript.

### A dumb idea with a point

Now I see no real reason to use the code that I'm going to look at in any current development but more importantly I want to look at something that is part of ECMAScript 5 that doesn't get the attention it deserves, [`Object.defineProperty`][1].


  [1]: http://es5.github.com/#x15.2.3.6