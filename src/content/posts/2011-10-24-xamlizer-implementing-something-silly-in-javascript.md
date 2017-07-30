---
  title: "Xamlizer - How to implement something silly in JavaScript"
  metaTitle: "Xamlizer - How to implement something silly in JavaScript"
  description: ""
  revised: "2011-10-27"
  date: "2011-10-24"
  tags: 
    - "javascript"
    - "doing-it-wrong"
  migrated: "true"
  urls: 
    - "/javascript/xamlizer-implementing-something-silly-in-javascript"
  summary: ""
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
	person.age = 27;
	console.log(person.age);

Hopefully you can see here the difference between the *function property* and the ES5 property.

With ES5 the property with a function body *looks just like a public field*. Now there's a few other things you can do here, such as make properties read-only and exclude them from `for...in` loops, and for that check out the [MDN][3] (you can also do body-less properties), but it makes it very easy to build smarts into your objects. Also like .NET if you want to provide a `get`/`set` you need to have a backing store, but that's easy to get around with closure scope.

So that covers a basic look ES5 properties. Now back to our bad idea...

# Implementing INotifyPropertyChange in JavaScript

As I demonstrated above it is possible to add a body to your properties let's do something with that idea.

If you're not familiar with `INotifyPropertyChang*` then you should read the [MSDN][4] [docs][5]. The **TL;DR** is that you use trigger the `Changing` event before you assign the property and then the `Changed` event after it's assigned and the UI can react.

As I said I think there's a lot of value in this pattern, it's just that as most Xaml devs will tell you implementing it is a real pain in the ass.

So say you wanted to implement it in JavaScript, it's not overly hard, ultimately we need to do something like this:

	Object.defineProperty(foo, 'prop', {
		get: function() { return _prop; },
		set: function(val) {
			propertyChanging(this, 'prop');
			_prop = val;
			propertyChanged(this, 'prop');	
		}
	});

I've ignored the guff code like what the `propertyChang*` methods are doing as well as subscribing handlers to the events but you get the idea. This really don't look any different to the C# version though does it? So what's the point?

## Making it better through the magic of JavaScript

As you can see there's a lot of boilerplate code that you need to get this working. In .NET there's no real way to avoid this (unless you do some magic under the covers). But one of the cool things about JavaScript being a dynamic language is that we can modify an object pretty damn easily. Let's go back to our `person` object:

	var person = {
		firstName: 'Aaron',
		lastName: 'Powell',
		age: 27
	};

Now imagine that I want to implement my JavaScript version of `INotifyPropertyChang*` on it so that my UI can react whenever I update the values, but I don't want to be going through and writing this all out myself, I've got a bunch of objects that I want to *promote* to implementing the interfaces.

Well since JavaScript doesn't actually have interfaces in the language it's a bit tricky, and this is where my funky little script comes in.

**Hello Xamlizer!**

So I've created a little JavaScript code snippet which I've called **[Xamlizer][6]** that'll take an object and implement `INotifyPropertyChang*` on it. Now the script isn't really that smart, all it does is goes through all the properties of the object and then converts them into properties that implement our pattern.

You can then use it like this:

	var person = {
		firstName: 'Aaron',
		lastName: 'Powell',
		age: 27
	};

	xamlizer(person);
	person.addPropertyChanging(function(object, property) {
		console.log('Property ' + property + 'changing');
	});

	person.age = 28;

And there we go, we've got a script that'll turn our normal JavaScript objects into something that can notify subscribers when the property changes.

If you dig into the code for Xamlizer you'll see that it doesn't do anything really complex, it just modifies some properties. *Note: As I said it's not really that smart, it actually modifies anything public on the object, so if you have a function that is public it might get crazy :P. But hey, it's just demo code!*

And if you want to see it in action check out the [jsfiddle][7].

# Conclusion

Well this wraps up our look at the limitations in how you have to do properties in ES3, the changes which ES5 provides you with (although their usefulness at the moment is debatable since we have to support ES3 browsers for a while still) and finished off with looking at how to implement a generic library to change fields to properties with debatable usefulness.


  [1]: http://es5.github.com/#x15.2.3.6
  [2]: http://knockoutjs.com
  [3]: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/defineProperty
  [4]: http://msdn.microsoft.com/en-us/library/system.componentmodel.inotifypropertychanged.aspx
  [5]: http://msdn.microsoft.com/en-us/library/system.componentmodel.inotifypropertychanging.aspx
  [6]: https://gist.github.com/1318702
  [7]: http://jsfiddle.net/slace/Zemxm/