---
  title: "Core JavaScript library"
  metaTitle: "Core JavaScript library"
  description: "A core JavaScript library from my JavaScript Tools"
  revised: "2010-09-13"
  date: "2010-09-12"
  tags: 
    - "javascript"
    - "web"
  migrated: "true"
  urls: 
    - "/slace-core-javascript-library"
  summary: ""
---
## Overview

This library is really just a core set of features which don't really belong to any particularly category, and I find a handy for common use in all JavaScript I write.

## Registering Namespaces

Something that I do a lot of in JavaScript is create namespaces. I always like to keep all code in a single namespace in the same manner which I would do with .NET. But there is a problem, JavaScript doesn't have namespaces!

I'm sure everyone has written their own code to register namespaces. The code that I use is actually someone I worked with adapted from some code that I'd written as I thought you had to be able to use recursive functions to do it and he was just quicker to getting it written than I was :P.

### Usage

The method resides within my core API namespace, `slace.core` as a method named `registerNamespace`, like so:

    slace.core.registerNamespace('some.namespace');

This will create a new namespace starting at the `window` object, but it also has the capabilities to add the namespace from any existing namespace, eg:

    slace.core.registerNamespace('web', slace);

Now the `slace` object will also have `web` to go with `core`.

### Understanding Namespaces in JavaScript

As I mentioned above JavaScript doesn't have the concept of namespaces, so how do you create a namespace in a language which doesn't do namespaces?

Well namespaces in JavaScript are actually a bit of a trick, and they aren't namespaces which are familiar to .NET developers, they are actually just a series of empty objects.

Take this piece of code:

	slace.core.registerNamespace('slace.web.controls');

This will produce the following object:

	slace = {
		web = {
			controls = {			
			}
		}
	};

*Well technically the `window` object should be before `slace` but it's skipped for brevity, as is the `slace.core` object*

So this is really just a set of empty objects!

### Looking into the code

So you can [find the code here][1], and let's have a look at what it does. The crux of it is a recursive function which the namespace is passed into:

	slace.core.registerNamespace = function (namespace, global) {
		var go;
		go = function (object, properties) {
			if (properties.length) {
				var propertyToDefine = properties.shift();

				if (typeof object[propertyToDefine] === 'undefined') {
					object[propertyToDefine] = {};
				}

				go(object[propertyToDefine], properties);
			}
		};
		go(global || (function () { return this; })(), namespace.split('.'));
	}

In this function the argument `object` is what we're putting the namespace onto, with `properties` is an array of the namespace to define (having been split on the .).

The last line initiates the function and either passes in the object you want to augment, or the object which is scoped as `this` for the method (which will be `window` unless you're really going to get nasty with JavaScript, but that's a topic for another time :P).

### Fun fact

This code can actually be reduced by a few lines by making it a self-executing named function (or a [self-executing anonymous function][2] if you want ;)), but due to limitations in the Visual Studio 2010 JavaScript intellisense engine it doesn't work recursively it seems. Odd bug, but easy to get around (and it makes your code a bit more readable!).

## Base Extensions

The library also includes some handy extensions for detecting if a method already registered on an object, in the form of `Function.method` (which is from Douglas Crockford's article on [JavaScript Inheritance][3]), and the `Array.prototype` is also augmented to have `Array.contains`, `Array.remove` and `Array.indexOf` (unless it's already there).


  [1]: http://bitbucket.org/slace/javascript-tools/src/tip/JavaScriptTools/Scripts/slace.core.js
  [2]: /recursive-anonymous-functions
  [3]: http://www.crockford.com/javascript/inheritance.html