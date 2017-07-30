---
  title: "A simple expanding list in CSS only"
  date: "2014-08-21"
  tags: 
    - "css"
  description: "Here's a simple approach to creating an expanding list with CSS."
---

Recently I was working on a site that needed to have an expanding list of items, the list is quite long but we wanted part of it hidden until the user clicks an option to expand it fully.

I was thinking about how I'd done this in the past and what would be the simplest way to do it. Normally I'd just whip out a bit of JavaScript, find the `ul`, find any `li`'s beyond the count limiter and hide them and when the user clicks the button it'll make them visible.

Then it hit me, there's a really simple way to hide the items with just CSS... `nth-child`.

I've never really used `nth-child` in development, except for things like alternating rows, but you can leverage the maths capabilities to do something like this:

    ul.hidden li:nth-child(n+10) {
      display: none;
    }

And you're done! Seriously, it's that simple to hide items at a position greater than 10 in the list!

The way this works is that it leverages the positional nature of the `nth-child`'s `n` value, which represents the index of the item in the selector is matching. By providing a `+10` to it we offset the position that the current pass matches, hiding it, so:

* First item - 0 + 10 -> match the 10th item
* Second item - 1 + 10 -> match the 11th item
* Eleventh item - 11 + 10 -> match the 21st item

And there we have it, using the `nth-child` we can easily manipulate the elements with CSS as a while, rather than individually by explicitly finding each item.

[Check out my demo](http://jsbin.com/seheyi/2/edit) to see it in action.
