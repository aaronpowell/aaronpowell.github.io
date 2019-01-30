---
  title: "Flight Mode - IndexedDB"
  metaTitle: "Flight Mode - IndexedDB"
  description: ""
  revised: "2013-05-27"
  date: "2013-05-27"
  tags: 
    - "flight-mode"
    - "offline-storage"
    - "indexeddb"
  migrated: "true"
  urls: 
    - "/flight-mode/indexeddb"
  summary: ""
---
The next stop in our offline storage adventure is to look at the big daddy of offline storage, [IndexedDB](http://www.w3.org/TR/IndexedDB/). Now I've [blogged about `IndexedDB` in the past](https://www.aaron-powell.com/tags/indexeddb) but today I want to talk about it in a bit higher level and introduce the idea of IndexedDB beyond just how to use the API.

IndexedDB is the latest approach to doing offline storage in offline applications, it is designed as a replacement for the [WebSQL spec which is now discontinued](http://www.w3.org/TR/webdatabase/). One of the main reasons that WebSQL was discontinued was because it was tied to a specific version of [SQLite](http://www.sqlite.org/) which introduced some problems. Need to change something in the way the API worked you needed to change the SQLite specification first. So IndexedDB was proposed as a replacement to WebSQL and the design was not tied to any particular underlying technology ([I've previously blogged about how different browsers store their data]({{< ref "/posts/2012-10-05-indexeddb-storage.md" >}})).

IndexedDB is quite different to WebSQL where instead of being a dialect of the SQL language IndexedDB much more closely related to a NoSQL, or Document Database (it's not true document database but I'm not here to argue semantics). Data is stored as the objects that they are (once they've been cloned, so you don't maintain prototype chains), not as strings like we've seen in the other options.

## Benefits of IndexedDB for storage

There's several important benefits of IndexedDB over the other storage options we've looked at, the first is something that's a very big break from other options, asynchronicity.

Where the other APIs all perform their operations in a synchronous manner IndexedDB doesn't. This means that we get the benefits of having a non-blocking operation, so if you're writing a large amount of data, you are on a low powered device, are experiencing high disk I/O, etc then you don't want to have the user seem like your web application has crashed while you're storing their data. Asynchronous operations aren't exactly a new concept on the web so it's nice to see that it's come to the storage level.

The next benefit is transactions. Anyone who's done database work will know the benefit of this within an application. Once you start doing lots of read/write options, accepting user input and so on the chance of getting data that you _can't_ handle is high. Transactions give you a benefit so that you can group operations and then if they fail roll them all back without getting your data store into a corrupt state. Transactions can also be read-only or read-write meaning that you can more selectively lock your data depending on the kind of operations being undertaken an limit the chance of corruption.

And then there's the way it handles data, where the previous options were storing data as strings, meaning we have to serialize/deserialize IndexedDB stores the data as the objects that were provided ([admittedly there's a few steps it goes through first](http://www.w3.org/TR/IndexedDB/#object-store-storage-operation)). This means that we can do a few smarter things on top of what we could do with strings, firstly we can create indexes. Again if you're familiar with databases you'll be familiar with indexes, but basically these allow us a nifty way to produce optimal query points. Say you've got people objects and you always query by `firstName` so then you can create an index so it'll optimize that kind of query. Which then leads on to the next part about handling data, querying. Since we're storing full objects when we want to find data (such as with our `getAll` method) we have our full object to then work against rather than just doing it against the full in-memory collection.

## Drawbacks of IndexedDB for storage

The biggest drawback of IndexedDB is probably going to be a pretty obvious one for an API that is as new as it is and that's browser support. At the time of writing the following browsers support IndexedDB unprefixed:

* Internet Explorer 10+
* Chrome 25+
* Firefox 19+

So you can see that there's a major limitation when we're looking to go offline, the mobile space. Because of the browser support Windows Phone 8 is the only phone that supports IndexedDB natively. Luckily there's hope, there's a [shim for IndexedDB](http://nparashuram.com/IndexedDBShim/) that used WebSQL as the underlying store. This means that iOS Safari (and desktop Safari) as well as Android can have the API exposed to them.

The other biggest drawback for me is the API, it's excessively verbose and generally feels very foreign to front-end development. Things like `transaction`, `index` and `cursor` are not really common concepts when you talk to front-end developers. And then there's API calls like `cursor.continue()` when you're iterating through a query, while it might look innocuous the problem is that `continue` is a reserved word in JavaScript so pretty much every editor I've used (and most linters) will raise a squiggly/warning which the ODC-coder in my flinches at, resulting in a lot of code people write like `cursor['continue']();`. And on the verbosity, say you want to query a store on a non-unique index (our `firstName` property for example), to do that you must:

- Have an open connection to your database, `indexedDB.openDatabase('my-db')`, and wait for it to succeed
- Open a transaction, `db.transaction('my-store')`
- Open the store from the transaction, `transaction.objectStore('my-store')`
- Open an index from the store, `IDBKeyRange.only('firstName', 'Aaron')`
- Open a cursor with the index, `store.openCursor(index)`, and wait for it to succeed
- In the success method of the query check to see if there was a cursor, if there was get its value and either work with it our push it to an array in the closure then call `cursor.continue()` or if there was no cursor ignore it (no cursor is the end of the query)
- In the success method of the transaction process the captured values, assuming you wanted to work with them all together

That's a lot of steps to get data by a property...

This then brings us to how you listen to the asynchronous actions. Generally you'll see code like this:

    request.onsuccess = function (e) { ... };

To me that feels very reminiscent of the IE6 era where events were registered by `on<something>`. Admittedly you can use `addEventListener` since IndexedDB uses the DOM3 event specification, but it seems to be the less-used approach in the documentation.

## Implementing IndexedDB storage

When we have a look at implementing IndexedDB storage on top of our `FlightMode` API that we've been using there's an immediate problem, we've been only working with synchronous APIs up until now but as I mentioned above one of IndexedDB's benefits is that it is asynchronous. Because of this we'll have to approach the API usage a bit differently, first up the `FlightMode` constructor now has two new arguments, a `migrate` and a `ready` callback argument. The `ready` argument is the most important one, it will be triggered when our IndexedDB connection is open and we can start using the API. The `migrate` callback on the other hand is used to allow you to manipulate the objectStore (such as create indexes) if required. Additionally to make it nicer to work with the asynchronous nature of the API I've leverages the [Promise/A+](http://promises-aplus.github.io/promises-spec/) specification for handling the events via the [Q](http://documentup.com/kriskowal/q/) library.

_Side note: If you're not familiar with Promises have a read through [my series on exploring them with jQuery](https://www.aaron-powell.com/doing-it-wrong/blinking-marquee). It's not exactly the same as Promise/A+, you can read about the differences [here](http://domenic.me/2012/10/14/youre-missing-the-point-of-promises/)._

_Warning: This is a **really** basic IndexedDB implementation, it glances over much of the really powerful features, such as complex index queries, for information on that check out my [other IndexedDB posts](https://www.aaron-powell.com/tagged/indexeddb)._

Our internal `Store` object has got a much more complex constructor this time since there's a few more things we need to do, we must:

* Open our connection to the database
* Create the object store if required
* Notify the consumer that the API is ready

So it will look more like this:

    var Store = function (name, onMigrate, onSuccess) {
        var that = this;
        var request = indexedDB.open('flight-mode');
        this.storeName = name;

        request.onsuccess = function (e) {
            that.db = e.target.result;

            onSuccess();
        };

        request.onupgradeneeded = function (e) {
            var db = e.target.result;

            var store = db.createObjectStore(name, { keyPath: '__id__', autoIncrement: true });

            if (onMigrate) {
                onMigrate(store);
            }
        };
    };

One nice thing about IndexedDB is that it can automatically create an `id` for the object, which I've turned on (it'll be stored in the `__id__` property) and set to `autoIncrement: true` so that it will create a new one for each record.

To use this we would do something like so:

	var ready = false;
	var store = new FlightMode('my-store', 'indexedDB', function () { ready = true; });

It is a bit tedious that we'd have to check for the `ready` flag before any query or risk the API not being ready to use but that is something you can program around with `Promise/A+` pretty easily.

As I mentioned in my drawbacks list the API is very verbose, but we can still make it reasonably simple to use as a consumer and hide away that verbosity. Let's look at the `add` method. Again since this is asynchronous we'll need to take that into consideration. This is where I'm leveraging `Q`, I'm creating a deferred object that you then will interact with.

    Store.prototype.add = function(obj) {
        var transaction = this.db.transaction(this.storeName, 'readwrite');
        var store = transaction.objectStore(this.storeName);

        var d = Q.defer();
        store.add(obj).onsuccess = function (e) {
            d.resolve(e.target.result);
        };
        return d.promise;
    };

First things first we need to create a new transaction, this is a **writable** transaction since we'll manipulate data. From said transaction we can then go out and get our object store that we're writing to. Lastly we setup our deferred object from Q which we'll then return so we can use the Promise. When you add a record into the object store it'll fire off the `success` event when done and an `error` event if it was to fail. I'm omitting error handling here to save code, but you'd capture the `IDBRequest` from the `add` call which you attach other handlers to.

When the request is successful the events _target_ will be the `id` that was generated by IndexedDB for us. If you're _not_ using auto-incrementing IDs the value will be what ever you defined as your `keyPath` anyway. I'm then resolving that out via our Promise resulting in an API usage like so:

	store.add({ firstName: 'Aaron', lastName: 'Powell' }).then(function (id) {
		console.log('Object stored with id', id);
	});

Getting a record out by it's `id` is also reasonably trivial once you understand the basis of IndexedDB, here's the code:

    Store.prototype.get = function(id) {
        var transaction = this.db.transaction(this.storeName);
        var store = transaction.objectStore(this.storeName);

        var d = Q.defer();
        store.get(id).onsuccess = function (e) {
            var obj = e.target.result;
            if (obj) {
                d.resolve(obj);
            } else {
                d.reject('No item matching id "' + id + '" was found');
            }

        };
        return d.promise;
    };

We have a few things in common with the `add` method, but this time we don't specify what type of `transaction` we want. If you _don't_ specify a type it will be read-only as transactions are read-only by default.

_Note: If you want to be explicit about it pass in `readonly` as the second argument._

Like `add` the `store.get` method returns an `IDBRequest` which we listen for events on. When the object doesn't exist in our store it won't raise an error as this isn't really an error state, instead we'll have the request succeed and the `target` of the event will be `null`. This means that we have to do the check inside the `success` handler and in this case I'm rejecting the Promise with an error message to consumers.

We end up with a usage like so:

	store.get(1).then(function (obj) {
		console.log('Object found', obj);
	}, function (msg) {
		console.log(msg);
	});

The final thing that really gets the power out of IndexedDB is that we can produce indexed queries, so finding items is more optimal. To do this we need to leverage the `migrate` callback so we can create ourselves an index for the `objectStore`. it would look something like this:

    var store = new FlightMode('my-store', 'indexedDB', function () {
        ready = true;
    }, function (store) {
        store.createIndex('firstName', 'firstName');
    });

The `migrate` method receives an instance of our `objectStore` which we can then create indexes from using the `createIndex` method. This takes a `name` for the index and a `keyPath` for the property of the object we want to index. Optionally you can pass in some options such as whether it should be a unique index.

With the index created we can then use it within the `getBy` method, like so:

    Store.prototype.getBy = function(property, value) {
        var transaction = this.db.transaction(this.storeName);
        var store = transaction.objectStore(this.storeName);

        var d = Q.defer();
        var items = [];

        var index = index = store.index(property);

        index.openCursor().onsuccess = function (e) {
            var cursor = e.target.result;
            if (cursor) {
                items.push(cursor.value);
                cursor['continue']();
            }
        };
        transaction.oncomplete = function () {
            d.resolve(items);
        };
        return d.promise;
    };

To query the `index` we need to use a `cursor` (and as I mentioned above the `continue` method is annoying...). Next we listen to the `success` event of the cursor request, extracting the items out as we navigate through the cursor.

Once the cursor is exhausted the `transaction` will be completed and then we can resolve all the items which we wanted from it.

You can find the rest of the implementation [in the github repository](https://github.com/aaronpowell/flight-mode-blog/src/adapters/indexeddb.js).

# Conclusion

IndexedDB is still rather new a technology so it's something that needs to be used with a certain bit of caution, if you can't target only the latest browsers then it might not be possible to use it in your application.

That said it is a **really** powerful API, the fact that it is asynchronous is alone a reason that it should be chosen over pretty much any other storage option when storing large amounts of data.

While there are drawbacks with the API design, particularly the fact that it can be very verbose *and* very foreign to web developers it isn't that difficult to hide away the bulk of the API with your own façade, using libraries like `Q` to make it easier to interact with the API and only exposing the features that you really need in your application.

Definitely keep an eye on IndexedDB in the coming years, especially when doing Windows 8 applications, as it'll be more available and more important for building offline applications.