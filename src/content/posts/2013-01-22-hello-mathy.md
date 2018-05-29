---
  title: "Hello mathy"
  metaTitle: "Hello mathy"
  description: "An introduction to another new library from me, this time it's mathy, a simple formula parser"
  revised: "2013-01-22"
  date: "2013-01-22"
  tags: 
    - "typescript"
    - "javascript"
    - "web"
  migrated: "true"
  urls: 
    - "/hello-mathy"
  summary: ""
---
In a previous post I [laid out some thoughts on TypeScript](https://www.aaron-powell.com/javascript/thoughts-on-typescript) which came from building a little library in TypeScript called [mathy](https://github.com/aaronpowell/mathy.js).

# Hello mathy

A few months ago I came to a realisation... I've never written a parser, at least not a language parser. Sure I've parsed CSVs, sure I've parsed XML, but never a language.

Part of what I've been working on recently has needed a formula parser to deal with chemical formulas, basically we need to be able to take this:

	Y = (Q * 0.12 + 100) / (Q * 15)

Another member of the team wrote a C# parser for this so I decided in my spare time to implement something similar in JavaScript and hence mathy was born.

The usage is something like this:

    var engine = new mathy.Engine({ name: 'a', derivation: '1 + 2' });
    var result = engine.process();
    expect(result[0]).to.equal(3);

Pretty simple, create a new engine, provide it some parameters and process it. You can also install mathy as a global Node.js module and get a new command that will do math for you:

	>> npm install -g mathy
	>> mathy "1 + 2" //output's 3

# Smarter than your average shell

So that example isn't particularly useful, open up PowerShell (or Terminal) and you can easily just type `1 + 2` and get a result. Where mathy does get a bit more useful is when you want a more complex formula parsed, something like this:

    var engine = new mathy.Engine({ name: 'a', derivation: '1 + 2 * 3 - 1 * 10 ^ 1 / 5' });
    var result = engine.process();
    expect(result[0]).to.equal(5);

Here we're doing a _to the power of_ (using `^`), you can also do negative powers like this:

    var engine = new mathy.Engine({ name: 'a', derivation: '1 + 2 * 3 - 1 * 10 ^ (-1) / 5' });

_Yes negative powers need to be parenthesis wrapped, that's pretty standard notation if you look around at how to handle it._

# Smarter calculations

Let's think back to the example that I said we're parsing in our application:

	Y = (Q * 0.12 + 100) / (Q * 15)

Well `Q` isn't exactly a number so that isn't a mathematical equation yet, but that's cool, mathy will allow you to provide multiple parameters, like so:

    var engine = new mathy.Engine(
		{ name: 'a', derivation: '(Q * 0.12 + 100) / (Q * 15)', result: true },
		{ name: 'Q', derivation: '10' }
	);

Now when mathy runs it'll hit the `Q` in the formula and then attempt to resolve that. It'll realise that it's not a numerical value so it'll then see if it was another parameter, then it'll find the value of `10` and be able to insert that.

Where this is more useful is when you want to late-add a parameter, meaning you can do this:

    var engine = new mathy.Engine(
		{ name: 'a', derivation: '(Q * 0.12 + 100) / (Q * 15)', result: true }
	);
	engine.add({ name: 'Q', derivation: '10' });

So you can create the engine and then ask the user for the inputs, adding them as they are provided.

# Decisions, decisions

While it's all well and good to be able to process parameterised numerical equations where mathy starts to get into its own is where it diverges and becomes a bit more of a standalone language; the main feature for this is decisions.

A decision is a binary condition statement, a tuple, and it's used like so:

	var engine = new mathy.Engine(
		{ name: 'a', derivation: '1 > 2 ? -1 : 42' }
	);

The statement on the left will be evaluated as a true/false statement (it only supports [JavaScript strict-equal equality](http://javascriptweblog.wordpress.com/2011/02/07/truth-equality-and-javascript/), but you only need to use `==` not `===`).

And of course all parts (well, except the operator) can be parameters:

	new mathy.Engine(
		{ name: 'a', derivation: 'b == c ? d : e', result: true },
		{ name: 'b', derivation: '42' },
		{ name: 'c', derivation: 'd' },
		{ name: 'd', derivation: '42' },
		{ name: 'e', derivation: '-1' }
	);

# Real-world usage

It's all well and good to make this simple little language/parser for chemical formulas but is there any other real reason you'd do this?

My main thoughts on this would be in a shopping cart scenario. Since [you shouldn't trust the client](http://minimaxir.com/2012/10/client-side-validation-is-hard-mode/) if you're doing any kind of calculation of the cart you'll be wanting to do that server side. But what if you want to have some benefits? Say you have a threshold before they get free shipping, or a discount for certain number of purchases, preferred customer, etc.

Often times these can be expressed as a simple formula rather a series of statements in code. Values like 'is this customer a preferred customer' can be provided as a parameter value to the formula which then does the calculation.

# Conclusion

So there we have it, a very simple little JavaScript formula engine called [mathy](https://github.com/aaronpowell/mathy.js) which has some nice little features to do slightly smarter formulas.

Check out the tests folder for more complex usage examples.