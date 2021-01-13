---
title: "Learning redux with reducks - creating a Store"
date: "2016-06-09"
tags:
    - "javascript"
    - "redux"
    - "reducks"
description: "An introduction to the Store and how to make a simple one."
series: "redux"
series_title: "The Store"
---

[Last time](https://www.aaron-powell.com/posts/2016-06-06-learning-redux-with-reducks-intro.html) we learnt the basics of what Redux is and what it does, now it's time to start looking at how it works.

Before we get started, I've created a little app that we'll be using. Because I wanted to illustrate that Redux isn't **just** for React our sample application is _not_ going to be a React application, it's actually going to be a little console application. You'll find the starting point for the code [here](https://github.com/aaronpowell/reducks/tree/demo-app-setup).

![Demo app in action](/get/reducks/reducks-demo-app.gif)

It's (obviously) a todo application, our quintessential demo app, which has a Redux Store, some Actions and Reducers. I've also created a couple of unit tests that indicate how it works. The goal of the rest of this series will be to swap out the `import { ... } from 'redux'` for the same calls into a library we'll create called Reducks.

Our first step is to create the store, and this is done by a function exposed by Redux, `createStore`.

## Implemented `createStore`

This function is the core of Redux, it takes three arguments:

-   A reducer
-   Initial State
-   Enhancers

We're going to ignore Enhancers for the moment, we'll look at that later in the series, so we'll focus on supporting the first two arguments.

The return value of calling `createStore` is a Store instance, which has four methods on it:

-   `getState`
-   `dispatch`
-   `subscribe`
-   `replaceReducer`

Again, to keep this article short we'll not cover the `replaceReducer` method, we'll look at that later in the series.

So, our basic code will look like this:

```js
const createStore = function(reducer, initialState) {
    const getState = function() {};

    const dispatch = function(action) {};

    const subscribe = function(fn) {};

    return {
        getState,
        dispatch,
        subscribe
    };
};

export default createStore;
```

Pretty simplistic huh! Now let's start making those functions do something.

### `getState`

The `getState` function is our window into what's happening within Redux, our ability to get the data within our application. The `state` in Redux is really just a plain old JavaScript object, you can define it any which way you like, you can use a library like Immutable.js if you want, it's just an object.

For our Store I'm going to want to track a `state` within it:

```js
const createStore = function (reducer, initialState) {
    let state = initialState;

    ...
```

Now we have a local `state` variable which we initialise from the consumer, and I bet you can guess how `getState` looks when implemented!

```js
    ...
    const getState = function () {
        return state;
    };
    ...
```

Fantastic, we can now get the state of our Redux store!

### `dispatch`

The `dispatch` function is what we use when we need to fire off an Action in Redux, which is why it takes an `action` argument to it. You'd use it off a store like so:

```js
store.dispatch({ type: "ADD_TODO", payload: "Todo name" });
```

Internally what it does is invokes the `reducer` which we provided the Store in `createStore`, along with the initial state of the Store, and then the result of that becomes the new state. With an Action there needs to be a `type` property, so you'd probably want to do some validation there as well, making a `dispatch` implementation look like so:

```js
    ...
    const dispatch = function (action) {
        if (typeof action.type === 'undefined') {
            throw Error('A `type` is required for an action');
        }

        state = reducer(state, action);
        return action;
    };
    ...
```

One thing you'll notice about the implementation is that we return the `action` that was passed in. This is so that the place that dispatched the action could do something once it's completed. But running directly after the `dispatch` completes might be a problem, especially when you start working with asynchronous payloads, so for that we'd want to subscribe to the Store.

### `subscribe`

The final piece of the puzzle when working with your Store is knowing when the Reducer has finished, and to do that in a way that is independent of where the `dispatch` was called from. We do this via the `subscribe` method that a Store exposes.

This method takes a function as the argument, the subscriber isn't passed any arguments, it's up to the listener to work out how to get to the state, generally using the `getState` method. It returns a new function which you can use to unsubscribe, so you don't have hold a reference to the listener function.

The implementation looks like this:

```js
    ...
    let subscriptions = [];
    const subscribe = function (fn) {
        if (typeof fn !== 'function') {
            throw Error('The provided listener must be a function');
        }

        var subscribed = true;
        subscriptions.push(fn);

        return function () {
            if (!subscribed) {
                return;
            }

            var index = subscriptions.indexOf(fn);
            subscriptions.splice(index, 1);
            subscribed = false;
        };
    };
    ...
```

Well now that we have the ability to subscribe we probably want to actually invoke the listeners when dispatching:

```js
    const dispatch = function (action) {
        if (typeof action.type === 'undefined') {
            throw Error('A `type` is required for an action');
        }

        state = reducer(state, action);

        subscriptions.forEach(fn => fn());

        return action;
    };
    ...
```

To easy!

Now one thing you might want to add to the `subscribe` function is mutation hold on the subscribers collection. The reason for this that you want the collection of listeners shouldn't change while a `dispatch` is running. So let's update our methods to handle this:

```js
    ...
    let currentSubscriptions = [];
    let nextSubscriptions = currentSubscriptions;

    const ensureCanMutateNextListeners = function () {
        if (nextSubscriptions === currentSubscriptions) {
            nextSubscriptions = currentSubscriptions.slice();
        }
    };

    const subscribe = function (fn) {
        if (typeof fn !== 'function') {
            throw Error('The provided listener must be a function');
        }

        var subscribed = true;
        ensureCanMutateNextListeners();
        nextSubscriptions.push(fn);

        return function () {
            if (!subscribed) {
                return;
            }

            ensureCanMutateNextListeners();
            var index = nextSubscriptions.indexOf(fn);
            nextSubscriptions.splice(index, 1);
            subscribed = false;
        };
    };

    const dispatch = function (action) {
        if (typeof action.type === 'undefined') {
            throw Error('A `type` is required for an action');
        }

        state = reducer(state, action);

        var subscriptions = currentSubscriptions = nextSubscriptions;

        subscriptions.forEach(fn => fn());

        return action;
    };
    ...
```

So here we have a function `ensureCanMutateNextListeners` that, when invoked, checks if the two arrays are the same array reference, if they are, use `slice` to _clone_ `currentSubscriptions` so that when we modify the `nextSubscriptions` array (adding or removing a listener) it won't impact any currently running `dispatch` pipeline. The goal here is to ensure that the listeners that are used by `dispatch` are a _point in time_, for when the `dispatch` started.

### Initialising your Store

There's one last thing that the Store does when you call `createStore` and that is to trigger an initialisation action. In Redux this can be observed by the action `redux/@@INIT` being dispatched, but for our Reducks library we'll trigger `reducks/@@INIT`. We'll add this to the very last step before returning the Store object:

```js
    ...
    const INIT_ACTION = 'reducks/@@INIT';

    dispatch({ type: INIT_ACTION });

    return {
        getState,
        dispatch,
        subscribe
    };
    ...
```

This will cause the Reducer to be run with the initial state (if provided). Now, you're reducer probably isn't subscribing to `reducks/@@INIT` (or `redux/@@INIT`), so it'll be a noop, but still, it gives you the entry hook if you so desire it.

## Conclusion

The Redux store is the core part of the application, but really it's quite simplistic in how it is implemented, but really quite powerful. We've seen how the three core methods, `getState`, `dispatch` and `subscribe` are implemented to make our Store operational.

You'll find the code in the [Reducks GitHub repo on the `reducks-baseline` tag](https://github.com/aaronpowell/reducks/tree/reducks-baseline), in the `src` folder.

Next time we'll plug Reducks into our sample application and tests to make sure that it works correctly!
