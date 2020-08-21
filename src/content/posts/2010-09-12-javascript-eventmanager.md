---
title: "An EventManager in JavaScript"
metaTitle: "An EventManager in JavaScript"
description: "Having disconnected eventing in JavaScript using a simple little framework"
revised: "2010-09-13"
date: "2010-09-12"
tags:
    - "javascript"
    - "javascript-eventmanager"
    - "web"
migrated: "true"
urls:
    - "/javascript-eventmanager"
summary: ""
---

## Overview

Previously I've blogged about [Client Event Pool's][1] (yes I know the images are broken), but that example was intrinsically tied to Microsoft AJAX and I wanted to have one which was separate from it.

So I decided to create an object that resides at `slace.core.eventManager` which will achieve this.

_Note: This library has a dependency on the `slace.core` library._

This API allows you to bind events, trigger events, unbind events (and event handlers) and event check if an event handler is registered.

This is all possible without having to explicitly tie each object to the objects which need to know about the events it's firing. To fully understand the idea behind the Client Event Pool concept I suggest you read my previous article and its references.

## Binding events

The concept of binding to an event is handy if you've got code on a page that you want to run when a certain event will be completed (although the code may also be run by other means), and to do this there is a simple method which works like this:

```javascript
slace.core.eventManager.bind('some event', function() { ... });
```

This will put that handler there so that if any code that triggers (raises) the 'some event' event the handler you specify will be executed.

You can call `bind` as many times as you like, adding as many handlers as you want.

One thing that can be handy (if you need to add/ remove events programmatically) is the ability to provide a unique ID to an event handler, to do that it's a third argument to the `bind` method:

```javascript
slace.core.eventManager.bind('some event', function() { ... }, 'awesome-event');
```

This will give the identifier of 'awesome-event' to the function you provided (we'll look at how this is handy shortly)

### How it works

Here's the code that makes up `bind`:

```javascript
bind: function (name, fn, eventHandlerId) {
    var e = getEvent(name);
    if (!eventHandlerId) {
        eventHandlerId = name + '-' + (e.length + 1);
    }
    fn.id = eventHandlerId;
    e.push(fn);
}
```

_I've omitted the getEvent method as it's not important, look into the real source for it_

What it does is check if you gave a unique ID, and if you didn't then I'll create one based off of the name of the event and the position in array of handlers and then it's assigned to the `id` property of the function object and adds it to the array of handlers.

## Triggering events

If you're binding to events you're probably going to want to be raising them as well, and this is what the `trigger` method is for and it works similarly to .NET events, like so:

```javascript
slace.core.eventManager.trigger("some event");
```

When triggering an event you need to provide it the name of the event to trigger (eg: 'some event'). Additionally there are two more arguments, with the full method call looking like this:

```javascript
slace.core.eventManager.trigger("some event", source, args);
```

If you've been doing much JavaScript work you'll be familiar with just how much fun scope can be in JavaScript, well with the `trigger` method, you're able to specify what object you want to be scoped as the `this` object in the method when it runs. This is the 2nd argument to the `trigger` method.

Lastly you can pass in arguments you want for the event handlers. If your handlers are to accept multiple arguments then you need to pass in an array, but I'd suggest just passing in an object literal each time, it's a lot more flexible than multiple arguments :P.

The most common reason I've needed to use this is to work nicely with AJAX requests, rather than having to pass in call-back methods ;).

### How it works

Here's the code:

```javascript
trigger: function (name, source, args) {
    if (!source) {
        source = {};
    }
    if (!args) {
        args = [];
    }
    var evt = getEvent(name);
    if (!evt || (evt.length === 0)) {
        return;
    }
    evt = evt.length === 1 ? [evt[0]] : Array.apply(null, evt);
    if (args.constructor !== Array) {
        args = [args];
    }
    for (var i = 0, l = evt.length; i < l; i++) {
        evt[i].apply(source, args);
    }
}
```

First off I do a few things like making sure you're passing in an object for the sender (or I'll default it to an empty one) and some arguments (which will become an empty array if it's not there).

Next I get the event by name and make sure there are some handlers to run.

If there are some handlers it'll just do a check to make sure that it's an array that we'll be working with for the handlers, ensure that the arguments are an array (if it's not the code will break during the `apply` method, since you **have** to pass an array as the 2nd argument to it) and then we iterate through all the handlers in the order they were added, setting the scope to what was specified.

## Programmatically playing with events

In addition to `bind` and `trigger` there are two methods which are handy if you're trying to work with events easily.

As I mentioned for the `bind` method you can pass in an ID for the event handler, well the ID can be used to remove the event:

```javascript
slace.core.eventManager.unbind("some event", "my-event");
```

What this will do is iterate through all the registered handlers and if one matches with the ID you've provided then it'll remove it from the handler collection.

If you want to get rid of all the event handlers you can just omit the handler ID and it'll clear all the handlers for that event.

Another useful feature of the `eventManager` is that it allows you to check if an event is already registered. If you had a named function that you want to bind to an event you should check to make sure it hasn't already been registered, eg:

```javascript
slace.core.eventManager.isRegistered("some event", "my-event");
```

This will return true or false depending on whether the ID you're providing matches a handler registered in that event.

You could use it like this:

```javascript
function myMethod() { ... }

/* ... */

if(!slace.core.eventManager.isRegistered('some event', 'myMethod')) {
    slace.core.eventManager.bind('somme event', myMethod);
}
```

Sure it's a sandboxed example but it should give you an idea.

## Source Code

You can grab the full source code for the `eventManager` from the project on bitbucket, which is here: [http://bitbucket.org/slace/javascript-tools/src/tip/JavaScriptTools/Scripts/slace.core.eventManager.js][2]

[1]: /client-event-pool
[2]: http://bitbucket.org/slace/javascript-tools/src/tip/JavaScriptTools/Scripts/slace.core.eventManager.js
