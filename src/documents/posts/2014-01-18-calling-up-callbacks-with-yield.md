---
  title: "Cleaning up callbacks with yield"
  date: "2014-01-18"
  tags: 
    - "javascript"
    - "es6"
  description: "We'll continue our exploration into the new `yield` and have a look at how it can be used to avoid the so-called callback hell which can plague JavaScript applications."
---

In my [last post](/posts/2014-01-13-functions-that-yield-mutliple-times.html) we took a journey on how to make a function execute in a delayed fashion by using the new `yield` keyword coming in ES6. But we were still working with what was essentially a synchronous code path, we just used `yield` to halt its execution. By the end of the post we used `setTimeout` to buffer our execution time, making it asynchronous in its execution.

But the fact of the matter remains this is still synchronous code that we're dealing with and in JavaScript synchronous programming isn't the only way we worked, much of what we do is asynchronous. This can lead to what is commonly referred to as [callback hell](http://callbackhell.com/) and it's the bane of JavaScript developers everywhere.

Now there's a number of different ways which you can tackle this, [Promises](http://promises-aplus.github.io/promises-spec/) being one of the popular options. I'm not going to talk about Promises in this post though, I just want to focus on the raw problem of callbacks.

Let's go with the following as our baseline code:

    var getData = function* () {
        let data = yield get('http://jsbin.com/ikekug/1.js');
        console.log(data);
    };

That'd be nice and clean code if we could get to it now wouldn't it? And if we think about how it works it wouldn't seem that difficult to achieve would it? As we learnt last time the right hand side of the `yield` statement gets evaluated in one `next()` call and we can pass the result of that through to the following `next()` call to do a left-side assignment.

# Implementing `get`

I'm going to not use any JavaScript library for doing our AJAX get, I'm going to do it raw [like I talked about it here](/posts/2013-08-02-ajax-without-jquery.html).

So our `get` method would look like this:

    let get = function (url) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.addEventListener('load', function (e) {
            var o = JSON.parse(xhr.responseText);
        });
        xhr.send();
    };

Hmm something about this doesn't look right, how are we getting the value of `o` back out of the callback handler for `load`? Well we need to return something so that it can be returned from the `next()` call, but returning something from `get` wouldn't make sense, it's actually the value from the `load` callback that we want, but we can't return from there either as it'd be a different scope, so what can we do?

# Thunk

The problem is we need to be able to return a value from inside a callback, and really the best way for us to do that is to change how we write our function, we're going to have to make a [Thunk](http://en.wikipedia.org/wiki/Thunk_(functional_programming)). Now our function will look like this:

    let get = function (url) {
        return function () {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.addEventListener('load', function (e) {
                var o = JSON.parse(xhr.responseText);
            });
            xhr.send();
        };
    };

Well that didn't really change anything did it. So why did we introduce a thunk?

# Executing our generator

So far in all of the examples I've walked through we've executed our generator functions by either the use of a `for-of` statement, or by iteratively calling `next()`. In a real-world scenario this is a bit less than ideal isn't it, after all to call `next()` you either have to keep checking if it's done, or know exactly how many times to call `next()`. What would be better is if we had something to take care of that for us.

Let's get started:

    let runner = function (generateor) {

    };

Now this `runner` function won't get a generator itself, it will just be able to handle generators. Ultimately what this function will do is take a function (which is assumed to be a generator) and handle the calls to `next`, passing the correct value until it's done. So what's the best way to do that? We could do a `while` loop like we used in the last post? Well that won't work with the asynchronous problems we're trying to solve because we've got no way to grab that return value if we try and be synchronous.

So what's the solution to that, a recursive function:

    let runner = function (generator) {
        let next = function (arg) {
        };
        let it = generator();
        return next();
    }

Here what I'll be doing is:

* Create a function that will handle calling `next`, imaginatively named `next`
* Get the iterator
* Start the recursion


    let next = function (arg) {
        var result = it.next(arg);
    };

Each time through `next` we'll capture the result of the iterator's `next` call, taking the argument from when it was last called and pass it through to the iterator. Also this takes care of the fact that you can't call an iterator _for its first iteration_ with an argument, which we can achieve by passing null.

    let next = function (arg) {
        var result = it.next(arg);
        
        if (result.done) {
            return;
        }
        
        next(result.value);
    }

And now our function will run through all steps of an iterator quite happily as a recursive function, but still **we're not dealing with asynchronous operations**. Well this is where our Thunk will come in, we'll check if the return type is a function. But more than that we'll pass the `next` function as the argument to our Thunk:

    let next = function (arg) {
        var result = it.next(arg);
        
        if (result.done) {
            return;
        }
        
        if (typeof result.value == 'function') {
            result.value(next);
        } else {
            next(result.value);
        }
    };

For this to work we better go update our Thunk:

    let get = function (url) {
        return function (cont) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.addEventListener('load', function (e) {
                var o = JSON.parse(xhr.responseText);
                if (cont)
                    cont(o);
            });
            xhr.send();
        };
    };

So what's going on here?

* When `yield get('...')` is called it will return a function as `result.value`
* `result.value` is received by our recursive function and detected to be a function
* Control over when the iterator will continue is up to our Thunk

The important point to note is the last point, we hand over continuation control to our asynchronous operation. Let's look at another way we can use this:

    let sleep = function (ms) {
        return function (cont) {
            setTimeout(cont, ms);
        };
    };

    runner(function* () {
        console.log('start');
        yeild sleep(1000);
        console.log('end');
    });

Does that make sense, our Thunk receives a function to execute when it is done. This can be executed immediately or this could be executed after an asynchronous operation completes. We can also pass an argument to it which is our _return value_ from the `yield` statement.

And finally we can make our generator like this:

    let fn = function* () {
        let data = yield get('http://jsbin.com/ikekug/1.js');
        console.log(data);

        yield sleep(1000);

        data = yield get('http://jsbin.com/ikekug/1.js');
        console.log(data);

        yield sleep(1000);

        cosole.log('done');
    };

    runner(fn);

# Conclusion

Today we've had a look at how we can solve the problem of callback hell by the use of ES6 generators, in a fashion that reminds me very much of [C#'s async/await](http://msdn.microsoft.com/en-us/library/hh191443.aspx).

We've seen that with a little change to the way we write functions, by introduction Thunks, we can create functions which can be used in a continuation manner.

## Bonus code

One of the first places I see generators being used is in Node.js (you can use it in Node.js 0.11.x with the `--harmony` flag) since you only have a single JavaScript engine to deal with. Also the Node.js APIs are written pretty close to what we're executing already, so with a few tweaks we can take our `runner` function into Node.js:

    let runner = function (fn) {
        let next = function (err, arg) {
            if (err) {
                return it.throw(err);
            }

            var result = it.next(arg);
            
            if (result.done) {
                return;
            }
            
            if (typeof result.value == 'function') {
                result.value(next);
            } else {
                next(null, result.value);
            }
        }
        let it = fn();
        return next();
    }

    let thunker = function (fn) {
        var args = [].slice.call(arguments, 1);
        return function (cont) {
            args.push(cont);
            fn.apply(this, args);
        };
    };

We could then do something, like reading folders:

    runner(function* () {
        var contents = yield thunker(fs.readdir, 'node_modules');

        console.log(contents);
    });
