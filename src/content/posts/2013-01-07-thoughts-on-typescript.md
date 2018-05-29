---
  title: "Thoughts on TypeScript"
  metaTitle: "Thoughts on TypeScript"
  description: "Some of my impressions from trying to implement something in TypeScript"
  revised: "2013-01-07"
  date: "2013-01-07"
  tags: 
    - "javascript"
    - "typescript"
  migrated: "true"
  urls: 
    - "/javascript/thoughts-on-typescript"
  summary: ""
---
When [TypeScript](http://typescriptlang.org) was announced I was pretty skeptical of it. I've been doing JavaScript development for a while now, I know many of the ins and outs of JavaScript development and I've never seen any problem with the syntax or the lack of type system.

But like a good skeptic I wanted to reserve my opinion until I had a chance to actually use it. This was the same approach [which I took with CoffeeScript](https://www.aaron-powell.com/javascript/postman), you don't really know something until you've made something with it (and for the record I wasn't particularly fussed by CoffeeScript).

Well I decided to do this, I wrote a small library called [mathy](https://github.com/aaronpowell/mathy.js) and I wanted to share some of my thoughts from having made something with it. Keep in mind this is only a small library so it's not exactly extensive, but I feel it's a good start.

# Project background

I just want to clarify a few things about how I did this project:

* I used Sublime Text 2 as my editor, not Visual Studio
* This is written primarily as a Node.js package but I also want it to work in the browser
* The repository should contain the TypeScript source _and_ the output JavaScript, consumers shouldn't be forced to use TypeScript if they don't want to

# The good

* The compiler errors can be nice, caught a few spelling errors and API usage errors through them which I wouldn't have caught until runtime/while the tests were being executed
* Debugging is fine. Even though I'm not debugging the TypeScript (since it's run as the compiled JavaScript through Node.js I don't have source map debugging) the JavaScript looks close enough to my original code that it's pretty obvious as to where I'm at
* Being able to create modules using a keyword is good, save a bunch of boilerplate guff
* I've used a class for part of the API which is very handy and easy to use, but most importantly it’s syntactically simple
* It doesn't try and stop me from writing any of the funky stuff that I actually want to write ;)
* Fat-arrow `=>` is really sweet, I’d never really got into CoffeeScript enough to have built anything much but I can see why those guys rave about it

# The bad

* If you're not using Visual Studio it’s kind of a pain, Sublime Text 2 only has syntax highlighting support so you don't exactly get much benefit, no intellisense or anything
* The fact you can't programmatically use the compiler sucks. Even though TypeScript's compiler is available as a Node.js package you have to execute the compiler yourself and pass in the input. It'd be nicer if you could just `require('typescript')` instead of what I have to do in the [Makefile](https://github.com/aaronpowell/mathy.js/blob/master/Makefile)
* The way modules are generated can be a real pain if you're trying to target the browser _and_ Node.js. If you want to go with CommonJS the internal modules they generate create a global variable to store your object in, but that won’t work in Node.js as the variable isn't exported. If you make it a public module it assumes there is a public “exports” object to attach to which is fine in Node.js but sucks in the browser! I had to have a shitty implementation to get it working that assumes in the browser there is the `exports` object. You can use the AMD support but it forces you to use RequireJS (or CurlJS or any other loader). It'd be nicer if there was optional AMD support, like how I have it done in [db.js](https://github.com/aaronpowell/db.js), so you can have something that will export as a AMD _if AMDs are available_, otherwise just be a global object
* There seems to be no way to plug a definition file into Node.js so all my unit tests are just written in plain JS which really sucks as I changed the API and didn't realise until every single unit test failed

# The really shitty

* The generated code isn't in a closure scope unless you use a module, which in turn the closure scope is really ridged (particularly from the CommonJS module point of view) which means
 * You can't create interfaces in a function
 * You can't create classes in a function
 * You can't create modules in a function (ok, I kind of get this one)

# Conclusion

So with all that considered what's my thoughts so far? I actually do like it, particularly the way the compiler can catch some stupid mistakes. I'd like to try it on a much bigger project, particularly something in Visual Studio to see how well that goes, especially by having things like intellisense working.

The biggest problem I see is the module system, it's really shit _if you don't do exactly as Microsoft does_, and here in lies the problem. If you want to load in third party libraries it really doesn't work too nicely, you end up with `any` type declarations around which really isn't helpful.