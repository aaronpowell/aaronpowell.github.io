---
  title: "Implementing \"indexers\" in JavaScript"
  date: "2013-07-10"
  tags: 
    - "javascript"
  description: "My colleague Luke Drumm challenged me to implement C# style indexers in JavaScript.\n\nSo let's have a look at how you can do that, and how you can make some very interesting JavaScript objects that are self replicating. We'll build on the knowledge of using `bind` and `apply` from the last two posts."
---

[Luke](https://twitter.com/lzcd) was wanting to know how to implement this C# code as JavaScript:

    class Foo {
        public string Stuff { get; set; }

        public Foo() {

        }

        public Foo(string stuff) {
            this.Stuff = stuff;
        }

        public Foo this[string stuff] {
            get {
                return new Foo(stuff);
            }
        }

        public Foo Bar() {
            Console.WriteLine("Darn tootin'");
            return this;
        }
    }

Class-implementation aside the interesting part that he was having trouble with was the indexer, basically being able to write this:

    Console.WriteLine(new Foo()["one"]["two"]["three"].Bar());

Now what exactly Luke is trying to do I don't know (and my life is probably safer not knowing) but there's no point shying away from a problem. 

So the syntax above is supported by JavaScript, you can use `[]` notation on an object but it's different to C#'s implementation. Since JavaScript objects are really glorified hash bags when you use ["one"] it's saying you want the property one of the object, like when you do it on a C# dictionary type, and this will be fine assuming you have a one property. The problem here is that we don't have said property, we're wanting to intercept them and create them on the fly.

## Simulating indexers with functions

Some languages support this concept of 'method missing' but not JavaScript ([well not until we get ES6 proxies](http://soft.vub.ac.be/~tvcutsem/invokedynamic/proxies_tutorial)) so we need to look at another idea… functions. So we could design something that allows us to write this:

    new Foo().make("one").make("two").make("three").Bar();

But that's kind of verbose isn't it? We've got this extra make method that we have to call, we're still using a new operator, really there's got to be some nicer way which we could do this… right?

## Functions that return functions containing functions

Let's make it so we can drop the make part of the above API, so we are now doing this:

    new Foo()("one")("two")("three").Bar(); 

That looks somewhat better doesn't it? Sure we're using `()` not `[]`, but that's minor semantics really, the question is can we actually make that our API? Of course we can, and we'll have a look at how (if you guessed that you couldn't where did you think this post would go :P).

So you know that JavaScript functions are just objects right? Well they are and what's cool is that since they are just objects we can manipulate them as such. Let's start with foo, really foo is just a function (since we don't have classes in JavaScript):

    var foo = function () {
    };

Now, I'm going to want something returned from foo that can be invoked like a function, so maybe I could just return a function...

    var foo = function () {
        var innerFoo = function () {
        };

        return innerFoo;
    };

Ok that's a good start, I can do:

    foo()();

Next it's time to make innerFoo do something, basically what innerFoo should do setup the next level down our chain. To keep the function more readable I'm going to push the logic out into a new function, we'll call it next:

    var foo = function () {
        var innerFoo = function () {
            return next.apply(this, arguments);
        };

        var next = function (stuff) {
        };

        return innerFoo;
    };

Do you see where we're going here? The next method is ultimately going to be smart, setting up the next level down our object, whereas the innerFoo is really just a pass-through to that (it'll be clearer as we implement our next method):

    var foo = function () {
        var innerFoo = function () {
            return next.apply(this, arguments);
        };

        var next = function (stuff) {
            var child = foo();
            child.stuff = stuff;
            return child;
        };

        return innerFoo;
    };

So our next method will:

* Create a new foo function (well, a new innerFoo)
* Create a property on the function object called stuff
* Return the newly created object

This means that we can do this:

    console.log(foo()('one').stuff); // one

Or go further:

    console.log(foo()('one')('two').stuff); // two

Awesome, we've pretty much got indexers going, now let's add the bar method from our original API.

    var bar = function () {
        console.log('Darn tootin\'');
        return this;
    }

    innerFoo.bar = bar;

Remember how I mentioned that functions as objects? Well this is where it can be really useful, since it's an object we can modify it like any JavaScript object and just add methods and properties like we've done, and awesomely since we're going back through our original foo method it'll work with all the children we get.

## Parent access

Once I did the initial revision for Luke he wasn't satisfied, next up he wanted to know how to access the parent of each instance created. Well that's actually pretty easy, just a small modification to our innerFoo function:

    var innerFoo = function () {
        return next.apply(innerFoo, arguments);
    };

So this time when it invokes the next level down will have a this context which is the parent object, then you can decide how to expose that as you step down.

## Bonus round – displaying the object

If you've run the code and tried to do a `console.log/console.dir` of the foo instances returned you'll see they are well... crappy:

    function () {
        return next.apply(innerFoo, arguments);
    };

Well that's kinda crappy, can't exactly see what the value of stuff is, or what an object's parent is now can we? Guess we better fix that!

Did you know that Object has a toString method on it? This method is generally overlooked, if you're working with an object you'll likely get [object Object] when you invoke it from your object, functions will return the text content of the function (which can be useful if you want to modify functions on the fly, but that's a subject for another day :P), and this is why we get the above output from foo, foo is a function after all.

Well we can write our own toString method if we want, we just put it on our object and it'll be used rather than the one inherited from the prototype chain. So let's do this:

    var toString = function () {
        return this.stuff;
    };
    innerFoo.toString = toString;

Awesome, done! One thing to keep in mind is that `toString` must return a string value, it can do whatever you want to get there, just return a string ;).

But let's go one step further and exploit this, let's get it to output the whole parent graph, I'm going to do this by using bind, like we saw in [my last post](/posts/2013-07-05-javascript-binding-currying-and-arrows.html):

    var next = function (stuff) {
        var child = foo();
        child.stuff = stuff;
        child.toString = toString.bind(child, this);
        return child;
    };
      
    o.toString = toString.bind(o, null);

You'll also see that I've bound the parent as the first argument of `toString`. `toString` doesn't take arguments but by using bind we can do that, now let's update our toString method to handle it:

    var toString = function (parent) {
        return parent + ', ' + this.stuff;
    };

Nifty huh? We're exploiting the type coercion in JavaScript, because parent isn't a string, it's an object, but we're using the + operator against another string JavaScript will coerce the object to a string, using its toString method, which in turn invokes the function we wrote, which in turn does coercion and so on!

## Done!

And with that we wrap up this week's adventure, if you've made it this far well done it was a long one but damn it was fun!