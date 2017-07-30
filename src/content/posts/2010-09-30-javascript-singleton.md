---
  title: "JavaScript functions that rewrite themselves for a Singleton pattern"
  metaTitle: "JavaScript functions that rewrite themselves for a Singleton"
  description: "Time for more crazy JavaScript, functions that can rewrite themselves!"
  revised: "2010-10-01"
  date: "2010-09-30"
  tags: 
    - "javascript"
    - "web"
  migrated: "true"
  urls: 
    - "/javascript-singleton"
  summary: ""
---
Recently I was building a JavaScript application which was quite complex and involved a bit of server interaction with some AJAX requests. The AJAX was just doing some one-time data loading, and the reason I was using AJAX was to lazy-load some of the information on the page.

Since the methods going back to the server were to be called multiple times and I wanted caching of the server response I needed to have the method a bit aware that the server call had responded and not to do it again. Essentially what I was wanting to do was have a [Singleton][1] implemented, but this is really just a method call, so we need to Singleton a method... hmm...

Well let's have a look at how to do that.

# Functions writing functions

Let's think about what we're trying to do here, we're trying to make a function run and then run again but perform a bit differently the next time around, and there's a few different ways to do this. One of the ways you can do this is with logic branches, `if something then ... else ... endif`, sure that's easy, but it's totally not crazy enough for me, could we do `if something then replace function else call original endif`? Well the answer is yes, and that's what we're going to do, the function is going to **rewrite itself during its execution!**

# It's exploitation I tell you!

So what we're wanting to do is take advantage of the way that JavaScript closure works. I'm not going to go into detail about explaining closure, [if you're interested check this post out][2], but what we're going to use is the fact that a variable defined outside a function can be assigned within that function.

Let's look at a very basic example:

	var fn;
	fn = function() {
		fn = function() {
			console.log("I've been replaced!");
		};
		console.log("Thanks for the call");
	};
	fn(); //Thanks for the call
	fn(); //I've been replaced!

If you run this in a browser (that supports `console.log`, eg: Firefox, Chrome and IE9)  the first time the function is called you'll get the output **Thanks for the call** and then every subsequent call will output **I've been replaced!**.

Awesome!

The reason this works is because we're creating a variable called `fn` which we can access within the scope of then `fn` function body, and because we can access the variable we can reassign it! So when `fn` runs it rewrites itself, but it has its own function body that it executes.

This allows you to do some crazy things, like this:

	var fn;
	fn = function() {
		fn = function() {
			fn();
		};
		console.log("Thanks for the call");
	};
	fn(); //Thanks for the call
	fn(); //results in a stack overflow

I wouldn't advise this, it's a good way to make a mess of some code :P. This was more just to illustrate a point.

# Real world scenario

The example we've seen above is fairly sandboxed, it doesn't really take into account the method being a method of a JavaScript object, doesn't take into account the AJAX or anything like that. It illustrates the point nicely, but let's expand on it.

First off let's create a little JavaScript object to play with:

	myObject = (function() {
		var _this;
		_this = {
			getData: function(callback) {

			}
		};	
		return _this;
	})();

I'm creating an object called `myObject` (imaginative I know) that will be sitting at the `window` level, and had a single public method `getData(callback)`. The method will take a function as an argument which we'll invoke when the server response is completed. Doing a callback for an AJAX request is an easy way to expose the successful response method without having to expose the AJAX API.

Now let's go about implementing the body of the function:

	myObject = (function() {
		var _this;
		_this = {
			getData: function(callback) {
				$.ajax({
					type: "POST",
					contentType: "application/json; charset=utf-8",
					url: '/MyService.asmx/SomeMethod',
					success: function (data) {
						_this.getData = function(callback) {
							callback.apply(_this, [data]);
						};
						
						callback.apply(_this, [data]);
					}
				});
			}
		};	
		return _this;
	})();

Here we're using jQuery (it'll just make it a bit less verbose for the demo) and then we're calling a web service method, that is all fairly standard, the interesting stuff is within the body of the *success* property:

	success: function (data) {
		_this.getData = function(callback) {
			callback.apply(_this, [data]);
		};
		
		callback.apply(_this, [data]);
	}

This is the function which jQuery will invoke when the server successfully returns (and we're assuming that it returns some data). When the method is called we'll execute the callback (and by using `callback.apply` we can specify the internal scope of the object, so the `this` scope will be the `myObject`).

And like we did in our early example here we're running a piece of code to rewrite the function when it executes. The thing is that we now have an object, so we can't use the trick we were using before, instead this time what we're doing is **assigning the method on the object which was created**. This is the key point here, if we don't have a reference back to the object then we can't reassign it. It is true that this demo could use `myObject.getData`, since it's a static method on the object, but I wanted the demo to cover if you are using a class implementation.

# Conclusion

That wraps it all up, we've see how we can create functions in JavaScript which will rewrite themselves to simulate a Singleton. The ultimate usefulness of this code is up for debate, but it is a good example of how you can do some really funky stuff with JavaScript.

Just be careful you don't make your rewriting functions too smart or they may become sentient!

  [1]: http://en.wikipedia.org/wiki/Singleton_pattern
  [2]: http://stackoverflow.com/questions/111102/how-does-a-javascript-closure-work