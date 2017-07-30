---
  title: "LINQ in JavaScript, ES6 style clarification"
  date: "2013-09-16"
  tags: 
    - "javascript"
    - "linq"
    - "es6"
  description: "A quick clarification on my previous post about LINQ in JavaScript using ES6 features."
---

I [recently blogged about implementing LINQ in JavaScript with ES6 iterators](/posts/2013-09-06-linq-in-javascript-es6.html). While I'd done a bunch of research, played around with FireFox (which seemed to have the most up-to-date implementation) and thought it was all well and good.

Unfortunately it turns out that what I was talking about was the `__iterator__` syntax which FireFox has implemented but it's not in line with the [current iterator and generator approach](http://domenic.me/2013/09/06/es6-iterators-generators-and-iterables/).

So while I did state that the code was against an API that wasn't set in stone I was a bit further away from where I wanted to be going forward.

Thanks [Domenic](https://twitter.com/domenic) for picking up on it and pointing me in the right direction, I'm in the process of reworking the library to work with what's actually outlined so far in ES6 and you can [check out the progress](https://github.com/aaronpowell/linq-in-javascript/tree/es6-generators).