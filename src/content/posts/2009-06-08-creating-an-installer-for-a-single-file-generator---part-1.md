+++
title = "Creating an installer for a Single File Generator - Part 1"
date = "2009-06-08T10:40:41.0000000Z"
tags = ["Visual Studio","LINQ to Umbraco"]
draft = false
+++

<p>LINQ to Umbraco is trucking along brilliantly and I recently solved a really big problem that I had, creating a Single File Generator (SFG).</p>
<p>For anyone who's not familiar with a SFG it is a tool for Visual Studio which allows a document to have .NET code generated for it when the file is saved (or the custom tool is explicitly run). There's a very good example as part of the Visual Studio 2008 SDK which covers how to create a SFG (<a href="http://code.msdn.microsoft.com/sfgdd" target="_blank">here is the documentation for it</a>).<br />The most familiar SFG people will know is the one used by LINQ to SQL or Entity Framework.</p>
<p>The above linked document (and the SDK example) are great for explaining how to create the SFG, but there is something which it doesn't cover, how do you provide a redistributable for it?<br />This was a major problem that I was having, I couldn't work out the best way to achieve it. Luckily I came across a project which showed me how it was to be done, in the form of <a href="http://linqToSharePoint.codeplex.com" target="_blank">LINQ to SharePoint</a>. There are a few registry keys that need to be inserts in the right places, and if it wasn't for LINQ to SharePoint I wouldn't have been able to find anywhere which explained it.</p>
<p>First off you need to have an Installer project, and I'm going to make the assumption that that has been done and that the DLL's you want deployed are linked in already.</p>
<p><strong>Registry Keys</strong></p>
<p>The keys need to be added with HKEY_LOCAL_MACHINE (HKML) and the first one is in a key called AssemblyFolderEx. The full path we'll be creating the key is <em>HKLM\Software\Microsoft\.NETFramework\v3.5\AssemblyFolderEx</em>. In this key you'll need to create a new key, which has the name of the SFG (eg: LINQtoUmbracoGenerator) and it has a default value of <strong>[TARGETDIR]</strong>, which is a variable from within the installer.<br />I'm not 100% sure of the point of this registry key, nor if it's actually required. Better safe than sorry in my opinion though :P</p>
<p>Now we need to create the registry keys within Visual Studio to activate the SFG, there's actually 2 - 3 (depending what languages you support) that need to be created.</p>
<p><strong>The CLSID Key</strong></p>
<p>The CLSID key is used to define assembly, class and some other data about your SFG. This key will reside in <em>HKLM\Software\Microsoft\VisualStudio\9.0\CLSID\</em>. In this registry key you need to create a new key <strong>which uses the GUID of your generator class as it's name</strong>. So for LINQ to Umbraco I ended up with a key like this:<br /><em>HKLM\Software\Microsoft\VisualStudio\9.0\CLSID\{52B316AA-1997-4c81-9969-95404C09EEB4}</em></p>
<p>Inside this key we need to create the following (all&nbsp;String values):</p>
<ul>
<li>Assembly 
<ul>
<li>Full name of the assembly (including version, public key, etc)</li>
</ul>
</li>
<li>Class 
<ul>
<li>Full name of the class of the SFG</li>
</ul>
</li>
<li>InprocServer32 
<ul>
<li>[SystemRoot]\system32\mscoree.dll (not quite sure what this is for)</li>
</ul>
</li>
<li>ThreadingModel 
<ul>
<li>Both (again, don't really know what it's for)</li>
</ul>
</li>
</ul>
<p>Now the CLSID is set up for the generator so Visual Studio will be aware of where the class to invoke resides.</p>
<p><strong>The Language Generators</strong></p>
<p>Although the CLSID is set up you need to set the generator names for the language(s) you are supporting. LINQ to Umbraco supports C# and VB.NET so I'll point out both in here.<br />All the installed SFG's are kept under a single key within&nbsp;the registry, which is <em>HKLM\Software\Microsoft\VisualStudio\9.0\Generators</em>. If you look at this within your registry there will be a number of different GUID's (changing depending on what Visual Studio languages you have installed).</p>
<p>For VB.NET you need to create under the <em>{164B10B9-B200-11D0-8C61-00A0C91E29D5}</em> key, and for C# place under <em>{FAE04EC1-301F-11D3-BF4B-00C04F79EFBC}</em>.</p>
<p>Under the language keys you need to create a new key with the name of your generator (eg: LINQtoUmbracoGenerator) with the following values:</p>
<ul>
<li>(Default) - String 
<ul>
<li>Friendly name of your generator (eg, VB LINQ to Umbraco Generator)</li>
</ul>
</li>
<li>CLSID - String 
<ul>
<li>GUID (including {}) of the CLSID defined earlier</li>
</ul>
</li>
<li>GeneratorDesignTimeSource - DWORD 
<ul>
<li>1 if you want to generate on save (I think!)</li>
</ul>
</li>
</ul>
<p>Replicate that under each of the language you want to support.</p>
<p><strong>Conclusion</strong></p>
<p>So that concludes part 1, the registry keys are the most frustrating part, but once they are working it's such a relief. If the above was confusion (which I'm not doubting it was) I'd suggest you grab a copy of the LINQ to Umbraco source from CodePlex and just look at what is setup in there.</p>
<p>&nbsp;</p>
<p><span>Update</span>: Just realised I had a registry key wrong. It should have been <strong>HKLM\Software\Microsoft\v3.5</strong> not <strong>HKLM\Software\Microsoft\3.5</strong></p>