+++
title = "Don't you worry about Planet Express, let me worry about blank"
date = "2008-12-11"
draft = false
tags = ["umbraco", "Umbraco.InteractionLayer", "linq", "asp.net"]
+++

<p>
Well avid reader I'm sure you are able to work out what the title is in <a href="http://en.wikipedia.org/wiki/Futurama" target="_blank">reference to</a>  (bonus points if you <a href="http://en.wikipedia.org/wiki/Future_Stock" target="_blank">got the episode right</a>). Well there is a bit of a reason for it, but it's really just a show of how massively nerdy a life I lead.
</p>
<p>
Since I've started developing the UIL I've been asked a few times what is the point of it. Most obvious one was from Warren Buckley when I released <a href="/posts/2008-11-19-umbraco-interaction-layer-beta-1">Beta 1.</a>
</p>
<p>
So just what is the UIL and why should you use it?
</p>
<p>
<span>First, some background</span>
</p>
<p>
To really understand the point behind the UIL you really need to look at why I started it to begin with. Other than the shear thrill of the challange I did actually have a valid reason (well, one which is valid enough in my own mind).<br>
Anyone who has done a lot of coding against the Umbraco API will be familiar with it's limitations, and those who haven't, well think about this.<br>
Your standard DocType has around half a dozen properties on it and these properties can have all kinds of use, depending on the purpose of the DocType.
</p>
<p>
A lot of sites I've worked on have had a "data" tree of some sort. A content tree in Umbraco which contains items which are never navigateable to, items such as:
</p>
<ul>
	<li>News</li>
	<li>Form field data</li>
	<li>Galleries</li>
	<li>etc</li>
</ul>
<p>
Programming aginst these using the standard Umbraco API isn't a problem when you're looking for a basic key/ value pairing between the ID and Text properties of the DocType, but what if you've got additional properties you want to access via code?
</p>
<p>
Sure you have a <span>doc.getProperty(string)</span> method, but what does it return? It returns a property, which you can get the value from <span>in the type of System.Object</span>. So then you have to cast it into the <span>actual</span> type, but low-and-behold you may have <span>DBNull.Value</span> in there because no data has been entered in the system!
</p>
<p>
So you write a check around it, you maybe write a generic checking method so you can reuse it in multiple places, and so on.
</p>
<p>
I did this, many times (you'll actually seen an early implementation in my post <a href="/posts/2008-08-07-extending-umbraco-members" target="_blank">Extending Umbraco Members</a>) and I figured there had to be a better way.
</p>
<p>
&nbsp;
</p>
<p>
Additionally I always had the goal of writing LINQ to Umbraco. Anyone who's read most of my posts (or has the pleasure *sic* of working with me) will know I'm <span>very</span> passionate about LINQ and what it can provide. Last year I had a chance to meet Niels and this was around the VS 2008 release, LINQ was a real buzz word and I chatted to him with the concept of a LINQ to Umbraco, something he seemed very fond of. And although it's very <span>basic</span> in its current incarnation (due to API restrictions) I'm quite happy that there <span>is</span> now a LINQ to Umbraco implementation available, and that I'm part of it.
</p>
<p>
<span>How can the UIL help your (Umbraco) life?</span>
</p>
<p>
So now that I've given some background about why I wanted to produce the UIL, how can it help you? It's all well and good for me to write something which will suite my needs perfectly but can it actually be usable for anyone else?
</p>
<p>
The goal of the UIL is to <span>act as a bridge between developers and the Umbraco API</span>. The UIL is very much a developer tool, if you're not planing on writing and .NET code then sorry, it's not really of use to you (other than a purely achedemic excercise). But if you are writing .NET code and you want to interact with Umbraco nodes then this is the tool for you!
</p>
<p>
All UIL-generated objects have both a parameterised and parameterless constructors for the ability to do the following:
</p>
<ul>
	<li>Constructing new CMS documents</li>
	<li>Opening existing CMS documents from the ID</li>
	<li>Opening existing CMS documents from the Unique ID (GUID)</li>
	<li>Opening existing CMS documents from an existing CMS node (only supported as part of the partial-class implementation, it's a <span>protected</span> constructor)</li>
</ul>
<p>
All data is imported from Umbraco when the constructor is used so there is full access to the data as it would be in Umbraco itself (or viewed on the page).
</p>
<p>
UIL-generated objects also provide the standard features you would be expecting on a document such as:
</p>
<ul>
	<li>Save</li>
	<li>Publish</li>
	<li>Unpublish</li>
</ul>
<p>
So really UIL objects (in theory) will provide all the interaction that is required from a developer.
</p>
<p>
Other things, which I have mentioned in previous posts that the UIL provides are:
</p>
<ul>
	<li>Validation of properties against Regex</li>
	<li>Mandatory checking</li>
	<li>Event raising for PropertyChanging and PropertyChanged</li>
</ul>
<p>
And of course there is the LINQ API, which provides strongly typed relationships to child items within the content tree.<br>
This is really useful if you have a "data" structure which I mentioned earlier. The Umbraco API does provide the child relationships, but you just get back <em>all</em> children, so to find the ones of the type you want you must know the docType ID. The UIL will handle the type-detection on-your-behalf.
</p>
<p>
As I have mentioned many a time the LINQ API is not perfect and one of its biggest limitations is that there is no way to view all children straight from the a single property. This is <strong>not</strong> planned for the v1 release.
</p>
<p>
<strong>So just when should I use the UIL?</strong>
</p>
<p>
Since the UIL is a developer tool there are several good locations which are common to most Umbraco developers (excluding custom development):
</p>
<ul>
	<li>Action Handlers</li>
	<li>Document events (in v4)</li>
	<li>Web Services</li>
	<li>Silverlight</li>
</ul>
<p>
Both Per and Ruben have done <a href="https://web.archive.org/web/20081216110256/http://umbraco.org/24261" target="_blank">good</a> <a href="https://web.archive.org/web/20081216110256/http://ruben.3click.be/blog/pinging-a-webservice-using-an-event-handler" target="_blank">posts</a>  <a href="https://web.archive.org/web/20081216110256/http://ruben.3click.be/blog/pinging-a-webservice-using-an-action-handler" target="_blank">recently</a> about how to use Action handlers and Event handlers (in v4) (although their posts don't really look at manipulating the document itself), and these are perfect locations if you want to modify a document during its life cycle.
</p>
<p>
Web Services, particularly JSON services are another great example. The UIL classes all have a DataContract generated against them which you can be used along with the DataContractJsonSerializer to generate JSON representations of your docTypes. Great for AJAX implementations!
</p>
<p>
And lastly Silverlight. Because all classes generate inherit both INotifyPropertyChanging and INotifyPropertyChanged it is possible to tie the UIL objects directly to a Silverlight app and have dynamic updates occuring very nicely.<br>
I'll admit this is <strong>highly experimental</strong> and i haven't actually tried it (I have done very little Silverlight dev) but I do know that in theory it can work.
</p>
<p>
&nbsp;
</p>
<p>
Well there you have it, I hope this sheds a bit of light on the UIL and whether it is a useful tool for your needs. Stay tuned for RC 2 which will be out very soon (I found a couple of very big bugs which I'm addressing at the moment) and if you have any feedback, comments, abuse, bugs or feature requests please feel free to drop me a line on <em>me</em><strong> at</strong><em> aaron-powell </em><strong>dot</strong> <em>com</em>, leave a comment on my blog or raise an issue on the <a href="http://www.codeplex.com/uil" target="_blank">UIL CodePlex site</a>. 
</p>