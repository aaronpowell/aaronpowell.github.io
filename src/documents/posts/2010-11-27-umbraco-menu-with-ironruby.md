---
  title: "Creating a menu in Umbraco with IronRuby"
  metaTitle: "Creating a menu in Umbraco with IronRuby"
  description: "No more XSLT, DRL for the win"
  revised: "2010-11-29"
  date: "2010-11-27"
  tags: 
    - "umbraco"
    - "ironruby"
  migrated: "true"
  urls: 
    - "/umbraco-menu-with-ironruby"
  summary: "Useful links:<br />\n<a href=\"http://ruby-doc.org\">Ruby Docs</a><br />\n<a href=\"http://ironruby.net\">IronRuby</a>"
---
Recently I've been help a client migrate a number of unmanaged microsites into an Umbraco instance, and since it's well known that [I'm not a fan of XSLT][1] an alternative is in order. While working at [TheFarm][2] I wrote a blog about the different macro options and what [we were doing back then][3]. Since moving on I've been wanting to avoid using XSLT at all.

Umbraco has supported DLR languages like [IronPython][4] and [IronRuby][5] for quite some time, so I decided to look into it for this new project.

So with the help of fellow Readifarian [Thomas Johansen][6] we set about doing a migration of the microsites and running IronRuby where possible (Thomas is a Ruby fan so that's why we're choosing IronRuby here).

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
	  puts %Q{
		<li class="#{'first' if i == 0}">
		  <a href="#{Library.NiceUrl(child.Id)}" class="#{'selected' if child.Id == currentPage.Id}" target="_self" title="Go to #{child.Name}">#{child.Name}</a>
		</li>
	  }
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
	  puts %Q{
		<li class="#{'first' if i == 0}">
		  <a href="#{Library.NiceUrl(child.Id)}" class="#{'selected' if child.Id == currentPage.Id}" target="_self" title="Go to #{child.Name}">#{child.Name}</a>
		</li>
	  }
	end

	puts '</ul></nav>'

That's a total of 13 lines (including whitespace, which can be condensed to just 7 lines if you change whitespace and HTML formatting) of Ruby code which can build a navigation which will suite a lot of needs. Compare this to the template for `NavigationPrototype.xslt` which ships within an Umbraco install that is 40 lines (ok, fine it **does** have comments :P). Not bad me things, not bad...

## Conclusion

IronRuby is a great alternative to writing small macros in Umbraco, it's a great alternative to using XSLT. If you're a developer I strongly recommend you look into the DLR support for your Umbraco projects.

# Bonus - making a recursive menu system

In the above code we've make a simple menu system that has a known starting point, but as I pointed out it's not great if you wanted to have a recursive one? Well let's have a look at what is required to do that.

## Recursively finding a parent

The first thing we need to do is work out how to translate this XPath statement (that's from the template shipped in Umbraco):

    $currentPage/ancestor-or-self::node [@level=$level]/node [string(data [@alias='umbracoNaviHide']) != '1']

into something in Ruby.

But there's a problem, we're checking against the `@level` attribute in XSLT, but the `Node` object in the Umbraco API **doesn't have a Level property**! Damn that's going to make my life harder isn't it... Well good news is you can get around this with a bit of trickery. What we're going to do is work against the `Id` property... but hang on, we don't *know* what the Id is of the node at the level we want, and like hell do I want to hard code that anywhere. Well here's where the trickery comes in.

The `Node` object has a property on it for the `Path`, we can use that to *fake* the level. Since a path is always in a known format, a comma-separated string, we can make that into an array, and then path-from-there ;).

    level = 2
    target_parent_id = currentPage.Path.split(',')[level].to_i rescue -1

Since we're working with microsites here I don't want the upper-most navigation point for the site, I want the point from the current microsite, so I'm finding the ID of the node at level 2, if you were doing a full site specify the array index position (aka level) to be `1`.

We're also doing a `rescue` here, and that will cause -1 to be returned if we for some reason don't have an array that is at least 3 items long (it's not required but it's just safer and easier to recover from if you have an unexpected error).

You'll also notice the `to_i` on the end, this method will convert the string (ie: "1234") into a number (ie: 1234).

Next we to actually find the parent, so we want to simulate the `ancestor-or-self` XPath select, which is really just a recursive function, and if there's something that dynamic languages are great for that's recursive functions.

	parent = currentPage
	parent = parent.Parent until parent.nil? || parent.Id == target_parent_id

So what we're doing here is calling the `until` loop method and assigning the value of `parent` to `parent.Parent` until one of the conditions returns true. This is similar to a `do {...} while(...)` statement in .NET languages, just a bit funkier ;).

## Bringing it all together

In addition to adding recursive parent lookups we've also decided to fix the script so that no navigation HTML is generated if there is no navigation to display. This can be done with a single-line `if` statement, which looks kind of cool:

	return if (parent && (parent.Children.empty? || parent.Children.any? {|c| c.GetProperty("umbracoNaviHide").Value != "1" })) || parent.nil?

That'll cause the script to exit if the parent wasn't found or there aren't any children to display.

Here's what the whole script looks like now:

	Library = Object.const_get("umbraco").const_get("library")

	target_parent_id = currentPage.Path.split(',')[2].to_i rescue -1
	parent = currentPage
	parent = parent.Parent until parent.nil? || parent.Id == target_parent_id
	
	return if (parent && (parent.Children.empty? || parent.Children.any? {|c| c.GetProperty("umbracoNaviHide").Value != "1" })) || parent.nil?
	
	puts '<nav><ul id="navigation">'

	parent.Children.find_all { |c| c.GetProperty("umbracoNaviHide").Value != "1" }.each_with_index do |child, i|
	  puts %Q{
		<li class="#{'first' if i == 0}">
		  <a href="#{Library.NiceUrl(child.Id)}" class="#{'selected' if child.Id == currentPage.Id}" target="_self" title="Go to #{child.Name}">#{child.Name}</a>
		</li>
	  }

	end

	puts '</ul></nav>'

Happy Ruby-ing :)


  [1]: /why-im-not-a-fan-of-xslt
  [2]: http://thefarmdigital.com.au
  [3]: http://farmcode.org/post/2010/07/13/TheFARMe28099s-guide-to-Macros.aspx
  [4]: http://ironpython.net
  [5]: http://ironruby.net
  [6]: http://twitter.com/#!/thomasjo
  [7]: http://ruby-doc.org/core/classes/Enumerable.html#M003124
  [8]: http://ruby-doc.org/core/classes/Enumerable.html#M003137



