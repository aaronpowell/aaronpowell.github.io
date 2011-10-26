--- cson
title: "Xamlizer - How to implement something silly in JavaScript"
metaTitle: "Xamlizer - How to implement something silly in JavaScript"
description: ""
revised: "2011-10-27"
date: "2011-10-24"
tags: ["javascript","doing-it-wrong"]
migrated: "true"
urls: ["/javascript/xamlizer-implementing-something-silly-in-javascript"]
summary: """

"""
---
I've never done much Xaml development, I started reading a WPF book and played around with it only to realise I didn't have any understanding of this concept of a stateful application or how layouts were going to work. And as a web developer who never saw the appeal of Flash I also never got into Silverlight as there was never a problem in my life that it would solve.

The one thing I do remember from my brief foray into that scary other world is the reliance on `INotifyPropertyChanged` and `INotifyPropertyChanging` interfaces. I've always thought that the idea behind these two interfaces was a good one, the primary problem though is how you actually have to implement them. Seriously, there's a lot of shit code you have to implement.

So I decided to do something a bit silly, I decided to implement the two interfaces in JavaScript.

### A dumb idea with a point

Now I see no real reason to use the code that I'm going to look at in any current development (I'll explain why later) but more importantly I want to look at something that is part of ECMAScript 5 that doesn't get the attention it deserves, [`Object.defineProperty`][1].

# JavaScript properties throughout history

JavaScript, unlike languages such as C#, doesn't really have this concept of a property like you get there, the idea of a *get* and *set* operating being something that you can control. Really this is how a *class* in JavaScript with some public properties looks:

    var person = {
        firstName: 'Aaron',
        lastName: 'Powell'
    };

And when we want to update a property we'd do something like this:

    person.firstName = 'John';

Now there's nothing wrong with this, it does what you'll want to do *in a lot of scenarios*, the problem is when you're wanting a slightly more complex scenario, say you want to react to a change to the `firstName` property, maybe perform some validation.

Let's assume we want to have an `age` property on our `person`. Obviously we want to make sure that `age` is at least 0 and probably less than 110 (sounds reasonable :P), well how do you do this?

* Validation before assigning the property?
 * That'll work, but what if we're exposing it to external API's? How can we enforce the validation to them?

### Functions as properties

The general way which this problem is solved is to rather than use assignable properties you use functions as properties, making your code look like this:

	var person = (function() {
		var _age;

		return {
			//firstName, lastName, etc
			age: function(val) {
		      	if(val !== undefined && (val >= 0 && val <= 100) {
		        	_age = val;
		      	} else {
		        	//Raise an error
		      	}
		      	return _age;
    		}
		}
	})();

Now we use the `age` property like so:

    person.age(27);
    console.log(person.age()); //outputs 27

Now this isn't really *that* bad, the main pain point to it is that we now have a different way to assign the value, we do it through a function invocation rather than through an assignment statement. This can come to light if you're writing a JavaScript templating engine, you need to check if the *property* is actually a property or a function property. But we do get some nice stuff like the fact that in JavaScript you don't need to do overloads so we can have the one function perform both the `get` and `set` operation for our property.

Libraries such as [KnockoutJS][2] use this pattern for properties to do their UI binding but it can cause confusion, like in KnockoutJS if you want to bind to a property you'd do something like this: `data-bind="css: { someClass: someBoolean }"` which Knockout will understand it's an observable property and bind to the result of the function, but if you want to use the **false** value you need to do `data-bind="css: { someClass: !someBoolean() }"`. Note that this time it's **invoked the property as a function** rather than just using the property.

The can be a bit confusing and I've seen more than one developer (including myself) getting stumped as to why their bindings weren't working only to realise that it'd because they are binding to `!someBoolean` which equates to `!function() { }` rather than the **result** of the function. It's a very face-palm moment.

# Introducing ES5 properties

As part of the ECMAScript 5 spec the concept of properties was addresses and has resulted in the `Object.defineProperty` API (and an API to define multiple at once, being `Object.defineProperties`) and this allows us to (among other things) define `get` and `set` method bodies for our properties.

Let's revisit our `person.age` property example from above, but do it using an ECMAScript 5 property:

	var person = (function() {
		var _age;

		var newPerson = { 
			firstName: 'Aaron',
			lastName: 'Powell'
		};

		Object.defineProperty(newPerson, 'age', {
			get: function() { return _age; },
			set: function(value) {
				if(value && value >= 0 && value <= 110) {
					_age = value
				} else {
					//raise error
				}
			}
		});

		return newPerson;
	})();




  [1]: http://es5.github.com/#x15.2.3.6
  [2]: http://knockoutjs.com