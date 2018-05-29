---
  title: "Blink and marquee!"
  metaTitle: "Blink and marquee!"
  description: "Aww yeah, old-skool win"
  revised: "2011-02-10"
  date: "2011-02-09"
  tags: 
    - "jquery"
    - "doing-it-wrong"
    - "web"
  migrated: "true"
  urls: 
    - "/doing-it-wrong/blinking-marquee"
  summary: ""
---
Recently I've blogged about creating the a [`blink` tag][1] with jQuery, I've also blogged about making a [`marquee` tag][2].

Well can we combine them? Sure we can! But with `$.Deferred()` there's some more cool things we can do, like this:

    $.when($('h1').blink({ count: 5 }), $('h1').marquee({ count: 1 }))
        .done(function() {
            $('h1').css('color', '#f00');
        });

Once both the plugins have completed the text will turn red.

Without wanting to get too deep into how Deferred works ([read the doco for that][3]) the high-level view is that when all the methods that are passed into `$.when` raise `deferred.resolve` (it only works if they use promise and such properly), but yeah, that's how you can have a function invoked when all the deferred method complete!

Hey, you could even do this:

    $.when($(.get('/foo'), $('h1').blink({ count: 5 }))
        .done(function() {
            $('h1').css('color', '#f00');
        });

Blink & AJAX, how awesome!

Here's a [jsfiddle][4] if you want to play too.


  [1]: https://www.aaron-powell.com/doing-it-wrong/blink
  [2]: https://www.aaron-powell.com/doing-it-wrong/marquee
  [3]: http://api.jquery.com/category/deferred-object/
  [4]: http://jsfiddle.net/slace/C85VH/