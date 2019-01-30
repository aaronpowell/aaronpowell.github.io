---
  title: "Flight Mode - local and session storage"
  metaTitle: "Flight Mode - local and session storage"
  description: ""
  revised: "2013-05-23"
  date: "2013-05-23"
  tags: 
    - "flight-mode"
    - "offline-storage"
    - "localStorage"
    - "sessionStorage"
  migrated: "true"
  urls: 
    - "/flight-mode/local-session-storage"
  summary: ""
---
Last time we looked a [using cookies to store offline data]({{< ref "/posts/2013-05-23-cookies.md" >}}) and we also saw that there's a number of problems with that approach. So let's move forward, let's look at what our next option would be when it comes to offline storage in our multi-dollar application.

Today it's time for the next level of offline storage, `localStorage` and `sessionStorage` which is sometimes referred to as `DOM storage`.

I'm going to talk about both of these options together as they share a lot of similarities.

There's a bit of a misconception around these two APIs, people often refer to them as _HTML5 storage_ but in truth they have been available much longer than that, in fact they can be used in [browsers as low as IE8](http://caniuse.com/#search=localstorage) which is not much of a HTML5 browser, and there's a lot more interesting storage options for "HTML5 browsers" that we'll look at later.

## Benefits of local/session storage

Like cookies `localStorage` and `sessionStorage` store key/value pairs of data, but they have a much nicer API to work with than you find when trying to work with cookies; it has explicit methods for getting, setting and removing data.

I keep referring to these two storage models together as they share a common root API but they are different. `sessionStorage` is designed for storing data for the life of a browser session (until the window/tab is closed). This can make it ideal if you've got data that you want to temporarily store until the user leaves your application. But this obviously makes it a dangerous one to use in our scenario, because if the browser was to crash while the user is offline you're likely to loose the data.

`localStorage` on the other hand is a long-term persistent storage, meaning that the data will stay between browser restarts, making it much more ideal for persisting data when we're offline.

But ultimately you need to select the right one for the right scenario so there are valid use cases for both and it's good to have that option.

## Drawbacks of local/session storage

Like cookies these stores are only capable of storing string values. This has the obvious drawback of being difficult to use if we've got a complex object that we're going to want to store for our application state.

The other main drawback is that there's no "magic sync to server" like with cookies. The data stored in either of these stores is **only** available to the client application, if you need to get the data back up to the server then you'll need to perform your own data sync. Now that does have the benefit of not having extra data added to a HTTP request so it's both a pro and a con.

## Implementing local/session storage

While it's an exercise in [reinventing the wheel](http://www.codinghorror.com/blog/2009/02/dont-reinvent-the-wheel-unless-you-plan-on-learning-more-about-wheels.html) we'll have a look at how to create a very simple key/value storage API on top of both `localStorage` and `sessionStorage`.

We'll be using our `FlightMode` API and creating two new adapters, one for each of the stores.

As I mentioned they have a nice API to work with and we get data in/out like so:

    localStorage.setItem('foo', 'bar');
    var item = localStorage.getItem('foo');
    localStorage.removeItem('foo');

But like cookies it can only store string values meaning that we'll be doing a lot of JSON serialization/deserialization, for example here's how we would do a `get`/`getAll` method:

    Store.prototype.get = function(id) {
        return JSON.parse(this.storage.getItem(id));
    };

    Store.prototype.getAll = function() {
        return this.store.map(this.get.bind(this));
    };

And like the cookie implementation we're tracking the IDs of all known objects which also adds overhead to out interactions as we need to add/remove items from the tracking object.

You can find the rest of the implementation [in the github repository](https://github.com/aaronpowell/flight-mode-blog/src/adapters/local-session-storage.js).

# Conclusion

While it might seem that there's quite a number of downsides for `localStorage` and `sessionStorage` over cookies when looking at offline storage options. But really `localStorage` and `sessionStorage` are much better options as they:

* Don't pollute the HTTP headers and thus increases the request/response size
* It's designed for storing medium-sized bits of data
* Getting items in/out has a cleaner API, and it's better designed than relying on string splitting

So if you're needing to store only really simple data structures across browser sessions then `localStorage` is a good option especially if the data you're working with can be indexed by a single property (which would represent your key). If you're only really focused on single-session cache then `sessionStorage` can be a good option but it has a much narrower use-case and is less than ideal for offline applications.

If you're curious to see an implementation of using `localStorage` for storing data then check out [twitter.com](http://twitter.com) and use your browsers dev tools to inspect `localStorage`. If you start writing a tweet and then close the tab the contents of that tweet are stored in an item keyed `__draft_tweets__:home` (there's also a `__draft_tweets__:profile` for doing it on your profile page). And there's a bunch of other useful data stored in there. While this data isn't synced across instances it's good for when you use a browser and then come back later.