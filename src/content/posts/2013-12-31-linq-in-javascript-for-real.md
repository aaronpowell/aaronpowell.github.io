---
  title: "LINQ in JavaScript, ES6 style, for real this time"
  date: "2013-12-31"
  tags: 
    - "javascript"
    - "linq"
    - "es6"
  description: "Revisiting how to implement LINQ in JavaScript on top of ES6 but this time it's actually going to be on top of ES6 features!"
---

In a recent post I talked about writing [LINQ in JavaScript using ES6 iterators](/posts/2013-09-06-linq-in-javascript-es6.html) but then had to [take my words back](/posts/2013-09-16-linq-in-javascript-es6-clarification.html) after it was pointed out to me that I wasn't actually using ES6 generators.

Well some time has past and I've reworked my previous library to actually use the [iterators and generators](http://wiki.ecmascript.org/doku.php?id=harmony:iterators) from ES6, so let's have a look at how to get going with it.

# Lazy evaluating collections

Let's start simple, let's take an array and make it lazy evaluated. To do this I'm going to create a _generator function_ that deals with the iterations through the array:

    let lazyArray = function* (...args) {
        for (let i = 0; i < args.length; i++) {
            yield args[i];
        }
    };

There's a few new things here to look at:

* `function*` - this is a new syntax as part of ES6 and what it is doing is telling the JavaScript runtime that this function is a _genreator function_. This is important if we want to use `yield` to return values as `yield` (and `yield*` which I won't be covering) can only be used inside a generator function. _Side note: At the time of writing Firefox Nightly allows you to use `yield` outside of generator functions, yay bleeding edge!_
* `...args` - I've used this mostly for convenience, splats are coming in ES6 and it's so much easier to get arguments as arrays this way
* `let` - as you should know JavaScript is _function scoped_ not _block scoped_ (which C# is) so when you declare a variable, regardless of where you declare it, it'll always be available in the function. Well that was before we had ES6 and `let`. `let` allows you to create block scoped variables and as I play with more ES6 I find that I prefer to use `let` over `var` for declaring variables as it brings a more sane scope to what I'm declaring

Now let's use it:

    let arr = lazyArray(0,1,2,3,4,5,6,7,8,9);

Awesome, we've got our lazy array, not quite as nice as using `[0,1,2,3...]`, but it's acceptable, so now we can do stuff with it, like read the values out:

    for (let x of arr) {
        console.log(x);
    }

Again we're seeing some new syntax, this time in the form of a `for-of` statement. This is used to iterate through the results of a generator function. Since this function is lazy evaluated we don't have array indexers or anything on it, instead we have a `next` method which tells it we want the next iteration of the function which is similar to [`IEnumerator` and it's `MoveNext` method](http://msdn.microsoft.com/en-us/library/system.collections.ienumerator.aspx). In fact we could write something like this:

    console.log(arr.next().value); //0
    console.log(arr.next().value); //1
    //and so on

The result of `next()` returns us an object like so:

    {
        done: true|false,
        value: value|undefined
    }

So to decompose our `for-of` look it's more like this:

    let x;
    while (!(x = arr.next()).done) {
        console.log(x.value);
    }

What we're saying is "While the generator isn't `done` get the next and output the value". Personally I think the `for-of` syntax is much nicer, but there's advantaged to accessing items at your choosing, just like using the `IEnumerator` interface in C# has its advantages.

# Building filtering for our generator function

The problem with our `lazyArray` is that we have no way which we would be able to filter it, although it's _array like_ it's not an array and we can't make it an array without loosing our lazy evaluation. So instead we'll start augmenting the function prototype:

    lazyArray.prototype.where = function* (fn) {
        for (let item of this) {
            if (fn(item)) {
                yield item;
            }
        }
    };

This works in a very smooth fashion, you'll see that we're doing `for (let item of this)`, that's because we're augmenting a generator function, so we are lazy evaluating our "parent" collection, we can just `for-of` loop over that.

And ultimately what it means is we can do this:

    for (let x of arr.where(i => i % 2)) {
        console.log(x);
    }
    //Note: I'm using the fat arrow syntax from ES6 to make it more lambda-esq, but you can use a "normal function" instead.

Sweet, we're filtering down to only items that are odd numbers!

# Transforming the items

What's `filter` without `map` (well... `where` without `select`)? Again that's pretty easy to add by just augmenting our `lazyArray` prototype:

    lazyArray.prototype.select = function* (fn) {
        for (let item of this) {
            yield fn(item);
        }
    };

So we could do something like creating squares of everything:

    for (let x of arr.select(i => i * i)) {
        console.log(x);
    }

# Chaining

Now being able to do a single manipulation on a collection that is lazy is good, but really you're more likely to do a `filter` then a `map`, well let's go ahead:

    for (let x of arr.where(i => i % 2).select(i => i * i)) {
        console.log(x);
    }

Hmm that's a syntax error, apparently our `where` function doesn't have a `select` method, well you'd be right on spotting that. The reason is we've been manipulating the `lazyArray` prototype, but we also need to manipulate the prototype of these new functions too, but to do that we'll have to assign them to variables rather than having them as anonymous functions:

    let where = function* where(fn) {
        for (let item of this) {
            if (fn(item))
                yield item;
        }
    };

    let select = function* select(fn) {
        for (let item of this) {
            yield fn(item);
        }
    };

    lazyArray.prototype.where = where;
    lazyArray.prototype.select = select;
    where.prototype.select = select;
    where.prototype.where = where;
    select.prototype.where = where;
    select.prototype.select = select;

And then we can:

    for (let x of arr.where(i => i % 2).select(i => i * i)) {
        console.log(x);
    }

Or even:

    for (let x of arr.select(i => i * i).select(i => i * i)) {
        console.log(x);
    }

Now using your imagination you can see how other LINQ methods can be implemented.

# Multiple enumerations

Now this is where it'll get tricky, unlike C# JavaScript generator functions can't be iterated over multiple times, once a generator is spent *it's spent*. This will be a problem if you want to do something like this:

    if (arr.any()) {
        for (let x of arr) {
            //stuff
        }
    }

For an `any()` to work you need to walk the generator, but when you've walked it once you can't walk it again, so how can do address that? The easiest way is to do what ReSharper suggests to me all the time in C#, get the collection in to an array, but doing so looses the laziness of our collection.

Instead what I've done with LINQ in JavaScript is wrapped the enumerable in another function so you have to invoke it to get the generator, like so:

    if (arr.any()) {
        for (let x of arr()) {
            //stuff
        }
    }

So our `arr` object is actually a non-generator function and you have to invoke it to use walk it, but to make it nicer to work with I've made functions like `any()` take care of that for you so you don't have to `arr().any()` as I think that'd be a code smell. But this does mean that the result of a call to `where` or `select` will need to be invoked like so:

    for (let item of arr.where(x => x % 2)()) {
        console.log(item);
    }

But really I'm of the opinion you shouldn't be doing your lambda expressions inside of the `for-of` declaration anyway so I think that it's fine.

# Wrapping up

Well there we have it, how we can use ES6 generators to create LINQ in JavaScript which is *actually* lazy evaluated. I've gone ahread and published the code which I've been working on [to my GitHub repo](https://github.com/aaronpowell/linq-in-javascript) and you can also get it [via npm](https://npmjs.org/package/linq-es6) if you're using Node.js `0.11.4` or higher (and turn on the harmony features of v8). So go one, check out [the tests](https://github.com/aaronpowell/linq-in-javascript/tree/master/tests) for some fun examples of what you can do like:

    describe('Interesting API usages', function () {
       it('should calc prime numbers', function () {
            var range = Enumerable.range(3, 10);

            var primes = range.where(n => Enumerable.range(2, Math.floor(Math.sqrt(n))).all(i => n % i > 0));

            var expectedPrimes = [3, 5, 7];
            var index = 0;
            for (let prime of primes()) {
                expect(prime).to.equal(expectedPrimes[index]);
                index++;
            }
        }); 
    });
