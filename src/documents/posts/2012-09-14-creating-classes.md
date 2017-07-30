---
  title: "Creating classes in WinJS"
  metaTitle: "Creating classes in WinJS"
  description: "A look at how you can create JavaScript classes in WinJS"
  revised: "2012-09-14"
  date: "2012-09-14"
  tags: 
    - "winjs"
    - "windows8"
    - "javascript"
  migrated: "true"
  urls: 
    - "/winjs/creating-classes"
  summary: ""
---
Sure using classes in JavaScript _may_ not be a great idea, you can't help but argue that there are valid scenarios which you would be wanting to use the class pattern.

If you're doing WinJS development there's an API that will allow you to make classes easily, `WinJS.Class` being the root. From here you can define new classes, derive classes or create mixins.

# Creating a class

It's very easy to create a class using the WinJS API, here's a simple person:

     var Person = WinJS.Class.define(function (firstName, lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
    });

    var me = new Person('Aaron', 'Powell');
    console.log(me.firstName + ' ' me.lastName);

Not very exciting is it?

Well let's say you want to add some instance members:

     var Person = WinJS.Class.define(function (firstName, lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
    }, {
        sayHello: function () {
           console.log('Hello there good sir');
        }
    });

    var me = new Person('Aaron', 'Powell');

    me.sayHello();

The 2nd argument to the `define` method is a JavaScript object that represents the _public instance_ members which you will have available on your class. There's also a third argument you can use which allows you to create _public static_ members.

## Powerful properties

Something that I found rather cool and not particularly well documented is how the properties are created (both the instance and static properties). Internally they are created using the [`Object.defineProperties`][1] method, and since this is ECMAScript 5 we're able to do some cool things, such as leveraging the new property features, like so:

     var Person = WinJS.Class.define(function (firstName, lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
    }, {
        fullName: {
            get: function () { return this.firstName + ' ' + this.lastName; }
        }
    });

What I've done here is used a property descriptor to create a **read only** property which calculates a value based off of other properties on the object. WinJS takes this information and then creates it properly so I can do:

    console.log(me.fullName);

If I then try and `set` the value of `fullName` nothing will happen, it gets ignored.

You can also leverage this to create properties with validation in them:

     var Person = WinJS.Class.define(function (firstName, lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
    }, {
        fullName: {
            get: function () { return this.firstName + ' ' + this.lastName; }
        },
        age: {
           get: function () {
               return this._age;
           },
           set: function (value) {
               if (value < 0) {
                   throw 'Age must be greater than or equal to 0';
               }

               this._age = value;
           }
       },
       _age: 0
    });

Now I have a more intelligent property in `age`, it will do validation to make sure that you don't have a negative age and it stores its information in a pseudo-private property, that being `_age`.

Pseudo-private property? Huh? Since JavaScript doesn't really have the notion of classes the concept of public/ private members doesn't exist. You *can* have things internal to the "constructor" function, but they can't be accessed outside of that scope. Instead what WinJS does (and many other class pattern libraries) is uses the `_` prefix to denote something as private. While this wont actually be private, it's a bit harder to learn about (Visual Studio intellisense drops any JavaScript members that start with it for example).

The other thing that WinJS does to help you hide these members is it will look to see if you've provided a property descriptor, and then look for the `enumerable` property of it (if you don't have a property descriptor it creates one and sets `enumerable` to `false`). When the `enumerable` property on a descriptor is `false` (the default too BTW) the property will be skipped when the properties are enumerated by say a `for-in` loop or `Object.keys`.

So these `_`-prefixed members are hidden as best as they can be in JavaScript, and it's really neat that you can use a common coding convention to mark them as hidden rather than having to create a full descriptor yourself.

# Deriving classes

Sometimes just creating a class isn't enough, you want to have a base class which you can then derive others from. Again since there's no class system in JavaScript this isn't native, but through the use of prototypes you can simulate this inheritance. WinJS provides a simple to use API for doing classical inheritance, `WinJS.Class.derive`.

Let's use the tacky person-employee example for this:

	var Employee = WinJS.Class.derive(Person, function (firstName, lastName, position) {
		this.firstName = firstName;
		this.lastName = lastName;
		this.position = position;
	});

For this as you can probably tell you provide the first argument of the method as the base class and then all arguments beyond that are the same as if you're calling `define`.

_Side note - if you don't provide a base class it will pipe the arguments through to the `define` function anyway._

Since this inherits from the `Person` class I have access to all its members so I can call `sayHello` for example, or set the age of  the employee.

## A gotcha with derived classes

While working with the `derive` API I hit a problem, **the base class constructor was never called!** I had a base class that I defined like this:

	var Bootstrapper = WinJS.Class.define(function () {
		var initialised = false;

		this.init = function () {
			//do some init stuff
			//eventually call customInit
		};
	}, {
		customInit: function () {}
	});

So this was the bootstrapper for my application but I wanted it so I could create an extended version of it for the different parts so I could bootstrap each individually. I then extended it like so:

	var MainBootstrapper = WinJS.Class.derive(MyApp.Bootstrapper, function () {
	}, {
		customInit: function () {
			//do some custom stuff
		}
	});

	new MainBootstrapper().init();

But this crashes, it crashes because `init` was not found on my `MainBootstrapper`. Strange, my type inherits from `Bootstrapper`, if I create an instance of `Bootstrapper` I get that, so why don't I have the `init` method on my derived type?

Well here's the problem the "base constructor" is never called. This means that anything done in the constructor of the type you're inheriting from doesn't get executed, and since that's where I was defining my `init` method it never got added to the object! The reason for this is that the `derive` method only does prototypal inheritance, it doesn't do constructor inheritance.

The easiest way to get around this is to move what you're setting up in your constructor into being setup in the instance members like the earlier `Person` example. If this isn't possible you can solve it in another way by manually calling the base class constructor function yourself, like so:

	var MainBootstrapper = WinJS.Class.derive(MyApp.Bootstrapper, function () {
		MyApp.Bootstrapper.apply(this);		
	}, {
		customInit: function () {
			//do some custom stuff
		}
	});

	new MainBootstrapper().init();

Here you'll notice I'm using the `apply` method to invoke the `MyApp.Bootstrapper` function. By doing that and passing `this` into it we're setting the scope of the function to be the instance of the `MainBootstrapper` being created, which in turn will perform any logic against it and properly extend the `MainBootstrapper` object with the base class constructor logic.

This is a frustrating problem, it took me *ages* to work out why my inheritance wasn't working the way I was expecting it to so watch out if you're doing classical inheritance in WinJS *and* wanting constructor inheritance.

# Mixins

The `WinJS.Class.mix` function is an interesting one and not something that you'll likely have come across before. What it does is allow you to implement multiple inheritance in JavaScript (and if you're a .NETter this wont exactly be familiar :P).

Let's revisit our Employee example:

	var payable = {
		accountNumber: 0,
		bsb: 0,
		accountName: '',
		rate: 150
	};

	var worker = {
		expectedHours: 8,
		worksWeekends: false
	};

	var Employee = WinJS.Class.mix(Person, payable, worker);

Here instead of using the `derive` function I've used `mix` to create our Employee. This time I've got a few objects that represent various things that could make up my employee type and I use `mix` to ultimately put them all together. The first argument is the constructor function which you want to use, so my `Person` class goes there and then it's essentially a `param[]` argument, everything that's used after the constructor has its properties copied onto the object, building up the members of it. Again this has the same property creation logic as `define` so you can make pseudo-privates, you can add get/ set bodies, etc.

# Conclusion

So this wraps up our look at the `WinJS.Class` API. I'm not trying to convince you that you should use classes in your JavaScript code but instead have a look a the API for it if/ when you reach the point that you think classes can have benefits inside of your WinJS application.

I also wanted to document some of the more intelligent features about how you can create classes, that it's smart enough to look for, and use, the ECMAScript 5 properties as well as taking conventions into account for creating privates. I also wanted to raise the problem that you can hit with the way classical inheritance is implemented in WinJS.

  [1]: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/defineProperty