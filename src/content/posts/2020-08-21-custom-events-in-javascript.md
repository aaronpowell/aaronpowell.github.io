+++
title = "Custom Events in JavaScript"
date = 2020-08-21T15:09:34+10:00
description = "Let's have a look at how to create and use custom events in JavaScript"
draft = false
tags = ["javascript", "web"]
+++

Messaging systems in JavaScript, [here]({{<ref "/posts/2011-07-02-postman.md">}}) [we]({{<ref "/posts/2010-09-12-javascript-eventmanager.md">}}) [go]({{<ref "/posts/2012-10-02-pubsub-in-typescript.md">}}) [again]({{<ref "/posts/2010-05-23-client-event-pool.md">}}).

Ok, so it's something I've written about a few times before, generally in the context of creating a pub/sub library, but in this post we're going to look at something a bit different, how to use the event system in the DOM.

While working with the DOM you'll undoubtedly used the events that are provided, things like `onclick`, `onchange`, `onkeypress`, etc. as these are events that the DOM will raise when it is interacted with. The invocation of these events is beyond your control, other than the fact that your interaction is probably what caused them, but we can add listeners for them and do things when the occur.

Currently on my [Twitch channel](https://twitch.tv/NumberOneAaron), I'm streaming the build of a web application that will show a selected list of timezones to allow you to compare across them. For this application I'm going framework free, meaning no React, no TypeScript, no CSS frameworks or anything like that, and doing so has meant that I'm looking at how to effectively handle things that happen within the application.

Some of the components that are in the application do things that other parts of the application might want to respond to, so for this I started to look at how we can use custom events in the browser, rather than writing a pub/sub library... _again_.

## Anatomy of a DOM Event

To understand a custom event, let's quickly look at the DOM events. DOM events all share a parent type, `Event`, but are classed for the event that represent, like `MouseEvent`, `KeyboardEvent` or `UIEvent`, to name a few. The `Event` base class has useful information such as the target of the event, whether it can bubble to parent elements or whether it can be cancelled, with the subclasses then having specific data for that event type, like the key pressed or the mouse position.

Events all bubble by default, which means that the element that the event came from isn't the only place you can listen to it, you can listen all the way up to `window`. You can see this in action by opening your browser DevTools (generally `F12`) and then running this in the JavaScript console:

```javascript
window.addEventListener("click", e => console.log(e));
```

Now start clicking around the page, notice that you get log messages appearing, and if you inspect them you'll notice that the `srcElement` property is the element that you clicked on. If you change the above code from `window` to `document` and run it, you'll now have two messages logged out, both are the same and have the same event object.

This is because th event has bubbled up from the element you originally clicked on to all of its parents until it ran out of parents. This is a useful trick if you want to have a single handler that can handle the same event from multiple places in the same way.

## Custom Events

But what if we want to create our own event? In my Twitch stream I need to update the time every second, but there could be multiple timezones in display, so how would I go about doing that? Well, I could use a `setInterval` that then uses `document.querySelectorAll` to find the elements based on the DOM structure I expect there to be, but the problem is that that becomes a little brittle, one component, the "time manager", needs to know about the internal structure of another component, the "time display".

This is where a custom event can be useful, so let's look at it. First up, we'll need to define a custom event and there's two ways to do that, either using the `CustomEvent` constructor, or by creating our own class inheriting `Event`. Here's how we can use the `CustomEvent` constructor:

```javascript
const timeUpdated = new CustomEvent("timeUpdated", { now: Date.now() });
```

`CustomEvent` takes two bits of information, first is the type of the event, and this is what you would then listen to elsewhere in your code and secondly it takes an object that contains the custom data you want to add to the event object that the listeners will receive.

Now, if you're to create your own class it'd look like this:

```javascript
class TimeUpdatedEvent extends Event {
    constructor(time) {
        super("timeUpdated");
        this.time = time;
    }
}
```

The major difference here is that we provide the event type to the `super` call in the constructor, which calls the constructor for `Event` and that in turn sets the `type`, otherwise it's very much the same. My personal preference is to create the subclass for `Event` as then I know that I'm being consistent each time that I use my custom event types.

With our custom event ready, we need to dispatch the event, and that is done with the `dispatchEvent` method which exists on anything that the browser considers and `EventTarget` (which is a fancy way of saying things that are part of the DOM).

```javascript
window.dispatchEvent(new TimeUpdatedEvent(Date.now()));
```

The last thing we need to do is to add a listener to the event:

```javascript
window.addEventListener("timeUpdated", e => {
    console.log(`The time is ${e.time}`);
});
```

There we have it, we can dispatch a custom event and then listen to it elsewhere in the code.

## Bubbling Events

Going back up to the demo where we looked at the way the `click` event worked, we saw that the event bubbled up through the parents of the originating element. We can do this ourselves as well, but we need to explicitly tell the custom event tha we want to have it bubble because by default it will only dispatch on the element that it was dispatched against, not any of its parents.

To do this, we need to set the `bubble` property to `true`:

```javascript
class TimeUpdatedEvent extends Event {
    constructor(time) {
        super("timeUpdated", { bubble: true });
        this.time = time;
    }
}
```

When using a subclass we pass this as a 2nd argument to the `super` call, and if we use `CustomEvent` directly, add it as a property of the 2nd argument there. Now when your event is dispatched it'll go through each of its parents until it hits the top of the structure and stop. This pattern is useful if you want a component to not expose its internal DOM structure in any way, but still allow outsiders to listen to events.

## Cancelling Events

Sometimes an event might be an indicator that something is about to happen. Take the `onsubmit` event from the `<form>` element which is called before form submits itself to the target, generally `POST`ing data to a server, but if you're wanting to use JavaScript to submit the form data you don't want the default browser action to continue and that is when we'd call `preventDefault` on the event. This tells the browser that the _default action_ shouldn't be done, and in the case of a form, the submit won't go ahead.

When it comes to a custom event, there's plenty of reasons we might want to stop the default action, maybe it's an indication that some data already exists in the data source so you don't want to go ahead with adding a duplicate record.

By default though a custom event can't be cancelled as the `cancelable` property is set to `false`. This can be changed by passing `cancelable: true` to the constructor. Now your event listeners can call `preventDefault` on the event and you can check the `defaultPrevented` property when the listeners are complete.

```javascript
const ce = new CustomEvent("longRunningOperation", { cancelable: true });

window.addEventListener("longRunningOperation", e => e.preventDefault());

window.dispatchEvent(ce);
if (ce.defaultPrevented) {
    console.log("you didn't want that done");
}
```

### Events are Synchronous

Something to be aware of, especially in the context of having cancelable events, is that the event listeners are executed in a synchronous manner, meaning that if your listener wants to cancel the event it'll need to make that decision without waiting for any asynchronous operation to complete (like a `Promise` continuation).

To see what I mean, try this code out:

```javascript
const ce = new CustomEvent("longRunningOperation", { cancelable: true });

window.addEventListener("longRunningOperation", async e => {
    const p = new Promise(res => {
        setTimeout(() => {
            console.log("preventing default");
            e.preventDefault();
            console.log("default prevented");
            res();
        }, 1000);
    });

    console.log("before promise");
    await p;
    console.log("after promise");
});

window.dispatchEvent(ce);
if (ce.defaultPrevented) {
    console.log("you didn't want that done");
} else {
    console.log("carry on");
}
```

What you'll see is output like so:

```
before promise
carry on
preventing default
default prevented
after promise
```

Unfortunately, we weren't able to cancel our event before it checked if we cancelled it. So be aware of this and if you need to cancel the event as the result of an async operation, you'll need to think through the design of your event system more closely.

## Conclusion

In this post we've taken a look at how we can leverage the DOM's built in event system to create our own custom events to raise between parts of our application that would better describe the intent of an event, rather than the more generic events that come out of the DOM itself.

If you want to see this in action, pop by my [Twitch stream](https://twitch.tv/NumberOneAaron), where I stream each Friday at midday (Sydney time).
