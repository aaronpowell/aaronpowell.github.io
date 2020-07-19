+++
title = "Implementing GitHub Actions for My Blog"
date = 2019-12-17T08:50:14+11:00
description = "A look at how to deploy a Hugo static website to Azure Static Websites and Azure CDN."
draft = false
tags = ["devops", "azure"]
cover_image = "/images/banners/2019-12-12-implementing-github-actions-for-my-blog.png"
+++

While I was doing the work to [host my Blazor search app]({{<ref "/posts/2019-12-10-can-you-use-blazor-for-only-part-of-an-app.md">}}) within my website I realised I'd need to update the deployment pipeline I use for my blog. The process being used was very similar to the one [used for the DDD Sydney website]({{<ref "/posts/2018-07-05-automating-deployments-for-dddsydney.md">}}), but tweaked for use with Hugo. As it was setup a while ago I used the UI designer in [Azure Pipelines](https://azure.microsoft.com/en-us/services/devops/pipelines/?{{<cda>}}), not the [YAML approach](https://docs.microsoft.com/en-us/azure/devops/pipelines/yaml-schema?view=azure-devops&tabs=schema&{{<cda>}}) so this seemed like the perfect opportunity for an overhaul.

But if I'm going to go in for an overhaul and port to YAML I decided it was time to learn something that'd been on my backlog, [GitHub Actions](https://help.github.com/en/actions?{{<cda>}}), after all, I've used Azure Pipelines extensively, so why not learn something new and compare/contrast the two products?

## The Moving Parts

With my website there are three pieces that I need to handle, generating a static website using Hugo, generating the Blazor WebAssembly application and deploying to Azure Static Websites while updating Azure CDN. I'll try and break this article down into those three pieces so that if one of them isn't relevant to you it'll be easy to focus on the parts you need most.

## My First Action

If you haven't worked with GitHub Actions yet, they appear under a new tab on your repository called [Actions](https://github.com/aaronpowell/aaronpowell.github.io/actions). With GitHub Actions you create a Workflow that will run on a number of different triggered events in GitHub, issues being created, PR's raised, commits pushed [and many others](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/configuring-a-workflow?{{<cda>}}#triggering-a-workflow-with-events). There's a guide that you can follow along in the GitHub UI to get started, but if you're wanting to start in an editor the first thing you'll need to do is create a new folder in your repo, `.github/workflows`, and add a YAML file to it. This file can be named anything, so long as it has a `.yml` or `.yaml` extension, mine is named `continuous-integration.yml`.

From here we can define the metadata about our Workflow:

```yml
name: Build and Deploy Website
```

Environment variables:

```yml
env:
    OUTPUT_PATH: ${{ github.workspace }}/.output
```

And what triggers the Workflow:

```yml
on:
    push:
        branches:
            - master
```

This gives us a starting like so:

```yml
name: Build and Deploy Website
env:
    OUTPUT_PATH: ${{ github.workspace }}/.output

on:
    push:
        branches:
            - master
```

In which we can then create `jobs`, which are the _things_ our Workflow does.

```yml
jobs:
    job_name:
        runs-on: <platform>
        steps: <steps to run>
```

The `runs-on` is similar to the `pool` in Azure Pipelines and is used to specify the platform that the Workflow will run on (Linux, MacOS or Windows). After that, we define some `steps` for what our Job does by specifying Actions to use from the marketplace or commands to run.

Steps will often have a `uses` directive which specifies the Action to run the step "tasks" under. This will either get something from the Actions marketplace or a custom Action within your git repo.

My colleague [Tierney Cyren](https://twitter.com/bnb) has a [fantastic intro guide](https://dev.to/bnb/an-unintentionally-comprehensive-introduction-to-github-actions-ci-blm) that you should check out to understand the building blocks (I used it as a reference myself when creating this Workflow!).

And with the primer handled let's start creating jobs for each piece we need to handle.

### Termonology Summary

Just to summarise some of the new terms we've been introduced to:

-   GitHub Actions - the product we're using from GitHub
-   Actions - things we can get from the marketplace (or build ourself) that defines what we can do
-   Workflow - A series of Environment Variables, Jobs and Steps undertaken when an event happens
-   Jobs - What our Workflow does
-   Steps - A task undertaken by a Job using an Action

## Generating The Static Website

My blog uses [Hugo](https://gohugo.io/), a simple static website generator written in Golang that consists of a single binary. All the content I need for my blog is in my [GitHub repo](https://github.com/aaronpowell/aaronpowell.github.io) and I even keep the Hugo binary in there so it's easy to just clone-and-run. So it's really simple, but let's look at how to do it via GitHub Actions.

Let's start by defining a Job for this Workflow:

```yml
jobs:
    build_hugo:
        runs-on: ubuntu-latest
```

The Job name is `build_hugo`, I like to name things with a prefix for their role (`build` or `deploy`) and the role it's performing, but the naming convention is up to you, just make sure it makes enough sense for when you look at it in 2 months!

I've specified that we're going to use the `ubuntu-latest` image as our base because Hugo can run on Linux and it's a simple image to use.

This Job is a "Continuous Integration" Job, meaning it needs access to the "stuff" in our git repository so the first step we're going to want to perform is a `git checkout`, and for that we can use the [`actions/checkout@v1`](https://github.com/actions/checkout) Action (note: I'm pinning the version to `v1`):

```yml
build_hugo:
    runs-on: ubuntu-latest
    steps:
        - uses: actions/checkout@v1
```

This Action doesn't require anything other than to be used for the checkout to happen on `master`, but if you're using it with a PR you might want to tweak it. For that check out the [Action documentation](https://github.com/actions/checkout).

### Building Hugo in an Action

Given I have the Hugo binary in the git repo I could just run that as a shell script, but I decided to look at whether or not I could do it "more Action-y" and I was pointed to [`peaceiris/actions-hugo`](https://github.com/peaceiris/actions-hugo). This is a pre-built Action designed to work with Hugo.

### Outputting Information from a Step

When we use the Hugo Action we need to give it the version of Hugo that we want to use (which it'll download for us), and I figured that since I have the Hugo binary, why not ask it what version it is? Let's add another Step to our Job that runs a script on the default shell:

```yml
build_hugo:
    runs-on: ubuntu-latest
    steps:
        - uses: actions/checkout@v1

        - name: Get Hugo Version
          id: hugo-version
          run: |
              HUGO_VERSION=$(./hugo version | sed -r 's/^.*v([0-9]*\.[0-9]*\.[0-9]*).*/\1/')
              echo "::set-output name=HUGO_VERSION::${HUGO_VERSION}"
```

This runs the `./hugo version` command to give me a rather verbose string that is passed to an ugly `sed` regex to generate an environment variable available within this Step. But since we'll need it in a different Step we have to turn it into Step Output, and we do that with this line:

```yml
echo "::set-output name=HUGO_VERSION::${HUGO_VERSION}"
```

If you've used Azure Pipelines it's similar to the [`##vso[task.setvariable variable=MyVar]some-value`](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/variables?view=azure-devops&tabs=yaml%2Cbatch&{{<cda>}}#set-a-job-scoped-variable-from-a-script) weirdness you may have used.

The other bit of information you need on the Step is the `id`, as that is how you can refer to it from other Steps.

### Generating Hugo Output

With the Hugo version in hand we can now generate the HTML output:

```yml
- name: Setup Hugo
  uses: peaceiris/actions-hugo@v2.3.0
  with:
      hugo-version: "${{ steps.hugo-version.outputs.HUGO_VERSION }}"

- name: Build
  run: hugo --minify --source ./src --destination ${{ env.OUTPUT_PATH }}
```

The `Setup Hugo` Step uses our marketplace Action (`peaceiris/actions-hugo@v2.3.0`) and sets the version by looking back to the previous Step output. Then we run a build step using the `hugo` binary from the Action to generate the output files. Because my site content isn't at the root of the repo, it's in the `src` folder, I specify the `--source` flag and override the default output to use an environment variable created at the very top of the Workflow.

### Creating an Artifact

A Job is made up of many Steps that are run sequentially, so you could do a build & release all from the one Job, but I prefer to separate those into clearly defined Jobs, making the phases of my Workflow clear. Since each Job runs on a new VM we need some way to get the artifacts that are generated out for use in future Jobs. For this we'll use the [`actions/upload-artifact@v1`](https://github.com/actions/upload-artifact) Action:

```yml
- name: Publish website output
  uses: actions/upload-artifact@v1
  with:
      name: website
      path: ${{ env.OUTPUT_PATH }}

- name: Publish blog json
  uses: actions/upload-artifact@v1
  with:
      name: json
      path: ${{ env.OUTPUT_PATH }}/index.json
```

Again using the analogy to Azure Pipelines, this is like the [`PublishPipelineArtifact`](https://docs.microsoft.com/en-us/azure/devops/pipelines/artifacts/pipeline-artifacts?view=azure-devops&tabs=yaml&{{<cda>}}) task, where we specify the name of the artifact and the location on disk to it. Artifacts are packaged as a zip for you, whether they are a single file or a directory, so you don't need to do any archiving yourself unless you want something special, but then you'll end up with it zipped anyway.

You may also notice that I'm publishing a JSON file, this is a JSON version of my blog which will be used [to generate my search index]({{<ref "/posts/2019-12-11-optimising-our-blazor-search-app.md">}}).

But, as far as our static website is concerned, we can deploy it to Azure. You'll find this full pipeline Job [here on my GitHub](https://github.com/aaronpowell/aaronpowell.github.io/blob/62a16a00f509cd13f6a4be84b6b66677df1d7914/.github/workflows/continuous-integration-workflow.yml#L12-L41)

## Building Our Search App

The other piece of the application we need to build is the Search App and the Search Index, which is a [Blazor WebAssembly](https://docs.microsoft.com/en-gb/aspnet/core/blazor/?view=aspnetcore-3.0&{{<cda>}}#blazor-webassembly) application and console application.

For this I'll use two separate jobs, one to build the UI and one to build the index.

### Building the Blazor UI

As this is a "Continious Integration" Job, like `build_hugo`, so it'll start with `git checkout`, using the [`actions/checkout@v1`](https://github.com/actions/checkout) Action:

```yml
build_search_ui:
    runs-on: ubuntu-latest
    steps:
        - uses: actions/checkout@v1
```

To build with .NET there's a convenient [`actions/setup-dotnet`](https://github.com/actions/setup-dotnet) Action that we can grab, and this one needs to know what version of .NET to download into your Job's VM. I'm going to add a new environment variable to the top of our file (since we'll use the same version in the `build_search_index` Job shortly):

```yml
DOTNET_VERSION: "3.1.100-preview3-014645"
```

Then it looks fairly similar to Azure Pipelines:

```yml
build_search_ui:
    runs-on: ubuntu-latest
    steps:
        - uses: actions/checkout@v1

        - uses: actions/setup-dotnet@v1
          with:
              dotnet-version: ${{ env.DOTNET_VERSION }}

        - name: Build search app
          run: dotnet build --configuration Release
          working-directory: ./Search

        - name: Publish search UI
          run: dotnet publish --no-build --configuration Release --output ${{ env.OUTPUT_PATH }}
          working-directory: ./Search/Search.Site.UI
```

We have Steps to setup the version of .NET, run `dotnet build` and finally `dotnet publish` (of the UI) and then we can package up the outputs (which we [learn about previously]({{<ref "/posts/2019-12-10-can-you-use-blazor-for-only-part-of-an-app.md">}})):

```yml
- name: Package search UI
  uses: actions/upload-artifact@v1
  with:
      name: search
      path: ${{ env.OUTPUT_PATH }}/Search.Site.UI/dist/_framework
```

Blazor done ([GitHub link](https://github.com/aaronpowell/aaronpowell.github.io/blob/62a16a00f509cd13f6a4be84b6b66677df1d7914/.github/workflows/continuous-integration-workflow.yml#L43-L64)), onto our search index.

### Generating the Search Index

This Job is going to be dependant on an artifact that comes from `build_hugo` so we need to tell GitHub Actions to wait for that one to complete. If we don't, our Workflow will run all of our Jobs in parallel, for that we add a dependency list:

```yml {hl_lines=[3]}
build_search_index:
    runs-on: ubuntu-latest
    needs: build_hugo
    steps:
        - uses: actions/checkout@v1

        - uses: actions/setup-dotnet@v1
          with:
              dotnet-version: ${{ env.DOTNET_VERSION }}
```

We'll use the same `actions/checkout` and `actions/setup-dotnet` here, since we're ultimately going to use `dotnet run`, but we're going to need to get the JSON file to build the index from. For that we can use [`actions/download-artifact`](https://github.com/actions/download-artifact).

```yml {hl_lines=["11-15"]}
build_search_index:
    runs-on: ubuntu-latest
    needs: build_hugo
    steps:
        - uses: actions/checkout@v1

        - uses: actions/setup-dotnet@v1
          with:
              dotnet-version: ${{ env.DOTNET_VERSION }}

        - name: Download index source
          uses: actions/download-artifact@v1
          with:
              name: json
              path: ${{ env.OUTPUT_PATH }}
```

What's cool about `actions/download-artifact` is that it will unpack the zip for you too, so the archiving format isn't something you need to concern yourself about!

Now we can build the index and publish it as an artifact:

```yml {hl_lines=["17-25"]}
build_search_index:
    runs-on: ubuntu-latest
    needs: build_hugo
    steps:
        - uses: actions/checkout@v1

        - uses: actions/setup-dotnet@v1
          with:
              dotnet-version: ${{ env.DOTNET_VERSION }}

        - name: Download index source
          uses: actions/download-artifact@v1
          with:
              name: json
              path: ${{ env.OUTPUT_PATH }}

        - name: Build search index
          run: dotnet run
          working-directory: ./Search/Search.IndexBuilder

        - name: Publish search index
          uses: actions/upload-artifact@v1
          with:
              name: search-index
              path: ./Search/Search.IndexBuilder/index.zip
```

You will notice that I am uploading a zip as an artifact, so it will be "double archived", but that is because the archive is what the UI application will download from my website, so it's not a problem.

And with that, the last of the Build Jobs are complete ([GitHub link](https://github.com/aaronpowell/aaronpowell.github.io/blob/62a16a00f509cd13f6a4be84b6b66677df1d7914/.github/workflows/continuous-integration-workflow.yml#L66-L90)).

## Deploying to Azure Static Websites

For my website I use [Azure Static Websites](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blob-static-website?{{<cda>}}) as a cheap host. It turns out that there's a GitHub Action already made for this, [`feeloor/azure-static-website-deploy`](https://github.com/feeloor/azure-static-website-deploy) which makes things super easy to deploy.

This prebuilt Action will deploy your files into the `$web` container within your Storage Account, as per the standard approach with Static Websites, but I don't use the `$web` container directly, instead, I have my site in a subdirectory that uses the Azure Pipelines build number. This allows me to roll back versions if required, or when I break things, diff the changes. So instead of this Action I'm going to use the Azure CLI to do the deployment.

Let's start creating the Job:

```yml
deploy_website:
    runs-on: ubuntu-latest
    needs: [build_search_ui, build_search_index]
    env:
        STORAGE_NAME: aaronpowellstaticwebsite
        CDN_NAME: aaronpowell
        CDN_PROFILE_NAME: aaronpowell
        RG_NAME: personal-website
```

This is a "Continuous Delivery" Job so I'm prefixing it with `deploy`, it also has dependencies on the completion of the `build_` jobs, which are defined in the `needs` property. I chose to not put `build_hugo` in the `needs`, since it's enforced by the need to complete `build_search_index`, but I might change that in future so it's a bit less opaque what the dependent Jobs are.

I've also created some environment variables needed in Azure, mainly because I dislike inline magic strings. They are created within this Job rather than at the top of the Workflow since they are only used within this Job.

Now it's onto the Steps.

### Working With Azure in Actions

Microsoft has provided [some Actions](https://github.com/azure/actions) that you can use. At the time of writing there isn't one for working with storage or CDN, we have to do that via the CLI, but before we can do that we need to log into Azure using [`azure/login`](https://github.com/Azure/login):

```yml
steps:
    - uses: azure/login@v1
      with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
```

To use this you need to create an Azure Service Principal and then store it as a [secret variable](https://help.github.com/en/articles/virtual-environments-for-github-actions?{{<cda>}}#creating-and-using-secrets-encrypted-variables) for your Workflow (no, don't inline your Azure credentials, that's just bad).

Next we need to download some artifacts using [`actions/download-artifact`](https://github.com/actions/download-artifact):

```yml
steps:
    - uses: azure/login@v1
      with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

    - name: Download website
      uses: actions/download-artifact@v1
      with:
          name: website
          path: ${{ env.OUTPUT_PATH }}

    - name: Download search UI
      uses: actions/download-artifact@v1
      with:
          name: search
          path: ${{ env.OUTPUT_PATH }}/_framework

    - name: Download search index
      uses: actions/download-artifact@v1
      with:
          name: search-index
          path: ${{ env.OUTPUT_PATH }}
```

I'm being sneaky and downloading them all to the same folder, and since there aren't any file name collisions my Job's VM will have the website structure just how I want it!

It's now time to upload the files to storage:

```yaml
- name: Deploy to Azure Storage
  run: az storage blob upload-batch --source ${{ env.OUTPUT_PATH }} --destination \$web/${GITHUB_SHA} --account-name ${STORAGE_NAME}
```

I'm using the [`upload-batch`](https://docs.microsoft.com/en-us/cli/azure/storage/blob?view=azure-cli-latest&{{<cda>}}#az-storage-blob-upload-batch) command on the CLI to do a bulk upload, which is faster than going through each file individually. When publishing using Azure Pipelines, the folder in the `$web` container was the build number, but with GitHub Actions there isn't a build number, there's only the SHA of the commit that triggered the action, which we can access using `${GITHUB_SHA}`. This does mean I can't sequentially find what is the latest deployment by browsing the storage account, but it is more obvious what commit relates to what deployment!

### Fixing Our WASM App

**Update:** Since I initially wrote this post the uploader has been improved to set the correct content type onf `.wasm` files, so you don't need to do it manually. But if you have other files you need to change the content type for, this is how you'd do it.

~~When you upload files to Azure Storage it will attempt to work out the mime type of the file and set it appropriately. Most of the time this works, except when it doesn't, and WebAssembly seems to be one of those edge cases at the moment, `.wasm` files are given the mime type of `application/octet-stream` but it needs to be `application/wasm`, otherwise the browser will reject the file.~~

~~But that's easily fixed with the Azure CLI!~~

```yml
- name: Update wasm pieces
  run: az storage blob update --container-name \$web/${GITHUB_SHA}/_framework/wasm --name "mono.wasm" --content-type "application/wasm" --account-name ${STORAGE_NAME}
```

~~We can run a [`blob update`](https://docs.microsoft.com/en-us/cli/azure/storage/blob?view=azure-cli-latest&{{<cda>}}#az-storage-blob-update) and change the `content-type` stored so it gets served correctly.~~

### Updating Azure CDN

Latest website updates are uploaded, the files have the right types, so there's one thing left to do, tell Azure CDN to start using the new updates.

Again, there isn't an existing Action (at time of writing), so we'll have to use the CLI. The first step is to update the CDN endpoint to use the new folder:

```yml
- name: Update CDN endpoint
  run: az cdn endpoint update --name ${CDN_NAME} --origin-path /${GITHUB_SHA} --profile-name ${CDN_PROFILE_NAME} --resource-group ${RG_NAME}
```

And then we'll purge the CDN cache so that the new files are sent to our readers:

```yml
- name: Purge CDN
  run: az cdn endpoint purge --profile-name ${CDN_PROFILE_NAME} --name ${CDN_NAME} --resource-group ${RG_NAME} --content-paths "/*"
```

Here we're doing a hard-purge and just deleting everything from the cache, but if you were using it in other scenarios (or had some intelligence around what files were changes) you could set different `content-paths` and the purge would be quicker.

But that's how we can deploy a static website and update the CDN from GitHub Actions ([GitHub link](https://github.com/aaronpowell/aaronpowell.github.io/blob/62a16a00f509cd13f6a4be84b6b66677df1d7914/.github/workflows/continuous-integration-workflow.yml#L92-L134)).

## Conclusion

Throughout this post we've seen a bunch of different things with GitHub Actions. We've seen how to use some of the Actions provided by the Actions team to check out our source code and work with artifacts. We then used some third party Actions to work with Hugo and Azure.

We saw how to define variables that are available throughout a Workflow by putting them at the top of the Workflow, defined some for specific jobs (such as our Azure information), output them from one step to another in a Job or even have credentials made available.

You can see the complete Workflow YAML file [on my GitHub](https://github.com/aaronpowell/aaronpowell.github.io/blob/62a16a00f509cd13f6a4be84b6b66677df1d7914/.github/workflows/continuous-integration-workflow.yml) and check out past runs [such as from a recent blog post](https://github.com/aaronpowell/aaronpowell.github.io/commit/a444ca21caf76b44cc6b8b71ff5ab2e44564a3aa/checks?check_suite_id=352172927).
