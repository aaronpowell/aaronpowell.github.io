---
  title: "DocumentDataProvider - Creating a custom LINQ to Umbraco Tree"
  metaTitle: "DocumentDataProvider - Creating a custom LINQ to Umbraco Tree"
  description: "Creating a custom LINQ to Umbraco provider - implementing a Tree"
  revised: "2010-10-01"
  date: "2010-10-01"
  tags: 
    - "umbraco"
    - "linq-to-umbraco"
  migrated: "true"
  urls: 
    - "/documentdataprovider-tree"
  summary: ""
---
*This article covers part of the `DocumentDataProvider` from the [LINQ to Umbraco Extensions][1] project.*

# Overview

When you create a custom LINQ to Umbraco data provider there are a number of classes which you need to implement, this article will look at how to implement the `Tree<T>` class.

But what is the point of the `Tree<T>` class for? The class is responsible for most of the heavy lifting for a particular type. The `Tree<T>` object is actually what is returned when you access a collection from the `UmbracoDataContext` that you generate from the code generator. It is also what you push new objects into (assuming that the implementation supports CRUD), in fact it's comparable to the [`Table<TEntity>`][2] class which is used by LINQ to SQL ([since LINQ to Umbraco is modeled after LINQ to SQL][3]).

# Implementing Tree&lt;T&gt;

To implement the class you need to inherit from the abstract class, `umbraco.Linq.Core.Tree<TDocType>`, like this:

	public class DocumentType<TDocType> : Tree<TDocType>
	{

	}

Next this you have to do is implement the abstract class, of which there are 6 abstract methods and 1 abstract property, so the basic implementation will look like this:

	public class DocumentType<TDocType> : Tree<TDocType>
	{
        public override UmbracoDataProvider Provider { get; protected set; }

        public override void DeleteAllOnSubmit(IEnumerable<TDocType> items)
		{
			throw new NotImplementedException();
		}

        public override void DeleteOnSubmit(TDocType itemm)
		{
			throw new NotImplementedException();
		}

        public override IEnumerator<TDocType> GetEnumerator()
		{
			throw new NotImplementedException();
		}

        public override void InsertAllOnSubmit(IEnumerable<TDocType> items)
		{
			throw new NotImplementedException();
		}

        public override void InsertOnSubmit(TDocType item)
		{
			throw new NotImplementedException();
		}

        public override void ReloadCache()
		{
			throw new NotImplementedException();
		}
	}

Here nothing is implemented, and it's up to you to work out exactly what you want to implement, the most important one to implement is `GetEnumerator()`. Since LINQ to Umbraco implements `IEnumerable` under the hood ([not IQueryable][4]) this is the primary method that will be needed, so we'll focus on that.

# Implementing the constructor

The first step that we need to do is implement a constructor. It's not really useful if we can't create the tree that we're going to be working with then it's not really useful then is it :P. 

Since I don't want to have people creating this type themselves, I only want it to be created as part of the overall data provider I'm going to create this as an `internal` constructor:

	private IEnumerable<Document> docs;
	private DocumentType docType;
	private UmbracoInfoAttribute umbracoInfoAttribute = ReflectionAssistance.GetUmbracoInfoAttribute(typeof(TDocType));
	internal DocumentTree(UmbracoDataProvider dataProvider)
	{
		Provider = dataProvider;
		cache = new Dictionary<int, TDocType>();
		docType = DocumentType.GetByAlias(umbracoInfoAttribute.Alias);
	}

Here I'm setting the provider that this instance knows about is actually passed in. Ultimately it is being passed in as a base type, but you can make tighter type if you want. Next I'm setting up a cache for the items that we're going to be finding in this provider (more on that shortly) and we're storing the Document Type from Umbraco that maps to the LINQ to Umbraco type that we know about.

You'll notice that I've got a field called `umbracoInfoAttribute`, this is a local reference to the attribute information which LINQ to Umbraco generates. We'll need this a bit so it's probably a good idea to keep it handy. The `ReflectionAssistance` class ships as part of LINQ to Umbraco for your convenience.

Onward ho!

# Implementing GetEnumerator

Now that we can create out `Tree<T>` instance lets look at how to implement the `GetEnumerator` method so we can start retrieving our data.

	public override IEnumerator<TDocType> GetEnumerator()
	{
		//we'll cache the documents from Umbraco
		if(docs == null)
			docs = Document.GetDocumentsOfDocumentType(docType.Id);

		throw new NotImplementedException();

	}

Cuz we're going to get all the Document objects from the Umbraco store we'll actually cache it so we don't completely hammer the database!

Next we'll loop through each of these documents and start creating a LINQ object which maps from it:

	public override IEnumerator<TDocType> GetEnumerator()
	{
		//to try and prevent the performance problems of hitting the DB we'll expect that this may be loaded already
		if(docs == null)
			docs = Document.GetDocumentsOfDocumentType(docType.Id);

		//go through each document
		foreach (var doc in docs)
		{
			int id = doc.Id;
			//check if we've got a cached version of the doc, if so we'll just use that, otherwise we need to do some setup
			if (!cache.ContainsKey(id))
			{
				
			}
			//use yield return so we can try and squeeze performance out. This way if say you're using a Take you can break early without fully loading the stuff from the DB
			yield return cache[id];
		}
	}

So here's the skeleton for what we're going to do, we'll iterate through all the documents and then look at our LINQ cache, and once it's in our cache we'll use `yield return` so that we can lazy run them (if you're not familiar with the `yield` keyword [check it out on MSDN][5]).

Now let's look at how to create our LINQ object.

	if (!cache.ContainsKey(id))
	{
		//create our LINQ doc and setup the 'standard' properties
		var linqDoc = new TDocType();
		SetupStandardProperties(doc, linqDoc);

		//find all the user-defined properties, LINQ to Umbraco decorates them with the PropertyAttribute
		var properties = linqDoc
			.GetType()
			.GetProperties(BindingFlags.Public | BindingFlags.Instance)
			.Where(p => p.GetCustomAttributes(typeof(PropertyAttribute), true).Count() > 0)
			;

		foreach (var p in properties)
		{
			//get the UmbracoInfo attribute (it'll have the alias)
			var attr = ReflectionAssistance.GetUmbracoInfoAttribute(p);
			//do some case-normalization of the attribute and then we'll grab the value from the document
			var data = doc.getProperty(Casing.SafeAlias(attr.Alias)).Value;
			p.SetValue(linqDoc, Convert.ChangeType(data, p.PropertyType), null);
		}

		//add the doc to our cache
		cache.Add(id, linqDoc); 
	}

So we're doing quite a bit of stuff here, first we're creating a new instance of the object we're needing, and then we'll set up the "standard" properties (properties such as ID, NodeName, etc, we'll look at that implementation shortly).

Next we want to find all the Umbraco properties, we'll use reflection to find all the **public instance** properties (using the [`BindingFlags`][6] enum) that have the attribute of `PropertyAttribute` which comes from LINQ to Umbraco's code generator. We do this check because we're generating partial classes you can add your own properties if you want, properties outside of Umbraco.

Then we'll iteration through them all, find the alias from Umbraco and then request the property data from the Umbraco API and lastly set it onto the LINQ object using refelction!

Lastly we put this LINQ object into cache so we don't have to create it next time.

Phew, that was a tricky bit!

As I mentioned we have a class for setting up the standard Umbraco properties:

	private static void SetupStandardProperties(Document doc, TDocType linqDoc)
	{
		//set some of the private properties on the object
		var type = linqDoc.GetType();
		{
			var prop = type.GetProperty("Id");
			prop.SetValue(linqDoc, doc.Id, null);
		}
		{
			var prop = type.GetProperty("CreatorID");
			prop.SetValue(linqDoc, doc.Creator.Id, null);
		}
		{
			var prop = type.GetProperty("CreatorName");
			prop.SetValue(linqDoc, doc.Creator.Name, null);
		}
		{
			var prop = type.GetProperty("Version");
			prop.SetValue(linqDoc, doc.Version.ToString(), null);
		}

		linqDoc.NodeName = doc.Text;
		linqDoc.CreateDate = doc.CreateDateTime;
		linqDoc.UpdateDate = doc.UpdateDate;
		linqDoc.SortOrder = doc.sortOrder;
		linqDoc.TemplateId = doc.Template;
	}

You'll notice four funky things at the top of this method, this is because some of the LINQ to Umbraco properties have **private** setters, but we can do it with reflection (ahh reflection, is there anything it can't do :P). There is a good reason that these properties don't have a public setter, it's means that some of the stuff can't be "screwed with" unless you want it to be. Yes this is a design decision that you'll have to live with :P.

# Conclusion

So we're done with our basic implementation of the `DocumentTree<T>` class. There's plenty more things to do if you want to support CRUD operations, and that'll be covered in a dedicated article.


  [1]: /linq-to-umbraco-extensions
  [2]: http://msdn.microsoft.com/en-us/library/bb358844.aspx
  [3]: /understanding-linq-to-umbraco
  [4]: /iqueryable-linq-to-umbraco
  [5]: http://msdn.microsoft.com/en-us/library/9k7k7cf0.aspx
  [6]: http://msdn.microsoft.com/en-us/library/system.reflection.bindingflags.aspx

