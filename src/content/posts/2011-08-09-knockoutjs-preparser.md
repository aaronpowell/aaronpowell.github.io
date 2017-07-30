---
  title: "Introducing the KnockoutJS preparser"
  metaTitle: "Introducing the KnockoutJS preparser"
  description: ""
  revised: "2011-08-09"
  date: "2011-08-09"
  tags: 
    - "javascript"
    - "knockoutjs"
  migrated: "true"
  urls: 
    - "/javascript/knockoutjs-preparser"
  summary: ""
---
In my [previous post][1] I outlined one of the biggest issues I have with [KnockoutJS][2] as being its WPF/ Silverlight binding syntax and how it requires you to put JavaScript into your HTML.

Now I'm a pretty firm believe that if you are going to criticise something then you better make it constructive. Just saying "I don't like `blah`" isn't helpful to a) the author of `blah` or b) people wanting to learn more about `blah`, so I decided that I would follow up my criticism of KnockoutJS with a way *I* would go about fixing it.

# Introducing the KnockoutJS preparser

To address my issue with KnockoutJS use of JavaScript in HTML I started looking at how I would go about it and the solution I kept coming back to was using the `data-*` attributes to describe in my HTML an intention. I decided that if I could do this in a good, convention approach then I should be able to translate it back into a KnockoutJS binding with minimal impact.

Out of this idea (and a challenge from my colleague [Ducas][3]) I set about taking my idea from my brain and putting in code.

Essentially what I came up with was taking this:

    <span data-ko-text="firstName"></span>

And turning it into this:

    <span data-bind="text: firstName"></span>

The idea is that you take `data-ko-*` as a prefix and use that to describe what could (well will...) become your binding syntax. Once getting this done I threw the code up on github and you can grab it from the [KnockoutJS Pre-Parser][4] project page.

# What does it address

The ultimate goal is to be able to use the `data-ko-*` to describe out what you want in your HTML and the pre-parser will pick that up and *Knockout-ify* it for you. Ideally I'd like to support all **common** scenarios and so far I support:

* Basic bindings with text, css, value, etc
* Template name binding
* Pre-parser syntax within a template
* Template options (but not completely, you still have to embed JSON in your template options attribute. I added it about 3 hours ago so it's still being worked on :P)
* Event handler wire ups (if you want a complex handler like defining scope, etc you'll still have to embed JavaScript for now, I'm trying to work out how to get around that)

# How to use it

If you really want to know how to use it I suggest you read the [Readme][5] or the tests but the quick and dirty is:

* Include it after you include KnockoutJS
* ???
* Profit

The pre-parser will actually hijack the `ko.applyBinding` method and perform the pre-parsing at that point, no custom stuff needs to be done to make it work :).

# Where to get it

At the moment the only way to get it is via [Github][6], depending on interest/ motivation I'll put it up on Nuget for people to get it via as well.

# Conclusion

So this wraps up my introduction to the KnockoutJS Pre-parser and an approach I am taking to address one of the issues which I have with KnockoutJS. Feel free to give me any feedback you have on the library and the idea in general.


  [1]: /javascript/why-i-don-t-like-knockoutjs
  [2]: http://knockoutjs.com
  [3]: http://duc.as
  [4]: https://github.com/aaronpowell/KnockoutJS-Pre-parser
  [5]: https://github.com/aaronpowell/KnockoutJS-Pre-parser/blob/master/README.md
  [6]: https://github.com/aaronpowell/KnockoutJS-Pre-parser