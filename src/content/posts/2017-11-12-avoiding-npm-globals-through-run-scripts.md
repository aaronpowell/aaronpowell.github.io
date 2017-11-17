+++
title = "Avoiding npm globals through run-script"
date = 2017-11-12T14:55:46+11:00
description = "How to remove your reliance on globally installed node tools"
draft = false
tags = ["nodejs", "npm"]
+++

I was talking with [Richard Banks](https://www.richard-banks.org/) the other day about doing silly things with Docker (because, well [I'm known for that at work]({{< ref "2017-09-21-vscode-linux-docker-windows.md" >}})) and he was saying he wants to create docker containers that contain the global npm modules that he often uses to save installing them using `npm install -g`.

I asked him why he was using `npm install -g` and he said it was for build tools (gulp/grunt/webpack/etc.) so that you can easily run them.

This led me to show him how I use globals without relying on global installs.

## Installing node cli tools

When you use `npm install -g` it really doesn't do anything different other than instead of putting the module in your `$PWD/node_modules` it puts them in the path that node.js is installed to, which (assuming you installed it correctly, or used [nvm](https://github.com/aaronpowell/ps-nvmw])) will be in your `$env:PATH` (or other OS equivalent), thus making the command globally available. If you drop the `-g` then you still get the executable, but it's in `$PWD/node_modules/.bin`.

This means that your local install can still be used, it's just a pain to type the path every time before you run it.

So realistically you probably do want to be doing a local install because by doing so you have it added to your `package.json` and that makes it clear that you depend on webpack. It also means that you can state the version you depend on. By relying on globals you have to deal with the problem of what happens if you require `webpack@3` but another project you work on is using `webpack@1`? Well one of them has a broken dependency if you use the global install, and thus it may not work properly.

## Introducing `npm run-script`

Our main pain point is with the additional path that has to be typed to get to our local installed version, so how do we get around this? Conveniently npm has something we can leverage [`run-script`](https://docs.npmjs.com/cli/run-script) which allows you to define a command that can be executed, so we can now do this:

```
$> npm run webpack
```

To do this you need to add a `scripts` section to your `package.json` like so:

```
...
"scripts": {"webpack": "webpack"}
...
```

But wait, how does it know which version of `webpack` to run? Isn't that just looking for a global command?

Actually, no. When a `run-script` is executed npm will append the path of `npm bin` to the `PATH` your scripts environment, and thus it finds your local installed dependency.

**Too easy! :grinning:**

## Update

It seems that this isn't the only way to do it:

{{< tweet 929541326034501633 >}}

Thanks Tim, TIL!
