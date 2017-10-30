+++
title = "Umbraco Interaction Layer - Preview 3"
date = "2008-11-06"
draft = false
tags = ["Umbraco.InteractionLayer", "umbraco"]
+++

<p>
In between the time spent packing and unpacking while moving house I've been working on my next release of the UIL, and I'm happy to say that it is ready and it is exciting. 
</p>
<p>
There is a breaking change between Preview 2 and Preview 3, but there are also a few new juicy features. 
</p>
<p>
<strong>Breaking changes</strong> 
</p>
<p>
The biggest breaking change with Preview 3 is that I have removed the interface <strong>IDocType</strong>.<strong><em> </em></strong>While working on the UIL I came to realise that having both an abstract base class and an interface was some-what redundant. When ever downcasting is needed it should always be done to the base class, so I have removed the interface to avoid confusion. 
</p>
<p>
Another major change is the dependencies of this release, no longer is the generated code supporting .NET 2+, it's now only supporting .NET 3.5+ (ok, I haven't tested it with .NET 4, but I'm just guessing there :P). 
</p>
<p>
<strong>Juicy new bits</strong> 
</p>
<p>
So I said there were some juicy new bits in this release and I'm quite excited about them, so let's have a look. 
</p>
<p>
<em>Better support for the Umbraco API</em> 
</p>
<p>
I have done some work to improve the features of the DocTypeBase class to have more of the Umbraco API operations, for that I have done the following changes: 
</p>
<ul>
	<li>CreatedDate property</li>
	<ul>
		<li>Now you can access the date that the Umbraco document was created</li>
	</ul>
	<li>Save overload method</li>
	<ul>
		<li>I have added an overload to Save which now mimics the Save &amp; Publish function from the Umbraco UI</li>
	</ul>
</ul>
<p>
&nbsp;So now it is even easier to programmatically create Umbraco pages and publish them on your site! 
</p>
<p>
<em>Support for Umbraco v4</em> 
</p>
<p>
Yep, that's right, I have finally got official support for the Umbraco v4 API! 
</p>
<p>
If anyone had been brave and tried Preview 2 in an Umbraco 4 site they would have seen the failure which ensued. Turns out that the Umbraco devs have finally upgraded all the GetAll methods to return List, not an array. A nice little change (keep in mind that Umbraco was originally .NET 1.1 so the array was probably a hold over from the pre-generics days), but it did mean that the UIL failed as the property signatures no longer matched what it was compiled against. 
</p>
<p>
But never fear, this release supports v4 (there are actually 2 download packages available, one for v3 and one for v4). 
</p>
<p>
This does not mean I am stopping v3 support, Umbraco v3 will be supported along with Umbraco v4. 
</p>
<p>
<em>VB support</em> 
</p>
<p>
Ok, I kind of already had this, the UIL has always been able to generate Visual Basic files, but if anyone had tried to use them well they would have seen that it didn't go so well. I'm <em>not</em> a Visual Basic developer, I haven't used VB for a number of years now so it was always there but I never tested it. Well it turned out that the VB files I was generating were no good at all. Preview 3 has been fully tested and now created compiling VB files! 
</p>
<p>
<em><strong>LINQ to Umbraco</strong></em> 
</p>
<p>
That's right sports fans, I now have a working implementation of LINQ to Umbraco. 
</p>
<p>
<strong>*cue applause*</strong> 
</p>
<p>
Check this shit out: 
</p>
<pre><span class="const">HomePage</span> home = new <span class="const">HomePage</span>(1000);
<span class="keyword">var</span> textPages = home.TextPages.Where(tp =&gt; tp.CreatedDate == <span class="const">DateTime</span>.Now.AddDays(-7)).OrderBy(tp =&gt; tp.CreatedDate).GroupBy(tp =&gt; tp.Keywords);
</pre>
<p>
(I used Lambda syntax cuz otherwise my formatting will be broken horribly). 
</p>
<p>
<strong>What LINQ to Umbraco is and what it isn't</strong> 
</p>
<p>
Ok, I need to make one thing clear, this LINQ to Umbraco implementation is not super clean. The current Umbraco API does not really support what I want to do, which means that I have had to have some hacks in place. 
</p>
<p>
The first thing you'll notice if you have a look at the code is that it's not really optimised. There is no <em>query language</em> in the Umbraco API for me to use, which means I have to rely on standard IEnumerable extension methods. 
</p>
<p>
So when you're accessing the child items you will be given all the items and then a filter will be applied.<br>
Unfortunately there isn't a way around this, not in the current API at least. 
</p>
<p>
That doesn't mean that this implementation isn't useful, it just means that if you're going into large child structures be aware that it may be slow and it may have a large memory footprint. 
</p>
<p>
Additionally I (currently) don't support the saving of child items/ adding child items to Umbraco. So if you do get an item from the collection make sure that you call Save on it.<br>
I am working on this and it should be ready soon for the next release. 
</p>
<p>
But at the very least we now have an API for Umbraco which is fully LINQ enabled and completed .NET runable. 
</p>
<p>
I really would love to solve the performance problem but I don't think that it can be done with the current API, not without a lot of ugly code.' 
</p>
<p>
&nbsp;
</p>
<p>
<strong>Downloads</strong> 
</p>
<p>
So if you want to check out Preview 3 make sure you grab the right one for your Umbraco: 
</p>
<ul>
	<li>
	<div>
	<a href="/get/media/1453/umbracointeractionlayer.preview3.v3.zip">UIL for Umbraco 3</a> 
	</div>
	</li>
	<li>
	<div>
	<a href="/get/media/1456/umbracointeractionlayer.preview3.v4.zip">UIL for Umbraco 4</a> 
	</div>
	</li>
</ul>