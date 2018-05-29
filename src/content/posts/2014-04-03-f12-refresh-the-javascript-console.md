---
  title: "F12 Refresh - The JavaScript Console"
  date: "2014-04-03"
  tags: 
    - "javascript"
    - "f12"
    - "internet-explorer"
  description: "A look at the JavaScript console improvements in the F12 tooling refresh"
---

One of the new features in the F12 refresh is some updates to the JavaScript console so let's have a look at those updates.

# `console.log`

I've previously [complained](https://www.aaron-powell.com/posts/2013-01-14-ie10-console-thoughts.html) about how the `console.log` method in IE doesn't like it when you pass an object to it, it just outputs `[object Object]` meaning it just executed a `toString` on the object.

I can happily confirm that this has been fixed! When you pass an object, multiple objects or formatted strings it operates as it does in the other browser dev tools.

![F12 console.log works](/get/f1-refresh-console-log.gif)

# `$_`

If you've used other browsers dev tools there's a chance you've come across `$_`. This variable is added by the dev tools which represents the result of the last expression. This can be useful when running through execution stacks and you're not capturing output, particularly when you're running through the debugger.

# Minor improvements

There's another few things which are fairly minor and not particularly obvious such as:

* There's now a button on the Console toolbar which you can prevent the console being cleared on each request. By default this turned on, meaning the console will be cleared on each request. There's obvious performance impacts by turning this off as the dev tools are maintaining state
* Under the Internet Explorer settings there is now a property you can set which will enable the console even when F12 isn't active. This setting is off by default as again it can be a performance hit so it's worthwhile only turning it on as-needed

# Conclusion

That wraps up our look at some of the new features related to the style editor in Internet Explorer's F12 tools. If you've got any feedback make sure you ping the [@IEDevChat](http://twitter.com/iedevchat) twitter account and let them know. Also don't forget to checkout [modern.ie](http://modern.ie) to get trial versions of Windows with Internet Explorer.
