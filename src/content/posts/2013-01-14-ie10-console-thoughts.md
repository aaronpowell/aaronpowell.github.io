---
  title: "Making the Internet Explorer JavaScript tools better, again"
  metaTitle: "Making the Internet Explorer JavaScript tools better, again"
  description: "A look at what's changed since I last pointed out the failings of the IE dev tools"
  revised: "2013-01-14"
  date: "2013-01-14"
  tags: 
    - "javascript"
    - "web"
    - "internet-explorer"
    - "web-dev"
  migrated: "true"
  urls: 
    - "/web-dev/ie10-console-thoughts"
  summary: ""
---
Almost two years ago I wrote a blog post about [what I saw as problems in the IE9 developer tools](https://www.aaron-powell.com/web-dev/ie9-console-thoughts).

Since then we've had IE10 released as well so I decided to revisit the post and see how have the development tools changed/improved since IE9.

* `console.log` still sucks
 * I made a point that when it comes to using `console.log` (and the derivatives) you often found that you got `[object Object]`. Well this is still the case, and most commonly you'll see it if you're using the console as a scratch pad to test things out. There are two solutions to this, one is to override the `console.log` method in a similar was as I mentioned with ["fixing" console.assert](https://www.aaron-powell.com/ie-9-console-assert) or alternatively override the `toString` method of your object, since the reason you get `[object Object]` is because all it uses the `toString` method of the object (I override it to just do `JSON.stringify(this)`)
* You still can't clear the console without right-clicking or using `console.clear()`, there's a toolbar option that _looks_ like it would do it but nope, that's a cache clear button
* Related to the above point I really wish the Ctrl + R and/or F5 would work when input is focused on the dev tools, and by work I mean reload the page. Yes I _get_ why they don't work, the dev tools are running in a separate process, that'd be a nice thing to fix too...
* The list of provided User Agents is **really** good ([as I said before](https://www.aaron-powell.com/web/ie10-user-agent-switching)) and the ability to save your own custom User Agents is nice
* Why is the DOM explorer still a static node list? C'mon this is 2013 guys and you make me refresh the DOM explorer when ever the DOM changes so I can inspect the current page state? Yes again I'm sure this is related to the fact that it's a separate process but it's just painful, especially if you're working on a KnockoutJS UI or a SPA
* I would love an IndexedDB inspector like Chrome has in their dev tools, and since it's [build on ESE](https://www.aaron-powell.com/web/indexeddb-storage) I would think that this shouldn't be that big a deal, ESE is pretty well documented

# So...

It looks like the IE dev tools saw very little love _in the form of features_ with the IE10 release. I'll admit that I didn't really talk about the network/profile tab as I find these are not the features that you use all that often. If I want to inspect network traffic then I'm going to use Fiddler, I see no point in use *any* of the browsers tools for that. As for the profile tab, it's good but I don't often find myself trying to analyse the JavaScript performance of a page (and when I do it's generally find that it's Knockout or jQuery that's causing the performance problems).

The last few years has seen the IE team put in the hard yards to get IE back to being a highly competitive browser in the current market for users so I hope that they start focusing on making IE a competitive browser for the web developer.
