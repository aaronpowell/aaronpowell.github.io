---
  title: "Overview"
  metaTitle: "LINQ to Umbraco - Overview"
  description: "An overview of LINQ to Umbraco"
  revised: "2010-04-07"
  date: "2010-04-07"
  tags: 
    - "umbaco"
    - "linq-to-umbraco"
  migrated: "true"
  urls: 
    - "/linq-to-umbraco-overview"
  summary: ""
---
# What? #

Anyone who has had to do a lot of work with the Umbraco API and interacting with nodes will know that using the .NET API isn't *great*. It's not bad, but in a strongly typed world a loosely typed objects are no where near as much fun.

Especially if you want to move around those items!

Umbraco is more than just a content management system, Umbraco a great application framework. If you start looking conceptually at Document Types in Umbraco you're realise that they are really just a way of *describing* data. So to this end they are actually really great at *describing* .NET types.

LINQ to Umbraco aims to take these meta-types which you are defining within the CMS and generate strongly typed representations of them which you can work with at a .NET level.

Become the types defined in Umbraco can be easily used to represent any data. To this end LINQ to Umbraco is **provider based**, allowing the underling data source to be defined by the developer.

## Provider Based? ##

Because of the way LINQ to Umbraco is designed it is possible to swap-out the way that the data is access within itself. This is what the UmbracoDataProvider class is used for.

Out of the box LINQ to Umbraco supplies a single UmbracoDataProvider implementation, the **NodeDataProvider**.

The NodeDataProvider is designed to interact with the XML cache of Umbraco, working with published data. This provides read-only operations, *despite LINQ to Umbraco providing full CRUD capabilities*.

# When to use it? #

LINQ to Umbraco is not designed to be a replacement for XSLT, nor is it to be a complete replacement for the existing Umbraco API's.

That's not saying it can't be used in these scenarios, but LINQ to Umbraco is best used when you're looking at Umbraco data in a site-wide scope.

# Design #

The design of LINQ to Umbraco borrows very heavily from that of LINQ to SQL, by having a DataContext which all interactions flow out from.

Because of this (and due to the provider model) there is no understanding of the data hierarchy. With the initial access of the data from the DataContext it looks at the data *as a whole picture*, allowing you to not concern yourself with the hierarchy, unless you need it.

In addition to having a LINQ to SQL style DataContext all of the hierarchy of Umbraco is matched by LINQ to Umbraco. This means that you can traverse down a node's children collections, in a strongly typed manner.
