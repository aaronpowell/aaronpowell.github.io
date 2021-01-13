---
title: "Learning redux with reducks - multiple reducers"
date: "2016-06-27"
tags:
    - "javascript"
    - "redux"
    - "reducks"
description: "Working with multiple reducers"
series: "redux"
series_title: "Reducers"
---

[Last time](https://www.aaron-powell.com/posts/2016-06-09-learning-redux-with-reducks-creating-a-store.html) we added some tests to our codebase to illustrate how our implementation of Reducks works against Redux. This time I want to look to expanding the features of Reducks and today it's to support multiple reducers.

## Understanding multiple reducers

In a suitably complex Redux application you're going to want to break down your reducer into smaller reducers. Let's take our reducer code (abridged):

```js
export default function (state, action) {
    switch (action.type) {
        case TOGGLE_VISIBILITY_FILTER:
            ...

        case ADD_TODO:
            ...

        case COMPLETE_TODO:
            ...

        ...
    }
};
```

Now you can see where this is going, we're going to have a **very** large `switch` statement, resulting ugly code. So you might want to split this down into smaller functions, but there's another reason you might want to use multiple reducers is that you want to split your `state` apart. This might be done because, taking our example above, the visibility filter is independent from the lost of todos, so we could have reducers that only concerns itself with the `visibilityFilter`. Now we would have reducers looking like:

```js
function visibilityFilterReducer (state = false, action) {
    if (action.type === TOGGLE_VISIBILITY_FILTER) {
        return !state;
    }

    return state;
}

function todosReducer (state = [], action) {
    switch (action.type) {
        ...
    }
}
```

Awesome, we've got a couple of smaller reducers, but how do we use them given that `createStore` takes a single reducer?

## `combineReducers`

This is a function produced by Redux that takes an object that has all our reducers as properties, like so:

```js
export default combineReducers({
    visibilityFilter: visibilityFilterReducer,
    todos: todosReducer
});
```

What the `combineReducers` function returns is a new function that takes two arguments, `state` and `action`, which looks very much like a reducer doesn't it!

Now here's the tricky thing, the object you pass into `combineReducers` is the _shape_ of the `state` that you'll have for your application, but each reducer only has access to their _tree_, meaning that the `visibliltyFilter` property is all that is accessible to the `visibilityFilterReducer`.

### Implementing the function

So let's get started on our implementation:

```js
export default function combineReducers(reducers) {}
```

We're going to need all those reducer functions so let's deconstruct our object and get them:

```js
export default function combineReducers(reducers) {
    var keys = Object.keys(reducers);

    return function(state = {}, action) {};
}
```

So we've got our reducer names, we're returning our new reducer function, let's implement it:

```js
export default function combineReducers(reducers) {
    var keys = Object.keys(reducers);

    return function(state = {}, action) {
        return keys.reduce((newState, key) => {
            var reducer = reducers[key];
            var currentState = state[key];

            newState[key] = reducer(currentState, action);
            return newState;
        }, {});
    };
}
```

Ok, how does it work? Well we take our reducer names (`keys`) use the [reduce](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce) function with an initial state of an empty object. For each reducer we:

-   Get the current state (which will be the initial state provided to the store, or `undefined` is we use the default argument set on the new reducer function)
-   Invoke the reducer with the current state and the action
-   Return the new state

Because we're using the `reduce` array method we then combine all the new states into a new object, using the name as the reducer for the property. So after our first run (the `@@INIT` action) our `state` would look like:

```js
{
    visibilityFilter: false,
    todos: []
}
```

Pretty nifty! Since we use the reduce method we create a new `state` object _every single time_, meaning that we don't have to worry about mutating the previous state object (sure a reducer could do that, but **we** don't :P).

And then we're done.

## Conclusion

And that is how we implement multiple reducers in Reducks. Ultimately it's a bit of a misnomer, we still only have a single reducer as far as the `store` knows, but internally we're breaking apart state, using different functions to handle different parts of the state tree and creating a single application state.

Now the `combineReducers` function doesn't have to be done this way, I'm just looking at how Redux does it, but if you didn't want the reducers to handle each branch, instead have access to the whole tree you could use an array of reducers and loop over them, providing the state to each one.

I've gone ahead and updated the code, you can find it [at this tag](https://github.com/aaronpowell/reducks/tree/demo-combineReducers), I've also taken it one step further than we looked at above and split the incomplete and complete todos apart. I've also updated the tests to understand the new structure.
