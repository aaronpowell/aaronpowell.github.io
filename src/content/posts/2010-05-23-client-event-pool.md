---
title: "Client Event Pool"
metaTitle: "Client Event Pool"
description: "Client event pools are great to have disconnected AJAX components on a page"
revised: "2010-09-13"
date: "2010-05-23"
tags:
    - "javascript"
    - "ajax"
    - "ms-ajax"
migrated: "true"
urls:
    - "/client-event-pool"
summary: ""
---

I read an article last year about implementing a [Client Event Pool][1] and I really liked the concept. Joel shows a very good way to use it but I've been doing my best to find a logical use for it myself.

Anyone not familiar with the concept of a Client Event Pool it's covered in Joel's post, but the short version is that a Client Event Pool is a browser-level event handler which is designed to allow events to be easily passed between unlinked components.
One component can raise an event which can be chosen to be handled by any other. Inversely events can be listened for even if the component isn't on the page or the event isn't used.

This isn't really a new concept, you can achieve it (to a certain extent) with standard ASP.NET, with the `OnClient<EventName>` which is on a lot of the standard ASP.NET controls.

And in this article I'm going to look at how to integrate a Client Event Pool with the ASP.NET AJAX Control Toolkit's Modal Popup.
Now, don't get me wrong, this isn't the only way to add the events to a modal popup control, there are a lot of event handlers which can be added without a Client Event Pool.

This all came about when I was tasked with integrating a login, forgotten password and change password component. Each were their own modal popups and each were separate .NET UserControls. I wasn't involved with developing any of them, and I didn't want to really do much to modify any of them too much and introduce more bugs in the system by screwing around with stuff I'm not familiar with.
Because they are all separate I didn't have a real way to pass the ID of the control that was to make the popup appear. Oh, and to make thing more complicated there were 2 links for each popup, sadly the Modal Popup doesn't support multiple controls to do the popping-up (or as far as I'm aware...)

I also didn't want each of the popups to overlay each other, it doesn't really look that good (as I'll show shortly), so I needed a way to hide the master popup when the child was shown, and then when the child was hidden I want the master to reappear.

So I'm doing 3 basic controls for my example, a Login control:

![][2][Full size][3]

a Forgotten Password control:

![][4][Full size][5]

a Registration control:

![][6][Full size][7]

And add a dash of CSS and you get a lovely little popup:

![][8]

(Ok, so my design skills aren't great!)

So now it's time to tie up the master control with the child controls. To do this I'm going to have 2 events raised from the child controls, one for when the popup is shown and one for when it is hidden.
I'm also going to have an event which can be raised elsewhere on each child control which will initiate the showing of the popup (you could add one for the hiding, but I'm using the inbuilt hiding from the CancelControlID property of the modal popup).

For each they will look as follows:

![][9][Full size][10]

Lets have a look at how they work, first off I locate the the `Sys.Component` instance of the ModalPopup control.
There are `showing` and `hiding` events fired off from the ModalPopup, so I'm going to add a handler, the handler though will just be a stub which in-turn raises an event within our Client Event Pool. I've given them names which will indicate what they are used for.
Lastly I'm going to add an event handler so anyone can raise an event which will show the popup.

Now lets have a look in the Login control:

![][11][Full size][12]

The first 2 lines of this is adding event handlers to the links on the control. All they do is tell the Client Event Pool to raise an event, an event which I previously set up to be consumed by the child controls.

Next we set up the Client Event Pool to listen for the hide and show events from our child controls.
It listens for the events to be raised and when they are it'll either hide or show the modal on the current page.
Admittedly I've gone a little bit overboard with my events between the two child controls. Each could just raise events like `hideParent` and `showParent`, and then I would only need 2 handlers against the Client Event Pool, but to illistrate my point I've gone the verbos method.

Now I've gone for having the popups showing like this:

![][13]

To this:

![][14]

Admittedly static images can't really show how it works, but it's much nicer to not overlay popups, and ability to having popups automatically hiding and showing the loss-of-focus ones is a really sweet idea.

I'll admit that it's possible to do this without the need for a Client Event Pool, you can expose all the appropriate properties on the child controls which then can be set appropriately within it's parent, but think of it a step further, if you wanted a link on the Forgot Password to the Registration page. Because they aren't really aware of each other it is very difficult to achieve (but not impossible). Your UserControl can also expose wrappers to the Showing and Hiding client events on the modal popup, but it still has the same problem as mentioned previously.

And there we have it, a nice little example of how to use a Client Event Pool to make it easier to link previously unlinked components in a soft way.

The source code for this article can be found [here][15].

## Framework agnostic

So in the above demo I've shown how to play around with it if you're using MS Ajax, but not every site we build will have MS Ajax as part of it.

I was recently doing a build where I wanted to use the event pool concept, but didn't want to use MS Ajax. So I set about simulating the concept in a framework agnostic way.

```javascript
EventManager = (function() {
    var events = {};

    var getEvent = function(id) {
        if (!events[id]) {
            events[id] = [];
        }
        return events[id];
    };

    return {
        bind: function(name, fn) {
            var e = getEvent(name);
            e.push(fn);
        },
        trigger: function(name, source, args) {
            var evt = getEvent(name);
            if (!evt || evt.length === 0) return null;
            evt = evt.length === 1 ? [evt[0]] : Array.apply(null, evt);
            for (var i = 0, l = evt.length; i < l; i++) {
                if (args.constructor !== Array) args = [args];
                evt[i].apply(source, args);
            }
        }
    };
})();
```

This will create a global `EventManager` object (which sits at the window level) which has a `bind` and `trigger` event (which is the naming convention used by jQuery).

You `bind` to `EventManager` an event name you want to listen for, like so:

```javascript
EventManager.bind("hideParent", function(args) {
    /* do stuff */
});
```

The `args` property is actually an array of all the arguments passed into the method by the `trigger` method, which is used like so:

```javascript
EventManager.trigger("hideParent", this, { Hello: "World" });
```

`args` can really be anything, from an object to an array, but I like to use single objects when passing around. You also need to pass in an object into the 2nd parameter which defines what will be used for the `this` scope of the event handlers which are triggered.

## Conclusion

Hopefully this has been a bit of fun looking at how you can use MS Ajax or a generic implementation of a client event pool to have disconnected AJAX functionality.

[1]: http://seejoelprogram.wordpress.com/2008/07/31/a-client-event-pool-in-javascript/
[2]: https://www.aaron-powell.com/get/media/1944/picture%201.jpg
[3]: https://www.aaron-powell.com/get/media/1944/picture%201.png
[4]: https://www.aaron-powell.com/get/media/1949/picture%202.jpg
[5]: https://www.aaron-powell.com/get/media/1949/picture%202.png
[6]: https://www.aaron-powell.com/get/media/1954/picture%203.jpg
[7]: https://www.aaron-powell.com/get/media/1954/picture%203.png
[8]: https://www.aaron-powell.com/get/media/1959/picture%204.png
[9]: https://www.aaron-powell.com/get/media/1969/picture%206.jpg
[10]: https://www.aaron-powell.com/get/media/1964/picture%205.png
[11]: https://www.aaron-powell.com/get/media/1979/picture%207.jpg
[12]: https://www.aaron-powell.com/get/media/1979/picture%207.png
[13]: https://www.aaron-powell.com/get/media/1974/picture%208.png
[14]: https://www.aaron-powell.com/get/media/1984/picture%209.png
[15]: /get/web-dev/clienteventpooldemo.zip
