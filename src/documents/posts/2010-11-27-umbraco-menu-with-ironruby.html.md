--- cson
title: "Creating a menu in Umbraco with IronRuby"
metaTitle: "Creating a menu in Umbraco with IronRuby"
description: "No more XSLT, DRL for the win"
revised: "2010-11-29"
date: "2010-11-27"
tags: ["umbraco","ironruby"]
migrated: "true"
urls: ["/umbraco-menu-with-ironruby"]
summary: """
Useful links:<br />
<a href=\"http://ruby-doc.org\">Ruby Docs</a><br />
<a href=\"http://ironruby.net\">IronRuby</a>
"""
---
Recently I've been help a client migrate a number of unmanaged microsites into an Umbraco instance, and since it's well known that [I'm not a fan of XSLT][1] an alternative is in order. While working at [TheFarm][2] I wrote a blog about the different macro options and what [we were doing back then][3]. Since moving on I've been wanting to avoid using XSLT at all.

Umbraco has supported DLR languages like [IronPython][4] and [IronRuby][5] for quite some time, so I decided to look into it for this new project.

So with the help of fellow Readifian [Thomas Johansen][6] we set about doing a migration of the microsites and running IronRuby where possible (Thomas is a Ruby fan so that's why we're choosing IronRuby here).

One of the most common macros I was still writing in XSLT is a navigation, so lets look at how we can do this with IronRuby.

*Note: With this I'm working on an Umbraco 4.5.2 version of Umbraco, using .NET 3.5*

## Getting your script ready

One of the nice things about XSLT is that you can load in XSLT extensions, you know that section at the top of your XSLT file which you need specify `xmlns:umbraco.library="urn:umbraco.library"` and so on, well we need to do a similar thing in IronRuby so we have access to the `umbraco.library` object.

But what's different here is we just need to open the appropriate objects:

    Library = Object.const_get("umbraco").const_get("library")

What this is doing is opening the `umbraco` namespace and then getting the `library` object from within it (you can chain as many namespaces together as you need to do this too).

## Getting the starting node

At the moment our sites are only one level deep so we're being a bit lazy with the loading of the root most node, but basically we want to find a parent some way. Like an XSLT DLR script are provided with the current page node in the form of a `currentPage` object, so we'll grab it from here:

    parent = currentPage.Parent

## Building our HTML

Now that we have our starting node we need to start constructing a navigation, that's as easy as just writing HTML to the screen:

	puts '<nav><ul id="navigation">'

	parent.Children.find_all { |c| c.GetProperty("umbracoNaviHide").Value != "1" }.each_with_index do |child, i|
		html = ""
		html << "<li class=\"#{'first' if i == 0}\">"
		html << "<a href=\"#{Library.NiceUrl(child.Id)}\" class=\"#{ 'selected' if child.Id == currentPage.Id }\" title=\"#{child.Name}\">#{child.Name}</a>"
		html << "</li>"
		puts html
	end

	puts '</ul></nav>

Here what we're doing is creating some HTML which is a HTML5 `<nav>` element that then encloses a `<ul>` element. What's primarily of interest in this script section is the loop.

We're doing a few things here, first we're using the [`find_all`][7] method (you could use a `select` instead if you want, Ruby has a dozen ways to do the same thing :P). This method we're doing a filter on the children, ignoring the ones which we want to hide, but you can add what ever conditions you want in there (the `c` variable is an instance of `Node` from the Umbraco API). Once we're got our filtered collection we are then looping through each one using the [`each_with_index`][8] method which provides us again with the instance of a `Node` and the position in the array (which is `i` if you're not following).

A really cool thing about Ruby is how you can do string formatting, unlike .NET you can put complex logic in your string formatting, which is denoted by the `#{ ... }` syntax, here we're doing a few things such as:

    #{'first' if i == 0}

What this does is returns a value of `first` when the `if` condition is true, and this is how we can put a class on the first item in the navigation.

We're also capable of doing other complex things like

    #{Library.NiceUrl(child.Id)}

And get the URL of the page in-place.

## Wrapping it all up

Here's the completed script:

	Library = Object.const_get("umbraco").const_get("libary")
	parent = currentPage.Parent
	puts '<nav><ul id="navigation">'

	parent.Children.find_all { |c| c.GetProperty("umbracoNaviHide").Value != "1" }.each_with_index do |child, i|
		html = ""
		html << "<li class=\"#{'first' if i == 0}\">"
		html << "<a href=\"#{Library.NiceUrl(child.Id)}\" class=\"#{ 'selected' if child.Id == currentPage.Id }\" title=\"#{child.Name}\">#{child.Name}</a>"
		html << "</li>"
		puts html
	end

	puts '</ul></nav>

That's a total of 13 lines (including whitespace, which can be condensed to just 7 lines if you change whitespace and HTML formatting) of Ruby code which can build a navigation which will suite a lot of needs. Compare this to the template for `NavigationPrototype.xslt` which ships within an Umbraco install that is 40 lines (ok, fine it **does** have comments :P). Not bad me things, not bad...

## Conclusion

IronRuby is a great alternative to writing small macros in Umbraco, it's a great alternative to using XSLT. If you're a developer I strongly recommend you look into the DLR support for your Umbraco projects.

  [1]: /why-im-not-a-fan-of-xslt
  [2]: http://thefarmdigital.com.au
  [3]: http://farmcode.org/post/2010/07/13/TheFARMe28099s-guide-to-Macros.aspx
  [4]: http://ironpython.net
  [5]: http://ironruby.net
  [6]: http://twitter.com/#!/thomasjo
  [7]: http://ruby-doc.org/core/classes/Enumerable.html#M003124
  [8]: http://ruby-doc.org/core/classes/Enumerable.html#M003137