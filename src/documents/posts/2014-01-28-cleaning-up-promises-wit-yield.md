---
  title: "Cleaning up promises with yield"
  date: "2014-01-28"
  tags: 
    - "javascript"
    - "es6"
  description: "Previously we looked at cleaning up callback hell with thunks and generators, but in this post we'll look at the next approach to managing callbacks, Promises, and how we could clean that up with generators."
---

Last time we [cleaned up callback hell with `yield`](/posts/2014-01-18-calling-up-callbacks-with-yield.html) but callbacks in the design which I was talking about are not all that common these days, especially if you're working in the browser. When you're in the browser there's a good chance you're going to be working with Promises, and more accurately [Promise/A+](http://promises-aplus.github.io/).

If you're unfamiliar with Promises, it's a specification which is states that you have an object which exposes a `then` method which will either fulfill or reject some operation. You've probably come across it with AJAX requests:

    $.get('http://jsbin.com/ikekug/1.js').then(function (data) {
        //do something with the successful response
    }, function (err) {
        //do something with an error
    });

So libraries like [jQuery](http://jquery.com) provide a Promise API ([well, it's not exactly Promise/A+](https://thewayofcode.wordpress.com/tag/jquery-deferred-broken)) or there's dedicated libraries like [Q](https://github.com/kriskowal/q). Even my [db.js](https://github.com/aaronpowell/db.js) exposes a Promise-like API, so it's pretty common a thing to find around the shop.

With the proliferation of Promises the question is, could we clean the up Promises like we did with thunk'ed functions? Basically getting us back to doing this: 

    var getData = function* () {
        let data = yield get('http://jsbin.com/ikekug/1.js');
        console.log(data);
    };

# Reimplemeting `get`

In the last post we had a `get` method which did our AJAX query, so we'll start with that:

    let get = function (url) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.addEventListener('load', function (e) {
            var o = JSON.parse(xhr.responseText);
        });
        xhr.send();
    };

But now we need to make it use a Promise. There's heaps of different Promise libraries which we could leverage, or we could leverage the [native browser support for Promises](https://github.com/domenic/promises-unwrapping)! _But be aware that this is super bleeding edge and it really doesn't have great support yet, but bugger it we're already using bleeding edge so why not go further!_

    let get = function (url) {
        return new Promise(function (fulfill, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.addEventListener('load', function (e) {
                if (xhr.status == 200) {
                    var o = JSON.parse(xhr.responseText);
                    fulfill(o);
                } else {
                    reject(Error(xhr.statusText));
                }
            });
            xhr.send();
        });
    };

Right, now we can do something like this:

    get('http://jsbin.com/ikekug/1.js').then(function (data) {
        console.log(data);
    });

So we're returning a new Promise instance from the browser and for that promise we have the contents of our `get` method from earlier. Once this completes we either `fulfill` the promise, because it was successful, or `reject` it on an error.

# Reimplementing `runner`

Now we need to reimplement our `runner` function, previously it assumed that the function to be `yielded` was a thunk, but this time it's not, so we need to refactor it to make it understand how to do the promise, and to deal with the fulfill/reject pipeline which it uses.

    let runner = function (fn) {
        let cont = function (method, arg) {
        };
        
        
        let it = fn();
        let fulfilled = cont.bind(this, 'next');
        let rejected = cont.bind(this, 'throw');
        
        return fulfilled();
    };

Ok here's our method skeleton, I've got a `cont` function (which use to be called `next`) which will be used to handle stepping through the iterator's `next` method, but I'm actually creating a wrapper around it which contains either `next` or `through` as the first argument (`method`). So why are we doing this? To understand that we need to look at how `cont` works:

    let runner = function (fn) {
        let cont = function (method, arg) {
            var result;

            try {
                result = it[method](arg);
            } catch (e) {
                return Promise.reject(e);
            }
            
            if (result.done) {
                return result.value;
            }
            
            return Promise.cast(result.value).then(fulfilled, rejected);
        };
        
        
        let it = fn();
        let fulfilled = cont.bind(this, 'next');
        let rejected = cont.bind(this, 'throw');
        
        return fulfilled();
    };

Here's our fully reimplemented `runner` method which includes the `cont` method completed. Because we're creating "wrappers" around the `cont` method using `Function.bind` we're able to use the exact same method for both stepping through to the next iteration, or raising an error (more on `Function.bind` [check out my previous post](/posts/2013-07-05-javascript-binding-currying-and-arrows.html)).

Let's walk through what happens:

* The `runner` starts up, creates our iterator, creates our wrappers and then invokes `fulfilled`
* This invokes the `cont` function with the `method` argument equaling `next`
* The expression `it[method](arg)` is really `it['next'](arg)` which is the same as `it.next(arg)`

Sweet, by using `bind` we can choose what method on the iterator to invoke, either `next` or `throw`.

Continuing down the assumption that we're using `next`, we wrap this in a `try/catch`, if the call fails we then immediately reject a Promise. Using the `Promise.reject` method means we're creating a promise that can only fail.

Assuming that that was successful we do our check for the iteration being done, and in that case just exiting out of the Promise chain, but if we've got a continuation point we'll create a yet another Promise using `Promise.cast`, which will either create a new promise or if `result.value` was a promise it'll return that, and from here we'll then provide _the same `fulfilled` and `rejected` functions_ so that it will step into the iteration again. This call to `Promise.cast` is important because what we're doing is ensuring that we can deal with Promise chaining. Once of the nice things about Promises is that they return a Promise, so we can do `.then().then().then()` and so on.

Now when we've got an implemented `runner` method which will go and execute our Promise-base `yield`.

# Conclusion

Today we've looked at the other approach to solving callback hell, Promises, and how we can combine that with the new approach to doing asynchronous programming in JavaScript through generators.