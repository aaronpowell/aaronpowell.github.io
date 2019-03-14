+++
title = "Pretty JavaScript Console Messages"
date = 2019-03-14T13:44:34+11:00
description = "Add a bit of flare to your console.log messages"
draft = false
tags = ["javascript", "fun"]
+++

![Facebook](/images/pretty-javascript-console/facebook.png)

If you’ve ever opened up your browser tools while logged into Facebook you might have noticed the above in it (at least, this is what it looks like at the time of writing).

DOM warning aside, it looks a bit different to most `console.log` messages you’re probably generating, doesn’t it? A big bit of red text and some other slightly larger text. That’s a bit weird, isn’t it?

As it turns out the `console` functions have a number of formatting options, so if you want to display numbers to certain decimal places you can use `%.#f` like so:

```javascript
console.log('Pi to 5 decimal places: %.5f', Math.PI);

```

_But that only works in Firefox._

If you want to specify where an object appears in the log message you can use `%O`:

```javascript
console.log('We found an object, %O, in the system', { foo: 'bar' });

```

But that’s all well and good, how do we make **big red text**!

For that we’ll use the `%c` formatter to apply CSS at a point in the string:

```javascript
console.log('%cR%ca%ci%cn%cb%co%cw', 'font-size: 20px; color: blue;', 'font-size: 25px; color: lightblue;', 'font-size: 30px; color: lightgreen;', 'font-size: 35px; color: green', 'font-size: 30px; color: yellow;', 'font-size: 25px; color: orange', 'font-size: 20px; color: red')

```

With `%c` you provide a string of CSS rules that will be applied until the end of the message being logged _or_ another `%c` is found. This means you can create lovely rainbow effects like above, manipulating each element along the way. Or if you want to get **really** adventurous you can do something like this:

![This console is on fire](/images/pretty-javascript-console/one-fine-console.png)

```javascript
console.log('%c' + 'This console is on fire', 'font-family:Comic Sans MS; font-size:50px; font-weight:bold; background: linear-gradient(#f00, yellow); border-radius: 5px; padding: 20px')

```

Yep, we’re setting a gradient background for the text and adding some padding plus rounded corners!

Now you can’t use all aspects of CSS (I haven’t been able to figure out if you can do animations for example) and it’s not _overly_ useful. But hey, it’s a bit of fun, isn’t it! 😉