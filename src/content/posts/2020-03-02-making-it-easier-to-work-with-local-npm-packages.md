+++
title = "Making it Easier to Work With Local npm Packages"
date = 2020-03-02T08:16:08+11:00
description = "A nifty trick I learnt recently for working with local npm packages"
draft = false
tags = ["nodejs"]
+++

I was recently doing some work to fix a bug in the [Azure Functions Durable JavaScript package](https://github.com/Azure/azure-functions-durable-js) that required changing the surface area of an API. I'd done everything that I could to test it, I'd created a new sample, I'd added a unit test for the bug I'd hit and ensured it passed while not breaking the existing tests over the API, all that sort of thing. But I wanted to make sure that the change, while seemingly fixing my issue, would **actually** fix it, so I wanted to drop the code into project.

So I've got two git repos on my machine, one with my application in it and one with the updated Azure Functions code, and I want to use that over the package that would come down from npm when I do an `npm install`.

When you look at npm's docs it says that I should be using [`npm link`](https://docs.npmjs.com/cli-commands/link.html) to setup a symlink between the code I want and the `node_modules` folder in my application, but I've always struggled to get it working right, and that's probably because symlinks on Windows aren't quite as simple as on \*nix (and maybe I've been burnt too many times to trust them! 🤣).

But, I found a simpler solution! It turns out that in your `package.json`'s `dependencies` (and`devDependencies`) rather than specifying a package version you can specify a file system path, like so:

```json
{
    ...
    "dependencies": {
        "durable-functions": "file:../azure-functions-durable-js",
        ...
    }
    ...
}
```

This path that I've set is the path to where the `package.json` for the dependency lives and by using `file:` it tells the dependency resolver to look for a file system path rather than a locally referenced package. Also, `npm install` knows not to download something from the registry.

Using this pattern can also be useful for doing samples within a repo as the sample can refer to the package by name (doing `import something from 'my-package';`) rather than using using paths within the sample files (`import something from '../../';`) which can make the samples match better with how someone would consume the package.

It can also be useful to test out if your change does fix the bug that you've found by redirecting where your project resolves and not changing your codebase itself.

I hope this has been a helpful tip and can make it easier for you to work with local packages and also make it easier to test fixes you want to contribute. There's more information on [npm's docs](https://docs.npmjs.com/files/package.json#local-paths) about this and the other kinds of special paths you can define, such as git repos and HTTP endpoints.
