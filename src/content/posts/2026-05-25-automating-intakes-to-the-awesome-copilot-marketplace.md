+++
title = "Automating Intakes to the Awesome Copilot Marketplace"
date = 2026-05-25T05:11:35Z
description = "How I built an automated intake process for external plugins in the Awesome Copilot marketplace using GitHub Issues, Actions, and a healthy dose of supply chain paranoia."
draft = false
tags = ["github-copilot", "github-actions", "automation", "oss"]
tracking_area = "javascript"
tracking_id = ""
+++

One of the things that comes with maintaining the [Awesome Copilot](https://github.com/github/awesome-copilot) repo is that people want to contribute to it. And that's great! We've had community contributions since the repo was first created. But recently we've been getting a growing number of requests from people wanting to list their _external_ plugins in the marketplace — plugins that live in repos we don't own, maintained by people we might not know.

That's... a different proposition to someone submitting a PR with a resource that we can review directly.

## The supply chain problem

Here's the thing that kept me up at night: external plugins are essentially us telling Copilot _"hey, go clone this repo and pull stuff out of it."_ We become the front door. The marketplace passthrough. And if you've been paying any attention to the NPM ecosystem lately (or PyPI, or... look, pick your package manager, they've all had incidents), you know that being the trusted entry point to untrusted code is a _really_ bad position to be in. Combine that with the rise of using AI in writing code, and Awesome Copilot being a directory of AI-powered plugins, and you have a recipe for... well, a lot of things that could go wrong.

I don't need to be the reason someone's machine gets owned because they trusted a plugin that we listed. That's the kind of thing that keeps open source maintainers awake at 2am, staring at the ceiling, questioning their life choices.

So before we could open this up, we needed a process. Not just "yeah sure, send us a link and we'll add it". An actual, structured, auditable process with real security guardrails.

## Designing the intake workflow

The goals were pretty straightforward:

1. **Transparency** — submitters should be able to see exactly where they are in the process, and consumers should be able to see that a review happened.
2. **Automation** — reduce the manual burden as much as possible, because I do _not_ have time to manually validate every field in a submission.
3. **Security** — pin submissions to immutable refs (SHAs or tags), not branches. Branches move with `HEAD`. SHAs cannot. And tags, well that _can_ move, but they require a force push to change, which is at least a more deliberate action.
4. **Human oversight** — automation is great, but someone with context still needs to make the final call.

What we landed on is a GitHub Issues-based workflow, which honestly felt like the most natural fit. Issues are already where people interact with repos, they have structured forms, they support automation via Actions, and they're public by default. So it's approachable, transparent, and auditable.

## How it actually works

The process flows like this:

### 1. Submission via Issue form

We created a [form-based issue template](https://github.com/github/awesome-copilot/issues/new?template=external-plugin.yml) that captures everything we need: plugin name, description, repo URL, the ref or SHA to review against, and so on.

The form-based approach is important here. It's not a freeform text area where people can write whatever they want, it's structured fields that we can programmatically parse. This means we can validate the submission _before_ a human ever looks at it.

### 2. Automated validation

When an issue is opened using the template, a GitHub Action fires and runs a validation script. This script checks:

- All required fields are populated
- The referenced repository actually exists and is public
- The ref or SHA provided **actually** resolves to something real on the remote repo
- The license is something we're comfortable with
- The structure looks correct

If any of these checks fail, the automation comments on the issue explaining what's wrong, and the submitter can fix their issue and trigger a re-run with `/rerun-intake`.

### 3. JSON generation

If validation passes, the action generates a comment containing the exact JSON blob that would need to be added to our repository's plugin definitions. This serves two purposes: it shows the submitter exactly what will be added, and it gives us (the maintainers) a copy-paste-ready block for the actual PR. Think of it as getting a preview of the PR diff before we even create the PR.

### 4. Manual review

This is where the human comes in. A maintainer looks at the actual plugin and performs the same kind of review that we would of anything that comes in via a PR. Does it do what it claims? Is it useful? Is the quality reasonable? Does it follow our responsible AI policies? Does it pass the "vibe check"? (C'mon, it's AI, there's gotta be _some_ vibes in there!) This is the part you _can't_ automate, because it requires judgement and context.

After the review, we either `/approve` or `/reject` via a comment, which triggers the next automation step.

### 5. Automated PR (or rejection notice)

If approved, an Action automatically creates the PR to add the plugin to the repo. If rejected, the submitter gets a comment explaining why, and the issue is closed.

## The iterative part

One of the things I'm most pleased about is how well the iterative feedback loop works. Take [issue #1813](https://github.com/github/awesome-copilot/issues/1813) as an example. Someone submitted a plugin for review, the automated review flagged some issues, they edited their submission, ran `/rerun-intake`, the automation validated again, found more issues, they fixed those too, and then it was ready for a manual review.

That whole back-and-forth happened without any human maintainer involvement. The submitter got immediate feedback, knew exactly what to fix, and could iterate on their own timeline. That's the kind of developer experience I was aiming for.

(Ultimately, the plugin was rejected after I did a manual review, but I wanted to highlight the process, not the outcome.)

## Re-review after six months

Something we built into the process is a staleness check. After six months, approved external plugins get flagged for re-review. This mirrors what we already do for resources directly in the repo (via our [staleness report](https://github.com/github/awesome-copilot/actions/workflows/resource-staleness-report.lock.yml)), and it ensures that the external plugins stay maintained, useful, and not quietly hijacked by someone buying an expired domain or taking over an abandoned repo.

## Individuals welcome

One decision I'm happy about is that this isn't limited to organisations or official "partners". If you're an individual with a plugin that's genuinely useful to the Copilot community, you can submit it through the same process. We might be a bit more thorough on the review (the rise of purely AI-generated submissions means quality varies... a lot), but the door is open.

## Testing Actions is hard

I'll be honest: I'm pretty amazed at just how smoothly the Actions and scripts are working, because they are _super_ hard to test. You can't really unit test "a GitHub Issue was opened with this specific form data and an Action should parse it, validate it, comment on it, and then wait for a slash command." You kind of just... ship it and hope.

Ok, that's not _entirely_ true — we did test the validation logic in isolation, and we did dry-run the workflow a bunch of times against test issues. But the integration between all the moving parts (issue forms, action triggers, comment parsing, slash command detection, PR creation) is the kind of thing where you cross your fingers and watch the first real submission come through.

And it worked. First time. Well, mostly first time. Look, there were a few tweaks needed, but nothing that was visible to submitters, so it counts.

## What's next

Now that the process is live, the next challenge is scale. As more submissions come in, the manual review step becomes the bottleneck. I'm exploring ways to leverage the other automation workflows that we have in Awesome Copilot and apply them to this process, but baby steps.

But for now, I'm just enjoying the fact that we have a transparent, auditable, secure-ish process for external plugins, and that it all runs on GitHub's native primitives — Issues, Actions, and PRs. No external services, no special tooling, just the platform doing what it does best.

If you've got a Copilot plugin you'd like listed in the marketplace, [open a submission](https://github.com/github/awesome-copilot/issues/new?template=external-plugin.yml) and let the robots take it from there. Well, the robots and me. Eventually me. I'll get to it. One day. Promise.
