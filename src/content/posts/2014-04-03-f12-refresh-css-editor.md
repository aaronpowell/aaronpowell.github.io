---
  title: "F12 Refresh - CSS editor"
  date: "2014-04-03"
  tags: 
    - "css"
    - "f12"
    - "internet-explorer"
  description: "A look at the CSS editor improvements in the F12 tooling refresh"
---

One of the new features in the F12 refresh is some updates to the CSS editor so let's have a look at those updates.

# Tracking what changed

As a web developer often I'm spending time in the browser on the dev tools tweaking the CSS of the page to try out changes to the CSS without having to reload the page. The main pain with all of this is that if you're making lots of changes across multiple elements it's easy to lose track of what you changed.

With the F12 refresh we now get some visual indicators in the Styles tab which will highlight different colours depending on what you've done; if you've changed a setting then it'll have an orange highlight next to it, removed properties (actually deleted, not just unchecked) will be highlighted with red and new properties will be highlighted green. Here is it in action:

![F12 CSS changed properties](/get/f12-refresh-css-colours.gif)

That's all well and good but when you're doing changes across multiple DOM elements it can be a bit tricky still, as the style list still only shows you what is the change of the current DOM element, and selectors relevant to it. To combat this the F12 team have added a new tab to the CSS panel called **Changes**. This new panel does an inline diff of all the changes across all stylesheets within your web application. The changes also have the line number where the selector starts which you can also click in and navigate into the file within F12. If you've created an inline rule that will be listed with the selector for the element. You can even create new rules and they'll appear in the list as well. Here's it in action:

![F12 CSS changes list](/get/f12-refresh-css-changes.gif)

# Toggling states

There are a few states of DOM elements that can be useful to style, the hover and visited states. The problem is that these states can be tricky to simulate, particularly hover, it's kind of hard to hover an element and tweak it within the dev tools at the same time. With the F12 refresh we now have an option on the right which we can use to hide/show these pseudo states and toggle them on and off:

![F12 pseudo states](/get/f12-refresh-toggle-state.gif)

_Note: Changing theses pseudo states only toggles their visual state not the true element state meaning that it won't trigger the events associated with them._

# Conclusion

That wraps up our look at some of the new features related to the style editor in Internet Explorer's F12 tools. If you've got any feedback make sure you ping the [@IEDevChat](http://twitter.com/iedevchat) twitter account and let them know. Also don't forget to checkout [modern.ie](http://modern.ie) to get trial versions of Windows with Internet Explorer.
