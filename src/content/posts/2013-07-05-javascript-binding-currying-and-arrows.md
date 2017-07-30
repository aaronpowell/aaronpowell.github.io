---
  title: "JavaScript bind, currying and arrow functions"
  date: "2013-07-05"
  tags: 
    - "javascript"
  description: "After confusing my colleagues with how to invoke functions with a modifided set of arguments at a single time the next evolutionary point was to confuse them with creating functions that are always called with a different state."
---

How many times have you written code like this:

    var foo = {
        makeRequest: function () {
            $.get('/foo', function (result) {
                    this.update(result);
                });
            );
        },
        update: function (data) { /* ... */ }
    };
    //somewhere later in the code
    foo.makeRequest();

Only to have it poo itself saying that `this.update` is not a function? Maybe it was with an event handler not an AJAX request, all in all it's the same problem, you tried to use something and JavaScript changed the value of this on you.

Welcome to the wonderful world of JavaScript scoping.

So there's a bunch of ways which you can solve this, you can write the `var that = this;` style code being a very popular one, basically leveraging closure scopes to keep an instance of the type in memory until the function itself is GC'ed.

But there's another approach, `Function.bind`.

We'll start with our simple demo:

    var foo = function (x) {
          console.log(this, x, arguments);
    };

As we remember from last time we can get this:

    foo(42); //console.log(window, 42, [42]);

Now saw we can the foo function to have a known value of what this is when it's called, no matter how it's invoked, even if someone was to sneaky and use call or apply? Well that's what we can use the bind method for:

    var bar = foo.bind({ a: 'b' });
    bar(42); //console.log({ a: 'b' }, 42, [42]);
    bar.call('abc', 42);

So both times we call the bar function we have the same result, even though we're trying to specify a this context using the call method.

## Other uses for bind

While bind is most commonly used to force a function to always have a specific value for the this object it can also be used for another purpose, to bind specific arguments. If we revisit our foo method we could do this:

    var baz = foo.bind('a', 'b');
    baz(); //console.log('a', 'b', ['b']);

## Practical application of argument binding

When you're looking for a practical application for argument binding an idea that comes to mind is [Currying](http://en.wikipedia.org/wiki/Currying). I'm not going to dive too deeply into what currying is, if you're not familiar with the concept start with the Wikipedia link and expand from there (also functional programming isn't my area of expertise, I just understand some of the basics and may be missing the point from here on out, if so Twitter is --> for you to rant on).

Let's create a new function to add two numbers:

    var sum = function (x, y) {
          return x + y;
    };

Ideally we want to be able to do something like this:

    var add2 = curry(sum, 2);
    add2(4); // 6

Now we'll create a curry function:

    var curry = function (fn) {
          var args = Array.prototype.slice.call(arguments, 1);
          return fn.bind.apply(fn, [this].concat(args);
    };

While this function is kind of trippy looking it's more because it's a very generic method, it's allowing us to curry a function and bind any number of arguments in place (which is why we're using the apply method of bind to provide an array of arguments) and the arguments we provide when calling the bound function will be appended on to the ones which we pre-bound.

But from this we end up with a new function that we can call as above.

_Bonus: My colleague [Liam Mclennan](https://twitter.com/liammclennan) flicked me [this gist](https://gist.github.com/liammclennan/3654718#comment-559457) of how to do an even cooler currying approach._

## Fat arrows

If you've done anything with CoffeeScript or TypeScript you might be familiar with the concept of fat arrow functions. These languages use a modified syntax to deal with lexical scoping problem that bind can be used to solve. TypeScript tracks your usage of this in fat arrow functions and replaces it with a captured variable, CoffeeScript relies on the `@` symbol to do a similar thing.

For anyone who's not been following the evolution of [ECMAScript 6](http://wiki.ecmascript.org/doku.php?id=harmony:proposals) (the next version of JavaScript) one of the accepted new syntax features is [arrow function syntax](http://wiki.ecmascript.org/doku.php?id=harmony:arrow_function_syntax).

Simply put the language is going to have a way to defining a function which you can be confident of what the this value will be (sure you can still futz with it if you want to but it's covering the most common scenarios).

To test out the new arrow function syntax grab Firefox v22 or newer.
