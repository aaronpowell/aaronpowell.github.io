---
  title: "Firefox, jQuery and the case of the Document response"
  metaTitle: "Firefox, jQuery and the case of the Document response"
  description: "A mystery that resulted in a strange mix of expected responses"
  revised: "2013-05-07"
  date: "2013-05-07"
  tags: 
    - "jquery"
  migrated: "true"
  urls: 
    - "/firefox-jquery-missing-datatype"
  summary: ""
---
I recently tweeted that I was having this problem:

![Something's not right][1]

As you can see something's not right there, Chrome is not getting anything back from my AJAX request (or at least a falsey value) where as Firefox seems to be having a `Document` object.

I was stumped.

**Why are you seeing two different responses from the exact same bit of code?**

So the response we're getting back has a 0 content length and that was my first point of call, something must be causing the browsers to behave differently when you've not got any content.

I ended up [here](https://github.com/jquery/jquery/blob/1.9-stable/src/ajax/xhr.js#L172) and what I found was that when this is called:

    complete( status, statusText, responses, responseHeaders );

The `response` object has different properties depending on the browser, in Chrome (and IE) it has a single `text` property but in Firefox it has a `text` _and_ `xml` property. I think we've found our problem boss, we've somehow got different objects. But still, why are we ending up with a `document` object not the text like Chrome?

Well next we end up through [this logic](https://github.com/jquery/jquery/blob/1.9-stable/src/ajax.js#L735). Here jQuery works out what `dataType` you're response is and it gives you the appropriate data.

Now the astute reader may have noticed _I wasn't setting a `dataType` in my request_ which means that jQuery will have to do it's _best guess_ at what to give me, and that is done through this:

	// Try convertible dataTypes
	for ( type in responses ) {
		if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[0] ] ) {
			finalDataType = type;
			break;
		}
		if ( !firstDataType ) {
			firstDataType = type;
		}
	}

It uses a `for in` loop of all the properties of the response and settles on the last one if it can't find anything else. Guess what the last one is... `xml`!

Well that makes for an easy solution, once you set a `dataType` on your jQuery ajax settings you're all good to go, which leads me to my conclusion:

## If `null` is valid from your response make sure you tell jQuery what `dataType` you want it to be.

[There's an example repository available here.](https://github.com/aaronpowell/jquery-ajax-datatype-issue)

  [1]: https://www.aaron-powell.com/get/firefox-vs-chrome-ajax-strangeness.PNG