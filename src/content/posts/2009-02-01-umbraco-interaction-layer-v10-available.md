+++
title = "Umbraco Interaction Layer v1.0 available"
date = "2009-02-01"
draft = false
tags = ["umbraco", "Umbraco.InteractionLayer"]
+++

<p>Well it's been <a href="/posts/2008-08-13-preview-umbraco-interaction-layer" target="_blank" title="Preview - Umbraco interaction layer">6 months</a> since I first announced the <a href="/tags/Umbraco.InteractionLayer" target="_blank">Umbraco Interaction Layer</a> project, but I'm happy to announce that v1.0 is available on the <a href="http://www.codeplex.com/uil" target="_blank">CodePlex site</a> for <a href="http://www.codeplex.com/UIL/Release/ProjectReleases.aspx?ReleaseId=22592" target="_blank">download</a>!</p>
<p>*Pauses for dramatic effect*</p>
<p>The v1 release supports Umbraco 4.0.0 and Umbraco 3.0.x.</p>
<p>The following are the major changes between the UIL RC and v1.0 release:</p>
<ul>
<li>Fixed the <a href="http://msdn.microsoft.com/en-us/library/system.runtime.serialization.datacontractattribute.aspx" target="_blank">DataContractAttribute</a> so it is now included on all generated classes (I didn't realise it wasn't inherited!)</li>
<li>Pluralised names of the generated LINQ interfaces are now more likely to be correct English</li>
<li>DocTypeBase has a Published property on it so it's easier to check the state of a document</li>
</ul>
<p>Speaking of having v4 support one thing I wasn't initally aware of with v4 was the nested DocType feature. I'm happy to announce that this <strong>is</strong> supported in the UIL release (for v4). It's not quite as nice as I'd like (it doesn't use class inheritance), the properties from a parent DocType are just included on the child.</p>
<p>There are some known limitations which are:</p>
<ul>
<li>Generated properties are using the underlying database type, which does mean that DataTypes such as Content Picker and Media Picker will generate <strong>an int property</strong> not a URL, string or custom-class property</li>
<li>The underlying Umbraco interface is provided by umbraco.cms.businesslogic.web.Document. This means that the access is directly with the Umbraco database <strong>not the umbraco.config xml files</strong>. I strongly recomment that when you are getting an existing object that you load via the Version GUID of the umbraco.presentation.nodeFactory.Node object. This will ensure you are loading the current published verion. When loading from the integer ID you will load the last saved version&nbsp;</li>
<li>When generating a class which a child relationship you need to include the child DocType to ensure that the LINQ interface is generated. The generation engine is unable to generate a child relationship of it isn't also generating the class for the child at the same time. This problem is also compounded by the fact there isn't any way to view the child relationships from the dashboard UI for generating classes</li>
</ul>
<p>&nbsp;</p>
<p>I really would love to hear from anyone who does have a play with the UIL, good and bad feedback.<br>I'm going to be looking at the v-next version soon so I will be looking for feedback of areas to improve or implement.</p>
<p>And one last thing, get LINQ-ing with Umbraco!</p>