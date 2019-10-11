+++
title = "Catching All Promise Errors"
date = 2019-10-11T19:21:50+11:00
description = "When a Promise falls in the woods and no one is there to catch it, does it error?"
draft = false
tags = ["javascript"]
+++

Recently I was looking into [monitoring static websites]({{<ref "/posts/2019-10-04-implementing-monitoring-in-react-using-appinsights.md">}}) and it got me thinking about global error handling. There's a good chance that you've come across the [`onerror`](https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror) global handler that's triggered when an error happens and there's no `try`/`catch` around it. But how does this work when working with Promises?

## Promise Error Handling

Let's take this example:

```js
function getJson() {
    return fetch('https://url/json')
        .then(res => res.json());
}

// or using async/await
function async getJsonAsync() {
    const res = await fetch('https://url/json');
    const json = await res.json();
    return json;
}
```

There are two errors that could happen here, the first is a network failure and the other is the response isn't valid JSON (side note, `fetch` doesn't return an error on a [404 or 500 respose](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)), but we're not doing anything to handle those errors so we'd need to rewrite it like so:

```js
function getJson() {
    return fetch('https://url/json')
        .then(res => res.json())
        .catch(err => console.log(err));
}

// or using async/await
function async getJsonAsync() {
    try {
        const res = await fetch('https://url/json');
        const json = await res.json();
        return json;
    } catch (e) {
        console.error(e);
    }
}
```

Now we are handling the rejection and our application is all the happier for it.

## Handling the Unhandled

In an ideal world, you're handling all errors that an application may have, but in reality that's not the case, there will be errors that were not planned for, which is why we have `onerror`. But, `onerror` is for handling errors that _didn't_ occur within a Promise, for that we need to look elsewhere.

Promises don't error per se, they _reject_ (which can represent an error or just being unsuccessful), and that rejection may be unhandled which will result in the [`unhandledrejection`](https://developer.mozilla.org/en-US/docs/Web/API/Window/unhandledrejection_event) event being triggered.

`onunhandledrejection` can be assigned directly off `window` like so:

```js
window.onunhandledrejection = function (error) {
    console.error(`Promise failed: ${error.reason}`);
};
```

This is _similar_ to `onerror`, but it doesn't have quite as much information provided. All you receive in this event handler is the Promise that failed and the "reason" provided to the rejection. This does mean that you don't get some useful information like source file or line number, but that's a trade-off because it's come from an async operation.

You can also call `preventDefault` on the error object which will prevent writing to `console.error`, which can be useful if you want to avoid leaking information to the debug console.

## Handling the Handled

While you can capture unhandled rejections you can also capture handled rejections using the [`rejectionhandled`](https://developer.mozilla.org/en-US/docs/Web/API/Window/rejectionhandled_event) event. While I find it annoying that it's an inconsistent name (Rejection Handled to go along with Unhandled Rejection, why aren't they consistent with where the word Rejection is!) this event handler works the same as the other one but will be triggered when a `catch` handled is provided.

This handler is useful if you're doing a monitoring platform you might want to log all rejections, handled or not.

## Conclusion

If you're building an application you should always look to include global error handling. It's very common to handle `onerror` but it's quite easy to forget about global error handling for Promises and that's easy to do with `onunhandledrejection`.