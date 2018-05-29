---
  title: "Some useful Jasmine extensions"
  metaTitle: "Some useful Jasmine extensions"
  description: "A few useful match helpers for Jasmine"
  revised: "2011-12-23"
  date: "2011-12-23"
  tags: 
    - "javascript"
    - "jasmine"
    - "testing"
  migrated: "true"
  urls: 
    - "/javascript/useful-jasmine-extensions"
  summary: ""
---
For [tbd, a JavaScript helper I've written][1] I've been using [Jasmine][2] for my testing.

Some of the tests I've had to go beyond what [matchers][3] are available out of the box so I thought I'd share them here (mostly so I've got an easy point for myself to find them again :P).

# A quick into to adding your own matcher

I've you're new to Jasmine and haven't added your own matchers here's a quick tutorial.

You need to use the [beforeEach][4] and call [addMatchers][5], like so:

    beforeEach(function() {
       this.addMatchers({
           alwaysTrue: function(){
               //put your logic in here to determine truthy results
               return true;
           }
       });
    });

Now you can call it like so:

    expect('something').alwaysTrue();

This test extension that I've created isn't really useful as it will always return true but you can put in any logic you want.

The `this` object has an `actual` property, which is the value from your `expect` method and the arguments passed to the call are passed in.

# My matchers

    beforeEach(function() {
        this.addMatchers({
            toBeInArray: function() {
                return ~[].slice.call(arguments).indexOf(this.actual);
            },
            toBeInDateRange: function(min, max) {
                var actual = this.actual.getTime();
                return actual <= max.getTime() && actual >= min.getTime();
            },
            toBeInNumericalRange: function (min, max) {
                var actual = this.actual;
                return actual <= max && actual >= min;
            }
        });
    });

Here's how you use them:

    expect('a').toByInArray('a', 'b', 'c');
    expect(3).toBeInNumericalRange(0, 10);
    expect(new Date(2011, 11, 01)).toBeInDateRange(new Date(2011, 10, 01), new Date(2011, 11, 30));

Hopefully this is helpful to someone else :)


  [1]: https://www.aaron-powell.com/javascript/building-data-with-tbd
  [2]: http://pivotal.github.com/jasmine/
  [3]: http://pivotal.github.com/jasmine/jsdoc/symbols/jasmine.Matchers.html
  [4]: http://pivotal.github.com/jasmine/jsdoc/symbols/jasmine.Suite.html#beforeEach
  [5]: http://pivotal.github.com/jasmine/jsdoc/symbols/jasmine.Spec.html#addMatchers