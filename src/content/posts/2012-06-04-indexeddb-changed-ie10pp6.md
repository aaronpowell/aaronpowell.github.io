---
  title: "IndexedDB changed in IE10 PP6"
  metaTitle: "IndexedDB changed in IE10 PP6"
  description: "A subtle change to IndexedDB in IE10 PP6"
  revised: "2012-06-04"
  date: "2012-06-04"
  tags: 
    - "indexeddb"
    - "javascript"
    - "ie"
  migrated: "true"
  urls: 
    - "/indexeddb-changed-ie10pp6"
  summary: ""
---
When building [Pinboard for Windows 8](https://www.aaron-powell.com/pinboard-for-win8) I decided to use [IndexedDB](http://www.w3.org/TR/IndexedDB/) as the internal storage for the application since I was writing it using WinJS.

Initially I wrote the application against the Consumer Preview release but when it came time to get it going for the Release Preview I hit a snag, the database layer was completely falling over! I kept getting an `InvalidAccessError` every time I tried to open a transaction. My code was looking like this:

	var transaction = db.transaction('my-store', IDBTransaction.READ_WRITE);
	
I couldn't work out what was going wrong here, I hadn't changed my code and reading the [spec at the time](http://www.w3.org/TR/2011/WD-IndexedDB-20111206/) everything looked exactly right...

**Watch out for fluid specs!**

What I hadn't noticed was that there was a new version of the IndexedDB spec in the works and in this spec the `IDBTransaction` enum had been dropped in favour of string representations of the transaction types and *IE10 was implementing this spec*.

So I had to update all my code to remove the enum values in favour of string values:

	var readOnlyTransaction = db.transaction('my-store', 'readonly');
	var readWriteTransaction = db.transaction('my-store', 'readwrite');
	
This spec is now the current version and most of the browsers have moved to using it (although Chrome still insists on having the enum available it just raises a warning if you use it) so you're code *should* work once updated.

# TL;DR

You should use my library, [db.js](http://aaronpowell.github.com/db.js/), to simplify your interaction with IndexedDB across the different browsers.