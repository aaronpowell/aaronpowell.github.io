---
title: "Learning redux with reducks - middleware"
date: "2016-07-17"
tags:
    - "javascript"
    - "redux"
    - "reducks"
description: "Time to take a look at middleware"
series: "redux"
series_title: "Middleware"
---

[Last time](https://www.aaron-powell.com/posts/2016-06-27-learning-redux-with-reducks-multiple-reducers.html) we learnt how multiple reducers worked and today we're going to look at intercepting the pipeline of actions to reducers, through the use of middleware.

## What is middleware?

When working with frameworks you're likely to hit a situation where you want to intercept the pipeline of functionality. This is quite common across frameworks these days as they open up a method of extensibility without requiring class overrides or forking source code.

The basic premise is that you provide a function that will be run when the processing is happening. Generally the middleware will be provided with the data for the pipeline that's being processed and a callback to the next method in the pipeline. In an ASP.Net or ExpressJS application this would be when a request comes in, in redux this would be when an action is being dispatched.

## Middleware in redux

In redux middleware is used to intercept the `dispatch` method as it is being invoked, allowing you to interact with the `action` before the reducer(s) are invoked.

So where would you use this? One example is if you had an asynchronous action payload, say an AJAX call. Well the _real_ payload isn't known when you create the action, it'll come later once the AJAX call is completed. So you might want to suspend the call to the reducers until **after** the call completes, this creating the payload from the response. Now you _could_ buffer the call to `store.dispatch` until after the AJAx call completes, but now you're application is a hybrid of redux and non-redux logic.

But for this post we're not going to use an AJAX call, instead we're going to use validation. I want certain types of validation against the `payload` of certain actions, example - you need a non-empty value for the payload of `ADD_TODO`.

### Anatomy of a middleware function

In redux a middleware function is actually made up of a series of chained, or curried, functions, with a signature like:

```js
let middlewareFunction = store => next => action => next(action);
```

So we get:

-   A store, well actually an API that is a subset of the store
-   The next "step in the chain"
-   The action being invoked

Well, if we want to make a validation middleware it'd be like so:

```js
import { ADD_TODO, ADD_ABORTED } from "../actions/types";

export const notEmptyValidator = store => next => action => {
    if (
        action.type === ADD_TODO &&
        (!action.payload || !action.payload.trim())
    ) {
        return store.dispatch({
            type: ADD_ABORTED,
            payload: "The name of the todo cannot be empty or a blank string"
        });
    }

    return next(action);
};
```

As you can see here we're checking some information about the incoming action. If our validation fails we instigate a new `dispatch` call to the `store`, if it doesn't we just pass through.

## Implementing middleware support

Within redux middleware is tied together through a `applyMiddleware` function, the result of which becomes the third argument of our `createStore` call.

We'll start by updating our `createStore` method:

```js
export default function createStore (reducer, initialState, enhancer) {
    if (typeof initialState === 'function' && typeof enhancer === 'undefined') {
        enhancer = initialState;
        initialState = undefined;
    }

    let state;
    let currentSubscriptions = [];
    let nextSubscriptions = currentSubscriptions;

    if (typeof enhancer !== 'undefined') {
        return enhancer(createStore)(reducer, initialState);
    }
    ...
};
```

So we've added a third argument to the function, which if provided (or the `initialState` is skipped) is invoked and returned. You'll notice that the `enhancer` (which is our `applyMiddleware` or any other approach to extending our store) takes the `store` as an argument and returns a new function that mimics the `createStore` behaviour, so we can immediately invoke it and return it.

## Implementing `applyMiddleware`

Alright, let's get started on implementing our `applyMiddleware` feature:

```js
export default (...middlewares) => {
    return createStore => (reducer, initialState) => {};
};
```

The first thing we need to do is create our store. Low and behold we've been provided everything that we could need to create the store too!

```js
export default (...middlewares) => {
    return (createStore) => (reducer, initialState) => {
        const store = createStore(reducer, initialState);
        ...
    };
};
```

Now this is were we learn really how the middleware works internally, we create a new `dispatch` method which is a chain calling through all the middlewares. We'll start by grabbing a reference to the `dispatch` method locally, with this local one we can change it without overriding the original reference on `store`.

```js
export default (...middlewares) => {
    return createStore => (reducer, initialState) => {
        const store = createStore(reducer, initialState);
        var dispatch = store.dispatch;
    };
};
```

Next we'll invoke the first method in our middleware function, and that receives the `store` instance provided to it, but we're only going to give it a subset of the `store` API, really all we want the middleware to have access to is `getState` and `dispatch`. We don't want middleware subscribing now do we? So how about we setup our middleware chain:

```js
export default (...middlewares) => {
    return createStore => (reducer, initialState) => {
        const store = createStore(reducer, initialState);
        var dispatch = store.dispatch;

        var middlewareAPI = {
            getState: store.getState,
            dispatch: action => dispatch(action)
        };

        var chain = middlewares.map(m => m(middlewareAPI));
    };
};
```

And the last step is that we need to return a `store`, because after all, this method is being used to create the full `store` instance! While we have the original store, we're not going to use that as our return value, because we're going to create a new `dispatch` method, as I mentioned earlier. This `dispatch` method is actually a wrapper around the original `dispatch`, but is a recursive call through each middleware. To do this I'm going to pull the logic out into a new function, in a new file, called `compose`. This `compose` function will take an array and return a new function that we invoke with the final method for the chain to execute and will return a new entry point function. Let's start with it's usage:

```js
import compose from "./compose";

export default (...middlewares) => {
    return createStore => (reducer, initialState) => {
        const store = createStore(reducer, initialState);
        var dispatch = store.dispatch;

        var middlewareAPI = {
            getState: store.getState,
            dispatch: action => dispatch(action)
        };

        var chain = middlewares.map(m => m(middlewareAPI));
        dispatch = compose(...chain)(store.dispatch);

        return { ...store, dispatch };
    };
};
```

You can see we use `compose` to create a new `dispatch` call and then combine that with the spread operator to create a new store but using our reworked `dispatch` call.

So how does `compose` look?

```js
export default (...funcs) => {
    if (!funcs.length) {
        return arg => arg;
    }

    const last = funcs[funcs.length - 1];
    const rest = funcs.slice(0, -1);

    return (...args) =>
        rest.reduceRight((composed, func) => func(composed), last(...args));
};
```

It's not particularly complex, you'll see that there's a _noop_ handler there (if you call it without any functions), but assuming there are some functions we grab the last one, walk backwards through the remaining and append the last on the head, bound to the _default_ value, our `next` argument, which in our usage so far is `store.dispatch`.

## Conclusion

There you have it, we've added `middleware` to reducks! We've seen that middleware is really just overriding the way `dispatch` works so that it keeps calling itself in a chain, passing through actions as needed.

As usual you'll find the code [here](https://github.com/aaronpowell/reducks/tree/demo-middleware).
