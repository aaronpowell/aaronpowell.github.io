+++
title = "Finding Resource Groups With No Resources"
date = 2022-08-15T06:27:02Z
description = "Always good to keep your subscriptions clean, but how do you know what's not needed"
draft = false
tags = ["azure"]
tracking_area = "javascript"
tracking_id = ""
+++

I have a lot of resources and a lot of Azure subscriptions, and as a result, often find that I'm forgetting what everything is used for. Sure, I try to name the resource groups something useful, add tags, and things of that nature, but even still, things can get out of control quickly. For example, I have 47 resource groups in my primary subscription at the moment (let along me second and tertiary ones).

I figured a good start would be to delete all the resource groups that don't have any resources in them. No resource? well, it's probably not one that I need anymore (I likely deleted some expensive resource but didn't do the full cleanup).

But how do we find those, short of clicking through the portal?

Well, let's start with [`shell.azure.com`](https://shell.azure.com?{{<cda>}}) and start scripting.

To do this task, there's two bits of information we'll need, the names of all resource groups and the count of items in those resource groups.

Getting the names of all resource groups is simple:

```bash
az group list | jq 'map(.name)'
```

This will output:

```json
[
  "aaron-cloud-cli",
  "dddsydney",
  "httpstatus",
  "personal-website",
  "restream-streamdeck",
  "NetworkWatcherRG",
  "stardust-codespace"
]
```

Unfortunately, this won't tell you how many resources are in a group (yes, we are _only_ getting the `name` property, but the whole JSON doesn't contain it). In fact, you can't get that with `az group` at all, even `az group show --name <name>` won't give you it, we'll have to tackle this differently, instead we'll get all resources and group them by their resource group, which we can do with `az resource list`:

```bash
az resource list | jq 'map(.resourceGroup) | group_by(.) | map({ name: .[0], length: length }) | sort_by(.length) | reverse'
```

This `jq` command is a bit complex, but if we break it down, the first thing we're doing is selecting the resource group name from each resource with `map(.resourceGroup)`, to give us an array of resource group names. Next, we use `group_by(.)` to group them together and pipe that to another `map` function that makes an object with the name of the resource group (obtained from the first item of the index) and the length (how many resources are in the resource group). Lastly, it just sorts and orders it with `sort_by` and `reverse`, giving us this output:

```json
[
  {
    "name": "httpstatus",
    "length": 11
  },
  {
    "name": "personal-website",
    "length": 3
  },
  {
    "name": "stardust-codespace",
    "length": 1
  },
  {
    "name": "restream-streamdeck",
    "length": 1
  },
  {
    "name": "dddsydney",
    "length": 1
  },
  {
    "name": "aaron-cloud-cli",
    "length": 1
  }
]
```

Great! Except... it only contains resource groups that have resources, meaning we know what resource groups have items, when we want the inverse, we want the ones that don't have items.

So, we will need that original query to get all the resource group names and we'll find the negative intersection between the two arrays, with the leftovers being the resource groups we can discard.

Start by pushing all resource groups with items into a bash variable:

```bash
RG_NAMES=$(az resource list | jq -r 'map(.resourceGroup) | group_by(.) | map(.[0])')
```

Next, we'll use `$RG_NAMES` as a substitution into a query against `az group list`:

```bash
az group list | jq -r "map(.name) | map(select(. as \$NAME | $RG_NAMES | any(. == \$NAME) | not)) | sort"
```

Again, let's break this more complex jq statement down. We start with getting the names of the resource groups (since it's all we need) with `map(.name)`. That is then piped to a `map` call so we can operate on each item of the array. In the second `map` we use assign the item to a variable `$NAME` (which we've escaped since we're doing substitution with the environment variable `$RG_NAMES`), pipe to the `$RG_NAMES` variable, so we can pipe _that_ to `any` and see if any item in `$RG_NAMES` matches `$NAME`. The result of the `any` is inverted by piping through `not` and the result is provided to `select` to filter down the resource group names to only that didn't have resources!

```json
["NetworkWatcherRG"]
```

And there we have it, we've successfully executed two lines of code and got back the resource groups that are empty and can be deleted.

## Summary

Here's those two lines again:

```bash
RG_NAMES=$(az resource list | jq -r 'map(.resourceGroup) | group_by(.) | map(.[0])')
az group list | jq -r "map(.name) | map(select(. as \$NAME | $RG_NAMES | any(. == \$NAME) | not)) | sort"
```

Yes, the `jq` can look a bit daunting, especially considering how many pipes they are executing, but all in all, it does what's advertised, returns a list of resource groups that contain no items.

And yes, I may have spent more time trying to figure this out than it would have been clicking through them all, but hey, at least I have it ready for next time! 🤣
