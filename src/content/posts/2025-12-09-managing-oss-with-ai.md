+++
title = "Managing The Aspire Community Toolkit With AI"
date = 2025-12-09T02:53:00Z
description = "With the recent release of the Aspire Community Toolkit v13, let's see how AI was used to help with the release."
draft = false
tags = ["dotnet", "ai", "oss"]
tracking_area = "dotnet"
tracking_id = ""
+++

In the middle of November [Aspire 13 was released](https://devblogs.microsoft.com/aspire/aspire13/) and with that came quite a few large changes that we would need to tackle in the [Aspire Community Toolkit](https://github.com/CommunityToolkit/Aspire).

As the lead for the OSS project, I took on the responsibility of managing the release, which meant coordinating the various changes, ensuring compatibility with Aspire 13, and all the stuff that would go along with that. Ask any OSS maintainer and they'll tell you that managing a release is a lot of work, especially one of this magnitude, and given that it's not part of my core role at Microsoft, I had to find ways to be as efficient as possible with my time.

With this in mind, leveraging AI is a logical step to help streamline the process, and I want to share how I used GitHub Copilot for the various tasks involved in managing the Aspire Community Toolkit release.

## By the numbers

Look at the [milestone](https://github.com/CommunityToolkit/Aspire/milestone/10?closed=1) there was 12 PR's that Copilot created for the release via [Copilot coding agent](https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent), which were wither issues that Copilot was assigned to, or agent tasks I kicked off from [agent HQ](https://github.blog/news-insights/company-news/welcome-home-agents/).

The largest of these PR's was the [.NET 10 upgrade](https://github.com/CommunityToolkit/Aspire/pull/949) with 48 comments from Copilot and reviewers. The simplest was probably [dropping _.NET_ from the branding](https://github.com/CommunityToolkit/Aspire/pull/967).

For other work that was done, Copilot often played a role in the editor to help speed up writing code, but that doesn't get captured as obviously as a PR.

## The human in the loop

One of the challenges of the Community Toolkit is that it's a very large solution, there's almost 200 projects in the repo, and while they don't _necessarily_ have all that much code in them, the sheer size results in complexity.

As a result, Copilot is not always going to be "right" on the first pass through, and this is where the human comes into play.

Generally speaking, the process that was followed was:

- Write up the issue or task that needed to be done.
- Assign it to Copilot via the coding agent.
- Review the PR that Copilot created.

During the review process, depending on the level of complexity I would either comment on the next iteration of changes that would need to be done, or check out the PR locally and pick up where Copilot left off. The latter is the more common of the scenarios, especially since we were updating to Aspire 13, which the models have no knowledge of, so trying to just prompt my way through it would have been a nightmare. In fact, here's my local branches:

```
$ git branch | grep copilot
  copilot/adapt-connection-string-formatting
  copilot/add-dotnet-10-tfm-support
  copilot/add-influxdb-integration
  copilot/add-neon-integration
  copilot/add-stripe-cli-integration
  copilot/fix-772
  copilot/fix-821
  copilot/fix-mcpinspector-certificate-issue
  copilot/fix-otel-export-integration
  copilot/remove-addviteapp-and-withnpmpackageinstaller
  copilot/remove-deprecated-lifecycle-hook
  copilot/review-python-extensions
  copilot/support-alternative-package-managers
  copilot/update-addchatclient-sensitive-data-config
  copilot/update-eventstore-to-kurrentdb
```

They aren't _all_ from the release, but most are, and they are the branches I took over from Copilot to finish up.

Admittedly there are times where it's more of a cursory glance at what Copilot has done, such as when it was removing `.NET` from the branding - that was just a quick pass over the PR changes and merging it in.

## Improving success

Since the work for the release was going to be done against stuff that Copilot had no knowledge of we ran the risk of it either making up something that was completely incorrect, or just not being able to help at all. To help reduce this, I aimed to provide a reference to the relevant Aspire source code for a change.

Let's take [the removal of AddViteApp and WithNpmPackageInstaller methods](https://github.com/CommunityToolkit/Aspire/pull/928) as an example. These methods were moved from the Community Toolkit to the core Aspire repo, and when crafting the issue for that, it links to the PR that made the change in Aspire, so that Copilot could see the new API surface and update our code accordingly. That PR did still result in human interception and finalisation, but that was partially because I kicked off the PR before the changes in Aspire were merged, so Copilot was working off a draft of the changes.

## Did it speed things up?

So the big question is - did doing this actually save any time? The answer is a resounding yes. As an OSS maintainer, the value for me was being able to kick off multiple parallel tasks to be worked on by Copilot, and then I could jump in for finalisation as required, while delegating more tasks to Copilot. It also allowed me to drop the really tedious stuff to Copilot, like the initial .NET 10 upgrade, which is really just modifying a bunch of MSBuild and yaml files, but then when we uncovered a problem with one of the projects not building correctly, I picked up that harder part of the task (which involved going through MSBuild source code and crash dumps - fun!).

The 13.0 release of the Community Toolkit came about 2 weeks after Aspire 13 was released, and while I can't say for certain how long it would have taken without Copilot, I can say that it would have been significantly longer than 2 weeks.

## Looking ahead

Copilot is going to continue to play a big role in how I manage the Aspire Community Toolkit. Anyone following the changes will see an ever growing number of PR's being created by Copilot. In fact, I've created [two custom agents](https://github.com/CommunityToolkit/Aspire/tree/main/.github/agents) in the repo that are designed to create new hosting and client integrations, allowing us to scale out the number of integrations we support. I also recently created a [custom agent to write docs](https://github.com/microsoft/aspire.dev/blob/main/.github/agents/community-toolkit-integration-doc-writer.agent.md) in the Aspire docs repo from our README files, meaning that we can ensure that our documentation is always up to date when integrations are created.

There's always going to be a human in the loop for OSS management, but by leveraging AI we can make the process significantly more efficient, allowing us to focus on the harder problems that require human judgement, while letting AI handle the more tedious tasks.
