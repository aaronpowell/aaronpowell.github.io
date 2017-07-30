---
  title: "Adding data attributes to MVC3 forms with HtmlHelpers"
  metaTitle: "Adding data attributes to MVC3 forms with HtmlHelpers"
  description: ""
  revised: "2011-05-26"
  date: "2011-05-26"
  tags: 
    - "mvc3"
    - "asp.net-mvc"
  migrated: "true"
  urls: 
    - "/data-attribute-mvc3-forms"
  summary: ""
---
In a site I'm working on I wanted to add a data attribute, you know, `data-*`, to a form that was being generated from a controller action in MVC3. So I have the code like this:

	@using(Html.BeginFor("Index", "Home", FormMethod.Posts) {
		<!-- form contents -->
	}

Now I want the form to be opening in a new window, but I'm a good developer and I don't like littering my code with `target="_blank"`, instead I have some jQuery that I'm using to detect elements that are to go into new windows and adding the attribute programmatically.

I want to run this jQuery method:

    $('form[data-external=true]').attr('target', '_blank');

But I was stumped, how do you add `data-external` to the form? The HtmlHelper *does* allow you to pass in attributes, but they are done through an anonymous .NET object, and `-` isn't valid in a member name in C# (it is in the CLR though), so this code doesn't complie:

	@using(Html.BeginFor("Index", "Home", FormMethod.Posts, new { data-external = "true" }) {

Good thing is that the MVC team have already got this sorted, instead of a hyphen you can use an underscore:

	@using(Html.BeginFor("Index", "Home", FormMethod.Posts, new { data_external = "true" }) {

Now you'll get a form like this:

    <form action="/home/index" method="post" data-external="true">

Hopefully this will prove handy for someone else too.