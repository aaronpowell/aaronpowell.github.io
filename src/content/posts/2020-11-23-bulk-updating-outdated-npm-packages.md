+++
title = "Bulk Updating Outdated npm Packages"
date = 2020-11-23T11:50:18+11:00
description = "Coming to a project with a lot of dependencies to update? Here's how to script it"
draft = false
tags = ["javascript"]
tracking_area = "javascript"
tracking_id = "11197"
+++

Ever come back to a project you haven't touched for a while, only to find out there's a lot of outdated npm packages that you want to update? This is a situation I occasionally find myself in and I'd never thought of a good way to tackle it.

## Finding Outdated Packages

First off, how do you know what's outdated? We can use [`npm outdated`](https://docs.npmjs.com/cli/v6/commands/npm-outdated) for that and it'll return something like this:

![Outdated package list](/images/npm-outdated/001.png)

If you want some more information you can provide the `--long` flag and get more output, such as whether the package is in the `dependencies` or `devDependencies` list:

![Outdated package list with all details](/images/npm-outdated/002.png)

If the update is within the semver filter you have in your `package.json`, it's easy to upgrade with [`npm upgrade`](https://docs.npmjs.com/cli/v6/commands/npm-upgade), but if you're in a situation like I found myself in from the above list, there's a lot of major version upgrades needing to be done, and since they are beyond the allowed semver range it's a non-starter.

## Upgrading Beyond SemVer Ranges

How do we go upgrading beyond our allowed semver range? By treating it as a new install and specifying the `@latest` tag (or specific version), like so:

```bash
npm install typescript@latest
```

Doing this will install the latest version of TypeScript (`4.1.2` at the time of writing) which is a major version "upgrade", and it's easy enough to do if you've only got one or two packages to upgrade, but I was looking at 19 packages in my repo to upgrade, so it would be a lot of copy/pasting.

## Upgrading from Output

Something worth noting about the `npm outdated` command is that if you pass `--json` it will return you a JSON output, rather than a human readable one, and this got me thinking.

If we've got JSON, we can use [`jq`](https://stedolan.github.io/jq) to manipulate it and build up a command to run from the command line.

The output JSON from `npm outdated --json --long` is going to look like this:

```json
{
    "@types/istanbul-lib-report": {
        "current": "1.1.1",
        "wanted": "1.1.1",
        "latest": "3.0.0",
        "location": "node_modules/@types/istanbul-lib-report",
        "type": "devDependencies",
        "homepage": "https://github.com/DefinitelyTyped/DefinitelyTyped#readme"
    }
}
```

We're starting with an object, but we want to treat each sub-object as a separate node in the data set, we'll turn it into an array using `to_entities`, which gives us this new output:

```json
[
    {
        "key": "@types/istanbul-lib-report",
        "value": {
            "current": "1.1.1",
            "wanted": "1.1.1",
            "latest": "3.0.0",
            "location": "node_modules/@types/istanbul-lib-report",
            "type": "devDependencies",
            "homepage": "https://github.com/DefinitelyTyped/DefinitelyTyped#readme"
        }
    }
]
```

This gives us a dictionary where the `key` is the package name and `value` is the information about the upgrade for the package. As it's now an array we can choose to filter it using whatever heuristics we want, and for the moment we'll upgrade the `dependencies` separate from the `devDependencies`. We do that using the `select` function in jq:

```bash
npm outdated --json --long | jq 'to_entries | .[] | select(.value.type == "devDependencies")'
```

> The `select` function allows you to do whatever filtering you want, for example if you wanted to only update the TypeScript type definitions you could change the `select` to be `select(.key | startswith("@types"))`.

Running this will give you a filtered output on the terminal, showing only the packages that match your `select` condition. The last step is to generate the new package install version:

```bash
npm outdated --json --long | jq 'to_entries | .[] | select(.value.type == "devDependencies") | .key + "@latest"'
```

This update specified the `@latest` tag, but you could use `.key + "@" + .value.latest` if you wanted to install the specific version for more tighter semver pinning. The output in the terminal will now look like this:

```bash
"@types/istanbul-lib-report@latest"
```

All that's left to do is to pass the packages to `npm install`, so you'd possibly think we can just pipe the output:

```bash
npm outdated --json --long | jq 'to_entries | .[] | select(.value.type == "devDependencies") | .key + "@latest"' | npm install
```

Unfortunately, `npm install` doesn't accept command line arguments provided by standard input, so instead we'll use [`xargs`](https://en.wikipedia.org/wiki/Xargs) to convert the standard input into command line arguments:

```bash
npm outdated --json --long | jq 'to_entries | .[] | select(.value.type == "devDependencies") | .key + "@latest"' | xargs npm install
```

And with that, our upgrade is fully underway!

## Conclusion

I'm going to keep this snippet handy for when I'm coming back to projects that I haven't worked on for a while, as it's an easy way to do a large number of updated.

An alternative option you can look at is [`npm-check-updates`](https://www.npmjs.com/package/npm-check-updates), which is a command line utility that will update in a similar manner to above, but also has other feature to how it controls updates.
