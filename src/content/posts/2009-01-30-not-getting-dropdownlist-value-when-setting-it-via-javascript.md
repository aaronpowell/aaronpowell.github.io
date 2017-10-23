+++
title = "Not getting DropDownList value when setting it via JavaScript"
date = "2009-01-30"
draft = false
tags = ["asp.net", "ajax", "javascript", "jquery"]
+++

<p>So today I had a problem which was doing my head in. I had a form which has a bunch of DropDownLists on it, some of which are disabled (depending on the radio button selection). Regardless of whether the DropDownList was available I needed to read the value (which was often set via JavaScript) back on the server.</p>
<p>But I noticed that the value I was setting via JavaScript wasn't making it way back to the server if I read the <strong>dropDownList.SelectedValue</strong> property.<br>Hmm I said to myself, I looked at the form, it's setting the value right. The "selected" attribute was on the right option tag, but the value still isn't on the server.</p>
<p>If I had set the value by clicking on it and selecting a value it was making it back.</p>
<p>Hmm...</p>
<p>Then I realised, the difference between the two actions was the DropDownList wasn't enabled in one of them, and when it wasn't it was enabled the value wasn't making it back.</p>
<p>Shit, that's it! When a DropDownList isn't enabled .NET seems to disregard the submitted value when loading the ViewState!</p>
<p>But the solution is simple:</p>
<pre>$(document).ready(function() {
  $('#submitButton').click(function() {
    $('select').removeAttr('disabled');
  });
});
</pre>
<p>jQuery makes it super easy to find all the drop down lists and then make them enabled before the form submits.</p>
<p>Here's another example of how to do it if you're using client-side validation and you want to make sure it's passed:</p>
<pre>$(document).ready(function() {
  $('#submitButton').click(function() {
    if( Page_IsValid ) $('select').removeAttr('disabled');
  });
});
</pre>
<p><strong>Page_IsValid</strong> is the client variable updated with the result of the client side validation.</p>