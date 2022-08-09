+++
title = "Fixing When SWA Pull Request Builds Can't Add Comments"
date = 2022-08-09T00:08:41Z
description = "Custom SWA deployments can cause problems with adding PR comments, but it's an easy fix"
draft = false
tags = ["azure", "javascript", "devops"]
tracking_area = "javascript"
tracking_id = "73327"
+++

I did a recent post about [deploying SWA with Bicep]({{<ref "/posts/2022-06-29-deploy-swa-with-bicep.md">}}) and another on [advanced GitHub Actions workflows for SWA]({{<ref "/posts/2022-07-20-taking-a-swa-devops-pipeline-to-the-next-level.md">}}) but I noticed when doing it that when using PR's on the repo I was no longer getting the comment added to the PR for where the staging site lives. When it's working correctly you'll get a comment like this:

![Example PR comment](/images/2022-08-09-fixing-when-swa-prs-cant-add-comments/01.png)

Instead, I'd get an error message in my logs:

> Unexectedly failed to add GitHub comment.

This doesn't give you a lot to go with and find the problem, so I reached out to the SWA engineering team to do some debugging and see if we could get to the bottom of it.

## Permissions, permissions, permissions

As I mentioned in the deploying with Bicep post, you'll need to authenticate against Azure, and I prefer the [OIDC Connect](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-azure?{{<cda>}}) approach, and in doing so, you need to configure the [permissions of the `GITHUB_TOKEN`](https://docs.github.com/en/actions/security-guides/automatic-token-authentication?{{<cda>}}#permissions-for-the-github_token) to enable `id-token` write.

And here's where the GitHub SWA integration broke.

What I missed in the docs is that these are _replacement_ permissions, not _additive_ permissions, meaning if you set the token permissions in the workflow you _only_ have those permissions.

Don't worry though, it's an easy fix, you need to add `pull-requests: write` permissions to the token and then you'll be good to go.

Check out [this commit](https://github.com/aaronpowell/aaronpowell.github.io/commit/d46ab4ef271f8a60d7751dee8aef34f35786d640) in my blog repo to see the changed permissions (I also moved the permissions to be set _per job_ rather than _per workflow_).

## Summary

It's a good idea to know what permissions are needed in the workflows and at what point they are needed, so you can maintain a policy of minimum trust in your deployments.

For SWA, you need to ensure you have `pull-requests: write` set on your `GITHUB_TOKEN` permissions if you're modifying the permissions and still want the Active to do comments on PRs.
