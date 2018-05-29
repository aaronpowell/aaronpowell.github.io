---
  title: "Tweaking console.assert in IE9"
  metaTitle: "Tweaking console.assert in IE9"
  description: "A small tweak to console.assert in IE9"
  revised: "2011-02-25"
  date: "2011-01-30"
  tags: 
    - "ie9"
    - "javascript"
    - "web"
  migrated: "true"
  urls: 
    - "/ie-9-console-assert"
  summary: ""
---
Today while writing some JavaScript I was using the `console.assert` method to work out the state of things at different points in time.

If you're not familiar with `console.assert` here's the method signature:

    console.assert(expression, message[, object])

What this allows you to do is pass in an expression to be evaluated, a message to display when the expression is `false` and an optional object to dump.

This is really useful if you're writing large chunks of JavaScript and you can't/ don't want to attach the debugger (common if you're working with timeouts and intervals), you can have the application assertion results to the console to be observed.

I was using this in Chrome and FireFox (since the machine I have at work only has XP so no IE9 :() and found it really useful to be able to log out the optional object.

When doing so you end up with something like this:

![Chrome console.assert][1]

As you can see you can inspect into the object that you dumped out. Sweet!

Something you may already be aware of is that IE9 also includes a `console` object (yay, no more `alert` debugging :P), and it also contains an implementation of `console.assert`. So I decided to test and see how it goes in IE9, and here's what it looks like:

![IE9 sad face][2]

Oh dear, `[object Object]`, where's my object to inspect? This isn't good now is it. The problem is that the IE9 `console.assert` method calls `toString()` on your object, resulting in the `[object Object]` output. It's also right up against message.

Well let's fix it, the best thing about JavaScript is that you can just change stuff if you don't like it. So here's a method you can run in JavaScript to replace the out-of-the-box `console.assert` method:

	(function(assert) {

		console.assert = function(expression, message, object) {
			if(object) {
				//we only want to do this if they did provide an object
				assert(expression, message, ' >>> ' + JSON.stringify(object));
			} else {
				assert(expression, message);
			}
		};	

	})(console.assert);

Here we're creating an anonymous function that we'll immediately execute, pass in the standard `console.assert` and then augment it with using `JSON.stringify`. The beauty of this is that the native method is still being called, but if you're passing in an object we're converting it to a JSON string first.

Now when you do a `console.assert` and provide an object you get this:

![IE9 happy][3]

It's not perfect, you can't inspect into the object since it's just a string, but it does suite for a lot of purposes.

Just don't be silly and pass in `jQuery` as the object, you'll end up with something quite large :P.

**Disclaimer: This was done against the IE9 Beta (build 9.0.7930.16406) so it may change by the time of official release.**

**Disclaimer 2: Tested against the RC and it still doesn't produce an object inspection so this work around is still handy.**

  [1]: https://www.aaron-powell.com/get/javascript/ie9-console-assert/chrome-console.png
  [2]: https://www.aaron-powell.com/get/javascript/ie9-console-assert/ie9-bad.png
  [3]: https://www.aaron-powell.com/get/javascript/ie9-console-assert/ie9-good.png