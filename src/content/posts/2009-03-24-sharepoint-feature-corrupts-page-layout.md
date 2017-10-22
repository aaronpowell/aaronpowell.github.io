+++
title = "SharePoint feature corrupts page layout"
date = "2009-03-24T19:39:28.0000000Z"
tags = ["SharePoint"]
draft = false
+++

<p>Something that I've come across a few times when working on SharePoint/ MOSS 2007 features. When importing a Page Layout the ASPX some times becomes corrupt. You end up with additional HTML inserts once it's been imported into SharePoint.</p>
<p>The corruption is in the form of HTML tags, outside the last &lt;/asp:Content&gt; tag.</p>
<p>Well it turns out that the problem is caused when you import an ASPX that has a &lt;/asp:content&gt; tag it'll happen.<br />Did you notice the problem?</p>
<p>That's right, if you have a <strong>lowercase</strong>&nbsp;<strong>c</strong>&nbsp;then it'll import corrupt. Let me show the problem again, highlighted this time:<br />&lt;/asp:<strong>c</strong>ontent&gt;</p>
<p>All you need to do is ensure that that has a capital letter, so the tag is &lt;/asp:<strong>C</strong>ontent&gt; and it's all good again.</p>
<p>The most common cause of this happening is doing a format-document within Visual Studio on the ASPX when it is in the features class-library project. Visual Studio doesn't handle the ASPX file correctly, and formats it as a raw XHTML file, which dictates that the XHTML tags need to be in all lowercase.</p>
<p>The things you discover...&nbsp;</p>