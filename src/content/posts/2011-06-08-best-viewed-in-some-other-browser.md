---
  title: "This post is best viewed in some other browser"
  metaTitle: "This post is best viewed in some other browser"
  description: ""
  revised: "2011-06-08"
  date: "2011-06-08"
  tags: 
    - "html5"
    - "opinionated"
  migrated: "true"
  urls: 
    - "/best-viewed-in-some-other-browser"
  summary: ""
---
Does everyone remember the good old days of when websites had the introduction

> This website is best viewed in 800x600 and Internet Explorer 5

No? We'll you missed the 'good old days' of the browser wars which saw the different browser vendors supporting different features which resulted in web developers having to pick and choose what browser(s) their websites would work in.

Fast forward a half dozen years and we end up in 2011 where we see a new browser war going on and this time the focus is on HTML5. With the browser vendors turning out new versions at a speed we haven't seen in a long time, [8 to 12 weeks for IE][1], [12 weeks for Chrome][2] and [14 weeks for Firefox][3], the features available in each browser can (and often are) different.

Take for the example the [HTML5 input types][4], most specifically the the date picker. For years we've been using plugins for our favorite JavaScript library to create date pickers so it was only natural that the browsers would evolve to having built in. But there's a problem, only some browsers do support them.

This isn't a huge issue because through tools such as [Modernizr][5] we can detect if a browser does or doesn't support it and use a [polyfill or shim][6] to patch the gaps. Awesome, but what if the browser has *partial support*? For example at the time of writing the current version of Chrome is **12.0.742.91 (Official Build 87961)** running WebKit **534.30 (branches/chromium/742@88085)** and it supports `<input type="date" />`, but it only has partial support. Here's how it looks:

![Chrome date input][7]

In fact Opera is the only browser that has full support for it.

But that's fine, as I said before we can use a polyfill to add the date picker, only there's a problem. Because the partial support which the WebKit engine has kind of has a date picker but kind of doesn't you still end up with the scroll bar on the side. Additionally you can't change the format of the date that you're entering.

Another interesting fact is that the `<input type="number" />` in this build also appears to be miss-implementing the HTML5 spec and inserting a comma every three digits.

There was also the [saga about Web Sockets spec changing][8] and potential security holes (which saw [Firefox disabling them by default][9]).

And this brings me back to my original question, are we going back to the days when the differences between the browsers are holding us back from doing what we need to in complex web applications or are polyfills and shims going to save us from another generation of websites which *work best in some other browser*?


  [1]: http://blogs.msdn.com/b/ie/archive/2011/04/12/native-html5-first-ie10-platform-preview-available-for-download.aspx
  [2]: https://docs.google.com/present/view?id=dg63dpc6_4d7vkk6ch&pli=1
  [3]: https://developer.mozilla.org/devnews/index.php/2011/04/07/new-development-channels-and-repositories-for-rapid-releases/
  [4]: http://diveintohtml5.org/forms.html
  [5]: http://modernizr.com
  [6]: https://github.com/Modernizr/Modernizr/wiki/HTML5-Cross-Browser-Polyfills
  [7]: https://www.aaron-powell.com/get/web-dev/chrome-input-date.PNG
  [8]: http://www.xtranormal.com/watch/7991991/web-sockets-we-are-the-first
  [9]: http://hacks.mozilla.org/2010/12/websockets-disabled-in-firefox-4/