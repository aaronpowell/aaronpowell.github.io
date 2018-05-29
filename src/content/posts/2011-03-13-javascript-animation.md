---
  title: "Animating with JavaScript"
  metaTitle: "Animating with JavaScript"
  description: "A look at how to make a simple JavaScript animation library"
  revised: "2011-03-14"
  date: "2011-03-13"
  tags: 
    - "javascript"
    - "web"
  migrated: "true"
  urls: 
    - "/javascript-animation"
  summary: ""
---
I've always considered the [animation][1] aspect of jQuery to be a bit of black magic (and well I still do :P) but at the same time I want to know how it works.

Recent a client had a need for some really basic animation (changing some elements dimentions) and they aren't using jQuery (and aren't in a position to add it as a dependency) so I needed to work out another solution. This gave me the opportunity I'd wanted, a chance to delve into what it would take to make animation work.

Well turns out it's not really that complex, in fact it can be done in about 60 lines of code. Rather building suspense [here is the code][2] that I'll be going over.

Now that you've seen the full code let's see about breaking it down.

# Creating a starting point

I'm going to use a self executing function to setup what we need, let's create a skeleton like so:

	var animator = (function() {
		return function(el, opts) {
			//do stuff
		};
	})();

There's two input arguments, an element to target and a set of options which will be the CSS properties we want to manipulate.

We'll do some basic validation, ensuring there was either an element or an ID selector (no I'm **not** building a selector engine too :P) and ensuring that we did receive some CSS rules. Then a type check is done against `el` to see if it was a DOM element or a selector (and yeah it's pretty basic) but the ulimate goal is to get a single DOM element which we can work against.

Next let's setup some variables we'll need:

	var start = +new Date,
		duration = opts.duration || 600,
		end = start + duration,
		calc = el.currentStyle || getComputedStyle(el, null),
		style = buildStyles(opts.css),
		data = {};

*Here's a trick, you can do `+new Date` to grab the ticks right now ;).*

We're grabing a few values such as the start and end time periods, the duration for an animation (or a default of 600 miliseconds), the styles of the element (using `currentStyle` or `getComputedStyle` depending on whether you're in a current generation browser or not). The current styles are going to be important when we get to the actual animation stage. The property (or method) returns an array which contains all the CSS rules applied to the element. Why do we need this? Well when we're doing the animation we need to know how far we have to 'travel'. If say you're going from `padding-top:10px` to `padding-top:30px` we don't want to cover 30px in total, just 20px, and if we know the starting point then we wont break the existing UI.

Next we're going to build up the styles. For this we're going to jump out to a method to handle that.

# Building the style rules

First we need a list of CSS properties which we'll support:

    var supported = ('padding-top,padding-bottom,padding-left,padding-right,font-size,line-height,margin-top,margin-bottom,'
					+ 'margin-left,margin-right,border-top,border-bottom,border-left,border-right,width,height').split(',');

This I'm doing as a comma-separated string which is then split (I just find it more readable) and as you can see it just supports dimention-based manipulation.

We'll next build up a string which represents the full style rule set that we're wanting to create:

    var buildStyles = function (style) {
        var s = '';
        for (var x in style) {
            s += ' ' + x + ':' + (typeof style[x] == 'function' ? style[x]() : style[x]) + ';';
        }

As you can see here we're also supporting functions for the style rules, it allows you to create funky rules based on calculations too :D. Basically it will take this:

	{ 
		css: {
			'font-size': '30px',
			'padding-top': '10px'
		}
	}

And produce this:

         font-size:30px; padding-top:10px;

Next we need to get tricky and filter out the rules which are not supported by out little library:

	var el = document.createElement('div');
	el.innerHTML = '<div style="' + s + '"></div>';
	var res = {};
	for (var i = 0, l = supported.length; i < l; i++) {
		if ((x = el.firstChild.style[supported[i]])) {
			res[supported[i]] = parse(x);
		}
	}
	return res;

Here we're producing a DOM element, then adding a child with the full rule set that was request. We'll then go through all the supported rules, see if it was specified and then build up an object to return which has the rule set we desire. We've also got a little `parse` method here which uses float parsing and regex to return `30px` into `30` which we can calculate against.

That completes our building of the styles and now we can go back to the core method.

# Handling the styles

Now that we've got the styles that we need to animate we have to make a clone of the style rules but set the values to that of the DOM element we're naimating:

	for (var p in style) {
		data[p] = parse(calc[p]);
	}

This is going back to the `currentStyles` (or `getComputedStyles`) object we found earlier.

# Making it animate

So this sees all the boilerplate code out of the way we've:

* Got our start, end and duration
* Know what styles we originally had
* Know what styles we need to get to

Well let's actually make it work!

For this I'm going to use a recursive setTimeout pattern (which I covered [in more details here][3]).

This is the code that we're going to need:

        setTimeout(function go() {
            var now = +new Date,
            pos = now > end ? 1 : (now - start) / duration;
            if (now >= end) {
                return;
            }
            for (var p in style) {
                el.style[p] = (data[p] + (style[p] - data[p]) * ((-Math.cos(pos * Math.PI) / 2) + 0.5)) + 'px';
            }
            setTimeout(go, 10);
        }, 10);


Now let's break it down. We're grabbing the current ticks and working out just how much more ground there is to cover.

But first off we need to check if we've hit the time period to do the animation in, and if so, just exit out of the timeout.

If we are to keep going though we'll get a bit crazy. So we'll itterate through all the properties in the style settings we have been told to animate. But this is the crazy part:

	(data[p] + (style[p] - data[p]) * ((-Math.cos(pos * Math.PI) / 2) + 0.5))

I don't recall where I got this code from but I believe it was from within the jQuery source somewhere. Basically it's some funky maths to determine a stable incrementation value based on the time remaining for the animation. And this is the most important part, you want to be able to animate at a consistent rate across the duration of the animation. By using the `pos` (which is defined earlier in the method) we can accurately assume the distance each animation step has to cover.

Once all style properties have been processed a timeout of 10 miliseconds is placed to re-execute the animation loop.

# Conclusion

To wrap we've looked at a way to make a really small and simple animation library. This is *not* a replacement for jQuery (or any other animation library) but just a good chance to shed some light on how something a little bit black magic works.

There's plenty of things missing from this implementation, such as:

* using CSS3 animations
* supporting animation chaining (eg: `animate('h1', { css: {'padding-top':'30px'} }); animate('h1', { css: {'padding-top': '10px'} });`)
* notification of animiation completing (aka `$.Deferred`)

But hopefully it does give you some interesting things to think about and [if you want to have a play I've put a jsfiddle up for it][4].


  [1]: http://api.jquery.com/animate/
  [2]: http://hg.slace.biz/javascript-tools/src/3322dbbdc2fe/JavaScriptTools/Scripts/slace.animator.js
  [3]: https://www.aaron-powell.com/doing-it-wrong/blink
  [4]: http://jsfiddle.net/slace/mVrN2/