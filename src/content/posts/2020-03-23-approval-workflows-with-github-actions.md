+++
title = "Approval Workflows With GitHub Actions"
date = 2020-03-23T10:27:04+11:00
description = "How to create an approval-based workflow with GitHub Actions"
draft = false
tags = ["devops"]
+++

I've been doing a bunch of work with [GitHub Actions](https://github.com/features/actions?{{<cda>}}) recently, from [deploying Azure Functions]({{< ref "/posts/2020-01-10-deploying-azure-functions-with-github-actions.md" >}}) to [overhauling my blog pipeline]({{< ref "/posts/2019-12-17-implementing-github-actions-for-my-blog.md" >}}) but each of these workflows have been rather straight forward, just build and deploy all off the one workflow.

With my latest project, [FSharp.CosmosDb]({{< ref "/posts/2020-03-16-introducing-fsharp-cosmosdb.md" >}}), I wanted to use GitHub Actions but the workflow I want is a little more complex. For other OSS projects such as [dotnet-delice](https://github.com/aaronpowell/dotnet-delice) the workflow works like so: I push to `master` it will compile the application, create the NuGet packages and then wait for me to approve the release before pushing to NuGet, creating the GitHub Release and tagging the right commit. This gives me a level of control against accidental pushes to `master` and I handle this through [Azure Pipeline](https://github.com/aaronpowell/dotnet-delice/blob/master/azure-pipelines.yml) which supports a simple approval flow, clicking an "approve" button.

But at the moment GitHub Actions doesn't have functionality to do approvals, so I have created me own! If you just want to see the final pieces here's the [build workflow](https://github.com/aaronpowell/FSharp.CosmosDb/blob/master/.github/workflows/build-master.yml) and [release workflow](https://github.com/aaronpowell/FSharp.CosmosDb/blob/master/.github/workflows/release-package.yml), but you'll want to read one to understand how they work. 😊

## Defining Our Workflow

The idea behind this workflow is something that I think is rather common in open source projects, I want to have the build and package as a single workflow and then these assets made available for people to consume and test, then based on feedback (the release is good or not) it'll be "promoted" to an official package repository, GitHub Release is created, commits are tagged, all that sort of thing.

The build is going to be pretty straight forward, I'm using [FAKE](https://fake.build) to script up the build workflow and I'm using a changelog following [Keep A Changelog](https://keepachangelog.com/en/1.0.0/) to define a release and its details. The job looks like this:

```yml
jobs:
    build:
        runs-on: ubuntu-latest
        steps:
            - name: Checkout
              uses: actions/checkout@master

            - name: Setup Dotnet ${{ env.DOTNET_VERSION }}
              uses: actions/setup-dotnet@v1
              with:
                  dotnet-version: ${{ env.DOTNET_VERSION }}

            - name: Restore dotnet tools
              run: dotnet tool restore

            - name: Generate packages
              run: dotnet fake run ./build.fsx --target Release
```

Now I've got my artifacts I want to setup some metadata to be made available, such as the version number from the changelog. To do this I've created a special FAKE task:

```fsharp
let getChangelog() =
    let changelog = "CHANGELOG.md" |> Changelog.load
    changelog.LatestEntry

Target.create "SetVersionForCI" (fun _ ->
    let changelog = getChangelog()
    printfn "::set-env name=package_version::%s" changelog.NuGetVersion)
```

Notice how it does `printfn` of `::set-env`? This is how you create your own environment variables and it conveniently works from anywhere that writes to `stdout`.

With this read we can add it to the workflow:

```yml
- name: Set Version
  run: dotnet fake run ./build.fsx --target SetVersionForCI

- name: Create version file
  run: echo ${{ env.package_version }} >> ${{ env.OUTPUT_PATH }}/version.txt

- name: Publish release packages
    uses: actions/upload-artifact@v1
```

## Approvals Through GitHub Issues

When I was thinking about how to do approvals I was thinking "What in GitHub would you use to discuss and approve something?" and there's an obvious answer, Issues! My thought is that if I can automate the creation of an issue and label it appropriately I can then use the GitHub Actions trigger of [Issue Labeled](https://help.github.com/en/actions/reference/events-that-trigger-workflows?{{<cda>}}#issues-event-issues) to monitor for a certain label to kick things off. In my case, I'm going to have a label of `release-approved` and once that label is applied I want to run the workflow to release the packages.

### Creating Issues With GitHub Actions

If you look on the [Actions Marketplace](https://github.com/marketplace?type=actions&{{<cda>}}) there's plenty of Actions for creating an issue, but I am going to have a few weird requirements so I decided to build my own (also, I hadn't built my own Action so this was another good chance to learn). This (and the others we'll build) are part of my git repo and not on the marketplace, so they'll live in the `.github/actions` folder, alongside the workflows and they'll be written in TypeScript.

First off I'd recommend that you read [how to create an Action](https://help.github.com/en/actions/building-actions/creating-a-javascript-action?{{<cda>}}) if you've not done one before as it'll talk through the setup guide and the files you'll need.

Because we'll be working with GitHub Issues we'll need an access token, which is conveniently available as a secret variable of `secrets.GITHUB_TOKEN` and I'm going to pass in two more arguments, the ID of the current action (`github.run_id`) and the version of the release (`env.package_version`).

We'll start by creating our empty action:

```js
import * as core from "@actions/core";
import * as github from "@actions/github";
import * as fs from "fs";

async function run() {}

run();
```

And now we can start populating the `run` function:

```ts
async function run() {
    const token = core.getInput("token");

    const octokit = new github.GitHub(token);
    const context = github.context;
}
```

This gives us access to the GitHub API via [octokit](http://octokit.github.io/). Now I want the changelog as I want to dump that into the body of the issue we're creating (so while approving I can work out what is in the release):

```ts
async function run() {
    const token = core.getInput("token");

    const octokit = new github.GitHub(token);
    const context = github.context;

    const changelog = fs.readFileSync("./.nupkg/changelog.md", {
        encoding: "UTF8",
    });
}
```

_Note: This file is created by one of my FAKE tasks and only contains the **current version** changelog, not the full history, like the root `CHANGELOG.md` contains._

Now to create the issue:

```ts
async function run() {
    const token = core.getInput("token");

    const octokit = new github.GitHub(token);
    const context = github.context;

    const changelog = fs.readFileSync("./.nupkg/changelog.md", {
        encoding: "UTF8",
    });

    const newIssue = await octokit.issues.create({
        ...context.repo,
        labels: [`awaiting-review`, "release-candidate"],
        title: `Release ${core.getInput("package-version")} ready for review`,
        body: `# :rocket: Release ${core.getInput(
            "package-version"
        )} ready for review

## Changelog

---

${changelog}
    `,
    });
}
```

Because we have `context.repo` to give us the information about the current GitHub repo I just spread (`...context.repo`) that onto the input of `octokit.issues.create` and then give it a few more pieces of information, the labels of `awaiting-review` and `release-candidate`, a title and the body, which contains the changelog. These labels are useful for me to create filters in GitHub Issues and I can look for them in a future workflow.

And now we're done, it's time to plug it into our build workflow:

```yml
- name: Prepare create release issue action
  uses: actions/setup-node@v1
  with:
      node-version: "12.x"

- name: Building Action
  run: npm i && npm run build
  working-directory: ./.github/actions/create-issue

- name: Create Release Issue
  uses: ./.github/actions/create-issue
  with:
      token: ${{ secrets.GITHUB_TOKEN }}
      action-id: ${{ github.run_id }}
      package-version: ${{ env.package_version }}
```

Since I chose to do these a TypeScript I have to add 2 additional steps to the workflow, one to setup Node.js and one to compile the Action, but the important stuff is in the 3rd Action. As it's a local Action the `use` points to the directory that it lives in, which is an absolute path from the root of the git repo (so you don't have to use `.github/actions`, but I like to keep them all together).

And there we go, the workflow creates our issue (yes it's closed because I approved it already 😉):

![Issue created by the Workflow](/images/approval-workflows-with-github-actions/001.png)

### Approving Releases

This proved to be a bit tricker than I had hoped, so I hope that this will help you avoid some of the challenges I hit with this step. First off, we're using the [Issue Labeled](https://help.github.com/en/actions/reference/events-that-trigger-workflows?{{<cda>}}#issues-event-issues) event in GitHub Actions which will trigger every time you label an issue, so if you use issues heavily your Action history will likely become quite noisy. This means that you'll need to think of a way to only run when the **right** label is added, so to do that I created an Action to check if an issue has a specific label:

```ts
import * as core from "@actions/core";
import * as github from "@actions/github";

async function run() {
    const token = core.getInput("token");

    const octokit = new github.GitHub(token);
    const context = github.context;

    if (!context.payload.issue) {
        throw new Error("This should not happen");
    }

    const issue = await octokit.issues.get({
        ...context.repo,
        issue_number: context.payload.issue.number,
    });

    core.setOutput(
        "exists",
        issue.data.labels
            .some((label) => label.name === core.getInput("label"))
            .toString()
    );
}

run();
```

The Action is reasonably straight forward, it'll grab the issue that triggered the workflow from the Action context and look if the label passed into the Action was present and set an output parameter indicating its presence. We'll use the Action like so:

```yml
- name: Check issue was release issue
  uses: ./.github/actions/check-issue
  id: check-issue
  with:
      token: ${{ secrets.GITHUB_TOKEN }}
      label: release-candidate
```

_Remember to install the packages and build the Action first, I've just skipped that for brevity here._

The problem is though that now every Action after this we need to check the output to decide if we want to run it, meaning we add `if: steps.check-issue.outputs.exists == 'true'` to every Action, which is annoying. _If someone knows how to improve that I'm all ears!_

### Getting Release Artifacts

Since the build phase generated the artifacts and we might've run a number of workflows since then we need to get the **right** artifacts. In the past I've used [`upload-artifact`](https://github.com/actions/upload-artifact) and [`download-artifact`](https://github.com/actions/download-artifact) to handle this (and in the build workflow I used `upload-artifact`) but here's the problem, the download expects to download _from the current workflow_, but I'm not in the workflow that the artifact was created, I'm on a completely new one, so how do I know what artifacts to get?

To do this we're going to update the `create-issue` Action we created earlier to include the ID of the Action in it somewhere. Initially, I thought to do this as a label, so you would have a label like `actionid: <id>`, but on a busy repository it's likely that that will become annoying quickly as each label is single use and they aren't automatically deleted. So instead let's create a comment on the issue with the Action ID. Right after we created the issue we'll add this:

```js
await octokit.issues.createComment({
    ...context.repo,
    issue_number: newIssue.data.number,
    body: `Action: ${core.getInput("action-id")}`,
});
```

With the comment appended we'll create another Action to extract it, I called this `get-action-id`:

```ts
import * as core from "@actions/core";
import * as github from "@actions/github";

async function run() {
    const token = core.getInput("token");

    const octokit = new github.GitHub(token);
    const context = github.context;

    if (!context.payload.issue) {
        throw new Error("This should not happen");
    }

    const comments = await octokit.issues.listComments({
        ...context.repo,
        issue_number: context.payload.issue.number,
    });

    const actionComment = comments.data.find(
        (comment) => comment.body.indexOf("Action: ") >= 0
    );

    if (!actionComment) {
        throw new Error("No comment found that has the right pattern");
    }

    core.setOutput("id", actionComment.body.replace("Action: ", "").trim());
}

run();
```

Again this is all happening in the context of an issue so we know where to look up the comments, which we do with `octokit.issues.listComments` and then from that we'll look for a comment that matches the pattern we expect, to start with `Action:`. If that's found we can pull the ID out of it and push it as an output variable!

```yml
- name: Get the ID of the Action
  uses: ./.github/actions/get-action-id
  if: steps.check-issue.outputs.exists == 'true'
  id: get-action-id
  with:
      token: ${{ secrets.GITHUB_TOKEN }}
```

With the Action ID in hand we now can download the Actions, and for this I decided to be lazy and just write an inline bash script:

```yml
- name: Download packages
  if: steps.check-issue.outputs.exists == 'true'
  run: |
      echo ${{ steps.get-action-id.outputs.id }}
      mkdir ${{ env.OUTPUT_PATH }}
      cd ${{ env.OUTPUT_PATH }}
      curl https://api.github.com/repos/aaronpowell/FSharp.CosmosDb/actions/runs/${{ steps.get-action-id.outputs.id }}/artifacts --output artifacts.json
      downloadUrl=$(cat artifacts.json | jq -c '.artifacts[] | select(.name == "packages") | .archive_download_url' | tr -d '"')
      echo $downloadUrl
      curl $downloadUrl --output packages.zip --user octocat:${{ secrets.GITHUB_TOKEN }} --verbose --location
      unzip packages.zip
      ls
```

Ouch, that's complex, let's break it down. I start with a bit of diagnostics info so I can see what the Action ID is and then create the location I want to dump the files into. Next we need to get the info about the artifacts for the release:

```sh
curl https://api.github.com/repos/aaronpowell/FSharp.CosmosDb/actions/runs/${{ steps.get-action-id.outputs.id }}/artifacts --output artifacts.json
```

We're grabbing the output of the previous step and making a call to the GitHub API and getting back a JSON like this:

```json
{
    "total_count": 1,
    "artifacts": [
        {
            "id": 2861674,
            "node_id": "MDg6QXJ0aWZhY3QyODYxNjc0",
            "name": "packages",
            "size_in_bytes": 39715,
            "url": "https://api.github.com/repos/aaronpowell/FSharp.CosmosDb/actions/artifacts/2861674",
            "archive_download_url": "https://api.github.com/repos/aaronpowell/FSharp.CosmosDb/actions/artifacts/2861674/zip",
            "expired": false,
            "created_at": "2020-03-13T03:37:13Z",
            "updated_at": "2020-03-13T03:37:14Z"
        }
    ]
}
```

I want the `archive_download_url` from the artifact named `packages`, and to do that I've again been tricky and used [`jq`](https://stedolan.github.io/jq/) to find it:

```sh
downloadUrl=$(cat artifacts.json | jq -c '.artifacts[] | select(.name == "packages") | .archive_download_url' | tr -d '"')
```

_Since this would have the `"` around it I use `tr` to strip them as well._

Lastly, we download the zip package from that location using curl, but you need to authenticate this request so we pass the `--user octocat:${{ secrets.GITHUB_TOKEN }}` to curl as well as `--location` to tell it to follow the 302 redirect. And with the package downloaded we can unzip it and I just run `ls` to do some more logging.

### Publishing To NuGet

With the packages downloaded we can start pushing them to the various feeds, let's start with NuGet. I didn't feel the need to use a 3rd party Action for this since you only need to run `dotnet nuget push` (Note: you will need a NuGet access token, so pop one in your secrets), but what I did need to know was what was the version number to put into the file path when publishing.

Thankfully, I created a file that I pushed into the artifacts list called `version.txt` that contains the version number from `CHANGELOG.md`. Let's turn that into an environment variable:

```yml
- name: Get release version
  if: steps.check-issue.outputs.exists == 'true'
  working-directory: ${{ env.OUTPUT_PATH }}
  run: |
      version=$(cat version.txt)
      echo "::set-env name=package_version::$version"
```

Good ol' `cat` to the rescue. Then we can setup the dotnet environment and push to NuGet:

```yml
- name: Setup Dotnet ${{ env.DOTNET_VERSION }}
  uses: actions/setup-dotnet@v1
  if: steps.check-issue.outputs.exists == 'true'
  with:
      dotnet-version: ${{ env.DOTNET_VERSION }}

- name: Push NuGet Package
  if: steps.check-issue.outputs.exists == 'true'
  working-directory: ${{ env.OUTPUT_PATH }}
  run: |
      dotnet nuget push FSharp.CosmosDb.${{ env.package_version }}.nupkg --api-key ${{ secrets.NUGET_KEY }} --source ${{ env.NUGET_SOURCE }}
      dotnet nuget push FSharp.CosmosDb.Analyzer.${{ env.package_version }}.nupkg --api-key ${{ secrets.NUGET_KEY }} --source ${{ env.NUGET_SOURCE }}
```

And with that we have packages on NuGet.

### Cutting a Release

The last thing to do is create a GitHub Release, which will mean we need to know what SHA the build was triggered from. Initially, I thought to do this by added it to the comments of the issue (which I do still do) but then I realised that I know the ID of the original workflow so I can just pull the metadata from there:

```yml
- name: Get Action sha
  if: steps.check-issue.outputs.exists == 'true'
  run: |
      echo ${{ steps.get-action-id.outputs.id }}
      cd ${{ env.OUTPUT_PATH }}
      curl https://api.github.com/repos/aaronpowell/FSharp.CosmosDb/actions/runs/${{ steps.get-action-id.outputs.id }} --output run.json
      action_sha=$(cat run.json | jq -c '.head_sha' | tr -d '"')
      echo "::set-env name=action_sha::$action_sha"
```

Again there's a bit of `jq` parsing of output to find it, but now we have the full SHA in an environment variable, so we can create the release, which I've defined a custom Action for (mainly to fit the way _I_ want it structured, but you could use one from the marketplace if you prefer).

This time let's look at the usage of the Action first:

```yml
- name: Cut GitHub Release
  uses: ./.github/actions/github-release
  if: steps.check-issue.outputs.exists == 'true'
  with:
      token: ${{ secrets.GITHUB_TOKEN }}
      sha: ${{ env.action_sha }}
      version: ${{ env.package_version }}
      path: ${{ env.OUTPUT_PATH }}
```

The result of running it will see an Release like this:

![Release created by the Workflow](/images/approval-workflows-with-github-actions/002.png)

This Action we'll create the release for the right SHA then upload the files to it (I don't pass in the files, I'm hard-coding them), so let's look at the `run` function:

```ts
async function run() {
    const token = core.getInput("token");
    const sha = core.getInput("sha");
    const version = core.getInput("version");
    const artifactPath = core.getInput("path");

    const releaseNotes = readFileSync(join(artifactPath, "changelog.md"), {
        encoding: "UTF8",
    });

    const octokit = new github.GitHub(token);
    const context = github.context;

    const release = await octokit.repos.createRelease({
        ...context.repo,
        tag_name: version,
        target_commitish: sha,
        name: `Release ${version}`,
        body: releaseNotes,
    });

    await upload(
        octokit,
        context,
        release.data.upload_url,
        join(artifactPath, `FSharp.CosmosDb.${version}.nupkg`)
    );
    await upload(
        octokit,
        context,
        release.data.upload_url,
        join(artifactPath, `FSharp.CosmosDb.Analyzer.${version}.nupkg`)
    );
}
```

The `octokit.repos.createRelease` is our first main step, we use the current context to set the repository info and then set the `tag_name` to the version defined in our changelog and the `target_commitish` to the right SHA, which will create the git tag for us (nice!) and then we set the title and finally the body I'm just injecting the changelog in (which will force me to write a decent changelog!).

When it comes to attaching files to a release, this is something you need to do for each file once the release is created, as creating the release gives you an `upload_url` for where the files need to be POST'ed to. Since I do this multiple times I pulled out a function to handle it called `upload`:

```ts
async function upload(
    octokit: github.GitHub,
    context: Context,
    url: string,
    path: string
) {
    let { name, mime, size, file } = fileInfo(path);
    console.log(`Uploading ${name}...`);
    await octokit.repos.uploadReleaseAsset({
        ...context.repo,
        name,
        file,
        url,
        headers: {
            "content-length": size,
            "content-type": mime,
        },
    });
}
```

This uses the `octokit.repos.uploadReleaseAsset` function to send the file and we need to provide it with the size (`content-length`) and the mime type (`content-type`), which I get through a function that grabs the file information called `fileInfo`:

```ts
function mimeOrDefault(path: string) {
    return getType(path) || "application/octet-stream";
}

function fileInfo(path: string) {
    return {
        name: basename(path),
        mime: mimeOrDefault(path),
        size: lstatSync(path).size,
        file: readFileSync(path),
    };
}
```

To get the mime type I use the [mime](https://www.npmjs.com/package/mime) npm package, but I could've hard-coded it since I'm hard-coding the files anyway, but that was just a habit. Otherwise I'm using `lstatSync` and `readFileSync` from Node's `fs` module.

And with that the Release is created and the packages are available for people to manually download if they don't want to use NuGet for some reason.

### Closing The Issue

The last thing I wanted to automate is the closing of the issue being used to manage the workflow. By now I was on a roll of creating custom Actions so I created another one (I also didn't find one for just closing an issue, they were all for stale issues or PR's, but maybe I didn't look hard enough).

```ts
async function run() {
    const token = core.getInput("token");

    const octokit = new github.GitHub(token);
    const context = github.context;

    if (!context.payload.issue) {
        throw new Error("This should not happen");
    }

    await octokit.issues.createComment({
        ...context.repo,
        issue_number: context.payload.issue.number,
        body: core.getInput("message"),
    });

    await octokit.issues.update({
        ...context.repo,
        issue_number: context.payload.issue.number,
        state: "closed",
    });
}
```

For convenience we're adding a comment to the issue using a provided message, done via `octokit.issues.createComment`, and then updating the issue status using `octokit.issues.update` and setting the `state: "closed"`. From our workflow file we can then use it like this:

```yml
- name: Close issue
  uses: ./.github/actions/close-issue
  if: steps.check-issue.outputs.exists == 'true'
  with:
      token: ${{ secrets.GITHUB_TOKEN }}
      message: |
          The release has been approved and has been

          * Deployed to NuGet
          * Created as a Release on the repo
          * Commit has been tagged
```

And with that, once the issue is labelled with `release-approved` my interactions are done!

## Conclusion

My goal at the start was to create an approval based workflow with GitHub Actions and I'm pretty happy that I was able to get it done. You can find the most recent (at the time of writing) [build](https://github.com/aaronpowell/FSharp.CosmosDb/actions/runs/54781143) and [release](https://github.com/aaronpowell/FSharp.CosmosDb/actions/runs/54790144) runs through, and if you look into the closed issues you'll find them there too.

It is a little cumbersome though, without built-in approval support there was a lot of custom Actions I ended up writing (my repo now reports 10% of the codebase is TypeScript 🤣) so I hope it's a feature on their roadmap.

Also, it's not 100% fool-proof. At the moment I don't check the labels properly, it should check for the `release-approved` label as well as `release-candidate`, because if I was to put a different label it'll just run through. But since I'm the only contributor here I'm less concerned about that at the moment.

Overall I'm happy with how it works and I hope it gives you an insight into how you too can have an approval-based workflow using GitHub Actions.
