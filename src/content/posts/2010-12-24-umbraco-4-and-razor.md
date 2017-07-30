---
  title: "Using Razor in Umbraco 4"
  metaTitle: "Using Razor in Umbraco 4"
  description: "A quick look at how to use the Razor support which is coming with Umbraco Juno (4.6)"
  revised: "2010-12-27"
  date: "2010-12-24"
  tags: 
    - "umbraco"
    - "razor"
  migrated: "true"
  urls: 
    - "/umbraco-4-and-razor"
  summary: "<a href=\"http://umbraco.codeplex.com/releases/view/58026\">Umbraco 4.6 download</a>"
---
If you've been following the development of Umbraco Juno (4.6) you'll have seen that [Niels][1] [released an add-in][2] for early Juno builds to which was for working with [Razor][3], the new syntax for ASP.Net development.

Well here's something even more exciting, Umbraco Juno no longer requires an add-in, instead it has a out-of-the-box support for working with Razor!

**AWESOME!**

## Umbraco <3 Razor

So what does the Razor support for Umbraco include? Well basically it allows Razor to be used in the same way that you use the Iron* languages, XSLT or .NET controls... as a macro. This means that you can use Razor just as you would any other language option.

## Working with Razor in Umbraco

So if you want to work with Razor what do you need to do? Well creating a Razor macro is just as nice as if you're doing any other kind of macro, through the Umbraco UI.

Razor files live along side the Iron* files in the `/python` folder (yeah, that's a hold over from the original DLR engine and changing it would be a breaking change so we have to live with it. Note - as Morten pointed out in the comments you can set `<add key="umbracoPythonPath" value="~/Razor" />` and use a different path for script files), and you create them like you create any other DLR script file in the Umbraco back office:

![Create Razor macors][4]

(Yes there's a spelling error in the beta which I've fixed :P)

Now you can start coding up your Razor macros.

## My first Razor macro

With Razor macros there's a slightly different way that you go about it, rather than using `currentPage` as you would with XSLT or an Iron* script you have a `Model` property which you work with.

To make this a bit nicer as well the `Model` property is a dynamic object, allowing you to access the properties as if they were actually properties of the model, meaning you can do this following:

    <div id="content">@Model.bodyText</div>

That's how easy it is to access the properties of the `Model`, no more `getProperty("bodyText").Value`. And there you have it, a basic Razor macro has been created.

### Something a bit more advanced

Well lets take it up a notch and make a slightly more advanced macro, say a news listing:

	<div class="news-lissting">
		@foreach(var page in Model.Children) {
			<div class="news-item">
				<h2><a href="@page.Url" title="@page.Name">@page.Name</a></h2>
				<h3>Published: @page.articleDate.ToString("dd MMM yyyy")</h3>
				<p>@page.description<p>
			</div>
		}
	</div>

What we're doing here looping through each of the children of the current page (the `Model`), and generating a `<div>` and then creating the HTML structure inside it.

### Post-beta features

Just a little note I've added a change to the DynamicNode class which is used by the dynamic Model object that allows you to access specific types of children, so you can do this in your Razor file:

	<div class="news-lissting">
		@foreach(var page in Model.articles) {
			<div class="news-item">
				<h2><a href="@page.Url" title="@page.Name">@page.Name</a></h2>
				<h3>Published: @page.articleDate.ToString("dd MMM yyyy")</h3>
				<p>@page.description<p>
			</div>
		}
	</div>

In this example my `Model` has children of the type `article` (that's the alias of the DocType) and I'm requesting them all (hence the pluralization). Pretty sweet I think!

## Conclusion

I'm sure that even the most seasoned XSLT "developer" (I'm looking at you [Warren][5]!) will have to admit the Razor syntax is highly readable for people who aren't .NET developers. And because we're working with a dynamic object it's really simple to access the properties as needed.

This brings us to the end of our quick look at the Razor support which is coming in Umbraco Juno, and how it's going to be another great choice for developers.


  [1]: http://twitter.com/umbraco
  [2]: http://our.umbraco.org/projects/website-utilities/razorcontrol-for-juno
  [3]: http://weblogs.asp.net/scottgu/archive/2010/07/02/introducing-razor.aspx
  [4]: /get/umbraco/umbraco-4-razor/umbraco-4-razor-01.png
  [5]: http://twitter.com/warrenbuckley