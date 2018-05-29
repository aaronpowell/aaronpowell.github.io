---
  title: "Text casing and Examine"
  metaTitle: "Text casing and Examine"
  description: ""
  revised: "2012-09-05"
  date: "2012-09-05"
  tags: 
    - "lucene.net"
    - "examine"
    - "umbraco"
  migrated: "true"
  urls: 
    - "/text-casing-and-examine"
  summary: ""
---
A few times I've seen questions posted on the Umbraco forums which ask how to deal with case insensitivity text with Examine, and it’s also something that we've had to handle a few times within our own company.

Here's a scenario:

* You have a site search
* You use examine
* You want to show the results looking exactly the same as it was before it went into Examine

If you're running a standard install you’ll notice that the content always ends up lowercased!

This is a bit of a problem, page titles will be lowercase, body content will be lowercase, etc. Part of this will be due to a mistake in Examine, part of it is due to the design of Lucene.

In this article I’ll have a look at what you need to do to make it work as you'd expect.

## First, some background

Before we dive directly into what to do to fix it you really should understand what is happening. If you don't care feel free to skip over this bit though :P.

Searching is a tricky thing, and when searching the statement `Examine == examine == false`; To get around this searching is best done in a case insensitive manner. To make this work Examine did a forced lowercase of the content before it was pushed into Lucene.Net. This was to ensure that everything was exactly the same when it was searched against. 
In hindsight this is not really a great idea, it really should be the responsibility of the Lucene Analyzer to handle this for you.

Many of the common Lucene.Net analyzers actually do automatic lowercasing of content, these analysers are:

* StandardAnalyzer
* StopAnalyzer
* SimpleAnalyzer

So if you're using the standard Examine config you'll find yourself using the StandardAnalyzer and still have your content lowercased.

This means that there's no need to Lucene to concern itself about case sensitivity when searching, everything is parsed by the analyzer (field terms and queries) and you'll get more matches.

## So how do I get around this?

Now that we've seen why all your content is generally lower case, how can we work with it in the original format and display it back to the UI?

Well we need some way in which we can have the field data stored without the analyzer screwing around with it.

*Note: This doesn't need to be done if you're using an analyzer which doesn't have a `LowerCaseTokenizer` or `LowercaseFilter`. If you’re using a different analyzer, like `KeywordAnalyzer` then this post wont cover what you're after (since the `KeywordAnalyzer` isn't lowercasing, you're actually using an out-dated version of Examine, I recommend you grab the latest release :)). More information on Analyzers can be found at [https://www.aaron-powell.com/lucene-analyzer][1]*

Luckily we've got some hooks into Examine to allow us to do what we need here, it's in the form of an event on the `Examine.LuceneEngine.Providers.LuceneIndexer`, called `DocumentWriting`. Note that this event is on the `LuceneIndexer`, not the `BaseIndexProvider`. This event is Lucene.Net specific and not logical on the base class which is agnostic of any other framework.

What we can do with this event is interact directly with Lucene.Net while Examine is working with it. 
You'll need to have a bit of an understanding of how to work with a Lucene.Net Document (and for that I’d recommend having a read of this article from me: [https://www.aaron-powell.com/documents-in-lucene-net][2]), cuz what you’re able to do is play with Lucene.Net... Feel the power!

So we can attach the event handler the same way as you would do any other event in Umbraco, using an Action Handler:

    public class UmbracoEvents : ApplicationBase
    {
            public UmbracoEvents()
            {
                var indexer = (LuceneIndexer)ExamineManager.Instance.IndexProviderCollection["DefaultIndexer"];
    
                indexer.DocumentWriting +=new System.EventHandler(indexer_DocumentWriting);
            }
    }

To do this we've got to cast the indexer so we've got the Lucene version to work with, then we’re attaching to our event handler. Let’s have a look at the event handler

    void indexer_DocumentWriting(object sender, DocumentWritingEventArgs e)
    {
            //grab out lucene document from the event arguments
            var doc = e.Document;
    
            //the e.Fields dictionary is all the fields which are about to be inserted into Lucene.Net
            //we'll grab out the "bodyContent" one, if there is one to be indexed
            if(e.Fields.ContainsKey("bodyContent")) 
            {
                    string content = e.Fields["bodyContent"];
                    //Give the field a name which you'll be able to easily remember
                    //also, we're telling Lucene to just put this data in, nothing more
                    doc.Add(new Field("__bodyContent", content, Field.Store.YES, Field.Index.NOT_ANALYZED));
            }
    }

And that’s how you can push data in. I'd recommend that you do a conditional check to ensure that the property you’re looking for does exist in the Fields property of the event args, unless you're 100% sure that it appears on all the objects which you’re indexing.

Lastly we need to display that on the UI, well it's easy, rather accessing the `bodyContent` property of the `SearchResults`, use the `__bodyContent` and you’ll get your unanalyzed version.

## Conclusion

Here we've looked at how we can use the Examine events to interact with the Lucene.Net Document. We’ve decided that we want to push in unanalyzed text, but you could use this idea to really tweak your Lucene.Net document. But really playing with the Document is not recommended unless you *really* know what you’re doing ;).


  [1]: https://www.aaron-powell.com/lucene-analyzer
  [2]: https://www.aaron-powell.com/documents-in-lucene-net