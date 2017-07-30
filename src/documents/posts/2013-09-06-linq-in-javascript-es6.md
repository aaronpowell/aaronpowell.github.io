---
  title: "LINQ in JavaScript, ES6 style"
  date: "2013-09-06"
  tags: 
    - "javascript"
    - "linq"
    - "es6"
  description: "It's been a few years since I last blogged about the concept of LINQ in JavaScript as a lot has changed in the JavaScript landscape.\n\nSo let's revisit the idea of it with a look at how you could leverage LINQ in JavaScript for ES6."
---

## Update #1

The code I've talked about here isn't actually ES6 related, instead it's about an API only in FireFox, read more [here](/posts/2013-09-16-linq-in-javascript-es6-clarification.html).

Back in 2010 I posted about [implementing LINQ in JavaScript](/posts/2010-04-24-linq-in-javascript.html) in which I had a look at what would have been involved if you were writing a LINQ style API in JavaScript. Keep in mind that back in 2010 we didn't have libraries like [Underscore](http://underscorejs.org) or [LoDash](http://lodash.com) nor were people that aware of the `Array.prototype` extensions `map`/`filter`/`reduce`. So when it came to collection manipulation the most common approach was via the good ol' `for` loop but as I've said [in the past](/posts/2013-07-22-array-like-objects.html) `for` loops are uncool.

But with my implementation of LINQ in JavaScript, and the others out there that I've come across (including Underscore/LoDash) there is one thing that always annoyed me, they are eager evaluated.

Let's say you're displaying a paged list of records, and also have custom filters that people can apply. So we'd need to do three things for this:

* Apply a filter to a collection
* Transform a collection of objects to a collection of DOM elements (or DOM strings)
* Grab the subset of records required

This would result in something like this:

    var rows = people.filter(function (person) {
        return person.age > 30;
    }).map(function (person) {
        //removed for simplicity
    }).slice(0, 5);

So this has to be eager evaluated, if we've got 500 records in our `people` collection and 250 of them are going to match the filter we still have to process all 500 in the filter, then 250 in the `map`'s before we take the 5 that we want to show on the current page. Now admittedly we can move the `.slice(0, 5)` to before the `map` and then we'd `map` the subset but you still go into the `slice` having put the whole collection through the `filter`.

And this is where I like LINQ, it's lazy evaluated, if we did the same thing:

    var rows = people
                    .Where(person => person.Age > 30)
                    .Select(person => /* removed for simplicity */)
                    .Take(5);

Here the collection manipulation is processed only once you iterate over it `rows`, and only the first 5 that match the `Where` filter will be used, it will stop once it hits that. And this all comes down to the fact that C# implements [Iterators](http://en.wikipedia.org/wiki/Iterator) through the `IEnumerable` interface.

## Enter ES6

Good news everybody, ECMAScript 6 has a proposal forward to [add iterators to ECMAScript/JavaScript](http://wiki.ecmascript.org/doku.php?id=harmony:iterators) which means we can create lazy evaluated objects, more specifically, lazy evaluated collections.

*Note: This is a draft spec so what I'm doing only works in Firefox Nightly and may stop working at some random point.*

To create an iterator object you need to add a member of `__iterator__` that is a function that `yield`s a result, here's a basic iterator:

    var iterator = {
        __iterator__: function () {
            yield 1;
            yield 2:
            yield 3;
        }
    };

We can then iterate over it using a `for-in` loop like so:

    for (let val in iterator) {
        console.log(val);
    }
    // 1, 2, 3

You could then make an iterater version of an array:

    var iteratableArray = function (array) {
        return {
            __iterator__: function () {
                for (let i = 0; i < array.length; i++) {
                    yield array[i];
                }
            }
        };
    };

So now you can do nothing really any different:

    var arr = iteratableArray([1, 2, 3, 4]);
    for (let val in arr) {
        console.log(val);
    }

But where it gets really powerful is in the lazy evaluation, let's update to if we have a function passed in we'll return the evaluation of it:

    var iteratableArray = function (array) {
        return {
            __iterator__: function () {
                for (let i = 0; i < array.length; i++) {
                    if (typeof array[i] == 'function')
                        yield array[i]();
                    else
                        yield array[i];
                }
            }
        };
    };
    
Now we'll create our object:

    var arr = iteratableArray([function () { throw 'Bad'; }]);

The exception won't be thrown until we iterate through the collection:

    for (var x in arr) {
        console.log(x);
    }

*(Yes it's a contrived example but we'll move on from that.)*

# Implementing LINQ

Now we've seen the basics of how you would create something that's an iterable collection, and this is the basis of how we could implement LINQ. For this I'm going to create an `Enumerable` type that we'll work against:

    var Enumerable = function (array) {
        if (typeof this === 'undefined' || this.constructor !== Enumerable) {
            return new Enumerable(array);
        }
        this._array = array;
    };

This is a [constructor function](/posts/2013-07-14-javascript-new-operator.html) (that doesn't have to be used with the `new` operator) that we'll pass an array in (I'm not doing error checking at the moment, be nice :P).

I've then got an `__iterator__` function:

    var __iterator__ = function() {
        for (var i = 0; i < this._array.length; i++) {
            yield this._array[i];
        };
    };

Which is then added to the `Enumerable`'s prototype:

    Enumerable.prototype.__iterator__ = __iterator__;

And it works the same as our previous function, now we can start implementing more methods on the `prototype`. Let's start with the [`Where`](http://msdn.microsoft.com/en-us/library/system.linq.enumerable.where.aspx) method so we can filter the collection:

    var where = function (fn) {
        return new WhereEnumerable(this, fn);
    };
    Enumerable.prototype.where = where;
    Enumerable.prototype.filter = where; //just so it's more JavaScript-y

Wait, what's this `WhereEnumerable` that we're creating? Well since we want to chain this up and not have a really complex object that we keep modifying I've created another "class" to handle the filtering concept. This is similar to what LINQ does, it has a number of internal types that handle the different iterator concepts. Let's start implementing it:

    var WhereEnumerable = (function (__super) {
        __extends(WhereEnumerable, __super);

        function WhereEnumerable(enumerable, fn) {
            __super.call(this, enumerable._array);
            this._enumerable = enumerable;
            this._fn = fn;
        };

        return WhereEnumerable;
    })(Enumerable);

I'm using one of the fairly common _class_ patterns in JavaScript and I was lazy and grabbed some auto-generated code from a TypeScript project for doing class inheritance, but basically what I'm doing is:

* Creating a new constructor function that will invoke the `Enumerable` constructor function
* Capture the "parent" enumerable object
* Store the filtering function

Now we'd better implement the `__iterator__` method:

    WhereEnumerable.prototype.__iterator__ = function() {
        var index = 0;
        for (let item in this._enumerable) {
            if (this._fn(item, index)) {
                yield item;
            }
            index++;
        }
    };

It's a pretty simple method to understand we:

* Use a `for-in` loop to step through each value of the _parent enumerable_
* Apply the function to the value and it's index
* If the function returns truthy yield the item, else skip it

Neat now we can do this:

    var enumerable = Enumerable([1, 2, 3, 4]);
    var odds = enumerable.where(x => x % 2);

Now we have an unevaluated collection filter, and until we _step into_ the collection it'll stay that way.

# Stepping it up with chaining

The really powerful aspect of LINQ is its chaining capability, that you can apply multiple "query" operations to get a result, like our original example. So now let's add a `Count` method:

    var count = function () {
        var count = 0;
        for (let item in this) {
            count++;
        }
        return count;
    };
    Enumerable.prototype.count = count;

This means we could do this:

    console.log(enumerable.count()); //4
    console.log(odds.count()); //2

Because our `WhereEnumerable` type inherits from the `Enumerable` class, when we augment that prototype it filters through. Neat! Now we could even do this:

    var notOne = odds.where(x => x > 1);
    console.log(notOne.count()); //1

And if you were to debug through it keeps doing the `__iterator__` method for the _parent_ `Enumerable` object, meaning it'll ask for `1`, pass it to the initial filter, `x => x % 2` and then to `x => x > 1` since it passed the first `where` call. The next item through will fail the first `where` and won't be passed to the second. Neat!

# Select

Say we want to implement `Select` (which is `map` in JavaScript land), again I'm creating a new `Enumerable` subclass:

    var SelectEnumerable = (function (__super) {
        __extends(SelectEnumerable, __super);
    
        function SelectEnumerable(enumerable, fn) {
            __super.call(this, enumerable._array);
            this._enumerable = enumerable;
            this._fn = fn;
        };

        SelectEnumerable.prototype.__iterator__ = function () {
            var index = 0;
            for (var item in this._enumerable) {
                yeild this._fn(item, index++);
            }
        };

        return SelectEnumerable;
    })(Enumerable);

It's very similar to the `WhereEnumeratable` but we're returning the result of the provided function. Once added to the `Enumerable` prototype it means we can do this:

    var squares = enumerable.select(x => x ^ x);
    var oddSquares = enumerable.where(x => x % 2).select(x => x ^ x);

# .All

Not all of the methods we'd want to implement are going to require a new subclass to be made, something like [`All`](http://msdn.microsoft.com/en-us/library/bb548541.aspx), which returns whether or not every item in the Enumerable matches the predicate, will evaluate immediately. It's reasonably simple to implement as well:

    var all = function (fn) {
        for (let x in this) {
            if (!fn(x)) {
                return false;
            }
        }

        return true;
    };
    Enumerable.prototype.all = all;

Here it'll go over each item and if any of them fail the function it'll return false, otherwise it's true. Because we're using a `for-in` loop against the `this`, which is an Enumerable (or subclass of) we step back through all the previous points in the chain.

# Bringing it all together

So now that we've got a bunch of lazy evaluation available we could do something like this:

    var range = Enumerable.range(100, 1000);
    var primes = range.where(n => Enumerable.range(2, Math.floor(Math.sqrt(n))).all(i => n % i > 0));

    for (let prime in primes) {
        console.log(prime);
    }

That's a simple prime number generate, using some more extensions that will generate a range between two numbers (100 and 1000). Pretty neat hey, it finds all 143 prime numbers.

# Conclusion

And there we have it, a look at how we can use iterators to create a lazy-evaluated collection API which brings the power of .NET's LINQ to JavaScript. You'll find my [LINQ in JavaScript repository here](https://github.com/aaronpowell/linq-in-javascript/) and it includes a [bunch of tests](https://github.com/aaronpowell/linq-in-javascript/tree/master/tests) for the different parts of the API.

Like I said this is built against a draft implementation of a spec and is in part another experiment but I think it's a cool example of what's coming in the future of JavaScript.