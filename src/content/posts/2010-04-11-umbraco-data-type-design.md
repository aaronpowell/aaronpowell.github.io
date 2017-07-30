---
  title: "Umbraco DataType Design"
  metaTitle: "Umbraco DataType Design"
  description: "Looking into how the DataTypes are designed for Umbraco"
  revised: "2010-04-11"
  date: "2010-04-11"
  tags: 
    - "umbraco"
    - "data-type"
  migrated: "true"
  urls: 
    - "/umbraco-data-type-design"
  summary: ""
---
## DataType's in Umbraco 4.x ##

I've often seem people wondering why performances is *so terrible* when creating Documents, particularly lots of Documents from the Umbraco API. There is a good reason for this, the design of the DataType allows anyone to be able to implement them to do almost anything.

The standard way to use a DataType is to write to the Umbraco database, but you don't have to do it that way, you can write to an XML file, call a web service or actually have no data saving.

Because of this it's up the responsibility of the DataType creator to do the CRUD operations, it's not possible to have Umbraco have some kind of a global save operation (because what if there wasn't a save!).

This does mean that there's the probability for lots of database interaction when you perform CRUD operations, but it does mean that DataTypes are infinitely flexible.

Because of this we were able to produce [TheFARM Media Link Checker package][1] for Umbraco. And I'd also hasten a guess that this flexibility also allowed the [Google Analytics for Umbraco][2] package to now allow lookups from the content item.


  [1]: http://our.umbraco.org/projects/thefarm-media-link-checker
  [2]: http://our.umbraco.org/projects/google-analytics-for-umbraco
