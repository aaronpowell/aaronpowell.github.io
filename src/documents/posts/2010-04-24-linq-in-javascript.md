---
  title: "LINQ in JavaScript"
  metaTitle: "LINQ in JavaScript"
  description: "LINQ is just a pattern, this shows you how to produce it in JavaScript"
  revised: "2011-02-26"
  date: "2010-04-24"
  tags: 
    - "linq"
    - "javascript"
  migrated: "true"
  urls: 
    - "/linq-in-javascript"
  summary: ""
---
*Let me start by saying that I am aware that there is a [LINQ to JavaScript project on Codeplex][1] but this was done by me are more of an achidemic exercise/ challange.*

So while I've been working on LINQ to Umbraco I've also been spending some time doing AJAX-y stuff, and I have been having a lot of fun playing with JavaScript.
And then one day I was thinking about how I would go about manipulating a collection entirely client-side, and realised that loops are ultimately the only way to go about it. Well that's all well and good, but if you want to do a lot of collection manipulation there's not a really good way to go about it (or at least, a really good way from a .NET developer point of view :P).

And after all, what is LINQ? LINQ really just is a way in which you can do pesudo-dynamic programming in a static language (as Lambda is heavily derived from dynamic languages). So shouldn't it be possible to do in a dynamic language?

So I whipped out my copy of Visual Studio and got coding away, and here's an end-line of code entirely in JavaScript:

    array.where(function(item) { 
        return item.property === "something"; 
        })
        .orderBy()
        .groupBy(function(item) { 
            return item.value; 
        });

Lovely isn't it.

But before I get into some of the stuff I do, let me explain why my approach is different to the JSLINQ project on Codeplex.
Now I mean no disrespect to Chris, but there are a few things which I don't like about his approach, and which kind of go against the LINQ pattern.

First off JSLINQ requires that you create a new object which you pass the array into. I can see some reasons for this, better intellisense, more strict control over collection manipulation (the collection becomes read-only) but I think that the primary reason must be to better support object-notation arrays (you know, [] arrays). When you define an array using object notation it's not really an array (`typeof [] === "object"`). This is a problem if you want to LINQify it, you need to pass it to some other type.

The second issue I have with it is the naming. All the methods are named with Pascal Casing, which is the standard in .NET land, but every JavaScript library I've ever used (and as is standard) uses Camel Casing for methods. Sure Pascal keeps its relationship to .NET valid, but when trying to appeal the JavaScript developers it's just a bit foreign.

Lastly I'm a bit bothered by the lack of argument checking. This may be because I'm a very defensive programmer, but I don't like to allow developers to shoot themselves in the foot. If a parameter should be a function, then the paramter should be checked as a function. If a parameter is required, it should be checked as such.

This is more of a personal preference than a real design flaw though.

##My Approach##

Now that I've talked aobut what I don't like with the JSLINQ project I think it's only fair to talk about my approach. I've gone with a more traditional LINQ approach and added extensions to an existing type, in this case the Array type, via `Array.prototype`. This means it is closer to the extension-method format of IEnumerable<T> from .NET, you just need to add in a namespace (aka, include the JavaScript file), but does have a problem of allowing the collection to be modified (which does have pros and cons).

I have also kept with standard JavaScript programming and Camel Cased the method names.

The following operators are supported:

 - Where 
 - Order By (inc decending)
 - First/orDefault 
 - Single/orDefault
 - Last/orDefault 
 - Select 
 - GroupBy 
 - IndexOf

By and large the word under the hood with for loops, taking a method (aka a Lambda function) and using it.
As I said I'm a defensive programmer so there is a lot of type-checking against the arguments and the return types of methods (for example, ensuring the the Where lambda returns a boolean).

GroupBy is my most proud operator, as it turned out to be a bit harder than I had though. But it does return a collection which is also a pesudo-dictionary which can be itterated through.

I would provide the full source code but there seems to be a problem with current Umbraco instance running my blog which wont let me upload media items!

But here's the Where and GroupBy operators:

    Array.prototype.where = function(fn) {
        /// Filters the array
        /// Filtering function
        /// 
        if (typeof (fn) !== typeof (Function)) throw Error.argumentType("fn", typeof (fn), typeof (Function), "where takes a function to filter on");
        var coll = new Array();
        for (var i = 0; i < this.length; i++) {
            var ret = fn(this[i]);
            if (typeof (ret) !== "boolean") throw Error.argumentType("fn", typeof (ret), typeof (Boolean), "function provided to where much return bool");
            else if (ret) coll.push(this[i]);
        }
        return coll;
    }

    Array.prototype.groupBy = function(fn) {
        /// 
        if (!fn || typeof (fn) !== typeof (Function)) {
            throw Error.argumentType("fn", typeof (fn), typeof (Function), "groupBy takes a function to filter on");
        }
        var ret = new Array();
        for (var i = 0; i < this.length; i++) {
            var key = fn(this[i]);
            var keyNode = ret.singleOrDefault(function(item) { return item.key === key; });
    
            if (!keyNode) {
                ret[ret.length] = { "key": key, "items": new Array() };
                ret[ret.length - 1].items.push(this[i]);
            } else {
                ret[ret.indexOf(keyNode)].items.push(this[i]);
            }
        }
    
        return ret;
    }

##The next stage##

I've done a few tweaks within LINQ in JavaScript, and I've added a couple of new operators, `Skip`, `SkipWhile` and `Take`, all providing the same functionality that their .NET counterparts provide.

Lets have a look at the way some of the code works, we'll look at the where method:

    Array.prototype.where = function(fn) {
        if (typeof (fn) !== typeof (Function)) throw Error.argumentType("fn", typeof (fn), typeof (Function), "where takes a function to filter on");
        var coll = new Array();
        for (var i = 0; i < this.length; i++) {
            var ret = fn(this[i]);
            if (typeof (ret) !== "boolean") throw Error.argumentType("fn", typeof (ret), typeof (Boolean), "function provided to where much return bool");
            else if (ret) coll.push(this[i]);
        }
        return coll;
    }

First off you'll notice that I expect a function to be passed into the method, otherwise how would you apply a where?! As you'll notice I'm doing a lot of type checking as well, the parameter for Where needs to be a function, so I explicitly check it so.

Then it's really just a simple itterator that is used, and pushing each item into a new collection where the provided function returns a boolean value of true.
Again you'll notice type checking, this time of the return value of the function. Because JavaScript isn't compiled, and there is no type checking I have to do it manually (this means that I'm doing a traditional LINQ API, not one where you can return anything you like, ala [this post][2]). Not a big problem, but it does add a little overhead.

Sure you can remove it but then it kind-of defeats what I'm trying to achieve, which is a very type-safe API.

Ultimately LINQ in JavaScript is nothing more than throught experiment project. It shows that you can quite easily have a client side query language using JavaScript and functional programming.

**But I don't recommend that anyone acutally use it**. If you're using a client-side query API such as this (or any of the other LINQ implementations for JavaScript) you're doing it wrong. Particularly operators like where, skip, take and even select. These operators are designed to lower/ change the data volume you are working with, which on the client side is not a good idea. It means that you've returned too much data from the server!
I see the only real useful reason for this (other than just wanting to prove it can be done) is to manipulate a DOM structure, say client-side reordering of a table.

## ECMAScript 5

LINQ in JavaScript supports the new Array methods which are part of ECMAScript 5, you can read more about it in the [announcement post][3].

##Source code

I've pushed the [source code for the LINQ in JavaScript][4] project up to bitbucket. If you're interested in having a play with it you can grab it from there.

## NuGet

I have created a NuGet package for this as well. [You can get it here][5].


  [1]: http://jslinq.codeplex.com/
  [2]: http://community.bartdesmet.net/blogs/bart/archive/2008/09/14/who-ever-said-linq-predicates-need-to-be-boolean-valued.aspx
  [3]: /linq-in-javascript/html5
  [4]: https://hg.slace.biz/linq-in-javascript
  [5]: http://nuget.org/Packages/Packages/Details/LinqInJavaScript-1-0