+++
title = "How do ECMAScript Private Fields Work in TypeScript?"
date = 2020-01-23T09:51:02+11:00
description = "Let's have a bit of a dig into how a new TypeScript feature works"
draft = false
tags = ["javascript", "typescript", "web"]
+++

I was reading the release notes for the [TypeScript 3.8 beta](https://devblogs.microsoft.com/typescript/announcing-typescript-3-8-beta?{{<cda>}}) the other day and there's a particular feature in there that caught my eye, [Private Fields](https://devblogs.microsoft.com/typescript/announcing-typescript-3-8-beta/?{{<cda>}}#ecmascript-private-fields). This is support for the [stage 3 proposal](https://github.com/tc39/proposal-class-fields/) which means it's a candidate for inclusion in a future language version (more info on the stages can be found [here](https://tc39.es/process-document/)).

What I found interesting is that although TypeScript has supported a `private` keyword it doesn't actually make the field private, it just tells the compiler, meaning that in "plain old JavaScript" you can still access the field, whereas the Private Fields implementation makes it properly _truly_ private, you can't access it. So how does TypeScript do this while still generating valid JavaScript? This was something I wanted to learn.

The easiest way to figure this out is to look at the generated JavaScript from the TypeScript compiler, so let's start with the sample from the blog post:

```ts
class Person {
    #name: string

    constructor(name: string) {
        this.#name = name;
    }

    greet() {
        console.log(`Hello, my name is ${this.#name}!`);
    }
}
```

You'll see the new syntax in the `#name` field that indicates it's a private field. If we pass this through the compiler we'll get this:

```js
"use strict";
var __classPrivateFieldSet =
    (this && this.__classPrivateFieldSet) ||
    function(receiver, privateMap, value) {
        if (!privateMap.has(receiver)) {
            throw new TypeError(
                "attempted to set private field on non-instance"
            );
        }
        privateMap.set(receiver, value);
        return value;
    };
var __classPrivateFieldGet =
    (this && this.__classPrivateFieldGet) ||
    function(receiver, privateMap) {
        if (!privateMap.has(receiver)) {
            throw new TypeError(
                "attempted to get private field on non-instance"
            );
        }
        return privateMap.get(receiver);
    };
var _name;
class Person {
    constructor(name) {
        _name.set(this, void 0);
        __classPrivateFieldSet(this, _name, name);
    }
    greet() {
        console.log(
            `Hello, my name is ${__classPrivateFieldGet(this, _name)}!`
        );
    }
}
_name = new WeakMap();
```

We'll come back to the generated functions `__classPrivateFieldSet` and `__classPrivateFieldGet` shortly, let's first look at the class:

```js
var _name;
class Person {
    constructor(name) {
        _name.set(this, void 0);
        __classPrivateFieldSet(this, _name, name);
    }
    greet() {
        console.log(
            `Hello, my name is ${__classPrivateFieldGet(this, _name)}!`
        );
    }
}
_name = new WeakMap();
```

Notice there's a variable generated called `_name` that is an instance of a [`WeakMap`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap). The `WeakMap` type in JavaScript is a special kind of key/value store that uses objects as the key, and we can see that in the `constructor` it calls `_name.set(this, void 0);`, so it's initialising the value in the store to `void 0` (which is a fancy way to write `undefined`). Now, if we were to give the field an initial value like this:

```ts
class Person {
    #name: string = "";
```

It's change the generated code to use `_name.set(this, "");`. Next it uses one of the generated functions, `__classPrivateFieldSet`, which does what you'd guess from the name, sets the value in the `WeakMap` for the current instance of the class to the value provided (it does some error checking too). Then when we want to access the value the `__classPrivateFieldGet` function is used to get the value back out of the `WeakMap` that contains it.

Something I also noticed when playing around is that if you were to add another private field:

```ts
class Person {
  #name: string = "";
  #age: number;

  constructor(name: string, age: number) {
    this.#name = name;
    this.#age = age;
  }

  greet() {
    console.log(`Hello, my name is ${this.#name} and I'm ${this.#age} years old!`);
  }
}
```

The generated code now looks like this:

```js
var _name, _age;
class Person {
    constructor(name, age) {
        _name.set(this, "");
        _age.set(this, void 0);
        __classPrivateFieldSet(this, _name, name);
        __classPrivateFieldSet(this, _age, age);
    }
    greet() {
        console.log(
            `Hello, my name is ${__classPrivateFieldGet(
                this,
                _name
            )} and I'm ${__classPrivateFieldGet(this, _age)} years old!`
        );
    }
}
_name = new WeakMap(), _age = new WeakMap();
```

We've got two `WeakMap`'s, one for each of the fields.

## Summary

TypeScripts use of the `WeakMap` and the instance of the class as the key is quite an ingenious one when it comes to doing private fields for a class, but I do wonder what the trade off would be in memory consumption, since every class will name n number of `WeakMap` instances, and do they take up much memory to the point it could be impactful?

None the less it does give me ideas for when I'm building applications and I want to have restricted access to parts of a type, using a `WeakMap` as a store might just do the trick.
