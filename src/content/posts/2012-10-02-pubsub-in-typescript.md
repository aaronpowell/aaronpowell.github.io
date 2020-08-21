---
title: "PubSub in TypeScript"
metaTitle: "PubSub in TypeScript"
description: "It's that time again, time for more Pub/Sub!"
revised: "2012-10-02"
date: "2012-10-02"
tags:
    - "typescript"
    - "javascript"
    - "web"
migrated: "true"
urls:
    - "/web/pubsub-in-typescript"
summary: ""
---

Pub/Sub is my Hello World, I've done it not [once](https://www.aaron-powell.com/client-event-pool) but [twice](https://www.aaron-powell.com/javascript-eventmanager) in JavaScript and [once](https://www.aaron-powell.com/javascript/postman) in CoffeeScript (although technically that has a 3rd version in JavaScript at the start of the post :P).

Well you may have heard of Microsoft's answer to application-scale JavaScript called [TypeScript](http://www.typescriptlang.org/) so I thought I'd write a pub/ sub library in it too.

```typescript
module PubSub {
    var registry = {};
    var pub = function(name: string, ...args: any) {
        if (!registry[name]) return;

        registry[name].forEach(x => {
            x.apply(null, args);
        });
    };
    var sub = function(name: string, fn: any) {
        if (!registry[name]) {
            registry[name] = [fn];
        } else {
            registry[name].push(fn);
        }
    };
    export var Pub = pub;
    export var Sub = sub;
}
```

It's pretty simplistic and I've gone with using the `Array.forEach` method rather than just a normal `for` loop for no reason other than I felt like it.

It could be used like so:

```typescript
PubSub.Sub("foo", function(...args: any) {
    args.forEach(x => {
        console.log("argument", x);
    });
});

PubSub.Pub("foo", 1, 2, 3, 4, 5);

setTimeout(() => {
    PubSub.Pub("foo", "a", "b", "c");
}, 1000);
```

See, it's just a pub/ sub library.

There is a few interesting thoughts here though:

-   `function` is not valid as an argument constraint
    -   I'm assuming that's just a limitation in the current compiler, you have to use `any` instead
-   They have splat support, `...args`, which is another ES6 proposal and can be quite useful
-   I couldn't work out how to define a `class` or `interface` to accurately represent what `registry` is, since it's really an expando object
-   You always have to do `export var <member name> = <what to export>`, this annoyed me as I like to define everything up front and then later selectively export. I kept getting errors with `export pub` because I didn't have a `var` in there

# Conclusion

For me it's pretty _meh_ an experience. I've been doing JavaScript for long enough that the features added to _language_ thus far aren't a really compelling reason to go and write it over JavaScript.

What I have liked is the ability to use ES6 idioms (splats, modules, etc) is nice.

I'm curious to see what other things it will drive _cough source maps cough_ in the future, but for the time being I'm not going to convert all my JavaScript files over.
