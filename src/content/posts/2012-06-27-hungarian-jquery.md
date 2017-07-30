---
  title: "Stop using Hungarian jQuery!"
  metaTitle: "Stop using Hungarian jQuery!"
  description: "The code smell that's creeping into JavaScript development"
  revised: "2012-06-27"
  date: "2012-06-27"
  tags: 
    - "jquery"
    - "rant"
    - "javascript"
  migrated: "true"
  urls: 
    - "/javascript/hungarian-jquery"
  summary: ""
---
I've been in software development for long enough that I remember a time when [Hungarian Notation](http://en.wikipedia.org/wiki/Hungarian_notation) was all the rage to write `strFirstName`, `iAge` and `objPerson`, I also remember it dying and dying for a good reason.

# The rise of Hungarian jQuery

This is something that I've been noticing more and more in JavaScript code that I work with, code that looks like this:

	var $foo = $('.foo');
	
	//do something with $foo
	
Do you see what I'm referring to, the prefixing of `$` onto a *jQuery variable* with the purpose of indicating that it's a jQuery object. To me this looks just like using Hungarian Notation, that just like we use to prefix `str` to denote a variable as a string we are prefixing `$` to denote a jQuery object.

## Analysing Hungarian jQuery

I've been calling this pattern **Hungarian jQuery** since when it's being used people aren't really following Hungarian notation, they don't add the prefix elsewhere, it's just specific to jQuery in their code.

The primary argument I've seen behind this is the same that Hungarian Notation took off to start with, editors for a long time were pretty shitty so it was hard to know what a variable type was, you'd constantly be scrolling up and down to work that out. A lot of the JavaScript editors we use (Visual Studio, Sublime Text 2, etc) don't have as good JavaScript support as they do other languages. Generally this comes from the dynamic nature of JavaScript and that it can be quite hard to work out *what* the type really is so the use of the `$` prefix helps us identify it as a jQuery object.

But it begs the question, if we use `$` to help identify a jQuery object then why aren't we using other prefixes to identify other variable types? What makes the jQuery objects in your code more important that the other objects which you have? And more to the point since JavaScript variables are dynamic you can change their type so what happens if you reassign the `$foo` to something that's *not* of jQuery origins? I wouldn't recommend that as you're probably going to make a royal mess of your application but the fact remains that you can do it and there are valid scenarios for it.

There are other arguments behind the use of Hungarian jQuery, one of those is scoping, say we've got this code block:

	$('foo').on('click', 'a', function () {
		var $this = $(this);
		
		$.get('/bar', function (result) {
			$this.html(result);
		});
	});
	
So the reason behind this is we have a click handler and inside that click handler we want to perform an AJAX request and then populate the HTML of the clicked element with something from the server (crappy example but you get the gist). Because of the way JavaScript scoping works by the time the AJAX response handler is called the `this` context is no longer the clicked element so we can't work with it, instead we need to capture it in the closure scope but because `this` is a reserved word we can't reassign it, instead we create a jQuery version of it and since we are making a jQuery version we append the `$` to the start. Personally I'd write the code this way:

	$('foo').on('click', 'a', function () {
		var target = $(this);
		
		$.get('/bar', function (result) {
			target.html(result);
		});
	});
	
It's no longer using Hungarian Notation but still conveying the same point.

# Conclusion

**I really dislike Hungarian notation**, I was glad when the war was won and we no longer had to prefix our variables with silly things (don't even get me started on `m_`) but quite often I see it creeping back into the JavaScript developers coding style. So next time you think "I'll prefix with `$` so I know it's jQuery" ask yourself why you didn't also prefix that bool with `b` so you knew it was a bool and that number with `i` so you knew it's a number.

