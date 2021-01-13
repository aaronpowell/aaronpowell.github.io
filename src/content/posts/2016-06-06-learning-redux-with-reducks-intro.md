---
title: "Learning redux with reducks - intro"
date: "2016-06-06"
tags:
    - "javascript"
    - "redux"
    - "reducks"
description: "A start in the series about learning the inner workings of redux"
series: "redux"
series_title: "Intro to redux"
---

Over the last 18 months I've been working with React and throughout that time I've used a number of different design patterns. For the past 6 months I've been primarily using [Redux](http://redux.js.org) and I've found it's beauty in the utter simplicty of it.

I'm the kind of person who likes to know how things work at the low levels though, because I feel if you know the low levels then you're going to be better informed about whether something is right or you're holding a hammer.

To this end I've decided to write a blog series diving into Redux and looking at creating it from the ground up, to do this I'm going to create a little library called Reducks (get it!).

Now, while it's common to come across Redux in the React community Redux is more than just a React library, and that's the topic for this first blog post, a look at the basic architecture of Redux.

## It's all about data flows

When I'm introducing Redux to people the one critical point that I want them to take away is that Redux is about how data flows through an application. To achieve this there are three core components:

-   Action
-   Reducer
-   Store

It's also cyclic notion, a Store will Dispatch an Action to get data, which is then passed to a Reducer which results in updated data for the Store.

![Redux data flow](/get/reducks/redux-data-flow.png)

### Actions

Actions are really simple objects, they are responsible for providing the instructions. Generally speaking an Action will have a `type` property on it that represents the _what_ to be done. Now, if you're implemeting Redux from scratch in your own application you don't need to use a `type` property, you can use whatever you want, but doing so you're moving away from being Redux 'as designed'.

As as Action is responsible for providing instructions you're often going to have data associated with it, this might be a `Promise` as you do an XHR, it might be some calculated data, or whatever. This is represented by whatever else you provide on the Action object. So an example Action might be like so:

```js
const action = {
    type: "ADD_TODO",
    value: "Write a blog post"
};
```

While an Action is just a plain old JavaScript object you'll probably want a function to generate it:

```js
const addTodoAction = function(value) {
    return {
        type: "ADD_TODO",
        value
    };
};
```

This way you can use the Action again and again in your application.

### Reducers

Reducers do the grunt work of your data flow, they are responsible for taking the information from the action, the present state of your data, and produce a new data state. Basically a reducer looks like this:

```js
const reducer = (state, action) => state;
```

That is a Reducer that acts as a noop. You can do whatever you want within the Reducer, the main rule is that you shouldn't change the original state (the first argument), instead create a new state object based on the original one. Commonly you'll do this using `Object.assign` or the `spread` operator `{ ...state }`.

So we'll update our noop example:

```js
const reducer = (state, action) => { ...state };
// or
const reducer = (state, action) => Object.assign({}, state, {});
```

### Store

The Store is really the heart of our data flow, it knows about our Reducers, it's told to dispatch Actions and _owns_ the State. I won't go into the implementation of a Store, that's next up in the series, but to consume a Store it'd be something like this:

```js
const store = createStore(reducer);
store.dispatch(addTodoAction("Write a blog post"));
console.dir(store.getState());
```

The basic process is:

-   Call `dispatch` with an Action
-   Execute all reducers
-   Update the State in the Store

A Store has a handy method on it, `getState` which then exposes our state back to us.

Now you're probably wanting to have a single Store within your application, a single Store, or at least the less Stores you have, the less independent State objects you would have and the easier it is to observe data changes within your application and ultimately simplify data binding.

_Side note: There's more method that are exposed by a Store, this is just the most basic implementation. Also, I didn't want to spoil all our fun in the first post!_

## Conclusion

We're starting our journey into understanding how Redux works under the hood. We've learnt about the three core concepts, Actions which tell us what to do/get us data, Reducers which take the current state and our Action to produce a new state and then the Store which orchestrates it all.

Next time we'll look into how to create our own Store.
