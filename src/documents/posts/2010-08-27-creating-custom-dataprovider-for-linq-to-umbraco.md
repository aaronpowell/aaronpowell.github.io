---
  title: "Creating custom DataProviders for LINQ to Umbraco"
  metaTitle: "Creating custom DataProviders for LINQ to Umbraco"
  description: "Creating custom DataProviders for LINQ to Umbraco"
  revised: "2010-08-27"
  date: "2010-08-27"
  tags: 
    - "umbraco"
    - "linq-to-umbraco"
    - "umbracodataprovider"
  migrated: "true"
  urls: 
    - "/creating-custom-dataprovider-for-linq-to-umbraco"
  summary: "This was ported from my old website and it is horribly out of date at the moment. The idea is to give you a bit of a starting point for writing a custom LINQ to Umbraco DataProvider"
---
Sorry to all the people who were kind enough to come to my [LINQ to Umbraco session at CodeGarden 09][1], I said I would do this post soon after the session. Sadly I started enjoying Copenhagen too much without the need to be sitting at my laptop and now it's a week later, I'm home and it's time I come good on my promise.

##The LINQ to Umbraco DataProvider model

Something that I have implemented with LINQ to Umbraco, and something which will be taking a stronger focus in Umbraco going forward, is a Provider model for the Umbraco data.
What this means with LINQ to Umbraco? Well the classes generated for LINQ to Umbraco act as proxies to a data model, they don't expect the data to come from anyway in particular.

This has a really neat advantage of the fact that you can write your own DataProvider which exposes the data from how ever you want. LINQ to Umbraco will ship as part of 4.1 with a single DataProvider, the NodeDataProvider. This enables the use of LINQ to Umbraco against the XML cache, which was the inital design of it.

##Anatomy from a DataProvider

The DataProvider itself is an abstract class which has a number of methods which are implemented do different operations, the primary method you need to be implementing is the LoadTree<TDocType> method, this is responsible for the initial population of the collection from your data source.

There are other methods which have different uses, I wont be covering them in this post, but they will be going up on the new Umbraco wiki (which the LINQ to Umbraco section is starting to come up).

The `LoadTree<TDocType>` method needs to then return an instance of a `Tree<TDocType>`, which is another abstract class that needs to be implemented to handle the data mapping for your data provider.

##Creating an RssDataProvider

While we were hacking at the Umbraco Retreat prior to CodeGarden 09 I decided to try a proof-of-concept about how you could use the generated classes in a proxy manner. I may have written LINQ to Umbraco for this purpose, but it wasn't something that I had actually tried to do.
So I decided to create a basic little DataProvider which would read an RSS feed and turn the returned data from there into LINQ to Umbraco objects which could then be used in the Umbraco content tree.

The first step is you need to generate the LINQ to Umbraco classes, with Umbraco 4.1 you will be able to do this directly from the Settings -> Document Types node. I created a basic little Document Type named RSS Item and then generated the class for it.

Next came the task of implementing my custom UmbracoDataProvider, I created my class:

	public class RssDataProvider : UmbracoDataProvider { }

And then set about implementing a constructor which takes the RSS feed URL (in this demo I used the Yahoo! Pipes which are on the homepage of our.umbraco) and then implemented the LoadTree<TDocType> method:

public override Tree LoadTree() 
{
    //supporting loading a full Tree
    //throw an exception if the type of the tree is an unsupported one
    if (typeof(TDocType) != typeof(RssItem))
    {
        throw new NotSupportedException(typeof(TDocType).Name);
    }

    //create a request to the URL supplied
    WebRequest request = WebRequest.Create(this._feedUrl);

    //do a GET and string buffer the response
    HttpWebResponse response = (HttpWebResponse)request.GetResponse();
    Stream dataStream = response.GetResponseStream();
    StreamReader reader = new StreamReader(dataStream);
    string responseFromServer = reader.ReadToEnd();

    //make a LINQ to XML representation of the RSS
    XDocument xdoc = XDocument.Parse(responseFromServer);

    //select the posts
    var items = xdoc.Descendants("item");

    //make an RssTree from the items returned by the feed
    return new RssTree(items, this);
}
So now I have a load method which reads my RSS feed (and I've restricted it to only support my RssItem Document Type), now it's time to create the RssTree<TDocType> from the provided data.

##Tree&lt;TDocType&gt;

This class is really just a wrapper for the IEnumerable<T> class. The way in which I have implemented the RssTree (and how I implemented the NodeTree) is by using delayed loading. What I mean is that the data isn't converted from the source to the result until the GetEnumerator() method is called.
This means that unless I do something with the collection there is no performance hit.

The following code is a bit of a hack (for the return type anyway) but that is because I wanted to show it being done without the use of reflection. If you want to see how to achieve it with a complete generic type check out the source for the NodeTree which is on Codeplex.

Anyway here's how the GetEnumerator() method looks:

	public override IEnumerator GetEnumerator()
	{
		//this is a bit hacky as i only support 1 doc type
		//normally the load can be done via reflection (which is how the NodeTree works)
		foreach (var item in _items)
		{
			var rssItem = new TDocType() as RssItem;
			rssItem.Name = (string)item.Element("title");
			rssItem.Link = (string)item.Element("link");
			rssItem.Description = (string)item.Element("description");
			rssItem.PublishDate = (DateTime)item.Element("pubDate");
			rssItem.Content = (string)item.Element("content");
			rssItem.CreateDate = (DateTime)item.Element("pubDate");

			//Because RssItem may not be the type of TDocType (although in this example we'll assume it always is)
			//we have to downcast to DocTypeBase before casting to the generic.
			yield return (TDocType)(DocTypeBase)rssItem;
		}
	}

So what's going on, well first off we're itterating through the collection of XML items returned from the initial load (_items) and then creating a new instance of the RssItem class and assigning the properties from the XML.
You can see the comment mentioning the hack, having to do some crazy casting, that is because I'm not really doing the Generics properly.

I've also implemented it via yield return, not building the entire collection into say a List<T> and then returning its Enumerator. The reason for this is you'll pick up a bit of performance if you are doing methods like Take(int) or breaking from a loop early.
You should probably push the items into an internal collection to support caching (which is what the Node implementation does), but this is just a quick demo.

Any that is as simple as it gets to write your own custom DataProvider for LINQ to Umbraco! Sure I've skipped a few sections (such as how to do child associations, but in this demo it's not really viable) but hopefully this should give you a heads up on how to do it.
And how does it work? Well just like this:

	using (var ctx = new RssDataContext(new RssDataProvider("http://pipes.yahoo.com/pipes/pipe.run?_id=8llM7pvk3RGFfPy4pgt1Yg&_render=rss")))
	{
		var feedItems = ctx.RssItems.Take(8);

		Assert.IsNotNull(feedItems);
		Assert.IsTrue(feedItems.GetEnumerator() != null);
	}

That's right, the above code is from a unit test, remember LINQ to Umbraco is capable of running outside of a web context so it is very easy to unit test!

##Making this into an Umbraco Content Tree

Now here is where the fun part comes in, you can easily turn the above data provider into a custom Umbraco tree. This means you can either make it into your own custom Umbraco module (/ application, what ever you call it!), or append it to the standard Content Tree! Isn't THAT a funky idea hey!

I'm not going to get too in-depth into this, Shannon Deminik has done some good documentation about that (again, see the [wiki][2]). So rather than going over the code I'm going to show it off in a short screencast and you can look into the provided source package with this post.

The screenscast is available [here][3] and the source code is [here][4].


  [1]: http://our.umbraco.org/wiki/codegarden-2009/open-space-minutes/linq
  [2]: http://our.umbraco.org/wiki/reference/api-cheatsheet/tree-api---to-create-custom-treesapplications
  [3]: http://screencast.com/t/NS24jMo6xkp
  [4]: /get/media/2640/umbracodataproviderdemo.zip