+++
title = "Deploying Azure Functions With Github Actions"
date = 2020-01-10T13:34:00+11:00
description = "Looking to deploy Azure Functions with GitHub Actions? Here's how to get started."
draft = false
tags = ["serverless", "azure-functions", "devops", "azure"]
+++

When I was creating [my Azure Functions to generate social images]({{<ref "/posts/2020-01-03-generating-images-with-azure-functions.md">}}) I decided to give [GitHub Actions](https://github.com/features/actions?{{<cda>}}) a spin as the deployment tool, after all, I quite liked them when I [updated my blog]({{<ref "/posts/2019-12-17-implementing-github-actions-for-my-blog.md">}}). So let's have a look at how to use GitHub Actions to deploy [Azure Function](https://azure.microsoft.com/en-us/services/functions/?{{<cda>}}).

_There's a lot of context and terminology on getting started with GitHub Actions in my [other blog post]({{<ref "/posts/2019-12-17-implementing-github-actions-for-my-blog.md">}}) that I'd encourage you to read first if you're new to GitHub Actions, since I won't cover it all in detail here._

## Setting Up Our Action

We'll start by creating our GitHub Action file at `.github/workflows/devops-workflow.yml` in our git repo:

```yml
name: Build and Deploy
env:
    OUTPUT_PATH: ${{ github.workspace }}/.output
    DOTNET_VERSION: "3.1.100"

on:
    push:
        branches:
            - master

jobs:
```

We'll use some environment variables for the output and .NET version (since the Functions in my image generator are .NET Functions, but you don't need that if they are non-.NET that you're using) and specify that this workflow will only run when code is pushed to the `master` branch.

## The Build Job

If it's a .NET Function we'll need to compile it, if it's Node.js install the npm packages, use pip if it's Python and Maven for Java. This is what the role of the Build job will handle, preparing the assets we need to deploy to Azure, so let's create a Build job:

```yml
build:
    runs-on: ubuntu-latest
    steps:
        - name: "Checkout"
          uses: actions/checkout@master

        - name: Setup Dotnet ${{ env.DOTNET_VERSION }}
          uses: actions/setup-dotnet@v1
          with:
              dotnet-version: ${{ env.DOTNET_VERSION }}

        - name: Publish functions
          run: dotnet publish --configuration Release --output ${{ env.OUTPUT_PATH }}
```

This will use the `actions/setup-dotnet@v1` Action from the marketplace to install the right version of .NET (based on our environment variable) and use the .NET CLI to publish the output.

Now it's time to package the output for the deployment job:

```yml
- name: Package functions
  uses: actions/upload-artifact@v1
  with:
      name: functions
      path: ${{ env.OUTPUT_PATH }}
```

Tada 🎉! You have an artifact for the Functions, ready to be deployed.

## The Deployment Job

```yml
deploy:
    runs-on: ubuntu-latest
    needs: [build]
    env:
        FUNC_APP_NAME: blogimagegenerator
```

Since the `deploy` job will need the artifacts from the `build` job we'll set it up as a dependency using the `needs: [build]`, otherwise we'd deploy before the Functions were built, and that's not going to work!

```yml
steps:
    - name: Download website
      uses: actions/download-artifact@v1
      with:
          name: functions
          path: ${{ env.OUTPUT_PATH }}

    - name: "Login via Azure CLI"
      uses: azure/login@v1
      with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
```

Using the `actions/download-artifact@v1` we can get the output from the `build` job and then it's time to log in to Azure using the credentials we'd previously generated (see my last blog post for information about that).

The last piece of the puzzle is to use the [`Azure/functions-action@v1`](https://github.com/Azure/functions-action) GitHub Action from the marketplace:

```yml
- name: "Run Azure Functions Action"
  uses: Azure/functions-action@v1
  with:
      app-name: ${{ env.FUNC_APP_NAME }}
      package: ${{ env.OUTPUT_PATH }}
```

This requires the name of the Function App that we're deploying into to be provided as the `app-name` parameter (we've stored it in an environment variable named `FUNC_APP_NAME`).

And with that the workflow is complete, ready to deploy your Functions to Azure. You can find the full file [on my GitHub](https://github.com/aaronpowell/blog-card-generator/blob/master/.github/workflows/devops-workflow.yml) along with [a recent run](https://github.com/aaronpowell/blog-card-generator/commit/9868de2cbef31436da62286463d1b9f6a11a8706/checks?check_suite_id=382519437) if you're curious on the output.

## Conclusion

With only 53 lines we can create a GitHub Action that will deploy Azure Functions each time we push to a branch, which I think is pretty simple.

I've covered off how to do it with a .NET Function, but if you want to check out how to do it with other languages head on over to the [Azure Function docs](https://docs.microsoft.com/azure/azure-functions/functions-how-to-github-actions?{{<cda>}}).
