+++
title = "Learning Golang through WebAssembly - Part 6, Go, WASM, TypeScript and React"
date = 2019-02-12T09:00:06+11:00
description = "Time to put all the pieces together and get something built!"
draft = false
tags = ["golang", "wasm", "javascript", "webpack", "typescript", "react"]
series = "golang-wasm"
series_title = "Go, WASM, React and TypeScript"
+++

## Building an Application

Welcome to the final article in our little series, congratulations, you've made it this far!

So far we've looked at a lot of little pieces which would eventually make an application and it's time to tackle that, it's time to build a web application.

I've decided that for this application we're going to piece together some other tools that you might commonly use, we'll use React as a UI library and TypeScript as a compile-to-JavaScript language. But there's no reason you couldn't replace React with Vue, Angular or any other UI library, and drop TypeScript for 'plain old JavaScript'. You'll find the demo app [on my GitHub](https://github.com/aaronpowell/go-wasm-experiments).

## Setting up our Application

To get started we'll use [`create-react-app` with TypeScript](https://facebook.github.io/create-react-app/docs/adding-typescript), I won't go over doing that setup, the React documentation does a good job for me. You don't have to use `create-react-app`, it's just a really easy way to bootstrap, but if you're confident without it, by all means skip this step.

Once you're created an application though we'll need to [eject `create-react-app`](https://facebook.github.io/create-react-app/docs/available-scripts#npm-run-eject) because we need to be able to modify the `webpack.config.js` file, which can only be done if you eject `create-react-app`.

## Getting all WASM-y

We'll start by adding the [loader created in the last post](https://www.npmjs.com/package/golang-wasm-async-loader) using `npm` or `yarn`:

```shell
npm install --save-dev golang-wasm-async-loader
# or
yarn add golang-wasm-async-loader
```

Then editing the `configs/webpack.config.js` file to add our loader (follow the instructions in the file for where to put it):

```js
{
    test: /\.go$/,
    loader: 'golang-wasm-async-loader'
},
```

## Adding our WASM

I'm going to make a little application that shows at least 2 number input fields and adds all the values together to get a sum, to Go code for it will look like this:

```go
package main

import (
	"strconv"
	"syscall/js"

	"github.com/aaronpowell/webpack-golang-wasm-async-loader/gobridge"
)

func add(i ...js.Value) js.Value {
	ret := 0

	for _, item := range i {
		val, _ := strconv.Atoi(item.String())
		ret += val
	}

	return js.ValueOf(ret)
}

func main() {
	c := make(chan struct{}, 0)
	println("Web Assembly is ready")
	gobridge.RegisterCallback("add", add)
	<-c
}
```

Pretty basic, we use `range` to go over the spread of `js.Value`, convert each one from a string to a number, sum them up and return boxed in `js.Value`.

Next up in our input field, I've created a file `NumberInput.tsx` for that:

```typescript
import * as React from 'react';

export interface NumberInputProps {
    value: number
    onChange: (value: number) => void
}

const NumberInput : React.SFC<NumberInputProps> = ({ value, onChange }) => (
    <input type="number" value={value} onChange={(e) => onChange(parseInt(e.target.value, 10))} />
);

export default NumberInput;
```

It's a stateless component that receives two properties, a value for the input field and the callback to execute on change of the input field.

Lastly we'll make our `<App />`:

```typescript
import * as React from 'react';
import wasm from './main.go';
import NumberInput from './NumberInput';

const { add } = wasm;

interface State {
    value: number[]
    result: string
}

class App extends React.Component<{}, State> {
    constructor(props: {}) {
        super(props);

        this.state = {
            value: [0, 0],
            result: '0'
        };
    }

    async updateValue(index: number, value: number) {
        //todo
    }

    render() {
        return (
            <div>
                <p>Enter a number in the box below, on change it will add all the numbers together. Click the button to add more input boxes.</p>
                {this.state.value.map((value, index) =>
                    <NumberInput key={index} value={value} onChange={i => this.updateValue(index, i)} />
                )}
                <button type="button" onClick={() => this.setState({ value: [...this.state.value, 0]})}>More inputs!</button>
                <p>Value now is {this.state.result}</p>
            </div>
        );
    }
  }

export default App;
```

Ok, pretty basic, it's component with state (sorry, no redux or hooks here 😝) where state contains an array of input values and the current sum. The `render` will loop over the input values, create our `<NumberInput />` component with the value and give it a function that will call `updateValue` when done. State it initialised to have 2 inputs, but you can add more with a button shown on screen.

At the top of the file you'll see that we're importing the `main.go` file from above and using [destructing assignment](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment) to get out the `add` function, or more accurately, a reference to it from the `Proxy` the loader creates for us.

Now it's time to complete our `updateValue` method. But it turns out that using the `add` function could be a bit tricky. Sure we can define it as an `any` property of the WASM, but what if we wanted to be more intelligent in the way it is represented?

```typescript
async updateValue(index: number, value: number) {
    let newValues = this.state.value.slice();
    newValues[index] = value
    let result = await add<number, string>(...newValues);
    this.setState({ value: newValues, result });
}
```

## Using Types with our Proxy

How do we make sure that TypeScript knows what type our arguments are that are to be passed into a function that, well, doesn't exist? Ultimately we want to get away from an `any`, instead we want to use TypeScript generics!

We can do this in one of two ways, the first is we just create a definition file that creates an explicit interface for our WASM import:

```typescript
declare module "*.go" {
    interface GoWrapper {
        add: (...params: number[]) => Promise<string>
    }

    var _: GoWrapper
    export default _
}
```

I've created a file called `definitions.d.ts` that sits alongside the `App.tsx` file, and by declaring the module for `*.go` it means that this declaration file works for any imports of Go files. We can also drop the generic arguments, which is nice, but it is a problem it we want to start adding more Go functions, we keep having to edit this file to include them.

So how about going crazy with generic!

```typescript
declare module "*.go" {
    interface GoWrapper {
        [K: string]: <T = any, R = any>(...params: T[]) => Promise<R>
    }

    var _: GoWrapper
    export default _
}
```

Now, stick with me as we break it down:

* We're saying we have keys of the type (`GoWrapper`) that are strings with `[K: string]`
* Each key has a type that takes two generic arguments, an input and an output, that's `<T = any, R = any>`
* These go into a function with `T` being a `params` array, denoted by `(...params: T[])`
* The return type is a `Promise` using the specified return type, `Promise<R>`

So when we do `add<number, string>` it says that were passing in an indeterminate number of arguments that are all numbers and it'll return a string asynchronously.

This forced type flow down from our state and back, all through the magic of TypeScript types!

If you were working with mixed types in the arguments to the function we could do something like:

```typescript
let result = await something<string | number, string>("hello", 1, "world");
```

Using the `|` tells TypeScript that the arguments into the function are a string _or_ number type, but not function, boolean, etc.. Pretty crazy right!

## Deploying our Application

We're done! It works locally! Now it's time to deploy it somewhere.

I'm going to use [Azure DevOps Pipelines](https://azure.microsoft.com/en-au/services/devops/?{{< cda >}}) to build and then deploy it as an [Azure Blob Static Website](https://docs.microsoft.com/en-au/azure/storage/blobs/storage-blob-static-website?{{< cda >}}).

### Building

To build you'll need to run the following steps:

* Install our Go dependencies
* Install our npm packages
* Run webpack
* Copy the required files as a build artifact

I've created an [Azure DevOps YAML build](https://docs.microsoft.com/en-us/azure/devops/pipelines/get-started-yaml?view=azdevops&{{< cda >}}) that is in the [GitHub repo](https://github.com/aaronpowell/go-wasm-experiments/blob/master/azure-pipelines.yml). It's modeled on the standard Node.js pipeline but I've added the specific Go steps.

The things of note are that you'll need to install the appropriate Go packages with `go get`. To use the `gobridge` I created for the loader you'll need to set the `GOOS` and `GOARCH` too:

```yaml
- script: |
    GOOS=js GOARCH=wasm go get "github.com/aaronpowell/webpack-golang-wasm-async-loader/gobridge"
  displayName: 'install gobridge'
```

You'll also need to make sure that `GOPATH` and `GOROOT` are environment variables available to the loader. By default these aren't set as environment variables in the agent, I just did it inline:

```yaml
- script: |
    npm install
    GOPATH=$(go env GOPATH) GOROOT=$(go env GOROOT) npm run build
  displayName: 'npm install, run webpack'
```

Alternatively, you can create them for all tasks:

```yaml
variables:
  GOBIN:  '$(GOPATH)/bin' # Go binaries path
  GOROOT: '/usr/local/go1.11' # Go installation path
  GOPATH: '$(system.defaultWorkingDirectory)/gopath' # Go workspace path
```

[Here's a completed build!](https://dev.azure.com/aaronpowell/CDA%20Demos/_build/results?buildId=346) (ignore all the failed ones before it :laughing:)

### Release

At the time of writing we don't have support for releases in the YAML file for Azure DevOps Pipelines. I use the [Azure File Copy task](https://docs.microsoft.com/en-us/azure/devops/pipelines/tasks/deploy/azure-file-copy?view=azdevops&{{< cda >}}) to copy all the files into the storage account I'm running in, followed by the [Azure CLI task](https://docs.microsoft.com/en-us/azure/devops/pipelines/tasks/deploy/azure-cli?view=azdevops&{{< cda >}}) to set the WASM content type on the WASM file, otherwise it won't be served correctly:

```shell
az storage blob update --container-name "$web" --name "hello.wasm" --content-type "application/wasm" --account-name gowasm
```

_Remember to change `hello.wasm` to whatever your filename is!_ :wink:

[Here's a completed release!](https://dev.azure.com/aaronpowell/CDA%20Demos/_releaseProgress?_a=release-pipeline-progress&releaseId=12)

## Conclusion

And we are done folks! Starting with no idea what WebAssembly is or how to write Go we've gone through a bunch of exploration into how it all works, what makes Go's approach to WebAssembly a little tricky as a web developer and ultimately how we can introduce Go into the tool chain that we are familiar with these days building web applications.

I do hope you've enjoyed this series as we've gone along. If you build anything exciting with Go and WASM please let me know!