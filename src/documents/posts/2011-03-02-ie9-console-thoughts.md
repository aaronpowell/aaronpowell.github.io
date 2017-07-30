---
  title: "Making the Internet Explorer JavaScript tools better"
  metaTitle: "Making the Internet Explorer JavaScript tools better"
  description: "Some thoughts on how to improve the IE9 JavaScript developer tools"
  revised: "2011-03-03"
  date: "2011-03-02"
  tags: 
    - "ie9"
    - "javascript"
    - "web"
    - "web-dev"
  migrated: "true"
  urls: 
    - "/web-dev/ie9-console-thoughts"
  summary: ""
---
Previously I've blogged about a limitation of [console.assert from the IE9 developer tools][1]. Also recently [Tatham Oddie][2] blogged some overall [thoughts on improving IE9 for developers][3] and I decided to elaborate some thoughts I've got around the JavaScript developer tools.

JavaScript developer tools are a very important part of my toolbox, I really am quite a JavaScript fan (as you may know if you read my blog), so when I find something that irks me it *really* irks me.

* Object inspection
 * When you want to inspect an object in dev tools my first thought is to dump it into the console. While the object will dump out it's not great, if you have nested objects they'll produce the nice `[object Object]`, also you can't expand/ collapse the object like with other browsers. If you want to do that you need to put it into the **Watch** window. This multi-step process is a bit tedious, particularly if you're prototyping something like jQuery selectors or defining objects on the fly.

* Code completion
 * This is something that I've noticed in recent versions of Firebug and the Chrome developer tools and it's really handy, being able to use intellisence on a JavaScript object.

* Console clearing
 * There doesn't seem to be a way to clear the console other than calling `console.clear()`.

* Locals & Call Stack outside of debugging
 * I'm not quite sure when you'd use those tabs on the *Script* window when you're not in a debugging session.

* No cross-tab interaction
 * With Chrome and Firebug when you drop a DOM object in the console and you hover over it the element reacts on the browser. This is really useful, especially when working with something like jQuery.

* jQuery inspection
 * A jQuery selector will return an array, but it's also an object literal, meaning it's been augmented with a number of non-array properties. That stuff isn't what you're interested in, you just want the selector results. I'd much prefer that it is treated as just an array and the extended properties are ignored.

# Wrapping up

Mostly what I've outlined here is nit-picking on the developer tools, they are better than the previous versions and here's hoping they take some inspiration from the other browsers.


  [1]: /ie-9-console-assert
  [2]: http://tath.am
  [3]: http://blog.tatham.oddie.com.au/2011/02/28/making-internet-explorer-better-for-developers/