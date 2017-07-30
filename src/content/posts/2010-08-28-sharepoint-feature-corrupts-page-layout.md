---
  title: "SharePoint feature corrupts page layout"
  metaTitle: "SharePoint feature corrupts page layout"
  description: "Are your SharePoint features corrupting your page layout?"
  revised: "2010-08-28"
  date: "2010-08-28"
  tags: 
    - "sharepoint"
  migrated: "true"
  urls: 
    - "/sharepoint-feature-corrupts-page-layout"
  summary: ""
---
Something that I've come across a few times when working on SharePoint/ MOSS 2007 features. When importing a Page Layout the ASPX some times becomes corrupt. You end up with additional HTML inserts once it's been imported into SharePoint.

The corruption is in the form of HTML tags, outside the last &lt;/asp:Content&gt; tag.

Well it turns out that the problem is caused when you import an ASPX that has a &lt;/asp:content&gt; tag it'll happen.
Did you notice the problem?

That's right, if you have a lowercase c then it'll import corrupt. Let me show the problem again, highlighted this time:
&lt;/asp:**c**ontent&gt;

All you need to do is ensure that that has a capital letter, so the tag is &lt;/asp:Content&gt; and it's all good again.

The most common cause of this happening is doing a format-document within Visual Studio on the ASPX when it is in the features class-library project. Visual Studio doesn't handle the ASPX file correctly, and formats it as a raw XHTML file, which dictates that the XHTML tags need to be in all lowercase.