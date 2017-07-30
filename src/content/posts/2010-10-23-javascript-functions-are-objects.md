---
  title: "JavaScript functions are objects"
  metaTitle: "JavaScript functions are objects"
  description: "JavaScript functions are more than just functions"
  revised: "2010-10-24"
  date: "2010-10-23"
  tags: 
    - "javascript"
    - "web"
  migrated: "true"
  urls: 
    - "/javascript-functions-are-objects"
  summary: ""
---
I think it's well known just how much I enjoy JavaScript, especially since there's a few [really][1] [funky][2] [things][3] I've written about in the past.

But in this article I'm going to look at something else that's not commonly realised about JavaScript, that a function is actually just an object.

## Functions 101

There's a couple of ways which you can write a function in JavaScript, you can write them anonymously:

	$(function() {
		//do stuff
	});

You can name them:

	function add(x, y) {
		return x + y;
	}

Or you can assign them to a variable:

	var add = function(x, y) {
		return x + y;
	};

Each type of function declaration type has a different ideal usage, anonymous functions are best if you're wanting to pass around single use functions, where as if you're naming them it's best if you want to reuse the function and assigning it to a variable (which you can name it at the same time) works in the a very similar fashion (I'm sure there's differences but I haven't read the full ECMA 262 spec so I'm not sure the differences :P).

JavaScript functions always return a value, even if you don't have a return statement (in which case they return `undefined`) so you can return objects, built-in types (like boolean, number, etc) or even return functions.

So as you can see functions are really quite powerful.

## Beyond function basics

Let's have a look at how we can work with functions beyond the basics of them, let's take a function that we're assigning to a variable:

	var add = function(x, y) {
		return x + y;
	};

By doing this we've got a variable named `add` which we can use like this:

    var x = add(1,1); //x === 2

Well there's a though, could you add a property to the variable `add`? Maybe we could use this to add a description for the function that we're working with...

    add.desc = "Adds two numbers together";
    alert(add.desc);

That's perfectly valid because... **functions are objects**. That's right, anything you could do to a "standard object" you can do to a function. In fact, you can even have a function property on a function, like this:

	var add = function(x, y) {
		return x + y;
	};
	
	add.add = add;
	alert(add.add(1,1)); //alerts 2

Ok, so this isn't *really* that useful an example, but it does kind of prove a point.

This whole concept of functions-are-objects is core in a lot of JavaScript frameworks. Take [jQuery][4] for example, you can do this which will invoke a function:

    jQuery('div');

Or you can do this which will work against jQuery as an object:

    jQuery.ajax(...);

And as you can see it's all through a single entry point of the `jQuery` object that we're either working with it as a function or as an object.

## Taking it another step

So if our function is an object, what can we do with it, can we do anything really trippy? How about having a function that describes itself after it runs? How can we do that?

When a function runs there is a special variable which you get passed in called `arguments`. This variable knows a few things about what's happening such as:

* The name of the function
* The arguments passed into it
* The object that called the function

By using the `arguments` object we could start describing the function, like so:

	var add = function(x, y) {
		arguments.callee.lastCall = {
			'x': x,
			'y': y
		};
		return x + y;
	};
	add(1,2);
	alert(add.lastCall.x); //alerts 1

Sweet, we can now find out about the last invocation of the function!

## Conclusion

In this article we've looked into some of the fun things you can do with JavaScript functions, and how you can use a function as more than just a way to perform operations, but get them to describe themselves while they are running.

Whether or not this is overly ideal in what you're doing it's up to you, but it's definitely something that could be handy if you're writing your own [JavaScript mocking framework][5] :P.


  [1]: /recursive-anonymous-functions
  [2]: /linq-in-javascript
  [3]: /javascript-singleton
  [4]: http://jquery.com
  [5]: http://hg.slace.biz/javascript-tools/src/tip/JavaScriptTools/Scripts/tester/slace.tester.mocker.js
