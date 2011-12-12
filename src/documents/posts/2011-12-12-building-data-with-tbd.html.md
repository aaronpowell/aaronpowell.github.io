--- cson
title: "Building data with tbd"
metaTitle: "Building data with tbd"
description: "An introduction to tbd, a data generator for JavaScript"
revised: "2011-12-13"
date: "2011-12-12"
tags: ["javascript","nodejs"]
migrated: "true"
urls: ["/javascript/building-data-with-tbd"]
summary: """

"""
---
When building a UI that is driven by JavaScript one of the most tedious tasks is ensuring that you have data which you can populate into the UI to develop against. If you're like me you probably prefer to do the UI component before the server component. Alternatively you could be working in a team where someone else is responsible for developing the server component at the same time as you're developing the UI. Which ever the case is you'll find yourself in a situation where you don't have the data to build out your UI.

This is a situation that I find myself in quite often and it always left me thinking about how I would throw together some data to do the UI. Generally speaking it'd involve a bunch of copy and pasted lines of JavaScript which builds up an object graph. This *does work* but it's not a great way to simulate data, especially if you want to change the data volumes and see how the UI will react.

Coming from a .NET background I've used libraries like [NBuilder][1] and [Fabricator][2] in the past. These libraries take an input object and will generate a series of fake data from it.

So I thought "hey, why not create that in JavaScript" and from there **tbd** was born!

# tbd - Test Data Builder

[tbd][3], or Test Data Builder is a project I started to create (fake) data using JavaScript. There's a bit of a joke in the name, when I was trying to pick a name I was thinking "what'd be quirky, it's for building test data, oh sweet, **tbd** since it can be Test Data Builder or *To Be Defined*, which makes for a good play on words". Now the astute reader will notice the mistake immediately but for those with reading disabilities like me you'll need a hint, Test Data Builder is actually **tdb**


  [1]: http://nbuilder.org/
  [2]: http://fabricator.codeplex.com/
  [3]: https://github.com/aaronpowell/tbd