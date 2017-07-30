---
  title: "How the browsers store IndexedDB data"
  metaTitle: "How the browsers store IndexedDB data"
  description: "A starting point for learning where and how "
  revised: "2012-10-05"
  date: "2012-10-05"
  tags: 
    - "indexeddb"
    - "web"
  migrated: "true"
  urls: 
    - "/web/indexeddb-storage"
  summary: ""
---
As you've probably noticed I've been doing a lot of digging into [IndexedDB](http://www.w3.org/TR/IndexedDB/) across the various browsers but there's one thing that I find quite interesting, _how it all works_. So for the **[TIL](http://www.reddit.com/r/todayilearned/)** session we've going to find out how the browsers store the data for IndexedDB*.

*_Note: This will be a pretty high-level look since I'm sooo not a C++ developer and C++ is the primary language of browser engines :P._

# Internet Explorer

We'll start with the first browser to go unprefixed for IndexedDB, IE (well IE10), also since we can't look at the source of IE most of this is speculative.

Internet Explorer uses the [Extensible Storage Engine](http://en.wikipedia.org/wiki/Extensible_Storage_Engine) as its underlying storage model. This is the same database format that many of Windows features use including the Desktop Search (very common in Windows 8), Active Directory on Windows Servers and even Exchange.

ESE seems like a good idea for IndexedDB as it has many of the features that you're going to want such as keys, indexes and multi-value indexes* so I'm not surprised that the IE team have built on top of what is already there.

*_Side point - IE currently doesn't support multiEntry indexes from IndexedDB which really sucks, especially since ESE seems to support it natively :(._

If you're curious to go digging around for your IndexedDB files you'll find them at:

> %AppData%\Local\Microsoft\Internet Explorer\Indexed DB\Internet.edb

So far I haven't had much luck getting into this file to view the database contents, I've tried [EseDbViewer](http://www.woanware.co.uk/?page_id=89) but it fails to open the database files and trying to dig through the Windows API itself is just plain unpleasant. Nobody likes COM.

# Firefox

Firefox was the 2nd browser to go prefix free with IndexedDB, it is unprefixed as of version 16. Logically since Firefox is a cross-platform browser they use a cross-platform database, [SQLite](http://www.sqlite.org/). It's also not surprising that they are using SQLite as IndexedDB replaced the WebSQL proposal which was based on SQLite (one of the reasons cited as to discontinuing WebSQL was everyone used SQLite so they weren't getting independent implementations), so it makes sense that they salvaged what they could from the first implementation of a complex storage model.

Being open source you can browse the [code for Firefox's IndexedDB implementation](http://mxr.mozilla.org/mozilla-aurora/source/dom/indexedDB/) which is awesomely mind bending. Check out the [OpenDatabaseHelper.cpp](http://mxr.mozilla.org/mozilla-aurora/source/dom/indexedDB/OpenDatabaseHelper.cpp), it's responsible for setting up your database connection as well as doing a bunch of SQL to make sure everything is ready for data (yep, Firefox has SQL statements in it!). Another file of interest is [IDBObjectStore.cpp](http://mxr.mozilla.org/mozilla-aurora/source/dom/indexedDB/IDBObjectStore.cpp#1594) and the line I've linked to is the method that is responsible for inserting a new record into the database (at least I'm pretty sure it is).

If you are wanting to look into your database then the easiest way is with the [SQLite Manager](https://addons.mozilla.org/en-US/firefox/addon/sqlite-manager/) Firefox extension. The files created for IndexedDB are stored in the following location:

> %AppData%\Roaming\Mozilla\Firefox\Profiles\your profile id\indexedDB\domain

Open up the SQLite Manager extension and then you can dive into your database.

# Chrome / WebKit

At the time of writing the IndexedDB implementation of [WebKit](http://webkit.org), and by extension Chrome, is still prefixed, in fact they are prefixing pretty much everything IndexedDB related with `webkit`. The implementation seems to be driven by the Chrome team and that probably also indicates why they are using a Google produced database, [LevelDB](http://code.google.com/p/leveldb/).

_Note: The implementation is already in the main WebKit repository which means that sooner or later it will appear in Safari as they also use WebKit under the hood._

You can browse the [source of their implementation](https://trac.webkit.org/browser/trunk/Source/WebCore/Modules/indexeddb) in all its C++ glory, it really is quite nicely written, at least to my untrained C++ eyes. The actual storage of the data is done through the [IDBLevelDBBackingStore.cpp](https://trac.webkit.org/browser/trunk/Source/WebCore/Modules/indexeddb/IDBLevelDBBackingStore.cpp) class, but exposed as an abstraction so I guess it can be swapped out (and I'd guess that's how they swapped between SQLite and LevelDB to begin with). The one thing that I do find curious is that LevelDB doesn't support indexes yet obviously IndexedDB does, so there's probably some trickery going on when they are pushing the data into the database (and well it hurts my head to read that much C++ :P).

There isn't any stand-alone viewer for LevelDB that I've come across but really that's not that big a deal as currently Chrome is the only browser who has an IndexedDB inspector built into its developer tools. Just navigate to the _Resources_ tab and there's an IndexedDB section (you may have to right click -> refresh the node as it's not a live view). I do hope the other browser vendors bring this feature in as well as it's really quite neat to have. But if you really must find the files for IndexedDB then they are located here:

> %AppData%\Local\Google\Chrome\User Data\Default

_Note: If you're using Chrome Canary then it's in the **Chrome SxS** folder._

# Conclusion

**TIL**:

- IE uses the same database format as Exchange and Active Directory for IndexedDB
- Firefox is using SQLite so are kind of implementing a NoSQL database in to SQL database
- Chrome (and WebKit) are using a Key/ Value store which has heritage in BigTable
- C++ is no less scary than when I was at uni
