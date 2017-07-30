---
  title: "How to get the field name for a model property"
  metaTitle: "How to get the field name for a model property"
  description: "Ever needed to find the name that'll be generated for a property in MVC? Here's how"
  revised: "2011-01-20"
  date: "2011-01-19"
  tags: 
    - "asp.net"
    - "mvc"
    - "web"
  migrated: "true"
  urls: 
    - "/mvc/find-name-from-field"
  summary: ""
---
I'm working on a custom EditorTemplate for a [FunnelWeb][1] around the new tagging system that I'm working on.

It's quite a complex editor that I'm doing, and it's being bound against a collection, an `IEnumerable<T>` in fact. But I have a problem, I need to be able to find out the `Name` that would be generated for the model property.

If you do something like:

    @Html.EditorFor(x => x.StringProperty)

You will get an input like this:

    <input type="text" name="StringProperty" />

But I need the `Name`, how do you do it? 

The other week when I was browsing through the [Orchard][2] source I came across this gem, and I **knew** one day I was going to need to do it, but you can get it from the `ViewData` of the `HtmlHelper` instance, just like this:

    @Html.ViewData.TemplateInfo.GetFullHtmlFieldName(string partialFieldName)

[Here's the MSDN doco][3] if you're interested in reading it. But that's not *really* useful, you need to pass a string in, that's not really useful, I've got a `Model` property to work with, well you can nicely convert a Lambda expression, using the `ExpressionHelper` class ([link][4]).

Here's an extension method which will do what I need:

        public static string FieldNameFor<T, TResult>(this HtmlHelper<T> html, Expression<Func<T, TResult>> expression) {
            return html.ViewData.TemplateInfo.GetFullHtmlFieldName(ExpressionHelper.GetExpressionText(expression));
        }

I got the source from the Orchard project, you can [find it here][5].

Now you can easily get the `Name` for any property.


  [1]: http://www.funnelweblog.com
  [2]: http://orchardproject.net
  [3]: http://msdn.microsoft.com/en-us/library/system.web.mvc.templateinfo.getfullhtmlfieldname.aspx
  [4]: http://msdn.microsoft.com/en-us/library/ee428394.aspx
  [5]: http://orchard.codeplex.com/SourceControl/changeset/view/2787c7365fa3#src%2fOrchard%2fMvc%2fHtml%2fHtmlHelperExtensions.cs