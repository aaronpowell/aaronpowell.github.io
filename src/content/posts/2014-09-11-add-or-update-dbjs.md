---
  title: "Add or update with db.js"
  date: "2014-09-11"
  tags: 
    - "db.js"
    - "indexeddb"
  description: "A common question with db.js is how to merge data from a remote store into the local store. When doing so you need to think about how you're handling an add vs an update statement."
---

A common question with [db.js](https://github.com/aaronpowell/db.js) is how to merge data from a remote store into the local store. When doing so you need to think about how you're handling an add vs an update statement.

Say you have some records that you're syncing between the two instances and they have a common key that you use to identify on both the client and the server. When a user hits the site you pull down the records and want to work out if they are to be inserted or just updated against what you already have.

Well db.js exposes two methods, `add` and `update` which take an item and well, do what it sounds like. But this can make your code seem a bit confusing, do you need to perform a `get` first and find out if the record exists, and if it does then do an `update` otherwise do an `add`? That'd make it quite intensive a process as you have two operations for every record.

I decided to crack open the [IndexedDB spec](http://www.w3.org/TR/IndexedDB/) and do some digging to see if I could work out the best way to go about this. The logical starting place for this is with the [Object Store Storage Operation](http://www.w3.org/TR/IndexedDB/#object-store-storage-operation) for you see there are two methods for adding items into an IndexedDB store, there is the `add` method and there is the `put` method.

So what's the difference between the two? Well it comes down to point #4 of the Object Store Storage Operation:

> If the no-overwrite flag was passed to these steps and is set, and a record already exists in store with its key equal to key, then this operation failed with a ConstraintError. Abort this algorithm without taking any further steps.

The difference is that `add` sets the `no-overwrite` flag to `true` where as `put` sets it to `false`, meaning that if you provide a "new" item to `put` it will perform an insert on the record.

Now let's get back to db.js, how does this fit into the picture? Well with db.js I don't have a `put` method (at least not as of today), instead `put` is what the `update` method uses.

# Takeaway lesson

If you want to perform an add-or-update but don't want to go through the overhead of doing a check if the record exists then you can just call the `update` method on your db.js store. Although it probably makes sense to rename the `update` method to `put` so it's more consistent with the IndexedDB API, maybe I'll just backlog that one.