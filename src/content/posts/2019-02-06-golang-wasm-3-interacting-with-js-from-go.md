+++
title = "Learning Golang through WebAssembly - Part 3, Interacting with JavaScript from Go"
date = 2019-02-06T09:00:07+11:00
description = "Looking at interop between Go and JavaScript via WASM"
draft = false
tags = ["golang", "wasm", "javascript"]
series = "golang-wasm"
series_title = "Interacting with JavaScript from Go"
+++

## Runtime interop

In the last post we wrote our first bit of Go and used it to write a message out to the dev tools console, which is useful in terms of proving that something worked, but not really useful for an end user. For that we really need to do something that allows the JavaScript and WASM runtimes to talk to each other.

For this we're going to use a package called [`syscall/js`](https://godoc.org/syscall/js) which is part of Go 1.11 and provides us with some basic functions to undertake interop.

And this is where we start seeing that Go's approach to WASM is quite different to other languages.

## Understanding `syscall/js`

Before we dive into anything too deep I want to look a bit at `syscall/js` so we know how it works.

As you'll see from the [API docs](https://godoc.org/syscall/js) that this is a very small package exposing a very small set of features. The most important thing that is exposed from the package is the type [`Value`](https://godoc.org/syscall/js#Value) which is how Go represents data getting passed in from the JavaScript runtime, and how we request things in Go from the JavaScript runtime. This is kind of a dynamic type because it could be an `int` or a `string` or a `function` or an `object`, it really depends on how you use it, which does make it a little bit clunky to use.

## Writing to the DOM

The first thing you might want to do is move away from writing to the console and instead write to the DOM.

_Site note: We'll use raw `syscall/js` but if you're doing serious DOM manipulation you might want to look at something like [`dennwc/dom`](https://github.com/dennwc/dom) which is a wrapper `syscall/js` and gives a nicer interface._

Let's create an element and then write a message to it before adding it to the DOM.

```go
func main() {
    document := js.Global().Get("document")
    p := document.Call("createElement", "p")
    p.Set("innerHTML", "Hello WASM from Go!")
    document.Get("body").Call("appendChild", p)
}
```

Compile this like we did in the last post and fire up your application to now see that you have a new element in the DOM with a message, rather than something in the console.

Let's break it down, first we've got [`js.Global()`](https://godoc.org/syscall/js#Global), this is a call to access the JavaScript global object, `window` or `self`, depending if it's browser or node. This returns you a `js.Value` object that, through the magic of the Go runtime, will be the right thing.

I'm then using the [`Value.Get`](https://godoc.org/syscall/js#Value.Get) function to access a property of the global object, `document` and then using the shorthand assignment `:=` assigning that to a Go variable called `document`.

Since `document` is of type `js.Value` we can then interact with it, and in-tern interact with the DOM, so I can use [`Value.Call`](https://godoc.org/syscall/js#Value.Call) to invoke a function of the object, `createElement`, passing in any arguments, `"p"` which returns the result as a `js.Value`, which in this case is the newly created DOM element, winding up in `p`.

On our new DOM element we can call [`Value.Set`](https://godoc.org/syscall/js#Value.Set) which will assign a property of the object, `innerHTML` to our message.

Finally, we use `Get` to access `body` (from `document`) and `Call` the function `appendChild`, giving it `p` so our new element appears in the DOM as we would expect.

Phew! See what I mean by it being a bit cumbersome? This is why I'd expect if you're really getting serious about DOM interactions from Go that you'll use a wrapper package or write your to fit your needs.

## Calling Go from JavaScript

We've looked at going from Go to JavaScript but what if we want to go the other way and call into Go from JavaScript? After all, that's one of the big draw cards of WASM, compiling a native module that would be overly complex to reproduce in JavaScript, but then using it from JavaScript just like any other function.

And here is where we find the biggest problem I have with Go's approach to WASM relative to the others (C/C++/Rust). Let's say I want to do this:

```js
const el = document.createElement('p');
el.innerHTML = goRuntime.someFunction("hello");
document.body.appendChild('el');
```

We're wanting to invoke a function, `someFunction` on the Go/WASM runtime from JavaScript. Ignoring the trivial nature of the code, this is the kind of thing that you'd want to do.

Now in an ideal world of WASM we would get some exports provided to us (see the **A Quick WebAssembly Primer** of the last post), but Go doesn't work that way, that's not how we export functions. Instead we have to register them with the browser using `Set` and a [`FuncOf`](https://godoc.org/syscall/js#FuncOf):

```go
js.Global().Set("someFunction", js.FuncOf(someFunction))
```

This will then create a global function called `someFunction` that you can invoke from JavaScript. Now it doesn't _have_ to be a global function, you could use `js.Global().Get(...)` and nest a bunch of `Get`'s to "namespace" your function, but you'd need to ensure that object exists in JavaScript first.

I find this quite ugly as it really feels like you're violating the encapsulation of WASM by not using the `instance.exports` that you should when you startup WASM.

## Creating a callable function

Complaining aside, let's get back to our example. Rather than hard-coding a message, let's allow you to send it from JavaScript. We'll create a new function for this and register the callback.

```go
package main

import (
    "syscall/js"
)

func printMessage(this js.Value, inputs []js.Value) interface{} {
    message := inputs[0].String()

    document := js.Global().Get("document")
    p := document.Call("createElement", "p")
    p.Set("innerHTML", message)
    document.Get("body").Call("appendChild", p)
}

func main() {
    js.Global().Set("printMessage", js.FuncOf(printMessage))
}
```

The main addition to this is the `printMessage` function, it takes an array of `js.Value` for arguments and doesn't return a value.

But why does it take an array? Well apart from the fact that `js.FuncOf` requires it to, it's because JavaScript can have as many arguments provided to a function as you like, you just name the ones you care about and handle the magic `arguments` (or define a spread) if you want more. And also, JavaScript has a pretty weak type system compared to Go, so while you might _want_ a string there's nothing stopping the caller passing in a number or a function, so Go forces you to use this boxed `struct` in `js.Value` and then you can unpack it as required using `Value.String` or `Value.Int` or whatever type you want.

Now compile it, launch a browser, open the dev tools, call your globally declared function and you'll get this error message:

```
printMessage("")
 wasm_exec.js:378 Uncaught Error: bad callback: Go program has already exited
     at global.Go._resolveCallbackPromise (wasm_exec.js:378)
     at wasm_exec.js:394
     at <anonymous>:1:1
```

_sad trombone_

## Go + WASM is an Application, not a Library

If you've done much reading on WASM then you'll see that it's intended to be treated like a library that you call out to, you use it to encapsulate functionality that would be hard to convert from C/C++/Rust to JavaScript, so you just load that native library and invoke the functions it exports.

Go takes a different approach, Go treats this as an _application_, meaning that you start a Go runtime, it runs, then exits and you can't interact with it. This, coincidentally, is the error message that you're seeing, our Go application has completed and cleaned up.

To me this feels more closer to the .NET Console Application than it does to a web application. A web application doesn't _really_ end, at least, not in the same manner as a process.

And this leads us to a problem, if we want to be able to call stuff, but the runtime want to shut down, what do we do?

## Introducing Channels

Basically we want to tell Go that we don't want it to exit until we tell it that we want it to exit and the easiest way to do this is with a [channel](https://tour.golang.org/concurrency/2).

A channel is something that waits for data to be sent into it and will pause the execution until it receives data on it.

First off we'll make the channel by adding this line into our `main` function:

```go
c := make(chan bool)
```

We're using the built-in `make` function, specifying the `chan` keyword with the type of data that we expect over the channel. The type is somewhat arbitrary since we're never planning to push data over the channel, I just chose `bool` for fun.

Now we need to tell the application to wait for the channel to receive data, we do this by adding this line where we want execution to pause:

```go
<-c
```

This would make a `main` function look like so:

```go
func main() {
    c := make(chan bool)
    js.Global().Set("printMessage", js.FuncOf(printMessage))
    <-c
}
```

Now if you build and run your application you can execute the `printMessage` function as many times as you like from the console!

As an aside, you can use channels for a lot more than stopping the application from quitting, such as combining channels with [goroutines](https://tour.golang.org/concurrency/1) but they are beyond the scope of what I'm covering at this point.

### Bonus - Using Channels to Kill You App

We're using a channel to "hold" out application open, but what if you did want to terminate it? Maybe there's a scenario where you want to cleanup your WASM application, or maybe it's only intended to be used for a short period of time before being shutdown?

Well we can leverage the channel for that.

Here's a slightly modified version of the demo code:

```go
package main

import (
	"syscall/js"
)

var c chan bool

func init() {
	c = make(chan bool)
}

func printMessage(this js.Value, inputs []js.Value) interface{} {
	message := inputs[0].String()

	document := js.Global().Get("document")
	p := document.Call("createElement", "p")
	p.Set("innerHTML", message)
	document.Get("body").Call("appendChild", p)

	c <- true
}

func main() {
	js.Global().Set("printMessage", js.FuncOf(printMessage))
	<-c
	println("We are out of here")
}
```

First thing you'll notice is that I've defined the channel as a package-scoped variable with `var c chan bool`. This makes it available throughout this package, not just on the stack of the `main` function.

Next I've introduced a function called `init`. We haven't talked about `init` yet, but `init` is a special function that is called, if it exists, before the `main` function, allowing us to setup stuff that might need to be setup. Here I'm using it to setup the channel that we're using.

Our `main` function still waits for our channel to receive data, and after it does it'll print out a message to the console. But what you will also notice is that inside `printMessage` I do push data over the channel on the last line I do:

```go
c <- true
```

This puts the value `true` into the channel, which then flows through to the `main` function and since we're not really doing anything on receive it just continues through, prints a message, and our application is done.

Pretty cool how you can control execution flow here with the channel.

## Conclusion

Today we looked at how we can start interacting with the DOM from our Go WASM application and then how we can get JavaScript to interact with WASM. Sure, much of how we did our interaction was via the dev tools to invoke the `printMessage` function we're defining, but you can see how we might be able to make it a bit smarter and bind that to an event on the page instead.

We've also seen one of the painful parts of Go's approach to WASM, that it's treated like an application not a library, and that we have to do something that feels a little dirty to ensure it is always available within our JavaScript application. This does feel like a design choice of Go on how to leverage WASM, but it still is quite jarring when you compare it to the rest of the WASM information you'll find on the web.