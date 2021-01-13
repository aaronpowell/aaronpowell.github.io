---
title: "Learning redux with reducks - tests and demo app"
date: "2016-06-09"
tags:
    - "javascript"
    - "redux"
    - "reducks"
description: "Converting our tests and demo across for use with Reducks"
series: "redux"
series_title: "Writing tests"
---

[Last time](https://www.aaron-powell.com/posts/2016-06-09-learning-redux-with-reducks-creating-a-store.html) we started creating our Reducks library by implementing the `createStore` and while I have all confidence in my ability to write bug free code we do have some tests in the demo app, so let's use them.

So, where do we start?

## Abstracting `createStore`

It's actually not _that_ complex in the way you would do this, normally within the code base you would have:

```js
import { createStore } from "redux";
```

The next step is change what we export to instead of just being the function to run you wrap it in. So with our `index.redux.js` file I have renamed that to `index.js` and added a new export:

```js
export default function (createStore) {
    ...
```

Now we can create a new `index.redux.js` file that looks like so:

```js
import { createStore } from "redux";
import app from "./index";

app(createStore);
```

And we can also create `index.reducks.js`:

```js
import { createStore } from "../src";
import app from "./index";

app(createStore);
```

Then you can run it:

```
PS> npm run reducks-demo
```

## Testing

I'm using [mocha](http://mochajs.org/) as my test framework so normally you'd write a test like so:

```js
describe('set visibility filter', () => {
    it('should change visibility when SET_VISIBILITY_FILTER action fired', () => {
        ...
    });
});
```

Well I'd be remiss to not ensure that the tests work with both libraries, so to do that I'm going to wrap the `it` scenario so that I can inject the the `createStore` function (and I also pushed it into a separate file):

```js
import { setVisibility } from "../examples/actions";
import { expect } from "chai";
import creator from "../examples/stores";

export default {
    "should change visibility when SET_VISIBILITY_FILTER action fired": createStore => done => {
        const store = creator(createStore);

        const initialState = store.getState();

        store.subscribe(() => {
            const nextState = store.getState();

            expect(nextState.visibilityFilter).not.to.equal(
                initialState.visibilityFilter
            );
            done();
        });

        store.dispatch(setVisibility(!initialState.visibilityFilter));
    }
};
```

Now let's change how our test is setup:

```js
import * as redux from "redux";
import * as reducks from "../src";

describe("set visibility filter", () => {
    describe("redux", () =>
        Object.keys(visibilityFilterTests).map(key =>
            it(key, visibilityFilterTests[key](redux.createStore))
        ));

    describe("reducks", () =>
        Object.keys(visibilityFilterTests).map(key =>
            it(key, visibilityFilterTests[key](reducks.createStore))
        ));
});
```

Using `Object.keys` I can go through the hash that's exported and create the `it` call, passing in the `createStore`. For readability I've also wrapped the test scenarios in a nested `describe` so that I can identify which library the tests were run against.

## Conclusion

This was a simple little post where we looked at how we refactored the existing code to support being able to use different implementations of Redux and support our test scenarios as we work on more features.

I've updated the repository with [a new tag](https://github.com/aaronpowell/reducks/tree/demo-and-tests) that shows the progress.
