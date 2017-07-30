---
  title: "Array-like objects"
  date: "2013-07-22"
  tags: 
    - "javascript"
  description: "Just because it looks like a duck, walks like a duck, quacks like a duck doesn't mean it's a duck. There's dangers with making assumptions of your JavaScript objects based on their surface area.\n\nThat said, a lot of power can be gleamed by these seemingly innocent assumptions."
---

You've possibly head the saying

> When I see a bird that walks like a duck and swims like a duck and quacks like a duck, I call that bird a duck. - [credit](http://books.google.com/books?id=j7zds6xx7S0C&pg=PA68&dq=%22james+Riley%22+OR+%22James+Whitcomb+Riley%22+bird++duck&num=100)

This is a common adage when talking about [Duck Typing](http://en.wikipedia.org/wiki/Duck_typing) in programming, especially when it comes to working with dynamic languages like JavaScript, based on assumptions made about an object you can attempt to infer other details. Statically typed languages on the other hand make it a bit harder to do Duck Typing, [that's not to say it's impossible](http://blogs.bartdesmet.net/blogs/bart/archive/2008/11/10/introducing-the-c-ducktaper-bridging-the-dynamic-world-with-the-static-world.aspx).

Due to the dynamic nature of JavaScript we actually come across this quite often with arrays in JavaScript. So what makes an object an array? Well there's two basic building blocks of an array:

* Numerical identifiers
* A length property

So take this code snippet:

    var foo = ??;
    for (var i = 0; i < foo.length; i++) {
        console.log(foo[i]);
    }

From this we can infer that `foo` is quite possibly an array, it meets our basic requirements to be an array, but like the dangers of duck typing this doesn't mean that it's actually an array does it?

# Array-like objects

It's quite common in JavaScript to come across array-like objects, objects that on the surface look like arrays but as soon as you look beneath the surface it'll become apparent that they aren't actually arrays. You've probably come across these objects in the past and not really given it a second thought, two really common objects are the `arguments` object and a `NodeList` (you know, from `querySelectorAll`). Both of these objects have numerical indexers, length, but no `push`, `pop` and so on, basically they don't inherit `Array.prototype`.

With both of these objects the fact that they don't inherit from `Array.prototype` is a bit of a pain, it means you couldn't do something like this for example:

    var inputs = form.querySelectorAll('input');
    var values = inputs.map(function (input) {
            return {
                value: input.value,
                name: input.getAttribute('name')
            };
        });

So this is a pretty simple bit of code, you want to get all the input name/value pairs, maybe to submit them via AJAX but that's not important, what's important is we're using the `Array.map` method, something very common if you're doing anything in a modern JavaScript engine (modern being >= IE9).

# Making arrays of array-like objects

If you've found yourself an array-like object chances are you want to use it like an array, that begs the obvious question, how do we make it an array?

Well there's a pretty easy solution to this, we have numerical indexes and a length property, so what about a `for loop`:

    var items = [];
    for (var i = 0, il = inputs.length; i < il; i++) {
        items.push(inputs[i]);
    }

But... `for loop`'s are so old school there's got to be a better way. Well there is and here we can look at exploiting JavaScript's functions. We've seen that you can use [`call` and `apply`](/posts/2013-07-04-javascript-call-and-apply.html) to futz with function scope and this we can do to improve our array-like object manipulation.

# Futzing slice

When you're wanting to create new arrays from existing ones the easiest way is using the `slice` method. The `slice` method can be neat if you want to take parts of an array between two indexes, but it can also be used if you want to create a whole clone of the array, like so:

    var array1 = [1, 2, 3];
    var array2 = array1.slice(0);
    console.log(array1 !== array2);

By passing `0` we take a slice starting at index 0 and since we provided no end point it'll go to the length of the array.

But `slice` is a function just like everything else, you can use `call` against it.

And where it gets really interesting is when we play with our array-like objects, we can pass _that_ as our context to our `slice` method:

    var items = Array.prototype.slice.call(inputs, 0);

Yep that's right, `slice` doesn't require an array, just something that _looks_ like an array, as far as `slice` is concerned it looks like a duck, it quacked, so hey, we'll treat it like a duck, check out [the SpiderMonkey source](http://hg.mozilla.org/mozilla-central/file/2268ff80683a/js/src/jsarray.cpp#l2536), it really only cares if there's a `length` property, pretty neat!

# Conclusion

We've seen some building blocks over the last few weeks, things we can use to manipulate functions and objects in the interesting ways and this is just another common usage of the patterns.

A small piece of advice, if you're doing a lot of these calls you can assign `slice` into a variable which you can use, which will make the minification work a whole lot better:

    var slice = Array.prototype.slice;
    var items = slice.call(inputs, 0);