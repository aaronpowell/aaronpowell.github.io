---
  title: "Overview of the DocumentDataProvider"
  metaTitle: "Overview of the DocumentDataProvider"
  description: "What is the DocumentDataProvider, why does it exists, and how can it complete me?"
  revised: "2010-09-30"
  date: "2010-09-30"
  tags: 
    - "umbraco"
    - "linq-to-umbraco"
    - "linq-to-umbraco-extensions"
  migrated: "true"
  urls: 
    - "/documentdataprovider-overview"
  summary: ""
---
##Overview

If you've read my article on [Understanding LINQ to Umbraco][1] (and if you haven't you really should go do that) you'll know that LINQ to Umbraco does have the scaffolding for doing full CRUD operations. But with CRUD it is up to the underlying `UmbracoDataProvider` implementation to support.

Because the OOTB `UmbracoDataProvider` instance, the `NodeDataProvider` is only concerned with how to access the in-memory cache so having full CRUD doesn't make sense.

This is where the `DocumentDataProvider` fits in; like its name suggests it is designed to work with the Umbraco Document API, which is responsible for performing CRUD operations. So the ultimate goal of the `DocumentDataProvider` will be to provide full CRUD operations against the Umbraco database.

## DocumentDataProvider vs NodeDataProvider

So if the goal of the `DocumentDataProvider` is to provide full CRUD where will that leave `NodeDataProvider`? Well they should still sit side-by-side. For your common usage you should still use the `NodeDataProvider`, this will only be interacting with published content, and the in-memory cache. The `DocumentDataProvider` on the other hand will be interacting with the Document API, this means that it'll be tied to the SQL instance, and doing read operations will suffer from the same performance limitations that you can find from the Document API. There will be caching built into the `DocumentDataProvider`, but by-and-large there will be limits to how that can help.


  [1]: /understanding-linq-to-umbraco
