---
  title: "Recursive Anonymous Functions"
  metaTitle: "Recursive Anonymous Functions"
  description: "To know recursion you must first know recursion"
  revised: "2010-04-08"
  date: "2009-06-06"
  tags: 
    - "javascript"
    - "black-magic"
  migrated: "true"
  urls: 
    - "/recursive-anonymous-functions"
  summary: ""
---
I was on [StackOverflow][1] the other day and I was reading a post about the [strangest programming language you've ever used][2]. While looking at what people have used I realized I haven't worked with anything that strange.

But then I was thinking there is one language I used that's a bit strange, **JavaScript**. 

Without going into all the weirdness of the JavaScript language I'd like to focus on one bit craziness which I'm quite fond of, **self executing recursive anonymous functions**. Yeah it's a bit of mouthful but it's also a bit of fun, and may even have some practical uses.

We're all familiar with JavaScripts ability to do anonymous functions, they are often used within event delegates and and constantly used when doing jQuery. Something like this:

    jQuery('#button').click(function() { ... } );

So that's the anonymous part of what we're trying to achieve, now lets look at self executing functions.
JavaScript can do self executing functions, they are generally used for creating objects. jQuery is in fact an example of this, which is why if you do a **typeof jQuery** you get **function** as the response. For example:

    var result = (function() { ... })();

Notice the () at the end, this tells the function to execute and take no parameters. But you can also do this:

    var result = (function(node) { ... } )(document.getElementById('button'));

I'm not going to cover what a recursive function is, I'm sure we all know what they are, but I did raise a problem, we're using anonymous functions, how do I call a function without a name?

Well JavaScript actually has a way of doing this, every JavaScript function has a hidden parameter called arguments, this is a collection of all the arguments passed into the function in the order they were passed in. So you can do something like this:

	(function() {
	  for(var i = 0; i < arguments.length; i++) {
		alert(arguments[i]);
	  }
	})("hello", "world");

This will do two alerts, the first saying *hello* the second saying *world*. But there's another property on the arguments object, **arguments.callee**. This is a reference to the method which called the current function. And because it's a reference to the function we can have some real fun, because you can **execute arguments.callee**!

Say I wanted to know if a node as a child of a node with a particular ID, I can do this:

	var isChild = (function(node) {
	  if(node) {
		if(node.id === 'parent') {
		  return true;
		} else {
		  return argument.callee(node.parentNode);
		}
	  } else {
		return false;
	  }
	})(document.getElementById('child'));

How nifty! Ok, yeah it does make the function a lot less reusable, but hey, this was an example of craziness of the JavaScript language! Oh, and I have used this before, see my post [Creating jQuery plugins for MS AJAX components, dynamically][3]!

And this is why JavaScript is the strangest language I have ever used.


  [1]: http://stackoverflow.com
  [2]: http://stackoverflow.com/questions/63241/what-is-the-strangest-programming-language-you-have-used
  [3]: /creating-jquery-plugins-from-ms-ajax-components