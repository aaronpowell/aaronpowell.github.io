+++
title = "Learning Golang through WebAssembly - Part 4, Sending a Response to JavaScript"
date = 2019-02-07T09:11:22+11:00
description = "We've learnt how to write to the DOM, but how about returning values to JavaScript functions?"
draft = false
tags = ["golang", "wasm", "javascript"]
series = "golang-wasm"
series_title = "Sending a response to JavaScript"
+++

## Returning to JavaScript

We've learnt how we can use `syscall/js` to create and manipulate DOM elements from our Go functions, but what if we want to treat Go like a library and execute a function to get a value back? Maybe we have an image processing library we want to use that was written in Go, or we want to use some functionality that our core business application has in it.

My first thought was to create a function that returns a value:

```go
func printMessage(inputs []js.Value) string {
    message := inputs[0].String()

    return "Did you say " + message
}
```

And immediately we hit an error because `js.FuncOf` takes a signature of `func(args []js.Value)`, meaning it takes a function that doesn't return anything, a `void` function (if you were to C# it).

Right, back to the drawing board.

## Callback Time!

As JavaScript developers we are very use to things being asynchronously executed, or at least, implied async, and we've always done this with a callback pattern.

In Node.js this is really prevalent:

```js
const fs = require('fs');
fs.readFile('/path/to/file.txt', (err, data) => {
    // do stuff
});
```

We pass a function as the last argument that thats two arguments, and error object and the output of the function executing successfully. We'd then test if `err` contained anything, throw if it does, continue if it doesn't.

This then got me thinking, would it be so bad to implement **that** as a pattern when it comes to talking to Go? It seems logical, because we're shelling out to another runtime, we shouldn't have to wait for it to complete before we continue on in our application, we should treat it like an async operation.

## Preparing Go for callbacks

Let's start updating our Go code to handle the idea of this callback pattern. Since we're given an array of `js.Value` we'll have to make an assumption about where the callback lives in that array. I'm going to follow how Node.js has done it and make an assumption that the last argument passed in was the callback function.

```go
func printMessage(inputs []js.Value) {
    callback := inputs[len(inputs)-1:][0]
    // todo
}
```

This is the same as doing `const callback = inputs.slice(inputs.length - 1)` in JavaScript, we're using the `len` Go function to take a subset of the array from the last item to the end (which will always be 1 item) and then grabbing that single value (since we get an array of length 1 and just need the value). Alternatively, you could write `inputs[len(inputs)-1]`, but I'm just experimenting with Go syntax and trying to learn what things do.

_You might want to do a [`Value.Type`](https://godoc.org/syscall/js#Value.Type) test against `callback` to make sure it is a JavaScript function and then fail if it isn't, but I'm going to omit error handling for now._

Now that we have a `js.Value` that represents our JavaScript callback we can call it using [`Value.Invoke`](https://godoc.org/syscall/js#Value.Invoke), which is like `Value.Call` that we saw in the last post but for use when you have a value that _is_ a function, not an object that _has_ a function.

Because I'm using the err/data style with the callback I'll pass `null` when there isn't an error (you could also pass `undefined`, pick your poison).

This results in our Go function looking like so:

```go
func printMessage(inputs []js.Value) {
    callback := inputs[len(inputs)-1:][0]
    message := inputs[0].String()

    callback.Invoke(js.Null(), "Did you say " + message)
}
```

## Updating our JavaScript

With our Go code updated it's time to improve how we call it from JavaScript:

```js
printMessage('JS calling Go and back again!', (err, message) => {
    if (err) {
        console.error(err);
        return;
    }

    console.log(message);
});
```

Obviously I'm going pretty simplistic here and just writing a message to the console but you could be pushing that into a DOM element you create via JavaScript, it could be sent as a fetch request, or do anything else that you might want to do from a JavaScript application.

## Conclusion

We've now seen how we can really break down the barriers between Go and JavaScript and start treating Go functions just like any other function we might use in a JavaScript application, whether they have come from another JavaScript module, the browser or the runtime.

Treating it like an async operation and using the callback pattern really makes it feel like just any old piece of JavaScript that you might be working with. It does become a bit cumbersome in the Go side of things, but so far that's been my experience with Go's approach to WebAssembly, it's either all in on Go or no Go (zing!).

### Bonus - Promisifying Go

The callback pattern is fine, but it can lead to callback hell. It also means we can't use the sexy new `async/await` keywords.

Let's just wrap it with a Promise!

```js
function printMessagePromise(msg) {
    return new Promise((resolve, reject) => {
        printMessage(msg, (err, message) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(message);
        });
    });
}

async function doStuff() {
    let msg = await printMessagePromise('JS calling Go and back again!');

    console.log(msg);
}

doStuff();
```

Alternatively you could pass in the `resolve` and `reject` callbacks and then Go makes a decision in which to invoke, but I prefer the callback pattern as it introduces less decision trees in the Go codebase.