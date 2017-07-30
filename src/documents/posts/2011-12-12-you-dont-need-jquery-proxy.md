---
  title: "You don't need to use $.proxy"
  metaTitle: "You don't need to use $.proxy"
  description: "Why you shouldn't use (and don't need to use) the $.proxy method in jQuery"
  revised: "2011-12-12"
  date: "2011-12-12"
  tags: 
    - "jquery"
    - "javascript"
  migrated: "true"
  urls: 
    - "/javascript/you-dont-need-jquery-proxy"
  summary: ""
---
I've been recently going through some extending of a jQuery UI widget which a colleague had written when I came across quite a number of statements that were using the [proxy][1] method from jQuery.

For anyone who's not familiar with the `proxy` method is allows you to take a function and specify a context (the `this` value) so when you pass it around for execution you always know what you're going to have as the context.

The method has been around for a while and it did serve a good purpose but these days its usefulness is becoming limited and I'm going to look at a few reasons as to why you shouldn't be using it.

# Understand this

The most common reason I see that people will use `proxy` is because they don't understand how `this` works in JavaScript. While there are dozens of articles through your favourite search engine explaining `this` ([here's a good start][2]) I'll do my best to give a quick overview.

When people come from C# they already have a notion of `this` and what it represents, unfortunately this is a broken assumption when moving to JavaScript. In C# `this` represents the current class which you're working within but since JavaScript *isn't* a classical language there isn't the concept of a *class* so you couldn't really associate it to one could you?

Instead `this` represents the context for which a function is executed for and different kinds of execution result in different contexts. Here's a few examples:

* Invoking a function from an object will set the context to the owner object
* Invoking a function literal will set the context to the global object (`window` in a browser)
* Invoking a function with apply/ call allows it to be controlled

And this is why a lot of people get utterly confused with `this` in JavaScript.

But what does this have to do with the `$.proxy` method? As I said one of the most common reasons I see people using it is because they want to be able to access members of a particular object within a callback (such as a function called from an AJAX success). Because they are aware that in their outer function they can go `this.foo` they expect it to be available within the callback (after all isn't the callback in the same class?) but it will fail so they use `$.proxy` to ensure that they can access the member(s) they require.

So why is it a poor choice in this scenario? Well the reason is  that you can solve the problem in a much simpler fashion, by understanding JavaScript closures. You can draw a lot of similarities between JavaScript closures and C# closures, but the simplest explanation is that a variable with be within scope until all functions that require is have been descoped. But with the case of `this`, since it changes between function scopes the `var that = this` pattern emerged in JavaScript.

Let's have a look at some code:

    var foo = {
        makeRequest: function () {
            $.get('/foo', $.proxy(function (result) {
                    this.update(result);
                }, this)
            );
        },

        update: function (data) { /* ... */ }
    };

    //somewhere later in the code
    foo.makeRequest();

Here we're using the `proxy` method to make it possible to access the `update` method, since when we called the `makeRequest` method its `this` is a reference to `foo` (we're assuming that the assignment of `foo` is out of scope for the `makeRequest` method). So let's update it to use variable closures:

    var foo = {
        makeRequest: function () {
            var that = this;
            $.get('/foo',function (result) {
                that.update(result);
            });
        },

        update: function (data) { /* ... */ }
    };

    foo.makeRequest();

The difference here is that I'm assigning the value of `this` to a variable before the callback is created and inside the callback I refer back to the variable.

So why is this better than using `proxy`? The primary reason is readability, if you look at the first snippet you're intention is obscured by the use of `proxy` to change the scope. When someone who understands JavaScript comes to that snippet they have to know what the use of `proxy` is and why the `this` context needs to be controlled. With the second snippet it's clearer to see that you want to call the `update` method on the same object which `makeRequest` was invoked from.

# Use built-in methods

An often missed note of JavaScript (well ECMAScript really) is that the functionality that is provided by `proxy` (and the similar methods in the other libraries) is built into the language, through the [bind][3] method. The `bind` method was added as part of ECMAScript 5 and

 > Creates a new function that, when called, itself calls this function in the context of the provided this value, with a given sequence of arguments preceding any provided when the new function was called.

Hmm that sounds pretty much like what you get from the `proxy` method yet it's built into the language.

This means that you can (potentially) get a performance boost ([check it out on JSPerf][4]) by using a native browser API rather than the wrapper. Also at the time of writing jQuery (1.7.1) doesn't use the native browser method it does the code itself.

Performance aside the main difference between the jQuery implementation and the ECMASCript 5 specification is the jQuery `proxy` method *does not throw a type error if the first argument is not a function* which the [spec states][5] `bind` will do. So although they are named differently they are providing the same functionality except for a critical check.

The take away from this point is that it's built into the language so using it makes a lot of sense and when you're in browsers that don't support it it's easy to polyfil the missing API (the mdn docs include the polyfil).

# Conclusion

That wraps up my "rant" against using the `proxy` method in jQuery. The goal of this article was to teach you a bit more about the JavaScript language and that things people commonly try and work around have simpler solutions.

By understanding language concepts such as `this` and closures you can avoid manipulating scope.

By knowing what's new in the language you can use built-in APIs and make faster and more portable code.


  [1]: http://api.jquery.com/jQuery.proxy/
  [2]: http://javascriptweblog.wordpress.com/2010/08/30/understanding-javascripts-this/
  [3]: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
  [4]: http://jsperf.com/bind-vs-jquery-proxy
  [5]: http://es5.github.com/#x15.3.4.5