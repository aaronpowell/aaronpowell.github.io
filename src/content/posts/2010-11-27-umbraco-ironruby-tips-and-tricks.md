---
  title: "Some tips and tricks for working with IronRuby and Umbraco"
  metaTitle: "Some tips and tricks for working with IronRuby and Umbraco"
  description: "Some things which I've learnt while working with IronRuby in Umbraco"
  revised: "2010-11-30"
  date: "2010-11-27"
  tags: 
    - "umbraco"
    - "ironruby"
  migrated: "true"
  urls: 
    - "/umbraco-ironruby-tips-and-tricks"
  summary: ""
---
*Note: The following has been tested in Umbraco 4.5.2 on .NET 3.5, and it **works on my machine***

# Modularizing your IronRuby files

Having the ability to break a large file into a set of smaller files is quite an important aspect of any kind of programming, and it's a concept that is in all the languages that Umbraco supports. XSTL has `<xsl:include`, .NET has types, but what about DLR scripts?

IronRuby (and IronPython) allow you to break files into smaller files, but how do you then include them?

I've seen examples with IronPython of peeople doing `Server.MapPath("~/python")` and having it all included like that, but with IronRuby (and I'm assuming IronPython) it isn't that complex.

## Script settings file

There's a file called **~/config/scripting.config** which is a little gem here. It's the file that you modify if you want to do something like add an additional DLR language (like [LOLCode][1]), but what's more interesting is this section:

    <options>
    </options>

Full information about the DLR hosting specification can be found [here][2] (and it goes into more details about this config section) but in short you can use this to pass folders into the script.

Here's a good sample (and what we're using):

	<options>
		<set language="Ruby" options="LibraryPaths" value="python" />
	</options>

What we're configuring here is:

* Setting the language to target as Ruby (you can use something from the names part of the language definition
* Specifying that we want to include the ~/python folder, using the **LibraryPaths** option.
 * This is the important one, the folders start from the root of your website (ie: /) so anything that's inside your site can be added (ok, that's not entirely true but it's true enough :P)

Now when each script is loaded it will include references to anything else in your ~/python folder, sweet :D.

## Adding external files

Now that you know how to ensure that all external script files are available to each other how do you actually use them? Well with IronRuby it's really simple:

    requires "MyAwesomeRubyScript"

Chuck that at the top of your file and then everything will be available to you from that script file. You can even create master includes so you can include specific scripts through 1 additional include:

**SomeIncludes.rb**

    requires "MyAwesomeScript"
    requires "SomeOtherScript"

**MainScript.rb**

    requires "SomeIncludes"
    
    #work against what was defined in MyAwesomeScript.rb

# Working with XML

In case you hadn't already noticed Umbraco has a lot of integration with XML, and although there is a .NET API and DLR workings sometimes you're just kind of stuck with XML. Take for example using the **Related Links** data type, that stores XML into the property value, which is *great* in XSLT, but how do you go with it in the DLR?

Well I came across a neat little script today for working with IronRuby and XML, [which you can get too][3]. And using the tip from above we can include it into any script file we need.

Let's make a basic IronRuby macro which will render a **Related Links** data type as a `<ul>`:

*Assumptions: We have the XML helper I linked about in a file called `xml.rb`. We have a property on the current node called **QuickLinks**.*

## QuickLinks.rb

Here's a simple little Ruby script to turn our property into some HTML:

	requires 'xml'

	links = currentPage.get_property('quickLinks').value

	xmlDoc = Document.new(links)

	html = '<ul>'
	i = 0
	xmlDoc.elements('links/link') do |e|
		html << %Q{
			<li class="#{'first ' if i == 0 }#{e.get('@type').value}" target="#{'_blank' if e.get('@newwindow').value == '1'}">
				<a href="#{e.get('@link').value}" title="#{e.get('@title').value}">#{e.get('@title'}.value</a>
			</li>
		}
                i+=1
	end

        html << '</ul>'
	puts html

This will create a new XML object which we can using in the Ruby script, we then do a XPath statement to find the link items and then iterate through them.

The XML library I used has a few shorthand method such as `get` that allows us to grab a contextual XPath statement result (it translates to [XmlNode.SelectSingleNode][4] internally) so we can quickly access the attributes and their values. I've also shown you how to use each attribute to build your list.

And you go, a Ruby script which you can use to create your very own related links :).

# Ruby-style naming

Although this tip isn't specific to the Umbraco usage of IronRuby it's a good tip to know if you're doing IronRuby coding. The Ruby naming conventions are not like the .NET naming conventions, rather than using PascalCase they go with underscoring to break up words, so in .NET we'd write a method name like `HelloWorld(...)` in Ruby we'd write `hello_world(...)`.

The smart folks behind IronRuby have taken this into account, and we can actually use Ruby-style naming even with .NET objects.

Previously I've shown [how to build a menu with IronRuby][5], well if you wanted to make it more Ruby-esq you can actually do this:

	parent.children.find_all { |c| c.get_property("umbracoNaviHide").value != "1" }.each_with_index do |child, i|
	  puts %Q{
			<li class="#{'first' if i == 0}">
			  <a href="#{Library.nice_url(child.id)}" class="#{'selected' if child.id == currentPage.id}" target="_self" title="Go to #{child.name}">#{child.name}</a>
			</li>
	  }
	end

I've done a few subtle changes, like:

    c.get_property("umbracoNaviHide").value

Or even

    library.nice_url(c.id)

Now it looks truly like a Ruby script, and not a .NET developers wild attempt to be up with the hip kids playing with Ruby :P.


  [1]: http://iunknown.com/2007/11/lolcode-on-dlr.html
  [2]: http://www.codeplex.com/Project/Download/FileDownload.aspx?ProjectName=dlr&DownloadId=127516
  [3]: http://code.msdn.microsoft.com/IronRubyXml
  [4]: http://msdn.microsoft.com/en-us/library/fb63z0tw.aspx
  [5]: /umbraco-menu-with-ironruby125