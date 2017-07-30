---
  title: "Not getting DropDownList value when setting it via JavaScript"
  metaTitle: "Not getting DropDownList value when setting it via JavaScript"
  description: ""
  revised: "2010-08-28"
  date: "2010-08-28"
  tags: 
    - "javascript"
  migrated: "true"
  urls: 
    - "/no-value-when-settings-dropdown-with-javascript"
  summary: ""
---
So today I had a problem which was doing my head in. I had a form which has a bunch of DropDownLists on it, some of which are disabled (depending on the radio button selection). Regardless of whether the DropDownList was available I needed to read the value (which was often set via JavaScript) back on the server.

But I noticed that the value I was setting via JavaScript wasn't making it way back to the server if I read the dropDownList.SelectedValue property.
Hmm I said to myself, I looked at the form, it's setting the value right. The "selected" attribute was on the right option tag, but the value still isn't on the server.

If I had set the value by clicking on it and selecting a value it was making it back.

Hmm...

Then I realised, the difference between the two actions was the DropDownList wasn't enabled in one of them, and when it wasn't it was enabled the value wasn't making it back.

Shit, that's it! When a DropDownList isn't enabled .NET seems to disregard the submitted value when loading the ViewState!

But the solution is simple:

	$(document).ready(function() {
	  $('#submitButton').click(function() {
		$('select').removeAttr('disabled');
	  });
	});

jQuery makes it super easy to find all the drop down lists and then make them enabled before the form submits.

Here's another example of how to do it if you're using client-side validation and you want to make sure it's passed:

	$(document).ready(function() {
	  $('#submitButton').click(function() {
		if( Page_IsValid ) $('select').removeAttr('disabled');
	  });
	});

`Page_IsValid` is the client variable updated with the result of the client side validation.