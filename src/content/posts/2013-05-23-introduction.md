---
  title: "Flight Mode - Introduction"
  metaTitle: "Flight Mode - Introduction"
  description: ""
  revised: "2013-05-30"
  date: "2013-05-23"
  tags: 
    - "offline-storage"
    - "flight-mode"
  migrated: "true"
  urls: 
    - "/flight-mode/introduction"
  summary: ""
---
So you've got an idea to build an amazing new web application, it's going to make you tens of dollars, hundreds of cents, it's all web API'ed and SPA. There's a responsive design so it's mobile friendly, all the cool stuff. But there's one last piece of the puzzle you need to sort out, offline data. Your application needs to be able to store data in a way that users and still interact with it, even if it's at a basic level, when they are offline.

You need to handle **Flight Mode**.

Throughout this series we're going to be looking at how to do this, how to do offline data storage in your web application. For convenience the series is going to be broken down across the following posts:

* [Introduction]({{< ref "/posts/2013-05-23-introduction.md" >}})
* [Cookies]({{< ref "/posts/2013-05-23-cookies.md" >}})
* [localStorage and sessionStorage]({{< ref "/posts/2013-05-23-local-session-storage.md" >}})
* [IndexedDB]({{< ref "/posts/2013-05-27-indexeddb.md" >}})
* [FileSystem APIs]({{< ref "/posts/2013-05-28-file-system.md" >}})
* [Useful libraries for offline storage]({{< ref "/posts/2013-05-30-libraries.md" >}})

I'm also going to be showing off basic implementations as we're going along to give a bit of an insight into the way we can implement using these storage models.

For that I've created a little library which we'll be interacting via, called `FlightMode`. This then allows you to create _adapters_ which are implementations of an underlying storage layer, here's our API that we'll interacting with:

    (function (global) {
        'use strict';

        var FlightMode = function (storeName, adapterName) {
            if (!(this instanceof FlightMode)) {
                return new FlightMode(storeName);
            }

            this.storeName = storeName;

            var adapter = FlightMode.adapters[adapterName] || FlightMode.defaultAdapter;

            this.adapter = adapter.init(storeName);
        };

        FlightMode.prototype.add = function(obj) {
            return this.adapter.add(obj);
        };

        FlightMode.prototype.remove = function(id) {
            return this.adapter.remove(id);
        };

        FlightMode.prototype.get = function(id) {
            return this.adapter.get(id);
        };

        FlightMode.prototype.getAll = function() {
            return this.adapter.getAll();
        };

        FlightMode.prototype.getBy = function(property, value) {
            return this.adapter.getBy(property, value);
        };

        FlightMode.prototype.destroy = function() {
            return this.adapter.destroy();
        };

        FlightMode.adapters = [];

        global.FlightMode = FlightMode;

    })(window);

The code is also available on [my github](https://github.com/aaronpowell/flight-mode-blog).

So sit back and let's have a look at how to do Flight Mode capable web applications.