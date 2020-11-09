+++
title = "Deploy to GitHub Packages With GitHub Actions"
date = 2020-11-06T09:25:07+11:00
description = "Let's look at how to automate releases to GitHub Packages using GitHub Actions"
draft = false
tags = ["devops", "javascript", "dotnet"]
tracking_area = "javascript"
tracking_id = "10724"
+++

You've started a new project in which you're creating a package to release on a package registry and you want to simplify the workflow in which you push some changes to be tested in an app, without a lot of hassle of copying local packages around.

The simplest solution to this is to push to npm, but that can be a bit cluttering, especially if you're iterating quickly.

This is a predicament that I found myself in recently, and decided it was finally time to check out [GitHub Packages](https://github.com/features/packages). GitHub Package supports a number of different package repository formats such as npm, NuGet, Maven and Docker, and integrates directly with the existing package management tool chain. For this post, we'll use a npm package, but the concept the same for all registry types.

## Creating a Workflow

To do this workflow, we'll use [GitHub Actions](https://github.com/features/actions) as our workflow engine. I've blogged in the past on [getting started with GitHub Actions]({{<ref "/posts/2019-12-17-implementing-github-actions-for-my-blog.md">}}), so if you're new to them I'd suggest using that to brush up on the terminology and structure of a workflow file.

Start by created a workflow file in `.github/workflows` and call it `build.yml`. We want this workflow to run every time someone pushes to the `main` branch, or when a PR is opened against it, so we'll set that as our trigger:

```yml
name: Node.js CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
```

Next, we'll create a job that does your normal build process. Remember that this is a Node package, so it's written for that, but swap it out for `npm` calls, or whatever platform you're targeting:

```yml
jobs:
  build:
    runs-on: ubuntu-18.04
    steps:
    - uses: actions/checkout@v2
    - name: Use Node.js 14.x
      uses: actions/setup-node@v1
      with:
        node-version: 14.x
    - run: npm ci
    - run: npm run lint
    - run: npm test
```

## Building a Package

With the workflow running our standard verification checks, the next job will generate the package. Personally, I like to extract it out to a separate `job` so it's clear which phase of our workflow a failure has happened. This new `job` will be called `package` and it'll need the `build` job to complete first, which we specify with the `needs` property:

```yml
  package:
    needs: [build]
    runs-on: ubuntu-18.04
    steps:
      - uses: actions/checkout@v2
      - name: Use Node.js 14.x
        uses: actions/setup-node@v1
        with:
          node-version: 14.x
```

One down-side of doing this as a separate `job` is that we'll need to prepare the artifacts for the package to be created again, as they aren't available from the `build` job (unless you upload them, but that might be really slow if you have a lot of dependencies), so we'll have to get them again.

```yml
  package:
    needs: [build]
    runs-on: ubuntu-18.04
    steps:
      - uses: actions/checkout@v2
      - name: Use Node.js 14.x
        uses: actions/setup-node@v1
        with:
          node-version: 14.x

      - run: npm ci
```

For this example, we're only installing the npm packages, but if it was a TypeScript project you'd want to run the `tsc` compilation, .NET projects would need to compile, etc.

With dependencies installed, it's time to generate the package:

```yml
  package:
    needs: [build]
    runs-on: ubuntu-18.04
    steps:
      - uses: actions/checkout@v2
      - name: Use Node.js 14.x
        uses: actions/setup-node@v1
        with:
          node-version: 14.x

      - run: npm ci
      - run: npm version prerelease --preid=ci-$GITHUB_RUN_ID --no-git-tag-version
      - run: npm pack
      - name: Upload
        uses: actions/upload-artifact@v2
        with:
            name: package
            path: "*.tgz"
```

With npm we have a `version` command that can be used to bump the version that the package is going to be created, and you can use it to bump each part of the semver string (check out [the docs](https://docs.npmjs.com/cli/v6/commands/npm-version) for all options). Since this is happening as part of a CI build, we'll just tag it as a pre-release package bump, and use the ID of the build as the version suffix, making it unique and auto-incrementing across builds. We'll also give it the `--no-git-tag-version` flag since we don't need to tag the commit in Git, as that tag isn't getting pushed (but obviously you can do that if you prefer, I just wouldn't recommend it as part of a CI build as you'd get **a lot** of tags!).

If you're using .NET, here's the `run` step I use:

```yml
run: dotnet pack --configuration Release --no-build --version-suffix "-ci-$GITHUB_RUN_ID" --output .output
```

Finally, we'll use the upload Action to push the package to the workflow so we can download it from the workflow to do local installs, or use it in our final `job` to publish to GitHub Packages.

## Publishing a Package

With our package created and appropriately versioned it's time to put it in GitHub Packages. Again, we'll use a dedicated job for this, and it's going to depend on the `package` job completion:

```yml
  publish:
    name: "Publish to GitHub Packages"
    needs: [package]
    runs-on: ubuntu-18.04
    if: github.repository_owner == 'aaronpowell'
    steps:
    - name: Upload
      uses: actions/download-artifact@v2
      with:
          name: package
    - uses: actions/setup-node@v1
      with:
        node-version: 14.x
        registry-url: https://npm.pkg.github.com/
        scope: "@aaronpowell"
    - run: echo "registry=https://npm.pkg.github.com/@aaronpowell" >> .npmrc
    - run: npm publish $(ls *.tgz)
      env:
        NODE_AUTH_TOKEN: ${{secrets.GITHUB_TOKEN}}
```

You'll notice that here we have an `if` condition on the job and that it's checking the [GitHub context object](https://docs.github.com/en/free-pro-team@latest/actions/reference/context-and-expression-syntax-for-github-actions#github-context) to ensure that the owner is the organisation that this repo belongs to. The primary reason for this is to reduce the chance of a failed build if someone pushes a PR from a fork, it won't have access to `secrets.GITHUB_TOKEN`, and as such the job would fail to publish, resulting in a failed job. You may want to tweak this condition, or remove it, depending on your exact scenario.

This job also doesn't use the `actions/checkout` Action, since we don't need the source code. Instead, we use `actions/download-artifact` to get the package file created in the `package` job.

To publish with npm, we'll setup node, but configure it to use the GitHub Packages registry, which is `https://npm.pkg.github.com/` and define the current organisation as the scope (`@aaronpowell`).

We'll then setup the `.npmrc` file, specifying the registry again. This ensures that the publishing of the package will go through to the GitHub Packages endpoint, rather than the public npm registry.

Lastly, we run `npm publish` and since we're publishing the package from an existing `tgz`, not from a folder with a `package.json`, we have to give it the file path. Since we don't know what the version number is we can use `ls *.tgz` to get it and inline that to the command.

_Quick note, GitHub Packages only supports scoped npm packages ([ref](https://docs.github.com/en/enterprise-server@2.22/packages/using-github-packages-with-your-projects-ecosystem/configuring-npm-for-use-with-github-packages#publishing-a-package)), so your package name will need to be scoped like `@aaronpowell/react-foldable`._

## Conclusion

With this done, each build will create a GitHub Package that you can use. You'll find a full workflow example on my [react-foldable](https://github.com/aaronpowell/react-foldable/blob/main/.github/workflows/build.yml) project.

The requirement for npm packages to be scoped caught me out initially, but it's an easy change to make, especially early on in a project.

Ultimately though, this helps give a quicker feedback loop between making a change to a package and being able to integrate it into a project, using the standard infrastructure to consume packages.
