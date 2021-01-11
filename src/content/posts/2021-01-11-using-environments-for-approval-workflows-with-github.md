+++
title = "Using Environments for Approval Workflows With GitHub Actions"
date = 2021-01-11T10:33:48+11:00
description = ""
draft = false
tags = ["devops", "javascript"]
tracking_area = "devops"
tracking_id = "12576"
cover_image = "/images/approval-workflows-with-github-actions/environments/banner.png"
+++

Last year I wrote a post about how I [implemented an overly complex approval workflow with GitHub Actions]({{<ref "/posts/2020-03-23-approval-workflows-with-github-actions.md">}}). While it wasn't the simplest solution, at the time it was a means to an end as we didn't have any built-in way to do approval workflows with GitHub Actions. At the end of last year that changed with the introduction of [Environments](https://docs.github.com/en/free-pro-team@latest/actions/reference/environments?{{<cda>}}) ([announcement post](https://github.blog/changelog/2020-12-15-github-actions-environments-environment-protection-rules-and-environment-secrets-beta/)). Environments bring in the concept of protection rules, which currently supports two types, required reviewers and a wait timer, which is exactly what we need for an approval workflow.

So with this available to us, let's look at taking the [workflow to publish GitHub Packages]({{<ref "/2020-11-06-deploy-to-github-packages-with-github-actions.md">}}) and turn it into an approval-based workflow.

## Setting up Environments

Navigate to the GitHub repo you want to set this up on and then go to `Settings` -> `Environments`.

![GitHub settings UI](/images/approval-workflows-with-github-actions/environments/001.png)

From here we can create new Environments. You can make as many as you need, and you can have different sets of environments for different workflows, they don't have to be reused or generic. We'll create two environments, one called `build`, which will be the normal compilation step of our workflow and one called `release`, which will have the approval on it and used to publish to our package registry (I'm using npm here, but it could be NuGet, or anything else).

On the **Configure release** screen we'll add a protection rule of **Required reviewer**, and I've added myself as the person required, but set whoever is the right person for this environment (you can nominate up to 6 people).

![Environment protection rule defined](/images/approval-workflows-with-github-actions/environments/002.png)

Remember to click **Save protection rules** (I kept forgetting!), and your environments are good to go.

![Environments ready to use](/images/approval-workflows-with-github-actions/environments/003.png)

## Implementing our workflow

With the Environments setup, we can now return to our GitHub Actions workflow and overhaul it to work with the Environments. We'll also take this opportunity to have our workflow create a GitHub Release for us as well.

To achieve this, we'll have four distinct environments, `build` to create the package and draft a GitHub Release, `release` to publish the GitHub Release, `publish-npm` to publish the package to npm and `publish-gpr` to publish to GitHub Packages. The `release` stage will need to wait until `build` has completed, and we've approved the release, and the two `publish` environments will wait for the `release` stage to complete.

_Note: `publish-npm` and `publish-gpr` aren't created as Environments in GitHub but they are implicit Environments. You could create explicit environments if you wanted protection rules, but I wanted to show how you can use explicit and implicit Environments together._

Let's scaffold the workflow:

```yml
name: Publish a release

on:
    push:
        tags:
            - v* #version is cut

env:
    NODE_VERSION: 12

jobs:
```

It's going to be triggered on a new version tag being pushed, which I like to do manually.

### The `build` stage

We'll start by associating the `build` job with the Environment:

```yml
jobs:
    build:
        runs-on: ubuntu-latest
        defaults:
            run:
                working-directory: react-static-web-apps-auth
        environment:
            name: build
            url: ${{ steps.create_release.outputs.html_url }}
        steps:
```

_Note: you can ignore the `working-directory` default, I need that due to the structure of my Git repo. It's left in for completeness of the workflow file at the end._

To link the job to the Environment we created in GitHub we add an `environment` node and provide it the name of the Environment we created, `build` in this case. You can optionally provide an output URL to the run, and since we'll be creating a draft Release, we can use that as the URL, but if you were deploying to somewhere, then you could use the URL of the deployed site.

Now we can add the steps needed:

```yml
steps:
    - uses: actions/checkout@v2
    - name: Create Release
      id: create_release
      uses: actions/create-release@v1
      env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: true
          prerelease: false
```

Here we're using `actions/create-release` to create a Release on GitHub and setting it to `draft`, as it's not yet approved. This step has an `id` set, `create_release`, which is what we used to get the release URL for the Environment output and will need to upload artifacts shortly.

You can add the appropriate build/test/etc. steps after this one, again this is an example with a JavaScript project and I'm using npm, so change to your platform of choice:

```yml
- uses: actions/setup-node@v1
  with:
      node-version: ${{ env.NODE_VERSION }}
- run: |
      npm ci
      npm run lint
      npm run build
      npm pack
```

With this step we're generating the package that will go to our package registry, but since we're not publishing yet (that's a future jobs responsibility), we need a way to make it available to the future jobs. For that we'll publish it as an artifact of the workflow, using `actions/upload-artifact`:

```yml
- name: Upload
  uses: actions/upload-artifact@v2
  with:
      name: package
      path: "react-static-web-apps-auth/*.tgz"
```

It'd also be good if the Release we're creating had the package attached to it, if people want to download it rather than use a package registry, and we can do that with `actions/upload-release-asset`. The only problem is that we need to find out the full name of the package, including version, but that's dynamic. To tackle this I create an environment variable containing the tag, extracted from `GITHUB_REF` using some [bash magic](https://stackoverflow.com/a/9533099):

```yml
- run: echo "tag=${GITHUB_REF##*/v}" >> $GITHUB_ENV
- name: Upload package to release
  uses: actions/upload-release-asset@v1
  env:
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
      upload_url: ${{ steps.create_release.outputs.upload_url }}
      asset_path: "react-static-web-apps-auth/aaronpowell-react-static-web-apps-auth-${{ env.tag }}.tgz"
      asset_name: "aaronpowell-react-static-web-apps-auth-${{ env.tag }}.tgz"
      asset_content_type: application/zip
```

Again, we're using the `create_release` step output to get the URL needed to upload the assets, another reason why you need to give that step an `id`.

The last thing that this job needs to do is let the future ones (in particular `release`) know what the `id` of the GitHub Release is, so it can publish it from draft. It doesn't look like the step outputs are available across environments (and this is something I also hit with Azure Pipelines), so the solution I have for this is to put it in a text file and upload it as an artifact of the build.

```yml
- run: echo ${{ steps.create_release.outputs.id }} >> release.txt
- name: Upload
  uses: actions/upload-artifact@v2
  with:
      name: release_id
      path: react-static-web-apps-auth/release.txt
```

`build` is done, time for `release`.

### The `release` stage

Like `build`, the `release` stage needs to have an `environment` node that references the correct Environment name, this is how GitHub will know to apply the protection rules for you. But since this Environment doesn't have any output, we're not going to need to set a `url` property.

```yml
release:
    needs: build
    runs-on: ubuntu-latest
    environment:
        name: release
```

You'll also notice the `needs` property in there as well. This tells us that this job can't run until `build` has completed, which makes sense as we're waiting on some outputs from there.

This phase of our workflow will only be responsible the draft status from the GitHub Release, and to do that we'll need to call the GitHub API and tell it which Release to edit, so we'll need to artifact that we published at the end of the last job.

```yml
steps:
    - name: Download package
      uses: actions/download-artifact@v2
      with:
          name: release_id
    - run: echo "release_id=$(cat release.txt)" >> $GITHUB_ENV
    - name: Publish release
      uses: actions/github-script@v3
      with:
          github-token: ${{secrets.GITHUB_TOKEN}}
          script: |
              github.repos.updateRelease({
                owner: context.repo.owner,
                repo: context.repo.repo,
                release_id: process.env.release_id,
                draft: false
              })
```

We download the artifact with `actions/download-artifact` and then export the context of the text file as an environment variable called `release_id`. Then, in the `actions/github-script` step we'll use the [`updateRelease`](https://octokit.github.io/rest.js/v18{{<cda>}}#repos-update-release) operation. Since `actions/github-script` is running as a JavaScript script, to access environment variables we can use `process.env`, and that gives us access to `process.env.release_id` as needed.

With this complete, our release is no longer in draft and we can publish the packages to their respective registries.

### Publishing to npm and GitHub Packages

_I'll only show the workflow steps for npm here, as GitHub Packages is virtually the same and can be read about [in this post]({{<ref "/posts/2020-11-06-deploy-to-github-packages-with-github-actions.md">}})._

This part of our workflow is rather straight forward since we've already built our package, all that's left to do is download the artifact from the current run and publish to npm.

```yml
publish-npm:
    needs: release
    runs-on: ubuntu-latest
    steps:
        - uses: actions/checkout@v2
        - name: Download package
          uses: actions/download-artifact@v2
          with:
              name: package
        - uses: actions/setup-node@v1
          with:
              node-version: ${{ env.NODE_VERSION }}
              registry-url: https://registry.npmjs.org/
        - run: npm publish $(ls *.tgz) --access public
          env:
              NODE_AUTH_TOKEN: ${{secrets.npm_token}}
```

As we have the `tgz` file, we don't need to repack, we'll just pass the filename into `npm publish` (obtained from `ls *.tgz`), and since it's a scoped package that everyone can use, we are setting the access to `public`.

## Running the workflow

With the new workflow ready to run, all it takes is a push with a tag for it to kick off. When the `build` phase completes, the reviewer(s) will receive an email and a notice on the Action in the GitHub UI.

![GitHub Action requiring approval](/images/approval-workflows-with-github-actions/environments/004.png)

Approve it, and the rest of the stages will run through to completion (hopefully...).

## Conclusion

Throughout this post we've created a new GitHub Action workflow that will build and release a package, but still give us the safety net of requiring a manual approval step before it is ultimately released.

You can find the successful run I demonstrated here [on my own project](https://github.com/aaronpowell/react-static-web-apps-auth/actions/runs/476471783), and the [commit diff](https://github.com/aaronpowell/react-static-web-apps-auth/commit/0bd29ff2f606c64c5efc6d77d53aff14d031a674#diff-aad3b21c2ed02fc778a85762a45f71b12bd5b6ee7732ca75c6cb46d5d73aa485) from a previous project that released to npm automatically.

Have you had a chance to implement anything using the approval process in GitHub Actions? Let me know as I'd love to see what else people are doing with it.
