---
  title: "Flight Mode - Libraries"
  metaTitle: "Flight Mode - Libraries"
  description: ""
  revised: "2013-05-30"
  date: "2013-05-30"
  tags: 
    - "flight-mode"
    - "indexeddb"
    - "localStorage"
    - "sessionStorage"
    - "offline-storage"
  migrated: "true"
  urls: 
    - "/flight-mode/libraries"
  summary: ""
---
Throughout the last few posts we've looked at the different ways which we can store data offline in browsers and then created a basic little API that will help is with doing that. The `FlightMode` API that we've been working with was though was really quite a simplistic approach to the problem that we were presented with, ultimately the API isn't meant for production use.

So when looking at the different storage options what do we have if we did want to go to production? In this article we're going to look at some of the different API wrappers for the different storage technologies that we've looked at.

# Lawnchair

Site: [http://brian.io/lawnchair/](http://brian.io/lawnchair/)

Lawnchair is one of the most fully featured storage options that we've got available to us, and also what I based the concept of `FlightMode` on. Lawnchair offers a variety of ways which you can store data, through its adapter system, you can plug in which ever storage option you want, [and there's a few options](http://brian.io/lawnchair/adapters). The one that doesn't exist is cookies but as I pointed out [in that post]({{< ref "/posts/2013-05-23-cookies.md" >}}s) they aren't exactly the best option when it comes to storing data.

Another interesting aspect of Lawnchair is it is asynchronous by default, so using adapters like `localStorage` (which they refer to as `DOM storage`) requires a callback argument passed to it. This is nice as it means you have a more consistent API usage when it comes to using actually asynchronous APIs like IndexedDB and FileSystem.

The main drawback I find is that because Lawnchair provides such a vast array of storage options behind a consistent programming API you ultimately loose some of the power of the underlying provider. This is especially a problem with IndexedDB, you loose a lot of the power of indexes and querying against those. But if you're goal is to have offline storage across as large a browser set as possible then it's a price you'll have to pay.

Lawnchair really is a good choice if you want to be able to do storage across a lot of platforms and use feature detection to work out exactly what adapter can be used.

# AmplifyJS.store

Site: [http://amplifyjs.com/api/store/](http://amplifyjs.com/api/store/)

AmplifyJS.store like Lawnchair aims to be an API simplification of the various browser storage models but rather than trying to be a one-size-fits-all option it is more focused on just key/value storage, in particular `localStorage` and `sessionStorage`.

The programmatic model of AmplifyJS.store is also much simpler, rather than trying to provide helper methods to do things like filtering objects it provides the minimal surface area and leaves that up to you, so providing you with a method to get all objects then you can perform your own `map`, `filter`, etc operations. This is good as it doesn't try and pretend that the underlying store is something that it's not.

The API is also synchronous unlike Lawnchair which does have upsides that you can avoid the complications that can arise from asynchronous programming and callback hell.

AmplifyJS.store is a nice API if you want something that is simple and just does the job of handling key/value storage without trying to go over the top.

# PouchDB

Site: [http://pouchdb.com/](http://pouchdb.com/)

PouchDB is one of the most powerful libraries when it comes to working with complex data stores in the browser (it also supports node.js) and is very much a specialist of storing data with IndexedDB. It's an implementation of the CouchDB programming interface built on top of IndexedDB (there are providers for WebSQL, levelDB and a HTTP interface) that gives you a lot of power when it comes to interacting with the underlying data stores.

Another killer feature of PouchDB is that it has the ability to sync directly to a CouchDB instance via the HTTP interface. This means that if you're using CouchDB as your backend then you've got an option to easily keep your data in sync between your client and server. This is really handy, particularly in the scenario I've been trying to paint over this series of being able to maintain user state even when they are offline.

The obvious drawback of this is that it's really geared around CouchDB developers so the API is designed for them. That said it doesn't mean that it's a bad API or something that can't be used without CouchDB, it definitely can and it is very good at turning the IndexedDB programming API into something that is even closer to being a full NoSQL database by exposing `map`/`reduce` directly from the query API.

If you're looking for a very full-featured IndexedDB wrapper then PouchDB should be given a very serious look.

# db.js

Site: [https://github.com/aaronpowell/db.js](https://github.com/aaronpowell/db.js)

db.js is a library that I wrote with the single goal of improving the programmatic API for IndexedDB. As I mentioned in my [article on IndexedDB]({{< ref "/posts/2013-05-27-indexeddb.md" >}}) I find that the API is very verbose and quite foreign to front-end development so I wanted to set out and improve that.

The other main design goal was to make the event handling better, more specifically to utilize Promises. so that you could assign multiple handlers to events that get raised and interact with them that way. It was also so it could be interoperable with other asynchronous operations and other libraries that implement Promise APIs.

Finally I wanted a really simple way which you could query the data stored, again in a manner that is familiar to JavaScript developers. For this I went with a chaining API (made popular from jQuery) so that you could do all your operations in a single chain, but I also expose the important query features built in such as querying on a specific index, only the chaining is also allowing you to query in a more expanded manner, say first on an index and then on a custom function.

Ultimately this is a very thin wrapper over IndexedDB and it's *only* designed for IndexedDB usage which makes it an ideal candidate if that's your only target platform and you want something very light weight.

# Conclusion

This has been a brief overview of a number of different JavaScript libraries for working with different offline storage models, libraries from the generic abstraction all the way down to specific implementations.

By no means is this an extensive list of libraries available, I'm sure that there's dozens more out there that would be worth looking into, but ultimately this was meant to be an introduction to a few which I see a great deal of promise in.
