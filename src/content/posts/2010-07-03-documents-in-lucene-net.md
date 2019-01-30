---
  title: "Documents in Lucene.Net"
  metaTitle: "Documents in Lucene.Net"
  description: ""
  revised: "2011-02-21"
  date: "2010-07-03"
  tags: 
    - "lucene.net"
    - "c#"
  migrated: "true"
  urls: 
    - "/documents-in-lucene-net"
  summary: ""
---
As you're most likely already aware Lucene.Net is a Document Database, which means that it's essentially a key/ value store, with the crux of the interaction through *Documents*

##But what is a Document?

What needs to be understood about the Document concept in Lucene.Net is that is doesn't have anything to do with a file, it's not a PDF, a DOCX, or a XLSX. It's just a key/ value store. As I pointed out in my [overview of Lucene.Net][1] this framework is agnostic of anything like that.

But unlike other Document Databases, such as [RavenDB][2], Lucene.Net doesn't allow you to put just an object into itself, you need to do it via a Document. Once a Document is inserted into the Lucene index it is then given a unique identifier (a numerical ID) and the data on the Document is stored.

##Data on a Document

When pushing the data into a Lucene index it is done via Fields. A Field is *a key/ value pair* if you want to get a very high view of it, but it's really a bit more powerful that that. It's true that it's primary responsibility is to push data into Lucene with a string key and a string value, and providing information to Lucene about how to store that data in the index.

When you're adding a Field to Lucene.Net you need to work out which of the available constructors to use, as there are 9 (yes, 9!) different choices. Personally I like this particular constructor:

	public Field(string name, string value, Store store, Index index)

I find that it gives the most flexibility and is the most obvious as to what it's doing (it's not the one which we use internal of [Examine][3] we actually use a different one as we want to work with TermVectors).

On top of the name (key) and value parameters there are also three others, Store, Index and TermVector. Each of these are used to define how the data is handled within the Lucene index.

Also, this is where we start getting in to the part of Lucene.Net that I **really** don't like, static fields (I miss enums...).

###Store

When first coming across Lucene the point of `Field.Store` is a bit confusion, it has two options, YES and NO (ok, it does have a third, COMPRESS, but it's been deprecated in the Java version of Lucene and replaced by a separate API which is available in Lucene.Net - `Lucene.Net.Documents.CompressionTools`).

Initially looking at these two options is confusion, why would you be putting the data Field if you don't want it stored? Seems a bit strange... But it comes down to what you're using Lucene.Net for, and having an understanding of that will give you an understanding of what you need to set as your Field.Store value.

If you're using Lucene.Net as a full storage model, a completely replacement of another storage model (such as a relational database) then you want to set it to Store.YES. This tells Lucene to store the value of the field, not just the tokenized version of it.

If you are using Lucene.Net as just a search engine, and maintaining the actual data in a separate data store then you can get away with setting Store.NO. This means that when you are 'hydrating' your entity from search you'll be going elsewhere to get the actual data that is required. Essentially doing a two-phase hydration, first finding your entities using Lucene, and then their data from your data store.

###Index

The Index parameter allows you to specify how the data is treated when it's added to your Lucene index, and this will also effect the searching against it. Also selecting the right Index type will impact on the size of your index.

There are 5 types of indexing, let's start with the basic on, NO. This one is fairly obvious, and it does what you're expecting. If you set your field with an Index.NO value it's not going to be accessible via the Lucene searcher. If you're working directly with the Document object then you can get the data (provided it's Store.YES :P) it's accessible via the name of the Field.

There other options are about the analysis of the Field data in the index. I've looked at [Analyzers in the past][4] so hopefully it's a concept your familiar with. Again, choosing the right option here will impact on the size of the index.

Here's a few good rules on whether to use analysis or not with your Field:

 * Analyze if:
  * The value contains multiple keywords
  * The data is to be searched using multiple different ways (such as fuzzy, boosting, etc)
  * The data does not need to be sorted against
 * Don't analyze if:
  * The value will only be a single word (and not a fuzzy word)
  * The value contains multiple words but requires sorting

NORMS/ NO_NORMS really comes down to what you need to do with the value when you're searching. If you use NO_NORMS then the value isn't normalized and features such as boost and string-length wont be enabled.

[In this article I've had a look at how the `Field.Store` and `Field.Index` can be used to make a simple application using Lucene.Net][5].

###TermVector

I thought I'd cover this even through I tend to let the default (`TermVector.NO`) get used. TermVector is used to indicate if you want to have metadata about the *terms* which you're putting into your index. A term is the value (or values if it's an analyzed Field).

This can be handy if you want to know whether what's being put into the index contains the same term multiple times, and potentially getting false-positives in your search. It allows you to see how many times a term exists in a Document (`TermVector.YES`), or you can go one step further and have to stored the position in the Field value which the term appears (`TermVector.WITH_POSITIONS`) or an offset for where the term appears in the value (`TermVector.WITH_OFFSET`) and lastly you can go all out with `TermVector.WITH_POSITIONS_OFFSETS`.

Use this sparingly, as it can blow out the size of your index if you store everything about everything!

##Conclusion

So to finish off this time we've looked at the Document side of a Document Database. Understanding Documents and Fields will allow you to start getting the full power out of the Lucene.Net API.


  [1]: {{< ref "/posts/2010-04-14-lucene-net-overview.md" >}}
  [2]: http://ravendb.net/
  [3]: http://examine.codeplex.com
  [4]: {{< ref "/posts/2010-05-27-lucene-analyzer.md" >}}
  [5]: {{< ref "/posts/2010-07-10-building-an-application-with-lucene-net.md" >}}