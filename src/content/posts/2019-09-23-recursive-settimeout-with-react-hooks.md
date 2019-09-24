+++
title = "Recursive setTimeout with React Hooks"
date = 2019-09-23T11:44:09+10:00
description = "How to use React Hooks to create a polling API using setTimeout"
draft = false
tags = ["react", "javascript", "typescript"]
+++

I'm working on a project at the moment where I need to be able to poll an API periodically and I'm building the application using React. I hadn't had a chance to play with [React Hooks](https://reactjs.org/docs/hooks-intro.html) yet so I took this as an opportunity to learn a bit about them and see how to solve something that I would normally have done with class-based components and state, but do it with Hooks.

When I was getting started I kept hitting problems as either the Hook wasn't updating state, or it was being overly aggressive in setting up timers, to the point where I'd have dozens running at the same time.

After doing some research I came across a post by [Dan Abramov](https://mobile.twitter.com/dan_abramov) on how to implement a Hook to work with [`setInterval`](https://overreacted.io/making-setinterval-declarative-with-react-hooks/). Dan does a great job of explaining the approach that needs to be taken and the reasons for particular approaches, so go ahead and read it before continuing on in my post as I won't do it justice.

Initially, I started using this Hook from Dan as it did what I needed to do, unfortunately, I found that the API I was hitting had an inconsistence in response time, which resulted in an explosion of concurrent requests, and I was thrashing the server, not a good idea! But this was to be expected using `setInterval`, it doesn't wait until the last response is completed before starting another interval timer. Instead I should be using `setTimeout` in a recursive way, like so:

```js
const callback = () => {
    console.log("I was called!");
    setTimeout(callback, 1000);
};
callback();
```

In this example the console is written to approximately once every second, but if for some reason it took longer than _basically instantly_ to write to the console (say, you had a breakpoint) a new timer isn't started, meaning there'll only ever be one pending invocation.

This is a much better way to do polling than using `setInterval`.

## Implementing Recursive `setTimeout` with React Hooks

With React I've created a [custom hook](https://reactjs.org/docs/hooks-custom.html) like Dan's `useInterval`:

```typescript
import React, { useEffect, useRef } from "react";

function useRecursiveTimeout<T>(
    callback: () => Promise<T> | (() => void),
    delay: number | null
) {
    const savedCallback = useRef(callback);

    // Remember the latest callback.
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the timeout loop.
    useEffect(() => {
        let id: NodeJS.Timeout;
        function tick() {
            const ret = savedCallback.current();

            if (ret instanceof Promise) {
                ret.then(() => {
                    if (delay !== null) {
                        id = setTimeout(tick, delay);
                    }
                });
            } else {
                if (delay !== null) {
                    id = setTimeout(tick, delay);
                }
            }
        }
        if (delay !== null) {
            id = setTimeout(tick, delay);
            return () => id && clearTimeout(id);
        }
    }, [delay]);
}

export default useRecursiveTimeout;
```

The way this works is that the `tick` function will invoke the `callback` provided (which is the function to recursively call) and then schedule it with `setTimeout`. Once the callback completes the return value is checked to see if it is a `Promise`, and if it is, wait for the `Promise` to complete before scheduling the next iteration, otherwise it'll schedule it. This means that it can be used in both a synchronous and asynchronous manner:

```js
useRecursiveTimeout(() => {
    console.log("I was called recusively, and synchronously");
}, 1000);

useRecursiveTimeout(async () => {
    await fetch("https://httpstat.us/200");
    console.log("Fetch called!");
}, 1000);
```

Here's a demo:

{{< codesandbox id="quizzical-sun-r8zkq" >}}

## Conclusion

Hooks are pretty cool but it can be a bit trickier to integrate them with some APIs in JavaScript, such as working with timers. Hopefully this example with `setTimeout` is useful for you, feel free to copy the code or put it on `npm` yourself.
