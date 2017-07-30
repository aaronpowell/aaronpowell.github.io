---
  title: "Chrome support for db.js"
  metaTitle: "Chrome support for db.js"
  description: "A little word on the db.js support for Chrome"
  revised: "2012-10-18"
  date: "2012-10-18"
  tags: 
    - "indexeddb"
    - "chrome"
    - "web"
  migrated: "true"
  urls: 
    - "/web/dbjs-chrome"
  summary: ""
---
I recently had a [bug opened](https://github.com/aaronpowell/db.js/issues/14) on [db.js](https://github.com/aaronpowell/db.js) which is related to Chrome operating differently to the other browsers.

After spending some time digging into the problem I came to realise that the problem was to do with the way older versions of Google's Chrome implement IndexedDB (where older versions are any version prior to Chrome 23).

Prior to Chrome 23 Chrome didn't support the final specification for IndexedDB completely, in fact they were still implementing the spec from [April 2011](http://www.w3.org/TR/2011/WD-IndexedDB-20110419) and the root of the problem was how changing database versions worked.

# TL; DR

db.js will not be supporting Chrome 22 or lower, even if they have `webkitIndexedDB` defined.

# Longer story

To understand the problem we need to understand what changed in the specification between April 2011 and today. The change that is causing the most problems is how IndexedDB handles new versions of each database. In case you missed it, when you open a database with db.js (or well just IndexedDB) you need to provide a version number for the schema. This is because a database can change across versions and IndexedDB allows you to maintain the old schema.

Initially the way version changes were handled was using a [`setVersion`](http://www.w3.org/TR/2011/WD-IndexedDB-20110419/#widl-IDBDatabase-setVersion) method, like so:

    var req = indexedDB.open('db');
    req.onsuccess = success;
    req.onerror = fail;
     
    function success(e) {
        var db = e.target.result;
        var req = db.setVersion("1");
        req.onsuccess = createSchema;
        req.onerror = fail;
    }
     
    function createSchema(e) {
        //create schema
    }

The problem is that this was changed, instead of using this method to change a schema version it was added to the `open` call and is used in conjunction with a [`onupgradeneeded`](http://www.w3.org/TR/IndexedDB/#widl-IDBOpenDBRequest-onupgradeneeded) event off the request, like so:

    var req = indexedDB.open('db', 1);
    req.onupgradeneeded = createSchema;
    req.onsuccess = success;
    req.onerror = fail;

Personally I'm quite glad that they made this change, I think it makes for a much cleaner API as you don't have nested database requests. But ultimately this was a very radical change to the way the API worked.

## The Chrome problem

Chrome was the last browser to adopt this change, drilling down through the changeset history, issue history and mailing list archive it was apparent that the Chrome team was reluctant to just _drop_ the support for `setVersion` like the other browsers because they were concerned about existing implementations and this is a fair enough justification, no one wants to introduce breaking changes.

The problem was there was no good way to tests for this change. Initially db.js _did_ have attempted smarts as to how it will handle database version changes _but_ the problem was that there was no way to detect for the existence of the `onupgradeneeded` event, only the `setVersion` method. Interestingly enough even through Chrome 23+ _does_ support the `onupgradeneeded` it **also** has `setVersion`. As you can expect this added a lot more complexity to the code!

Ultimately what it came down to was it was overly complex to support _both_ versioning methods, so I made the decision that any implementation that uses `setVersion` and not `onupgradeneeded` it won't work as in the time it would take to resolve the problems I was seeing Chrome 23 will make it to the stable channel.