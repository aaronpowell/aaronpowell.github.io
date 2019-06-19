+++
title = "Learning Golang through WebAssembly - Part 5, Compiling With Webpack"
date = 2019-02-08T09:00:06+11:00
description = "It's time to bring this into a web devs toolchain"
draft = false
tags = ["golang", "wasm", "javascript", "webpack"]
series = "golang-wasm"
series_title = "Compiling Go with webpack"
+++

## Bringing in a Web Devs Tool Chain

Up until now we've been writing our Go code and then using the `go build` command to generate our WebAssembly bundle, and sure, this works fine, does what we need it to do, but it doesn't really fit with how _we web developers_ would be approaching it.

Us web developers are not shy of using a compiler step, or at least a build task, whether you're converting from one language to another using TypeScript/Fable/Flow/etc., down-leveling ESNext to ESNow or just doing bundling and minifying of multiple scripts into one, it's rare to find a JavaScript application these days that it's using a tool like gulp, rollup, parcel or webpack.

I prefer webpack so I decided to look at incorporating it into my process by writing a custom [Loader](https://webpack.js.org/contribute/writing-a-loader/).

## A Quick Intro to webpack

If you're unfamiliar with webpack you really should [check out their docs](https://webpack.js.org/concepts/) as I won't do it justice here. Instead I want to focus on the core part of webpack that we need to leverage and how it works.

Because webpack is designed to be a generic module bundler it doesn't understand how to deal with different languages, whether that's JSX in React, TypeScript or in our case Go. For that we need to bring in a Loader. A Loader is essentially a JavaScript function that takes the contents of the file you're "loading" and expects you to return some JavaScript that can be run in the generated bundle.

This means that in our JavaScript file we can write the following:

```js
import foo from './bar.go';
```

And tell webpack to use the right loader when it finds a `*.go` file to hopefully generate what we need it to generate.

Ultimately, our goal is to be able to write something like this:

```js
import wasm from './main.go';

async function init() {
    let result = await wasm.printMessage('Hello from Go, via WASM, using webpack');
    console.log(result);
}

init();
```

Now let's look at how we achieve this.

## Creating a Loader

**TL;DR: If you don't really want to see the process you can just check out the [source code for the loader](https://github.com/aaronpowell/webpack-golang-wasm-async-loader) and install it into your own project.**

As I mentioned above, the loader that we create is just a JavaScript function that receives the contents of the file we're loading passed into it, meaning we'll get our raw Go code, which is not particularly helpful because we need to pass the file path to `go build`, not the file contents.

But never fear, the loader has a [Loader API](https://webpack.js.org/api/loaders/) that we can leverage, and the first thing is that we want to get [`resourcePath`](https://webpack.js.org/api/loaders/#this-resourcepath) which gives us the full path to the file. Fantastic, now we are able to send that over to `go build`!

### Generating WASM in our Loader

We're going to need to execute `go build` in our loader, and to do that we can use [`child_process`](https://nodejs.org/api/child_process.html) to spawn it.

But before that we'll need to find the path to the `go` binary and for that we'll use the `GOROOT` environment variable (that we learnt about in the first post).

Finally we're going to use [`execFile`](https://nodejs.org/api/child_process.html#child_process_child_process_execfile_file_args_options_callback) which is asynchronous, and we'll have to tell webpack that this loader is [`async`](https://webpack.js.org/api/loaders/#asynchronous-loaders).

Our loader is starting to look like this (note: I've chosen to write this with TypeScript rather than plain ol' JavaScript):

```ts
import * as webpack from "webpack";
import { execFile } from "child_process";
const getGoBin = (root: string) => `${root}/bin/go`;

function loader(this: webpack.loader.LoaderContext, contents: string) {
  const cb = this.async();

  const opts = {
    env: {
      GOPATH: process.env.GOPATH,
      GOROOT: process.env.GOROOT,
      GOOS: "js",
      GOARCH: "wasm"
    }
  };

  const goBin = getGoBin(opts.env.GOROOT);
  const outFile = `${this.resourcePath}.wasm`;
  const args = ["build", "-o", outFile, this.resourcePath];

  execFile(goBin, args, opts, (err) => {
      //todo
  });
}

export default loader;
```

I'm also creating the environment variables (in `opts`) that sets the appropriate `GOOS` and `GOARCH` for WASM.

For the file that we generate, I'll just append `.wasm` to the end of the resource that we're processing. This means that we _should_ be fine writing to disk, but some error handling on the writability of the disk could be useful...

### Generating JavaScript for webpack

We're successfully generating our WASM file but it's a) dropped in what's likely our `src` folder, not where the rest of the webpack bundles will go and b) we still have to write a bunch of code to use it.

For our objective of it being just like any other piece of JavaScript we'll want to generate something to give back to webpack. But what will we need to generate?

If we think about it there are two things we need in JavaScript to use a Go WASM binary:

1. `wasm_exec.js`
2. The WebAssembly loader

Well I think this is something that webpack should do for us, we don't want to have to write that code ourselves!

We're going to build up a large string template to send back to webpack, starting with the bootstrapper for WebAssembly:

```js
async function init() {
  const go = new Go();
  let result = await WebAssembly.instantiateStreaming(fetch(...), go.importObject);
  go.run(result.instance);
}
init();
```

This code will be inserted into our bundle and used when we `import wasm from './main.go'`, but that only starts up the WASM runtime, what about accessing the stuff we registered?

I decided that I want to enforce the callback pattern from the last post, and that means we'll need to return something, but _what the heck_ should we return? We've got **no idea** what the names of the functions from Go will be, so how do we know what to return to the `import` statement?!

### JavaScript Proxies to the Rescue

If you've ever done programming with Ruby you _may_ have come across the [`method_missing`](https://docs.ruby-lang.org/en/trunk/BasicObject.html#method-i-method_missing) method on `BasicObject` which you can use to do [metaprogramming](https://www.leighhalliday.com/ruby-metaprogramming-method-missing). In C# you can do a [similar thing with the DLR](https://haacked.com/archive/2009/08/26/method-missing-csharp-4.aspx/).

But if you haven't come across this, basically it's a special function that gets executed on an object when there are no members of it that match, a last ditch attempt to handle an error before it is thrown.

Unfortunately, JavaScript doesn't have such a method, but we do have [`Proxy`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy).

A Proxy is a wrapper around an object that allows you to do interception of standard JavaScript operations, get, set, etc. and with this we can simulate the `method_missing` from Ruby.

Here's a basic example:

```js
let base = {
    foo: () => 'foo'
};

let baseProxy = new Proxy(base, {
    get: (target, prop) => {
        console.log(`captured call to ${prop}`);
        if (target[prop]) {
            return target[prop];
        }
        return () => 'method_missing';
    }
});

console.log(baseProxy.foo());
console.log(baseProxy.bar());
```

And we'll see:

```
> "captured call to foo"
> "foo"
> "captured call to bar"
> "method_missing"
```

So we can capture all calls and do something with them before, after or completely replace them.

And we're going to use that to wrap WASM with our callback pattern:

```js
let proxy = new Proxy(
  {},
  {
    get: (_, key) => {
      return (...args) => {
        return new Promise((resolve, reject) => {
          let cb = (err, ...msg) => (err ? reject(err) : resolve(...msg));
          window[key].apply(undefined, [...args, cb]);
        };
      };
    }
  }
);
```

Because we register stuff on the global object our proxy is actually of a blank object, since we don't really want to proxy `window`, and anyway we can just ignore the `target` that the proxy receives anyway.

### Putting it all together

It's time to put together our template that we'll give back to webpack, and that will be executed when you import a Go file:

```js
const proxyBuilder = (filename: string) => `
let ready = false;

const bridge = self || window || global;

async function init() {
  const go = new Go();
  let result = await WebAssembly.instantiateStreaming(fetch("${filename}"), go.importObject);
  go.run(result.instance);
  ready = true;
}

function sleep() {
  return new Promise(requestAnimationFrame);
}

init();

let proxy = new Proxy(
  {},
  {
    get: (_, key) => {
      return (...args) => {
        return new Promise(async (resolve, reject) => {
          let run = () => {
            let cb = (err, ...msg) => (err ? reject(err) : resolve(...msg));
            bridge[key].apply(undefined, [...args, cb]);
          };

          while (!ready) {
            await sleep();
          }

          if (!(key in bridge)) {
            reject(\`There is nothing defined with the name "$\{key\}"\`);
            return;
          }

          if (typeof bridge[key] !== 'function') {
            resolve(bridge[key]);
            return;
          }

          run();
        });
      };
    }
  }
);
  
export default proxy;`;
```

Ok, it's a little more advanced that the few snippets above, but let me explain some of the additions:

1. Since we are asynchronously loading the WASM file using `fetch` there is the possibility that we'd try and use an exported function before it's been made available. This would most likely happen if you have a large bundle and/or a slow network connection, so I've introduced a `sleep` function which uses `requestAnimationFrame` as a sleeper (so chucking stuff in the event loop) and waiting until the WASM initialization function completes and sets `ready` to `true`
2. I've aliased the global that we're working with so you can use the generated code in Node.js or a browser
3. I'm not exposing it as a callback pattern, instead I'm exposing it as a `Promise`, meaning you can `async`/`await` with it
4. I added some error handling, if you call a function that can't be found the `Promise` is rejected
5. It also supports setting values not just functions from Go

### Finishing our Loader

Template? ✔

Generating WASM file? ✔

Time to combine all of this together so that we can actually run the Loader.

```ts
function loader(this: webpack.loader.LoaderContext, contents: string) {
  // omitted for brevity

  execFile(goBin, args, opts, (_, err) => {
    if (err) {
      cb(new Error(err));
      return;
    }

    let out = readFileSync(outFile);
    unlinkSync(outFile);
    const emittedFilename = basename(this.resourcePath, ".go") + ".wasm";
    this.emitFile(emittedFilename, out, null);

    cb(
      null,
      [
        "require('!",
        join(__dirname, "..", "lib", "wasm_exec.js"),
        "');",
        proxyBuilder(emittedFilename)
      ].join("")
    );
  });
}
```

Remember how we generated the WASM file into the same location on disk as the original `.go` file? Well that's fine to output as `go build` requires, but we actually want it to go with the rest of the webpack output. To do this we use the [`emitFile`](https://webpack.js.org/api/loaders/#this-emitfile) method on the loader context, providing it the contents of the file as a `Buffer`. That's why I use `readFileSync` to get the file into memory, then I `unlinkSync` to delete it from disk, since the original output isn't needed anymore.

Finally I generate a `require` statement to the `wasm_exec.js` file that is bundled with the loader (I had to make a minor change to it so it worked with webpack). You'll see this message in the debugging console:

```
../lib/wasm_exec.js 9:19-26
Critical dependency: require function is used in a way in which dependencies cannot be statically extracted
```

This is because the `wasm_exec.js` file is being added as a `require` statement to webpack but we're not explicitly exporting anything from it (since it just augments the `global` scope), meaning webpack is unsure what we're actually using in there and it can't undertake [tree shaking](https://webpack.js.org/guides/tree-shaking/) to remove unneeded code (and thus optimise the application).

## Conclusion

All the code for the loader is on [GitHub](https://github.com/aaronpowell/webpack-golang-wasm-async-loader) and I've published the loader on npm as [`golang-wasm-async-loader`](https://www.npmjs.com/package/golang-wasm-async-loader). GitHub contains a (works on my machine) example of it in action if you'd like to try it out.

## Bonus Round: Ditching Globals and Improving the Go Experience

The astute observer among you will have looked at the source code published to GitHub and noticed it's not _quite_ what I posted above.

One thing that's constantly irked me with the stuff I'd read from Go on how to work with WASM is that everything seems to use `js.Global` as a dumping place for their functions/values/etc. and that is rather unpleasant because you shouldn't pollute `window`/`global`/`self`.

I decided that I wanted my loader to address this and to also make it a little easier in Go to work with this, removing the need to understand the JavaScript callback pattern.

So the loader's GitHub repository also contains a Go package called [`gobridge`](https://github.com/aaronpowell/webpack-golang-wasm-async-loader/tree/master/gobridge) which gives you helpers to register functions and values in Go to JavaScript.

This means I can write some code like so:

```go
//+ build js,wasm

package main

import (
	"strconv"
	"syscall/js"

	"github.com/aaronpowell/webpack-golang-wasm-async-loader/gobridge"
)

func add(this js.Value, args []js.Value) (interface{}, error) {
	ret := 0

	for _, item := range args {
		val, _ := strconv.Atoi(item.String())
		ret += val
	}

	return ret, nil
}

func main() {
	c := make(chan struct{}, 0)
	println("Web Assembly is ready")
	gobridge.RegisterCallback("add", add)
	<-c
}
```

And use `gobridge.RegisterCallback` and not worry about working with `js.FuncOf` or where to register it in the JavaScript object graph.

And that latter part is important because I don't want to dump everything on global, I want to namespace it.

Let's update the JavaScript we're generating in the Loader to include this:

```js
const g = self || window || global

if (!g.__gobridge__) {
  g.__gobridge__ = {};
}

const bridge = g.__gobridge__;
```

Now our Go code can use that, via the `gobridge` and we don't have to worry about trashing anything on `window` in the browser!