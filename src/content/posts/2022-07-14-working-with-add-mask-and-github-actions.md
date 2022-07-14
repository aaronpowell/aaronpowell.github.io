+++
title = "Working With add-mask and GitHub Actions for dynamic secrets"
date = 2022-07-14T01:00:33Z
description = "This took a lot of chasing down to work out, so hopefully I can save you some time"
draft = false
tags = ["devops"]
tracking_area = "javascript"
tracking_id = "70935"
+++

I've been doing an overhaul of the GitHub Actions workflow that power my blog, which I'll write a separate post about, but on of the new steps I've added is an Azure CLI command that gets the SWA deployment token, rather than having it set as a secret in the GitHub repo.

So the steps of the workflow are 1. make a call to get the token, 2. set it as an environment variable (you could use a step output if preferred), and 3. provide it to the SWA deployment action.

But the problem is, environment variables aren't secret in the logs, meaning your logs will end up something like this:

```
Run Azure/static-web-apps-deploy@v1
  with:
    azure_static_web_apps_api_token: 3c0399e8e4f1456f8249ce89209946c7c6a3fa79a3acf6c17236b9cbb7b1dc54-<snipped for blog post>
    repo_token: ***
    action: upload
    skip_app_build: true
    skip_api_build: true
    app_location: .output
    api_location: .output-api
  env:
    OUTPUT_FOLDER: .output
    DOTNET_VERSION: 6.x
    AZURE_HTTP_USER_AGENT:
    AZUREPS_HOST_ENVIRONMENT:
    SWA_DEPLOYMENT_TOKEN: 3c0399e8e4f1456f8249ce89209946c7c6a3fa79a3acf6c17236b9cbb7b1dc54-<snipped for blog post>
```

Yeah, that happened to me, and yes, the logs did contain the active deployment token for my blog (it's been regenerated now for those who want to do naughty things!).

Whoops!

This is an easy mistake to make, you have a step that's connecting to a service securely to get something else to pass on that's meant to be secret but it's inadvertently leaked via your logs. So, how do we address that?

## The `add-mask` workflow command

GitHub Actions has a set of [workflow commands](https://docs.github.com/actions/using-workflows/workflow-commands-for-github-actions?{{<cda>}}) that can be used for a variety of things, such as `set-output` for outputting from a script.

But for our use-case, we want to use the `add-mask` command, and I'll admit that I found it a little confusing.

### How `add-mask` works

My mistake was that I assumed that `add-mask` worked like `set-output`, only it would make something a "secret" in the logs, but that's not correct.

The way `add-mask` works is that it takes a value and _from that point onwards_ when that value is to be written to the logs, it'll be masked. And this is the important point to note, masking will only be applied **to log messages after it is used**, so you need to ensure it's used as early as possible, relative to the usage of the value you wish to mask.

### Using `add-mask`

Here's a basic workflow that uses `add-mask`:

```yaml
on:
    workflow_dispatch:
    push:
        branches:
            - main

jobs:
    masking:
        runs-on: ubuntu-latest
        steps:
            - run: |
                  echo '::add-mask::test'
                  echo This is a test
```

And here's the raw output from that workflow run (I've truncated to just the job run):

```
2022-07-14T01:27:14.0104402Z ##[group]Run echo '::add-mask::test'
2022-07-14T01:27:14.0104910Z [36;1mecho '::add-mask::test'[0m
2022-07-14T01:27:14.0105274Z [36;1mecho This is a test[0m
2022-07-14T01:27:14.0906476Z shell: /usr/bin/bash -e {0}
2022-07-14T01:27:14.0907141Z ##[endgroup]
2022-07-14T01:27:14.1473068Z This is a ***
2022-07-14T01:27:14.1729814Z Cleaning up orphan processes
```

Notice the second last line, where it says `This is a ***`? that's happened because we've used `add-mask` to _mask_ ever time the work **test** appears in our log, but you will see that it doesn't mask it in the first 3 lines, because at that point, the mask _hasn't_ yet been applied, so it doesn't know to mask there (the first three lines are the logs dumping out the script that's going to be run before it's run).

That is a little bothersome, but realistically, you're unlikely to have a hard-coded string in the workflow file that you want to mask in logs, after all, if it's hard-coded in the workflow, then it's already publicly visible, masking in logs won't solve anything. Instead, you're more likely to mask something that is computed, or retrieved from elsewhere.

## Masking the SWA deployment token

Let's go back to the problem I originally had, I need to mask the deployment token I get from the Azure CLI.

Here's the original step in the workflow:

```yaml
- name: Get SWA deployment token
    uses: azure/CLI@v1
    with:
        inlineScript: |
            echo SWA_DEPLOYMENT_TOKEN=$(az staticwebapp secrets list -n ${{ secrets.SWA_NAME }} -o tsv --query properties.apiKey) >> $GITHUB_ENV
```

We're generating an environment variable assigned to the `az staticwebapps secrets list` call, so this step won't leak it to our logs, just every subsequent step, since this is an environment variable (again, I should probably use a step output, and maybe I will after writing this post...).

Since we can capture the token in a way that won't log, all we need to do now is provide that to `add-mask`, so let's update this step:

```yaml
- name: Get SWA deployment token
    uses: azure/CLI@v1
    with:
        inlineScript: |
            SWA_DEPLOYMENT_TOKEN=$(az staticwebapp secrets list -n ${{ secrets.SWA_NAME }} -o tsv --query properties.apiKey)
            echo "::add-mask::$SWA_DEPLOYMENT_TOKEN"
            echo SWA_DEPLOYMENT_TOKEN=$SWA_DEPLOYMENT_TOKEN >> $GITHUB_ENV
```

Now what we're doing is splitting this down a bit more finely than before and we:

1. Capture the token as a variable within this script
1. Provide it to the `add-mask` call
1. Push it out as an environment variable for the following steps

When this step is hit in the logs, we'll see the following:

```
Run azure/CLI@v1
  with:
    inlineScript: SWA_DEPLOYMENT_TOKEN=$(az staticwebapp secrets list -n *** -o tsv --query properties.apiKey)
  echo "::add-mask::$SWA_DEPLOYMENT_TOKEN"
  echo SWA_DEPLOYMENT_TOKEN=$SWA_DEPLOYMENT_TOKEN >> $GITHUB_ENV
```

Since the script hasn't been evaluated yet, the `add-mask` line shows it _will_ use a variable, but not the value of that variable. Then the script is run and `add-mask` is applied so that when subsequent steps are executed, the logs now look like this:

```
Run Azure/static-web-apps-deploy@v1
  with:
    azure_static_web_apps_api_token: ***
    repo_token: ***
    action: upload
    skip_app_build: true
    skip_api_build: true
    app_location: .output
    api_location: .output-api
  env:
    OUTPUT_FOLDER: .output
    DOTNET_VERSION: 6.x
    AZURE_HTTP_USER_AGENT:
    AZUREPS_HOST_ENVIRONMENT:
    SWA_DEPLOYMENT_TOKEN: ***
```

Success! Our deployment token is no longer visible to anyone via our logs.

## Conclusion

Leaking credentials via log files is something that is really easy to accidentally do - I've been doing this with my SWA deployment token for a few weeks now and thankfully no one noticed. While being able to deploy new files to my blog might not be the end of the world, this is the sort of thing that can leave a company exposed without them even realising it.

GitHub providing the `add-mask` workflow command is really useful to do on-the-fly sanitisation of your log files, but it's a little confusing on how you would use it, so remember, `add-mask` takes a value that you want to mask, it's not for creating new outputs/environment variables/etc., and the masking is only applied for log entries that appear **after** the `add-mask` command is executed, so execute it as early as you can.
