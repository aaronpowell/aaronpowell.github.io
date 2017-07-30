---
  title: "What I learned about nth-child selectors"
  date: "2014-03-06"
  tags: 
    - "css"
  description: "Today I learned something important about the `nth-child` CSS selector that seems to be a common misconception."
---

Today I learned an interesting fact about how the `nth-child` CSS selector works and it was different to what I expected and what seems to make sense.

I had the following HTML snippet:

    <div class="input-group">
        <div class="legacy">
            <div class="input-subgroup">
                <input name="itemId" id="Type0" type="radio" checked="checked" value="1">
                <label for="Type0">Single</label>
            </div>
            <div class="input-subgroup">
                <input name="itemId" id="Type1" type="radio" value="2">
                <label for="Type1">Couple</label>
            </div>
            <div class="input-subgroup">
                <input name="itemId" id="Type2" type="radio" value="3">
                <label for="Type2">Family</label>
            </div>
        </div>
        <div class="new">
            <div class="input-subgroup">
                <input name="somethingElse" id="somethingElse" type="text" maxlength="2" placeholder="Enter" value="">
            </div>
            <div class="input-subgroup">
                <input name="somethingElse2" id="somethingElse2" type="text" maxlength="2" placeholder="Enter" value="">
            </div>
        </div>           
    </div>
    
And I wanted to find the `input[type="radio"]` at a particular position in the DOM.

So I started with this snippet:

    var group = document.getElementsByClassName('input-group')[0];
    var couple = group.querySelectorAll('.legacy input[type="radio"]:nth-child(2)');

And was confused when that didn't work, I'm wanting to find the 2nd radio button, and that _reads_ right, it's the 2nd radio button under the `class="legacy"` element, so it makes sense... Right?

But I was missing a point, that it's the `nth-`**child** and in my DOM `input[type="radio"]` isn't actually a **child** of `class="legacy"`, it's a **descendant** so what I'm really after is `nth-descendant`, which isn't a real selector.

## The fix

It's a pretty easy fix _if you know your DOM_, change the selector to:

    .legacy :nth-child(2) input[type="radio"]
  
Since we know that the radio button is in the `nth-child(2)` of `.legacy` and we are properly locating the children based on their position.

You can see the [broken one here](http://jsbin.com/hemag/1/edit) and the [working one here](http://jsbin.com/hemag/4/edit).