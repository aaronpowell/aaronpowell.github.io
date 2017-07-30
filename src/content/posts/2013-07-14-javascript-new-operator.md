---
  title: "The JavaScript new operator"
  date: "2013-07-14"
  tags: 
    - "javascript"
  description: "Time to revisit something that was overlooked in the last post, the `new` operator in JavaScript and what it does."
---

In the [last post](/posts/2013-07-10-implementing-indexers-in-javascript.html) I was changing some C# code to JavaScript but there was one part that I just _dropped_ and didn't explain why, and that was the use of the new operator.

While JavaScript isn't a classical language, it's prototypal, and doesn't have a notion of classes ([yet](http://wiki.ecmascript.org/doku.php?id=strawman:maximally_minimal_classes)), but it does have a new operator. What's interesting is [it's an operator](http://www.ecma-international.org/ecma-262/5.1/#sec-11.2.2) like C# (see 14.5.10 of the spec, yep I looked it up :P), and operators tend to do something unique which is also the case with JavaScript new. If you're a spec-nut you can read what happens in the link above (and also the [[[Construct]]](http://www.ecma-international.org/ecma-262/5.1/#sec-13.2.2) method which is important), but if you're not it does a few things that are of note:

* It expects a function as the _thing_ being new'ed up
* The result is a new object that has the prototype of the function that was new'ed, but also potentially their own values (such as values provided as the arguments)

So let's make a simple "class" which consists of a constructor function:

    var Person = function (firstName, lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
    }; 

We can then add members to all instances by modifying the prototype:

    Person.prototype.fullName = function () {
        return this.firstName + " " + this.lastName;
    }

Now if we run the following we'll get two different people:

    var aaron = new Person('Aaron', 'Powell');
    var john = new Person('John', 'Smith');

    console.assert(aaron == john); //fails

The two people we've created are different objects, which is exactly what we expect, but if we did:

    console.assert(aaron.fullName == john.fullName);

The assert won't fail since they are the same method _reference_, but on two different objects.

Another important part of the Person constructor has a this scope (which we've learnt to manipulate in the past) and what would we expect it to be? Well functions inherit the scope of their parent (unless you modify it) which means that our parent scope of Person will be the global object (window in the browser) or null in ES5 Strict Mode.

But that's not the case when you use the new operator, the new operator is yet another way we can modify this, under this scenario it becomes a completely new object literal, it's similar to doing this:

    Person = function () {
        var obj = {};
        var Person = function (firstName, lastName) {
            this.firstName = firstName;
            this.lastName = lastName;
        };
        Person.apply(obj, arguments);
        return obj;
    };
 
Well that's close, it doesn't maintain the prototype chain or setup the constructor properly, what it does do is create a new object that is then returned, meaning each invocation of Person will result in a different object, much like the new operator.

## Is it new or not?

The problem with the new operator is that it's applied to a function, it can be applied to _any_ function, but it can also be omitted. This means you can create yourself a function that's intended to be a constructor but not used with a new operator, and doing this would mean that you're augmenting a this scope you probably shouldn't be, such as the global object.

So how do we know if someone used the new operator? You're probably not writing your own pre-parser to check the code before it's executed so it's not like you know the omitted it at a code level. Well there's an alternative *check the constructor*.

One thing I omitted from the above pseudo-new implementation is setting up the obj.constructor property, this is something that the new operator does, and it's the easiest way to check if a function was invoked with a new operator:

    var Person = function (firstName, lastName) {
        if (this.constructor !== Person) {
            return new Person(firstName, lastName);
        }
        //setup properties
    }
 
Here we're checking the constructor against the type we expect the constructor to be. If the function wasn't invoked with the new operator it won't receive the right constructor type which means we can assume that function was invoked normally and expects a return, a return which can then be a new instance.

This can be a very useful trick if you're exposing something that's to be constructible but you don't trust your consumers to do the right thing.

## Wrap up

The new operator is an interesting one, it's a great way to create objects that have unique instances but still share a common root (being the prototype). There's arguments all over the internet about whether you should use the new operator or not, whether your API should not require the new operator, whether not using new means a violation of the API or whether your API should just be smart enough to deal with both usages.

But why would you use it? Well that's a story for another day ;).
