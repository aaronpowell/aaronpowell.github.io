---
  title: "Hello db.js"
  metaTitle: "Hello db.js"
  description: "An introduction to db.js, an IndexedDB wrapper."
  revised: "2012-10-28"
  date: "2012-10-01"
  tags: 
    - "indexeddb"
    - "web"
    - "winjs"
  migrated: "true"
  urls: 
    - "/web/hello-dbjs"
  summary: ""
---
_I'm going to make the assumption you're somewhat familiar with IndexedDB in this post, if you're not check out [this tutorial](https://developer.mozilla.org/en-US/docs/IndexedDB/Using_IndexedDB)._

If you've spent any time looking at [IndexedDB](http://www.w3.org/TR/IndexedDB/) you'll have to agree that the API leaves a lot to be desired. Look IndexedDB is a great feature of modern browsers but the problem is that its API is not really designed around modern JavaScript practices.

In particular I really dislike that you have to do stuff like this:

    request.onerror = function(event) {
      // Do something with request.errorCode!
    };
    request.onsuccess = function(event) {
      // Do something with request.result!
    };

It really starts getting convoluted when you're working with the events on the different request objects. Even opening the initial database can be quite ugly, if the version number has changed then you need to handle that event before the success event, doing migrations and all kinds of stuff.

The other ugliness starts coming into play when you want to hide your database code behind a public facing API, you're constantly having to take in callback arguments and it's Christmas trees all around.

On top of this if you look at the code above it feels very reminiscent of old-IE event wire-ups, `onclick` and all that fun stuff, but today the [Promise](http://wiki.commonjs.org/wiki/Promises) callback pattern is a much more popular one ([you've probably seen it in jQuery](https://www.aaron-powell.com/doing-it-wrong/blinking-marquee)) as it does a great job of standardizing how you provide callbacks.

This was my impression when I started with IndexedDB so I decided that I'd address it in my own way.

# Hello db.js

I created a simple little library called [db.js](https://github.com/aaronpowell/db.js) which aims to simplify the problems I was finding with IndexedDB's API. It's open source, it's up on GitHub and it's currently in production running my [Pinboard for Windows 8 application](http://pinboard.aaron-powell.com).

# Addressing callbacks

The first design goal of db.js was to address the way callbacks were handled. As I said above I really dislike the `.onsuccess = function () { ... };` syntax that IndexedDB uses and I really like the Promise API.

For db.js I decided that everything would be handled through Promises to keep consistencies with the various callbacks that would be happening. Another decision was that I wouldn't take a dependency on any existing library that provides a Promise API (like jQuery) to keep db.js as agnostic as possible. So I implemented my own Promise API, as per the CommonJS specification that would power db.js (the Promise spec is pretty easy to implement really).

# Opening a connection

There's a few things that you need to do when opening a server connection, you need to:

- Provide the name of the server
- Provide a schema version
    - If the schema version is newer then you have to handle a schema change
- Listen of a success or fail method and react accordingly

Rather than through a series of properties or arguments that you set I went with an object literal, so creating a connection is like so:

    var promise = db.open({
        server: 'my-app',
        version: 1,
        schema: { 
            people: { }
        }
    });

This opens a connection to the database server `my-app` on the current domain and the version of that server is `1`, which uses the provided schema, which has a single store (aka, table) called `people`. If you want more object stores then just add another property to the `schema` object, each named property becomes an object store name.

This returns a `Promise` object which is implemented as per the CommonJS spec so you have to listen for the success handler to move on:

    promise.done(function (server) {
        window.server = server;
    });

It can get a bit tricky there, you don't have an active server connection _until_ the `done` function is called. The argument it is provided is a db.js `Server` object which maintains the active connection. **Make sure you expose that out otherwise your server connection will be lost!**

_Note: Since opening the connection is an asynchronous operation you need to make sure any code that will use the server is told to wait for it. The connection generally opens quickly but when you can use it isn't known. This is something that can easily trip you up._

## Persisting the connection

What you'll notice from the above code is that it is making the server a _global_ object in my application. The expectation of db.js is that you only ever have one `Server` object, if you descope it you loose your access to the connection, but this does not _close_ the connection. IndexedDB only allows one connection per server to be open at any given time, so keep that in mind in your application.

That said db.js will try and be smart about connection management, it caches the connections internally so if you try and re-open a connection it will return you the existing one.

## Closing the connection

Since our connection is a singleton there may be times you don't need it hanging around, to do this you need to close it off:

    server.close();

Be aware though that the connection _may not_ close immediately, [IndexedDB has steps it must follow](http://www.w3.org/TR/IndexedDB/#dfn-steps-for-closing-a-database-connection) to close a connection. Once the connection is closed the `Server` instance that db.js provided you with will raise an error any time you try and work against it.

# Accessing a store

Now that you have a connection db.js will be smart about what stores you have available. What it does is go through all the stores on your connection and create them as properties of the server, allowing quick access to them. Let's see how that works by adding some data.

## Adding data

IndexedDB has a really nice feature when it comes to adding data (well doing any operation really), it has transaction support! The problem is that because of this everything takes lot more code to do. With db.js this is seemlessly handled for you and when you're doing bulk inserts it'll even take care of that:

    var promise = server.people
        .add({
            firstName: 'Aaron',
            lastName: 'Powell'
        }, {
            firstName: 'John',
            lastName: 'Smith'
        });

Here you'll notice we're accessing the `people` property on our `server`, this tells db.js which of our object stores we want to work against. Next you pass in one or more items that represent the objects you want to store and then the method returns a Promise. To know when you have added all records use a `done` handler:

    promise.done(function (records, server) {
        console.log(records);
    });

The `done` method will be provided with the records _after_ they go into IndexedDB, this means that if you're using an auto-incrementing key it'll have been added to the record so you can then access it.

_Note: I'll cover off how to set up a key on an object store in a future post._

### Promise `progress` method

If you've read the Promise spec you'll notice that it includes a reference to a `progress` method. This is used to keep the application "in the loop" when an asynchronous job is running. When you are using the `add` method in db.js it will trigger the `progress` method **for each record that is inserted**. This is because there are two levels of asynchronous jobs happening in the `add` process, you have the overall `transaction` status and the individual record status. I see the main use for this is when you are doing a large insert into IndexedDB (say the first time the user comes to the application) and you want them to know not to hit refresh.

## Removing data

Removing records is just as simple as adding them:

    server.people
        .remove(1)
        .done(function (key) {
            console.log('removed record with key `1`');
        });

You need to provide the key of the record you wish to remove and it'll go off and do it.

_Note: Currently db.js doesn't support bulk removal._

## Accessing a record

You've got a record into your store, how about getting it back out again?

    server.people
        .get(1)
        .done(function (person) {
            console.log('The person with the primary key `1` is... ', person);
        });

The `get` method takes a single key and returns the record that matches it. Essentially it's a pass through to the [native `get` metohd of IndexedDB](http://www.w3.org/TR/IndexedDB/#widl-IDBObjectStore-get-IDBRequest-any-key).

## Accessing multiple records

If you want to get back multiple records db.js has a very extensive query API which supports all of the IndexedDB query methods, as well as adding some additional sugar on top. Here's a basic "get all" operation:

    server.people
        .query()
        .all()
        .execute()
        .done(function (people) {
            console.log(people);
        });

There's a few steps you need to go through, first all the querying is done via the `query` API. From here we use the `all` method which is exposed, it tells IndexedDB to get back each record in an unfiltered manner. Once we're done setting up our query we call the `execute` method which tells db.js to take the rules we've specified and pass them through to IndexedDB. Ultimately a `Promise` is returned and we can listen for the resulting data.

The reason for the `execute` method is because there's a lot more we can do from the query. Through this we have a nice fluent chaining API that we can structure our query before it is run. In my next post we'll look at how to do more powerful querying with db.js.

# Conclusion

This has been a very quick overview of [db.js](http://github.com/aaronpowell/db.js) and the approach I've taken to simplify working with IndexedDB.