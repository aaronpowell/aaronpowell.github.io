---
  title: "Understanding compression and minification"
  metaTitle: "Understanding compression and minification"
  description: "An look into what is involved in JavaScript compression and minification as well as where the benefits lie."
  revised: "2012-05-29"
  date: "2012-05-29"
  tags: 
    - "javascript"
  migrated: "true"
  urls: 
    - "/javascript/understanding-compression-and-minification"
  summary: ""
---
One of my colleagues raised a question on our internal discussion system as to why we should use minified JavaScript libraries. Now I'm sure everyone knows that you *should* minimize your libraries but do you *really* understand what the different levels of minification are and the benefits of the different levels? While I strongly recommend that you should ensure that on a production system you always have your JavaScript minified **and** [gzipped](http://en.wikipedia.org/wiki/Gzip) (well and the right caching headers but that's beyond the scope of this blog post) let's have a look as to exactly what differences it makes.

For the exercise I decided that I would take the [jQuery 1.7.2](http://blog.jquery.com/2012/03/21/jquery-1-7-2-released/) release as it's a very common JavaScript library and it's very well written and formatted. I'm going to use the unminified version to run the steps against. For the minification I've decided to use [uglify js](https://github.com/mishoo/UglifyJS) which is toting itself as the best library for minification, it's also got a pretty nice API so I can work with it programmatically. Lastly I've got a tiny Node.js application running Express.js that is serving out the files.

# Serving the raw file

Let's start by looking at serving a completely raw file, the jQuery *development* release and if we request our file we'll see something like this as the response headers:

    HTTP/1.1 200 OK
    X-Powered-By: Express
    Content-Type: application/javascript
    Content-Length: 327171
    Connection: keep-alive
    
So the raw request is coming back at **327171 bytes** which is pretty large. From a production point of view you wouldn't exactly want to do this everytime. Let's turn on gzip for this same request and see what happens:

    HTTP/1.1 200 OK
    X-Powered-By: Express
    Content-Encoding: gzip
    Vary: Accept-Encoding
    Content-Length: 78390
    Content-Type: application/javascript
    Connection: keep-alive

Now that I've turned on gzip compression our request is already down to **78390 bytes**, this is a pretty drastic reduction already and all we've done is turn on compression. But we're not really getting the most our of our response, gzipping is good, it takes care of common parts of our code, the `function` keyword, whitespace, etc, but there's still more we can get out of this.

# Stripping comments

Comments are useful in your codebase but do you really need to send them down to the user? Probably not. So let's strip them out before sending our response and see what impact this has. For this I'm going to use uglify.js and rebuilt the AST from our original source. I'm going to maintain the structure of our code so we're going to have a bunch of whitespace still, it wont be exactly what jQuery originally had since we've had to rebuild the codebase from the AST but at least our code would still be useful if we want to step through. If we take a look at the first few lines of the file it looks like this:

	(function(window, undefined) {
	    var document = window.document, navigator = window.navigator, location = window.location;
	    var jQuery = function() {
	        var jQuery = function(selector, context) {
	            return new jQuery.fn.init(selector, context, rootjQuery);
	        }, _jQuery = window.jQuery, _$ = window.$, rootjQuery, quickExpr = /^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/, rnotwhite = /\S/, trimLeft = /^\s+/, trimRight = /\s+$/, rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>)?$/, rvalidchars = /^[\],:{}\s]*$/, rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g, rwebkit = /(webkit)[ \/]([\w.]+)/, ropera = /(opera)(?:.*version)?[ \/]([\w.]+)/, rmsie = /(msie) ([\w.]+)/, rmozilla = /(mozilla)(?:.*? rv:([\w.]+))?/, rdashAlpha = /-([a-z]|[0-9])/ig, rmsPrefix = /^-ms-/, fcamelCase = function(all, letter) {
	            return (letter + "").toUpperCase();
	        }, userAgent = navigator.userAgent, browserMatch, readyList, DOMContentLoaded, toString = Object.prototype.toString, hasOwn = Object.prototype.hasOwnProperty, push = Array.prototype.push, slice = Array.prototype.slice, trim = String.prototype.trim, indexOf = Array.prototype.indexOf, class2type = {};
	        jQuery.fn = jQuery.prototype = {
	            constructor: jQuery,
	            
As I said this isn't exactly what the jQuery source looked like since we've removed more whitespace but it's close and most importantly it's readable.

Now let's look at the headers:

    HTTP/1.1 200 OK
    X-Powered-By: Express
    Content-Type: application/javascript; charset=utf-8
    Content-Length: 254399
    Connection: keep-alive
    
If we compare that to the original we've gone down to **254399 bytes**. Cool even with that we've dropped a good bit of weight from our response. Now let's also gzip it:

    HTTP/1.1 200 OK
    X-Powered-By: Express
    Content-Encoding: gzip
    Vary: Accept-Encoding
    Content-Length: 48566
    Content-Type: application/javascript
    Connection: keep-alive

Again we're getting some better performance because we don't have the comments which don't compress as well as say whitespace and a slightly more organised codebase.

# Mangling our code

One of the most common things that a minifier will do is *obfuscate* your code, variables, functions, etc will all be renamed into smaller versions so that you have smaller files by having smaller names. Obviously this makes your code a whole lot harder to read (hence obfuscation) but it does do wonders for file size. Again we're going to get uglify.js to help us out so let's have a look at the first few lines again:

	(function(a, b) {
	    function h(a) {
	        var b = g[a] = {}, c, d;
	        a = a.split(/\s+/);
	        for (c = 0, d = a.length; c < d; c++) {
	            b[a[c]] = true;
	        }
	        return b;
	    }
	    
Well that's quite different now isn't it! You'll see from the very first line in the original version we had two arguments `window` and `undefined`, these are now called `a` and `b`, the body has also been rewritten so that there's a different order for the code, functions are now at the top, the first being a function called `h`. Here's the original function that is now the `h` function:

    function createFlags(flags) {
        var object = flagsCache[flags] = {}, i, length;
        flags = flags.split(/\s+/);
        for (i = 0, length = flags.length; i < length; i++) {
            object[flags[i]] = true;
        }
        return object;
    }

As you can see the use of smaller variable names and this is done because the variables are never needed by any consumer of the API, so renaming `object` to `b` wont be a problem because anyone who knew it was `object` has also had their references updated. So what's the impact on size?

    HTTP/1.1 200 OK
    X-Powered-By: Express
    Content-Type: application/javascript; charset=utf-8
    Content-Length: 213222
    Connection: keep-alive

If we compare this back to the last request you'll see that it's only slightly smaller, but this is the advantage of using minimal variable names (and keep in mind we still have whitespace). And now we'll try gzipping it:
    
    HTTP/1.1 200 OK
    X-Powered-By: Express
    Content-Encoding: gzip
    Vary: Accept-Encoding
    Content-Length: 42854
    Content-Type: application/javascript
    Connection: keep-alive

Again we're not really that might smaller than just the comment stripped version but we are shrinking our response down.

# Optimising the codebase

Although variable minification can do good things to getting your files smaller you can get even more out of it if you're smart about your codebase, in this stage we're looking at tricks of the JavaScript language that you won't want to actually write but are useful when you're trying to get smaller files. Things like utilising the comma operator can be useful for chaining together statements and removing unreachable code are something best left to the machines, you can easily introduce errors into your JavaScript if you're not careful. Let's run this over our codebase:

	(function(a, b) {
	    function h(a) {
	        var b = g[a] = {}, c, d;
	        a = a.split(/\s+/);
	        for (c = 0, d = a.length; c < d; c++) b[a[c]] = !0;
	        return b;
	    }
	    
Well now *that* is looking rather different isn't it. You'll see that there's some interesting tricks that have been applied, in particular the use of `!0`. Fascinating how you can exploit JavaScript boolean operations isn't it. If you're unsure of what this is doing in JavaScript `0` is a falsey value, meaning that JavaScript will treat `0` as `false`, but it's not *actually* false (`0 === false` returns `false`) but by putting a `!` operator it will force the value to be converted to an actual boolean by returning the inverse, and `!0 === true`. Like I said, fascinating.

So what's it do for our response size (keep in mind we still have whitespace maintained):

    HTTP/1.1 200 OK
    X-Powered-By: Express
    Content-Type: application/javascript; charset=utf-8
    Content-Length: 155600
    Connection: keep-alive

Well that's looking good, we've really dropped the size nicely, and if we gzip it:

    HTTP/1.1 200 OK
    X-Powered-By: Express
    Content-Encoding: gzip
    Vary: Accept-Encoding
    Content-Length: 39185
    Content-Type: application/javascript
    Connection: keep-alive

Almost there! It's getting pretty small right there ey!

# Putting it all together

We've pretty much run through all of the different steps to get our responses down, we've seen the impact of each step, but let's roll it all together and also strip off the whitespace:

    HTTP/1.1 200 OK
    X-Powered-By: Express
    Content-Type: application/javascript; charset=utf-8
    Content-Length: 94656
    Connection: keep-alive

So if we drop the whitespace we are *drastically* reducing the size of our library but our code is next to impossible to step into if we need to debug it. This is a logical desire of a production system, you really shouldn't be debugging through it. So what if we turn on gzipping this time, we've already removed the whitespace, the biggest space waste in our response so can we really get as much from gzipping?

    HTTP/1.1 200 OK
    X-Powered-By: Express
    Content-Encoding: gzip
    Vary: Accept-Encoding
    Content-Length: 33632
    Content-Type: application/javascript
    Connection: keep-alive

Sweet, we've still got a really good levels of compression against our library, down to just **33632 bytes** for jQuery.

# Size Matters

Now that we've seen how we get to the end goal, an ultra-small version of our JavaScript library we should answer the question of *why*. The simplest answer to the question is speed, by having a smaller file (~30kb vs ~350kb) we can send that down from the server a lot quicker. This is especially important when you're looking at this from a mobile point of view, you've got a limited bandwidth allowance so you want to be able to send as much as quickly as possible.

But what about from the point of view of high-speed network connections, is file size *really* that important if you're transmitting over ADSL2 or something? Well yes it still does matter, even if you can download the file fast you can download smaller files even faster and that will have an impact on the overall speed of your application, the faster all dependencies are loaded the faster your application becomes response to the end user.

The other main reason to ensure that you're files are as small as possible is caching. Again this is most important from a mobile browser point of view but it's still very valid with desktop browsers. Mobile browsers have fairly limited cache allowances. Yahoo! did a [blog post](http://www.yuiblog.com/blog/2010/07/12/mobile-browser-cache-limits-revisited/) which they looked at the allowances for the different mobile devices (although it's a bit out-of-date) and you can see from that you've not got a lot of play so the better packed your files the safer you'll be in cache. Desktop browsers are a lot more flexible since you can change their cache allowances and they also have [higher starting levels](http://www.blaze.io/mobile/understanding-mobile-cache-sizes/).

# Conclusion

So you've seen throughout this blog exactly what makes up minification of JavaScript libraries, what different minification concepts bring to the table and ultimately just *why* you should minify **and** gzip your libraries in production. Keep in mind that there's more to performance that I haven't covered such as caching but there's plenty of articles out there that can help you with that ;).
