+++
title = "Learning Golang through WebAssembly - Part 2, Writing your first piece of Go"
date = 2019-02-05T09:00:56+11:00
description = "Writing your first piece of Go to combine with WASM"
draft = false
tags = ["golang", "wasm", "javascript"]
series = "golang-wasm"
series_title = "Writing your first piece of Go"
+++

## Hello WASM, Go style

You've got your [Golang dev environment setup]({{< ref "/posts/2019-02-04-golang-wasm-1-introduction.md" >}}) and now it's time to put it to good use.

We're going to start really basic and write what amounts to a Hello World code:

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello WASM from Go!")
}
```

Well... that's not particularly exciting, but let's break it down to understand just what we're doing here (after all, I'm expecting this might be your first time looking at Go).

```go
package main
```

Here's how we initialise our Go application, we define a `main` package which becomes our entry point. This is what the Go runtime will look for when it starts up so it knows where the beginning is. Think of it like `class Program` in C# for a console application.

_Side note: I just said "our Go application", and that's something that you need to think differently about with Go + WASM, we're not just writing a bunch of random files that we talk to from the browser, we're building an application that we compile specifically to run in the WASM virtual machine. This will make a bit more sense as we go along._

```go
import "fmt"
```

This is how Go brings in external packages that we want to work with. In this case I'm pulling in the `fmt` package from Go's standard library that gives us something to work with later on. It's like `open System` in F#, `using System` in C#, or `import foo from 'bar';` in JavaScript.

Like F# & C# we only open a package, we don't assign the exports of the package local variable if we don't want to. If we wanted to import multiple packages we can either have multiple `import` statements or write something like this:

```go
import (
    "fmt"
    "strconv"
)
```

_Side note: We're not ready to get too complex with packages, but if you want to know more [check out this article](https://www.golang-book.com/books/intro/11)._

Finally we create a function:

```go
func main() {
    fmt.Println("Hello WASM from Go!")
}
```

We've named our function `main` and given it no arguments, which is important, because this is the entry point function in our `main` package that the Go runtime looks for. Again, it's like `static void Main(string[] args)` in a C# console application.

Next we're using the `fmt` package we imported and the public member of it `Println` to... print a string to standard out.

## Run Go, Run!

It's time to test our code, we'll use the `go run` command for that:

```shell
~/tmp> go run main.go
Hello WASM from Go!
```

Yay we've created and run some Go code, but we've run it on a command line, not in a browser, and after all, we're trying to make WASM, and for that we can't use `go run`, we'll need `go build`. But if we were to just straight up run `go build` it will output a binary file for the OS/architecture you are currently working with, which is OK if you're building an application to run on a device, but not for creating WASM binaries. For that we need to override the OS and architecture that we're compiling for.

## Building Go for WASM

Conveniently Go allows you to specify environment variables to override system defaults, and for that we need to set `GOOS=js` and `GOARCH=wasm` to specify that the target OS is JavaScript and the architecture is WASM.

```shell
~/tmp> GOOS=js GOARCH=wasm go build -o main.wasm main.go
```

And now we'll have a file `main.wasm` that lives in the directory we output to.

But how do we use it?

## A Quick WebAssembly Primer

For over 20 years we've had JavaScript in the browser as a way to run code on the web. WASM isn't meant to be a replacement for JavaScript, in fact you're really hard pressed to use it without writing (or at least executing) a little bit of JavaScript.

This is because WebAssembly introduces a whole new virtual machine into the browser, something that has a very different paradigm to JavaScript and is a lot more isolated from the browser, and importantly user space. WebAssembly executed pre-compiled code and is not dynamic like JavaScript in the way it can run.

_Side note: There are some really great docs on [MDN](https://developer.mozilla.org/en-US/docs/WebAssembly) that covers WebAssembly, how it works, how to compile C/C++/Rust to WASM, the WebAssembly Text Format and all that stuff. If you **really** want to understand WASM have a read through that, in particular the WebAssembly Text Format is very good at explaining how it works._

So before we can use our WASM binary we need to create a WASM module and instantiate the runtime space that WASM will run within.

To do this we need to get the binary and instantiate it with WASM. MDN covers this [in detail](https://developer.mozilla.org/en-US/docs/WebAssembly/Loading_and_running) but you can do it either synchronously or asynchronously. We'll stick with async for our approach as it seems to be the recommended way going forward.

And the code will look like this:

```js
async function bootWebAssembly() {
    let imports = {};
    let result = await WebAssembly.instantiateStreaming(fetch('/path/to/file.wasm'), imports);
    result.instance.exports.doStuff();
}
bootWebAssembly();
```

_Don't worry about the `imports` piece yet, we'll cover that in our next chapter._

We've used `fetch` to download the raw bytes of our WASM file which is passed to WebAssembly and it will create your runtime space. This then gives us an object that has an `instance` (the runtime instance) that `exports` functions from our WebAssembly code (C/C++/Rust/etc).

At least, this is how works in an ideal world, it seems that Go's approach is a little different.

## Booting our Go WASM output

Now that we understand _how_ to setup WebAssembly let's get our Go application going.

As I mentioned Go is a little different to the example above and that's because Go is more about running an application than creating some arbitrary code in another language that we can execute from JavaScript.

Instead with Go we have a bit of a runtime wrapper that ships with Go 1.11+ called `wasm_exec.js` and you'll find it in:

```shell
~/tmp> ls $"(go env GOROOT)/misc/wasm/wasm_exec.js"
```

Copy this file into the folder with you `main.wasm`, we're going to need it.

Next we'll create a webpage to run the JavaScript:

```html
<html>
    <head>
      <meta charset="utf-8">
      <script src="wasm_exec.js"></script>
      <script>
            async function init() {
                const go = new Go();
                let result = await WebAssembly.instantiateStreaming(fetch("main.wasm"), go.importObject)
                go.run(result.instance);
            }
            init();
       </script>
    </head>
    <body></body>
</html>
```

Finally we'll host the code somewhere, you can use any webserver that you want, [goexec](https://github.com/shurcooL/goexec#goexec), [http-server](https://www.npmjs.com/package/http-server), IIS, etc.

_Note: Make sure your server supports the WASM mime type of `application/wasm`._

Fire it up, launch the browser and open the dev tools, now you should see the result of `fmt.Println` there! Woo! Did you guess that we'd see it in the `console`? I bet you did, after all, that's the thing most akin to standard out in the browser!

## Go's WASM Runtime

As you'll see in the little HTML snippet above the was we start WASM for Go is a little different, first we create a Go runtime with `new Go()`, which is provided to us by `wasm_exec.js`.

This then provides us with an `importObject` to pass to the `instantiateStreaming` function and the result we get back we pass back to the runtimes `run` method.

This is because Go does a bit of funky stuff to treat the WASM binary as an application rather than arbitrary functions like others do. Over the rest of this series we'll explore this a bit more too.

## Conclusion

There you have it folks, we've created our first bit of WASM code using Go, created some browser assets, executed it in the browser and seen an output message.

We've also learnt a little bit about how WASM works and how it's isolated from the JavaScript environment, and what makes the approach with Go a little different to other WASM examples you'll find on the web.

But our application is isolated, tune in next time and we'll start looking at how to interact with JavaScript from WASM.