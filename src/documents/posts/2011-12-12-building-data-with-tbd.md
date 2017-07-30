---
  title: "Building data with tbd"
  metaTitle: "Building data with tbd"
  description: "An introduction to tbd, a data generator for JavaScript"
  revised: "2011-12-13"
  date: "2011-12-12"
  tags: 
    - "javascript"
    - "nodejs"
  migrated: "true"
  urls: 
    - "/javascript/building-data-with-tbd"
  summary: ""
---
When building a UI that is driven by JavaScript one of the most tedious tasks is ensuring that you have data which you can populate into the UI to develop against. If you're like me you probably prefer to do the UI component before the server component. Alternatively you could be working in a team where someone else is responsible for developing the server component at the same time as you're developing the UI. Which ever the case is you'll find yourself in a situation where you don't have the data to build out your UI.

This is a situation that I find myself in quite often and it always left me thinking about how I would throw together some data to do the UI. Generally speaking it'd involve a bunch of copy and pasted lines of JavaScript which builds up an object graph. This *does work* but it's not a great way to simulate data, especially if you want to change the data volumes and see how the UI will react.

Coming from a .NET background I've used libraries like [NBuilder][1] and [Fabricator][2] in the past. These libraries take an input object and will generate a series of fake data from it.

So I thought "hey, why not create that in JavaScript" and from there **tbd** was born!

# tbd - Test Data Builder

[tbd][3], or Test Data Builder is a project I started to create (fake) data using JavaScript. There's a bit of a joke in the name, when I was trying to pick a name I was thinking "what'd be quirky, it's for building test data, oh sweet, **tbd** since it can be Test Data Builder or *To Be Defined*, which makes for a good play on words". Now the astute reader will notice the mistake immediately but for those with reading problems like me you'll need a hint, Test Data Builder is actually **tdb**.

The idea behind tbd was to be able to take a JavaScript object and create a bunch more of them, as many as you want! I also wanted it to be disconnected to the browser so you could run it in both Node.js and the browser. For running it in the browser you need to add a reference to the file and with Node.js it's up on [npm][4].

Here's a basic example of how to use it:

    var data = tbd.from({ hello: 'world' }).make(10);

This will create an array of 10 objects all which are identical. Since JavaScript doesn't have reflection like .NET there isn't a way to get an inferred type of a property, instead you have to assign it a 'default' value. This can have an advantage though as it means you can also only have tbd generate values for properties you actually want random data for. So how do you do values?

    var data = tbd.from({ foo: 1 })
                .prop('foo').use(function() { return Math.random(); }).done()
                .make(10);

This will create an array of 10 items which have a unique random number (well as unique as a random number can be :P) for the property `foo`. To break down the way it works you need to understand the fluent API for properties.

1. Pass the property name to the `prop` method as a string
 1. *Pro tip - if the property name doesn't exist on the source object it'll still be added!*
1. Pass a value or function into the `use` method
 * If you pass a value that will be used for each object
 * If you pass a function it'll be invoked for each object
 * There's some helper methods we'll look at later
1. Call `done` to signify you've finished with that property so you're back to the root API and allow you to modify more properties

The last thing you always call is `make` and specify the number of objects you want.

And that's it, you can go off and create all the data you could ever want.

# Making better fake data

Since tbd is a really dumb API if you don't tell it what to do with a property it wont do anything. So how do you produce *better fake data*? That might sound like a silly question but say you're trying to build some graphs, you don't want all the data to be the same do you?

Well to simplify this tbd ships with a number of useful utilities for generating better fake data. The full list you can get off the [readme][5] but are some of the most useful IMO. All of these reside in the `tbd.utils` namespace.

## Pick a random value

Say you want to randomly choose a value from a set of values, say a bunch of different word, there's a handy method that'll do that called `random` and you use it like so:

    var data = tbd.from({ hello: 'world' })
                .prop('hello').use(tbd.utils.random('me', 'no me', 'why not me!')).done()
                .make(10);

This method takes *n number of arguments* and it will randomly choose one of them for each object. You can pass in any data type that you want to this and it'll take a random from the list so you're not just restricted to strings.

## Better random numbers and dates

While the `random` method is great if you have a small set of data to go through but what if you don't? What if you want a random number between 1 and 1000? Typing that out would **suck**. Well luckily there is the `range` method:

    var data = tbd.from({ hello: 'world' })
                .prop('hello').use(tbd.utils.range(1, 1000)).done()
                .make(10);

For `range` you pass in a min and max value and something from in there will be used. This method also supports dates so you can randomly choose a date from within a range.

## Sequences

Sometimes you just want an ordered list of values and that's where `sequential` comes in. Sequential you provide a start point and you'll get a value incremented by one each time from there:

    var data = tbd.from({ hello: 'world' })
                .prop('hello').use(tbd.utils.sequential(1)).done()
                .make(10);

*Note: I had a mistake in the initial post, the method is `sequential` not `sequence`.*

### Date sequences

One cool thing about the `sequential` api is that you can provide it a date and it will increment that. By default the dates will shift one day at a time to get you to your new date:

    tbd.from({ date: new Date })
        .prop('foo').use(tbd.utils.sequential(new Date() /* optional parameter for date property the increment, default is 'd' */)
        .make(10);
    //the 'day' property will be incremented by 1 from the starting value

But you can overload this to increment by other date parts:

* y -> Year
* M -> Month
* d -> Day (default)
* h -> Hour
* m -> Minutes
* s -> Seconds

# Conclusion

So this wraps up our look at `tbd`, a useful little tool I wrote to make it easier to build out some fake data for when you're mocking a UI or to pump into a test.

[Grab it today!][6]


  [1]: http://nbuilder.org/
  [2]: http://fabricator.codeplex.com/
  [3]: https://github.com/aaronpowell/tbd
  [4]: http://search.npmjs.org/#/tbd
  [5]: https://github.com/aaronpowell/tbd/blob/master/README.md
  [6]: https://github.com/aaronpowell/tbd