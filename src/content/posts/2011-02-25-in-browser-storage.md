---
  title: "A look at browser storage options"
  metaTitle: "A look at browser storage options"
  description: "Looking at localStorage, sessionStorage and the like"
  revised: "2011-02-26"
  date: "2011-02-25"
  tags: 
    - "javascript"
    - "ie9"
    - "html5"
    - "web"
    - "web-dev"
  migrated: "true"
  urls: 
    - "/web-dev/in-browser-storage"
  summary: ""
---
Recently I created a little website, [Doin' Nothin'][1] which has a mostly JavaScript application. This is all well and good, means you don't have any worries about submitting server data (unless you are registered and you want to save sessions). But it has a problem, because it's all JavaScript I kept having a problem, I'd forget to log in before starting my session, meaning that I couldn't save it as navigating to the login page would mean that my session was lost, since it only lived in the memory of the page. Another feature that I was wanting to have was support for leaving the site and coming back to resume a session.

But how do we deal with this, currently it's just a JavaScript API, there's no server logic for dealing with sessions, tracking time blocks, etc. I *could* add that in, but then I need to track anonymous users coming and going and they may not like that. Alternatively I could look into browser storage.

# Introducing browser storage

Something that's part of the HTML5 specification (seriously, what **isn't** part of HTML5 these days :P) is [Web Storage][2] (Note: this is different to the [Indexed Database][3]) and Web Storage is like cookies, but on steroids.

There's two types of Web Storage, `localStorage` and `sessionStorage` and these two ways which you can do browser-level storage.

Both types of storage inherit from the same `storage` sub type, meaning that their API is just the same and they also store data in the same manner. The way data is stored is as a basic key/ value storage, with the value really just being a string. The Web Storage options don't support storing complex objects *as objects* so keep that in mind ;).

## localStorage

The idea of `localStorage` is that of persistent data *across browser sessions*. By this I mean that if you close your browser window and then come back data you persisted into `localStorage` will still be there.

Anything which is pushed into `localStorage` will reside in `localStorage` until it is removed explicitly, so keep that in mind if/ when you are pushing into `localStorage`


## sessionStorage

The idea of `sessionStorage` is that of persistent data *during the browser session*, and what I mean is that while you're navigating your site data in there will stay but once your browser session ends the data will be cleared out.

# Working with Storage

Now that we have a basic overview of the different storage types how do we go about using them?

Well they are quite easy, both `localStorage` and `sessionStorage` reside off the `window` object, so they are globally accessible. Each type of Storage has three main methods you need to know, `setItem`, `getItem` and `removeItem`. These are the CRUD operations which are exposed from the Storage object.

*Note: there are a few other methods and properties I haven't covered, such as `clear` if you want to remove everything.*

Here's a basic example of how to use `localStorage`:

	localStorage.setItem('foo', 'bar');
	console.log(localStorage.getItem('foo')); //bar
	localStorage.removeItem('foo');
	console.log(localStorage.getItem('foo')); //undefined

What we're doing in this demo is adding an item to `localStorage`, reading it out and then removing it.

The exact same operations can be done with `sessionStorage`.

## Working with complex objects

As I mentioned earlier in the article only strings are handled by the Web Storage API, so how do you deal with a complex object? What would this do:

    localStorage.setItem('foo', { foo: 'bar' });

Well you'll end up with `[object Object]` stored (well, maybe a bit different depending on browsers, but that's what you get in IE9), and that's not very useful. But the lovely thing about JavaScript is JSON, meaning you can convert an object to a string. This means that you can convert `{foo: 'bar'}` to `"{"foo":"bar"}"`, and then we can push that into our Web Storage of choice.

The easiest way to do this is using the `JSON` object which current generation browsers have in them (if you're using an older browser you can use [this Douglas Crockford library][4], but chances are Web Storage isn't available anyway :P).

Now we can do this:

	localStorage.setItem('foo', JSON.stringify({ foo: 'bar' }));
	console.log(JSON.parse(localStorage.getItem('foo'))); //{ foo: 'bar' }

For this we've used the `JSON.stringify` method, this will take a JavaScript object and produces a string. This isn't limited to just objects, but can also take an Array and make a JSON string from it (but yes, I know arrays are really just objects anyway, but that's semantics! :P).

We can then use the `JSON.parse` to convert the JSON string back to a JavaScript object, when we're reading it back out of our Storage.

# Browser Support

Now that you know all this cool stuff you hit an obvious question, **what browsers can I use this with?** and it's a very good question. Here's a list of what browsers I know it works with:

* IE8 & IE9
* FireFox 3.5+
* Chrome
* Safari
* Opera 10+

Basically any browser from the last few years support Web Storage, so keep that in mind.

# Conclusion

To wrap up in this article we've looked at the idea of Web Storage and  that there is two different types, `localStorage` if you want to persist across multiple browser sessions or `sessionStorage` if you want to persist for just the current browser session.

We've also looked at how to perform CRUD operations against it, using `getItem` to read, `setItem` to add and `removeItem` to delete and the fact that they allow strings only.

We finished up by looking at how to store complex objects into the Web Storage locations, using the JSON API. 


  [1]: https://www.aaron-powell.com/doin-nothin
  [2]: http://dev.w3.org/html5/webstorage/
  [3]: http://www.w3.org/TR/IndexedDB/
  [4]: https://github.com/douglascrockford/JSON-js