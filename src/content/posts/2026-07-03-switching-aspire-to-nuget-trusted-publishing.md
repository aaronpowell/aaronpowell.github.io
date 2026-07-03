+++
title = "Switching the Aspire Community Toolkit to NuGet Trusted Publishing"
date = 2026-07-03T15:44:56+10:00
description = "How I migrated the Aspire Community Toolkit's NuGet publishing workflows from a long-lived API key to NuGet trusted publishing with GitHub OIDC."
draft = false
tags = ["aspire", "nuget", "github-actions", "security", "devops", "dotnet"]
tracking_area = "aspire"
tracking_id = ""
+++

Recently I had to fix something that had become a bit too easy to ignore in the [Aspire Community Toolkit](https://github.com/CommunityToolkit/Aspire): our NuGet publishing in CI had started failing, and the fix I wanted wasn't "rotate the key and hope for the best." If I was going to touch the release pipeline anyway, I wanted to move us onto NuGet's newer trusted publishing model and stop depending on a long-lived API key stored in GitHub secrets.

That meant updating the workflows that publish our beta and stable packages: `.github/workflows/dotnet-main.yml` and `.github/workflows/dotnet-release.yml`. In our case those map to separate GitHub Environments as well, so the supporting configuration needed to line up for both the beta path and the stable release path.

## What we were changing

The old model was the familiar one:

```yaml
- name: Publish to NuGet
  run: dotnet nuget push ./*.nupkg --source "https://api.nuget.org/v3/index.json" --api-key ${{ secrets.NUGET_PACKAGE_PUSH_TOKEN }}
```

It works until it doesn't. Keys expire, get rotated, get copied around, or just become another piece of release infrastructure that nobody wants to touch because if it breaks you find out at the worst possible moment.

Trusted publishing is a much nicer fit for GitHub Actions. Instead of pre-provisioning a long-lived API key, the workflow exchanges GitHub's OIDC token for a short-lived NuGet API key at runtime. So the runner only gets credentials for the duration of that job, and only if the workflow matches the trust policy configured in nuget.org.

## The workflow changes

The heart of the change was pretty small.

First, the publishing job needs permission to request an OIDC token:

```yaml
publish-nuget:
  runs-on: ubuntu-latest
  permissions:
    id-token: write
    contents: read
```

That `id-token: write` permission is the important one. Without it, GitHub won't mint the OIDC token that `NuGet/login` needs.

Then I replaced the static API key with [`NuGet/login@v1`](https://github.com/NuGet/login):

```yaml
- name: NuGet login (OIDC)
  id: login
  uses: NuGet/login@v1
  with:
    user: ${{ secrets.NUGET_USER }}

- name: Publish to NuGet
  run: dotnet nuget push ./*.nupkg --source "https://api.nuget.org/v3/index.json" --api-key ${{ steps.login.outputs.NUGET_API_KEY }} --skip-duplicate
```

There are two details here that are easy to miss:

1. `NuGet/login` still wants a username, so I added a `NUGET_USER` secret to the GitHub Environment used by the publishing job (`nuget-beta` for the main workflow and `nuget-stable` for the release workflow in our case).
2. The API key now comes from `${{ steps.login.outputs.NUGET_API_KEY }}`, which is short-lived and scoped to that workflow run.

I also added `--skip-duplicate`, because package publishing jobs are exactly the sort of thing you end up re-running after fixing an unrelated failure. If the package is already on nuget.org, I want the rerun to be boring, not fatal.

## The setup detail that bit me

The part that matters most isn't actually in GitHub, it's in nuget.org.

When you create the trusted publishing policy for a package, nuget.org wants to know exactly which GitHub repository and workflow file are allowed to publish it. And "exactly" really does mean exactly. The policy has to match the workflow filename, not just the repository or a rough pattern.

So if your beta packages are published by `.github/workflows/dotnet-main.yml`, that exact workflow path needs to be in the nuget.org policy. If your stable packages are published by `.github/workflows/dotnet-release.yml`, that needs its own matching policy as well.

This is where I think people are most likely to get tripped up. It's easy to assume that "the repo is trusted" or "the workflow name is close enough." It isn't. If the filename in nuget.org doesn't match the workflow that's actually running, the login step won't be able to exchange the OIDC token for a NuGet API key.

## Why I kept the old path around

I didn't want to flip both publishing paths over and immediately delete the old secret-based setup.

Instead, I treated the beta flow as the proving ground. Once the trusted publishing path succeeded there, I had much higher confidence applying the same pattern to the stable release workflow. That's also why I recommend keeping the old API key path available until you've seen the new flow complete successfully at least once.

The failure mode for trusted publishing is usually configuration, not code:

- the wrong workflow filename in nuget.org
- the wrong repository bound to the policy
- missing `id-token: write`
- forgetting the `NUGET_USER` environment secret

Those are all easy mistakes to make, and much easier to recover from if you haven't immediately torn out the previous publishing path.

## The practical setup checklist

If you're doing this yourself, here's the checklist I wish I'd had up front:

1. Create a trusted publishing policy in nuget.org for each package flow you want to support.
2. Make sure the policy references the exact GitHub repository and exact workflow filename.
3. Add `id-token: write` to the publish job permissions.
4. Add a `NUGET_USER` secret to the GitHub Environment used by that job.
5. Use `NuGet/login@v1` and publish with `${{ steps.login.outputs.NUGET_API_KEY }}`.
6. Add `--skip-duplicate` so reruns don't fail unnecessarily.
7. Keep the old API-key-based path around until the new flow has succeeded end-to-end.

## Why this is better

The immediate win was getting our CI publishing working again, but the longer-term improvement is operational. We no longer have a long-lived NuGet push key sitting around as a secret that we need to manage manually. Publishing is now tied to the workflow identity itself, which is exactly what I want for release automation.

It's one of those changes that's not especially flashy when you look at the diff, but it meaningfully tightens the supply chain story around package publishing. And if you're already on GitHub Actions, it's a pretty natural upgrade once you know where the sharp edges are.

Honestly, the biggest lesson from this migration was that the YAML change is the easy part. The real work is making sure GitHub, nuget.org, and your workflow filenames all agree on who is allowed to publish what.
