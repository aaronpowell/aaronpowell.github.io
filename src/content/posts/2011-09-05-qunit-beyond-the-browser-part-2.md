---
  title: "Going beyond the browser with QUnit - Part 2"
  metaTitle: "Going beyond the browser with QUnit - Part 2"
  description: "Working with the DOM and QUnit from Node.js"
  revised: "2011-09-06"
  date: "2011-09-05"
  tags: 
    - "javascript"
    - "nodejs"
    - "qunit"
  migrated: "true"
  urls: 
    - "/javascript/qunit-beyond-the-browser-part-2"
  summary: ""
---
In my [last post][1] I talked about what you need to do if you want to monitor changes and run tests automatically under Node.js but there was a few assumptions in there. One of the main assumptions I had was that you weren't doing any DOM interactions.

In this part we're going to look at how you can use DOM interactions in your QUnit tests and still run them under Node.js.

# Working in a DOM-less JavaScript environment

One thing that can trip people up when they first come to Node.js is they don't realise that JavaScript isn't tied to the browser. In reality JavaScript is just a language that happens to be used predominately in the browser, meaning that the `window` object isn't part of the JavaScript specification, it's just something that's part of the runtime.

So when you're running your code under Node.js you can't just `document.getElementById` or `$('#foo')`. Uh-oh, how are we going to run tests against the DOM, after all if you want to test a library like Knockout.Unobtrusive you kind of need to be able to do that!

Well don't fear, the smart people in the Node.js community have solved this problem with a nice little package, [jsdom][2]!

jsdom is essentially an implementation of the DOM in Node.js allowing you do create a `document` object, a `window` object and interact with it as though it was in a browser.

*Note: There are limitations to `jsdom`, it doesn't do everything you'd want but it's a great way to do basic interactions such as we want to do in our tests.*

# Updating out test runner

In my previous post I showed you how to set up a basic test runner in your Cakefile. For our tests we're going to need to add some new stuff into our runtime (Node.js) and to do that we can use the `dep` option when we set up the runner:

    test = 
      deps: ["./tests/test-env.js"]
      code: "./#{output}/#{file}.js",
      tests: "./tests/#{file}.tests.js"

What I'm going to do is create a `test-env.js` file which will be executed before the tests, allowing me to set up our pesudo-DOM.

# Creating our test environment

I'm going to set up a few new variables:

    var jsdom = require('jsdom'),
        fs = require('fs'),
        dom = fs.readFileSync("./tests/knockout.unobtrusive.tests.html").toString(),
        document = jsdom.jsdom(dom, null, { features: { QuerySelector: true } }),
        window = document.createWindow(),
        navigator = {
          userAgent: 'node-js'
        };

First thing I'm doing here is importing `jsdom` and `fs`. This will mean I can work with `jsdom` and the file system.

The next step is to pull in our test HTML page as a string. We've got some base HTML which we'll be interacting with during our tests. This is also the HTML we'd be running in our browser for our browser-based tests because keep in mind we want to share our tests between Node.js and the browser.

Now that we have our DOM as a string we'll create our `document` object from it. One other thing we are doing is specifying that we do want `querySelector` and `querySelectorAll` available, and this is done with the `{ features: { QuerySelector: true } }` argument to `jsdom`.

Lastly we need to create a `window` object and a `navigator` object.

So when we have all these local variables we need to make sure that they'll be available everywhere:

    global.window = window;
    global.navigator = navigator;
    global.document = window.document;

Unlike the browser Node.js's global object is called `global`, once we add our variables to that they'll be available in any of the other files we use in the runner.

# Augmenting our tests

In the original set of tests that were in the Knockout.Unobtrusive project there was a heavy reliance on jQuery. Now admittedly there is a [jQuery npm package][3] but I couldn't get it running on Node.js 0.4.10 but it's not really important (I'd prefer not to rely on jQuery in my tests anyway).

So I'm going to do a check for jQuery (our Node.js tests wont have it):

    var get, getAll, camalizer, data,
      dataMatcher = /data-(.+)/,
      dashAlphaMatcher = /-([a-z])/ig;
    
    if(typeof $ !== 'undefined') {
      getAll = get = $;
    } else {
      camalizer = function(x, letter) {
        return letter.toUpperCase();
      };
      
      data = function(el) {
        var attribute,
            attributes = el.attributes,
            data = {};

        for(var i = 0, il = attributes.length; i < il; i++) {
          attribute = attributes[i];
          if(dataMatcher.test(attribute.name)) {
            data[attribute.name.match(dataMatcher)[1].replace(dashAlphaMatcher, camalizer)] = attribute.value;
          }
        }
        
        return function(attr) {
          return data[attr];
        };
      };
      
      get = function(id) {
        if(id.indexOf('#') === 0) {
          id = id.substring(1, id.length);
        }
      
        var el = document.getElementById(id);
        
        if(!el) {
          el = document.querySelectorAll(id)[0];
        }

        el.data = data(el);
        return el;
      };

      getAll = function(selector) {
        var el,
            elements = document.querySelectorAll(selector);
        
        if(elements[0] && !elements[0].dataset) {
          for(var i=0, il=elements.length; i < il; i++) {
            el = elements[i];
            el.data = data(el);
          }
        }
        
        elements.each = function(fn) {
          var that = this;
          that.forEach(function(value, index) {
            fn.apply(that, [index, value]);
          });
        };
        
        return elements;
      };

Ok so the obvious first step is to check for jQuery and then we're deferring everything to that, but instead of just exposing `$` I'm going to expose two methods, `get` and `getAll`. The former will be useful for getting a single element, the latter for multiple elements.

Next I'm creating two helper methods, the first being a camel case method (handy for working with `data-*` and the second simulating the `.data` API which you get from jQuery itself.

*Note: The data method isn't exactly the same as using the $.data API, but I'm only replicating what I need at the current time.*

In our simulated data API it will iterate through all the attributes and find any `data-*` ones (using a regex to look for them) then turning them into camel cased strings (like the spec, so `data-foo-bar` becomes `fooBar`). It's probably a bit more complicated than it needs to be but it works nicely as I want.

The only other interesting point of note is that the `getAll` method will also simulate the `.each` API from jQuery so that we can use those loops in our tests.

And there you go you're essentially done. Once you replace all your usages of jQuery in your tests for the `get` and `getAll` API then you'll be ready to roll!

# Be careful with DOM manipulations

Something that I got tripped up with when porting the Knockout.Unobtrusive tests was that you don't want your DOM manipulations to persist across the tests.

If you've done work with QUnit you'll know that if you a DOM element with an `id` of `qunit-fixture` then it'll get rebuilt after every single test.

Well there's a problem, the Node.js implementation of QUnit isn't designed to work with the DOM so naturally this doesn't work. But it's an easy one to get around, QUnit exposes a method called `reset` that you can use to force a reset of the `qunit-fixture` element. Since the Node.js one doesn't worry about the DOM it doesn't have this method.

To implement this ourselves we'll create a `module` for our test that we can have a `teardown` method on the end of it:

    QUnit.module('createBindings', {
      teardown: function() {
        if(!QUnit.reset) {
          //do the reset
        }
      }
    });

*Note: you need to either access `module` via `QUnit.module` or assign that to `module` yourself because `module` is a reserved word in Node.js.*

For the reset method I've created a helper function back in the `test-env.js` file:

    global.rebuildDom = function() {
      global.document = jsdom.jsdom(dom, null, { features: { QuerySelector: true } });
      global.window = global.document.createWindow();
    };

This will rebuild both the `document` and `window` objects from the original DOM string. So we can update our module like so:

    QUnit.module('createBindings', {
      teardown: function() {
        if(!QUnit.reset) {
          rebuildDom();
        }
      }
    });

# Conclusion

I'm aware that this has been a bit of a long and complicated post but hopefully it gives you some starting points for how you could approach doing online & offline JavaScript tests.

  [1]: https://www.aaron-powell.com/javascript/qunit-beyond-the-browser-part-1
  [2]: http://search.npmjs.org/#/jsdom
  [3]: http://search.npmjs.org/#/jquery