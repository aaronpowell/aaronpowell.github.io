+++
title = "Extending the GitHub CLI"
date = 2021-01-22T15:18:41+11:00
description = "Let's look at how we can extend the GitHub CLI to give us information about GitHub Actions"
draft = false
tags = ["github", "devops"]
tracking_area = "javascript"
tracking_id = "13317"
+++

I've been using the [GitHub CLI](https://cli.github.com/) a lot recently for my common GitHub tasks, such as cloning and working with PRs, but there's something else in GitHub that I've been using a lot that I can't do from the CLI, working with Actions, like in my last post [about approval workflows]({{<ref "/posts/2021-01-11-using-environments-for-approval-workflows-with-github.md">}}).

Now, this might be a feature that [comes soon to the CLI](https://github.com/cli/cli/issues/1725) but I'm an impatient person, so I set out to work out how to do it myself.

## Creating custom aliases

The GitHub CLI gives us the ability to create our own aliases, this could be useful if you want to, say, create an easy way to list a certain type of issue:

```bash
$ gh alias set bugs 'issue list --label="bugs"'
- Adding alias for bugs: issue list --label="bugs"
✓ Added alias.

$ gh bugs

Showing 2 of 7 issues in cli/cli that match your search

#19 Pagination request returns empty JSON (bug)
#21 Error raised when passing valid parameters (bug)
```

_This example is taken from the documentation._

Awesome, we can create an alias for `action`, but how can we make it do something? Since we don't have anything built into the CLI that gives us access to Actions, we'll need to use the GitHub API.

## Calling the GitHub API

I'm going to use the [GitHub REST API for Actions](https://docs.github.com/en/rest/reference/actions?{{<cda>}}), since the GraphQL one doesn't appear to expose this information at the time of writing.

Since the API requires us to be authenticated, we can use the `gh api` command, which uses the currently authenticated user of the GitHub CLI, neat, no credential management for me!

Let's start by [listing the workflows for the repository](https://docs.github.com/en/rest/reference/actions?{{<cda>}}#list-repository-workflows), which would see us calling:

```
/repos/{owner}/{repo}/actions/workflows
```

But we're going to need to know the `owner` and `repo` information, so how can we get that? Well, the first option is that we can prompt the user for it somehow, but that can break the workflow you might have. Instead, we can leverage the tokenization feature of `gh api` in which if the API we're calling has `:owner` and `:repo` in the path, it'll be substituted with the information from the current repo your in. Great! That makes a lot of sense since you're likely in the git repo on the command line when you want to run it anyway.

## Writing our alias

Since this isn't a simple extension on an existing command, we'll write this alias within the config file for the CLI (usually at `~/.config/gh/config.yml`). If this file doesn't exist, go ahead and create it and add an `aliases` section to it and scaffold out our starting point:

```yml
aliases:
    action: |-
        echo TODO
```

Great, now we can run `gh action` and it'll echo back a note to us. Time to start using the `gh api` command.

```yml
aliases:
    action: |-
        !gh api /repos/:owner/:repo/actions/workflows
```

What we've done here is made a shell script that, when executed, will return the JSON payload from the API. If I run this on my [FSharp.CosmosDB repo](https://github.com/aaronpowell/FSharp.CosmosDB) I get the following output to the terminal:

```json
{
    "total_count": 3,
    "workflows": [
        {
            "id": 744033,
            "node_id": "MDg6V29ya2Zsb3c3NDQwMzM=",
            "name": "Build release candidate",
            "path": ".github/workflows/build-master.yml",
            "state": "active",
            "created_at": "2020-03-12T17:07:41.000+11:00",
            "updated_at": "2020-03-12T17:07:41.000+11:00",
            "url": "https://api.github.com/repos/aaronpowell/FSharp.CosmosDb/actions/workflows/744033",
            "html_url": "https://github.com/aaronpowell/FSharp.CosmosDb/blob/main/.github/workflows/build-master.yml",
            "badge_url": "https://github.com/aaronpowell/FSharp.CosmosDb/workflows/Build%20release%20candidate/badge.svg"
        },
        {
            "id": 3865909,
            "node_id": "MDg6V29ya2Zsb3czODY1OTA5",
            "name": "CI build",
            "path": ".github/workflows/ci.yml",
            "state": "active",
            "created_at": "2020-11-27T13:50:00.000+11:00",
            "updated_at": "2020-11-27T13:50:00.000+11:00",
            "url": "https://api.github.com/repos/aaronpowell/FSharp.CosmosDb/actions/workflows/3865909",
            "html_url": "https://github.com/aaronpowell/FSharp.CosmosDb/blob/main/.github/workflows/ci.yml",
            "badge_url": "https://github.com/aaronpowell/FSharp.CosmosDb/workflows/CI%20build/badge.svg"
        },
        {
            "id": 4075965,
            "node_id": "MDg6V29ya2Zsb3c0MDc1OTY1",
            "name": "Release build",
            "path": ".github/workflows/release.yml",
            "state": "active",
            "created_at": "2020-12-07T14:26:25.000+11:00",
            "updated_at": "2020-12-07T14:26:25.000+11:00",
            "url": "https://api.github.com/repos/aaronpowell/FSharp.CosmosDb/actions/workflows/4075965",
            "html_url": "https://github.com/aaronpowell/FSharp.CosmosDb/blob/main/.github/workflows/release.yml",
            "badge_url": "https://github.com/aaronpowell/FSharp.CosmosDb/workflows/Release%20build/badge.svg"
        }
    ]
}
```

Job done, ship it.

## Improving the output

Ok, so maybe just dumping the JSON out like that isn't _super_ useful, maybe we only want a part of the data, say, the names of the workflows. Well to do that we can parse the JSON with [jq](https://stedolan.github.io/jq/) (no, not [_that_ jq](https://jquery.com)).

Let's go back to updating our alias:

```yml
aliases:
    action: |-
        !gh api /repos/:owner/:repo/actions/workflows | jq -c ".workflows | map({ name: .name, id: .id })"
```

We're using `jq` to find the `.workflows` property at the response root, then pulling out the name of each workflow and returning just that:

```bash
[{"name":"Build release candidate","id":744033},{"name":"CI build","id":3865909},{"name":"Release build","id":4075965}]
```

_Note: the `-c` flag to `jq` returns a condensed version of the JSON, so it's on a single line. We'll need that shortly._

That's looking better, but I don't really want it as JSON, I want it more human readable, I just want the names. Well, to do that we can unpack the array as separate items:

```yml
aliases:
    action: |-
        !gh api /repos/:owner/:repo/actions/workflows | jq -c ".workflows | map({ name: .name, id: .id }) | .[]"
```

Which gives us this output:

```bash
{"name":"Build release candidate","id":744033}
{"name":"CI build","id":3865909}
{"name":"Release build","id":4075965}
```

And we'll wrap up by turning it back to a plain string using a `while` loop:

```yml
aliases:
    action: |-
        !gh api /repos/:owner/:repo/actions/workflows | jq -c ".workflows | map({ name: .name, id: .id }) | .[]" | while read i; do
              echo $i | jq -r '.name'
            done
```

Tada! 🎉

```bash
$ gh action
Build release candidate
CI build
Release build
```

_Note: I'm only picking out the `.name` from each item for display, so the `map` does more than it needs to, but I wanted to show that you could get a complex object but pick a subset of it._

## Multiple operations from a single alias

This is great and all, but getting a list of workflow names isn't the only thing you're likely to want from the command, maybe you also want to get some info about a particular workflow run.

Unfortunately, `gh alias` is only one level deep, so `gh action` is all it can do, it can't do `gh action list`... unless we expand our shell scripting!

If we use the `case` operation in our script, we could expand our alias to do whatever we want.

```yml
aliases:
    action: |-
        !(case $1 in
            list)
                gh api /repos/:owner/:repo/actions/workflows | jq -c ".workflows | map({ name: .name, id: .id }) | .[]" | while read i; do
                      echo $i | jq -r '.name'
                    done
                ;;

            *)
              echo The following commands are supported from '\e[1;31m'gh action'\e[0m':

              echo '\t\e[1;32m'list'\e[0m'
              echo '\t\t'Returns the names of all workflows for the repo
              ;;
        esac)
```

The way this works is that the `gh action` will then look at the first argument provided, `$1`, and then see if it matches any of the specified `case` switches, meaning that we can run `gh action list` to get output:

```bash
FSharp.CosmosDb on  main via .NET 5.0.102
$ gh action list
Build release candidate
CI build
Release build
```

We've also implemented a _catch all_ case, `*`, so that we can handle unexpected input and return a help system.

```bash
$ gh action help
The following commands are supported from gh action:
        list
                Returns the names of all workflows for the repo
```

With this in place, you can write as complex an alias as you want! Here's mine that also includes getting the information for a workflow run:

```yml
aliases:
    action: |-
        !(case $1 in
          get)
            jq_filter=$([ "$2" ] && echo "map(. | select(.name == \"$2\")) | first" || echo 'first')
            res=$(gh api /repos/:owner/:repo/actions/runs | jq -r ".workflow_runs | $jq_filter")
            url=$(echo $res | jq -r '.html_url')
            status=$(echo $res | jq -r '.status')
            name=$(echo $res | jq -r '.name')
            created=$(echo $res | jq -r '.created_at' | xargs date '+%A %b %d @ %H:%m' --date)
            echo '\e[1;34m'$name'\e[0m' \($url\)
            echo '\t'Started: '\e[1;33m'$created'\e[0m'
            case $status in
              completed)
                echo '\t'Status: '\e[1;32m'$status '\e[0m'\('\e[1;33m'$(echo $res | jq -r '.conclusion')'\e[0m'\)'\e[0m'
                echo '\t'Completed: '\e[1;32m'$(echo $res | jq -r '.updated_at' | xargs date '+%A %b %d @ %H:%m' --date)'\e[0m'
                ;;

              waiting)
                echo '\t'Waiting...
                ;;
            esac
            ;;

          list)
            gh api /repos/:owner/:repo/actions/workflows | jq -c ".workflows | map({ name: .name }) | .[]" | while read i; do
                echo $i | jq -r '.name'
              done
            ;;

          *)
            echo The following commands are supported from '\e[1;31m'gh action'\e[0m':
            echo '\t\e[1;32m'get'\e[0m' '\e[1;33m?workflow name\e[0m'
            echo '\t\t'Returns info of the most recent Action run. If '\e[1;33m'workflow name'\e[0m' is provided, it will return the most recent run for that workflow

            echo '\t\e[1;32m'list'\e[0m'
            echo '\t\t'Returns the names of all workflows for the repo
            ;;
          esac)
```

And it will return the following:

```bash
$ gh action get "Release build"
Release build (https://github.com/aaronpowell/FSharp.CosmosDb/actions/runs/459861911)
        Started: Monday Jan 04 @ 09:01
        Status: completed (failure)
        Completed: Monday Jan 04 @ 09:01
```

You can find my config file [on my GitHub](https://github.com/aaronpowell/system-init/blob/master/common/gh-config.yml#L23-L60).

## Conclusion

With a little bit of scripting magic we've been able to create a nice new feature on the GitHub CLI that can show us information about the GitHub Actions in our repository. This pattern can be applied to anything you want from the GitHub API, either the REST or GraphQL, depending on what's available where.

Have you been doing any extensions on the GitHub CLI? Share them below so we can get as much power as possible.
