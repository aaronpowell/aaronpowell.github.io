+++
title = "Reviving the Tessel 2 - Getting the Old Tooling to Run Again"
date = 2026-08-06T10:30:00+10:00
description = "Before I could talk to a Tessel 2 I had to get a command line tool from 2015 running on a 2026 machine, which turned out to be a bigger project than I expected and didn't touch the hardware at all."
draft = true
tags = ["iot", "tessel", "ai"]
tracking_area = "javascript"
tracking_id = ""
series = "tessel-revival"
series_title = "Getting the Old Tooling to Run Again"
+++

At the end of [the last post]({{< ref "/posts/2026-08-03-reviving-the-tessel-2-archaeology.md" >}}) I said the next question was whether I could talk to these boards at all. So I plugged one in, ran the Tessel command line tool, and got this:

```
Cannot find module 'nomnom'
```

That's the whole result of my first attempt. Not a USB error, not a board that wouldn't answer, not a firmware problem. The tool didn't start.

`nomnom` is an argument parser. It was deprecated years ago and it's the very first thing `t2-cli` reaches for, which means the tool falls over before it has parsed a single flag, let alone gone looking for hardware. And the fix was completely mundane - the dependencies simply weren't installed in my checkout. I ran `npm install`, it pulled down 884 packages, and it worked fine.

I want to be honest that this is where I expected the story to be interesting and it wasn't. There's a version of this post where the install itself explodes in a shower of native compilation errors, and that would make a better anecdote. It just didn't happen. What happened instead is that the install succeeded and _then_ I started reading what it had installed.

## Four addresses that don't exist anymore

Here's the file that changed my mind about how big this was going to be. This is [`lib/remote.js`](https://github.com/aaronpowell/t2-cli/blob/f52a5e143c4a6b3ffccb3b26e3e1c6ff35dab4ca/lib/remote.js) as it shipped:

```js
CRASH_REPORTER_HOSTNAME: 'crash-reporter.tessel.io',
BUILDS_HOSTNAME: 'builds.tessel.io',
PACKAGES_HOSTNAME: 'packages.tessel.io',
RUSTCC_HOSTNAME: 'rustcc.tessel.io',
```

Four hostnames, hard-coded. Firmware builds, the package feed, the Rust cross-compiler service, and crash reporting. I looked all four up. Every one of them is NXDOMAIN - not "returns an error", not "times out", simply no such name.

The part I find genuinely poignant is that `tessel.io` itself still resolves. The apex outlived every single service underneath it.

That reframed the problem for me. I'd been thinking of `t2-cli` as old software, and old software you can usually coax into running. But this wasn't a tool that was merely out of date. It was a tool with a set of assumptions baked into it about a company that no longer exists, and roughly half of what it wanted to do was reach out to machines that had been switched off years ago.

## A note on where this one comes from

Most of this series is written from a running log - I've got checkpoints, command output and boot captures for nearly all of it, and where I'm going from memory instead I'll say so.

This stretch of work is the exception. The session that did the modernisation is gone, and what survives is the commit. So for this post I'm reading a diff rather than a diary. That means I can tell you exactly what changed and why it had to change, but I can't tell you the order I hit things in or how long any of it took, and I'd rather say that than invent it.

## Replaced, patched, deleted, left alone

The commit that does the work is [`9aa80f4`](https://github.com/aaronpowell/t2-cli/commit/9aa80f400594f2903b23693b38e5982d7bb7a155), and it touches 18 files. It breaks down into four kinds of change, and I think the four categories are more interesting than the diff.

**Replaced.** Every one of those dead hostnames became a configurable URL with a sensible default. Firmware builds now come from GitHub Releases via a `builds.json` manifest, and there are environment variables (`T2_ARTIFACT_REPOSITORY`, `T2_RELEASES_BASE_URL`, and friends) for anyone who wants to point it somewhere else. Nothing clever, but it's the difference between a tool that can fetch a firmware image and one that can't.

There's a small piece of continuity here that made me smile. The build referenced in that manifest is pinned to commit `c61b3d89`, which is the exact same commit I spent the last post chasing through seven repositories to work out which OpenWrt version these boards were actually built from.

**Patched.** The `usb` package changed its public shape between major versions - what used to be the module itself moved to a property on it. So there's a line that reads `var usb = rawUsb.usb || rawUsb`, which is not beautiful but works against both. There's stream handling to suit modern Node, and connection state tracking so a closed connection stops trying to read from itself.

**Deleted.** This is the category I didn't expect to need. The `postinstall` script used to run two things; now it runs one:

```
- "postinstall": "t2 install drivers --loglevel=error || true; t2 install homedir --loglevel=error || true;"
+ "postinstall": "t2 install homedir --loglevel=error || true;"
```

Installing USB drivers automatically on every install made sense in 2015. In 2026, on a machine where I'd already sorted out USB access myself, it was a step that could only fail or do damage. It's still there as an explicit `t2 install drivers` if you want it. It just doesn't happen behind your back anymore. The same instinct applies to the crash reporter, which now checks whether it's actually configured and whether anyone's watching before it decides to block on a prompt.

**Left alone.** This is the important one and it's invisible in a diff. The temptation with a codebase this old is to modernise all of it - it's all `var` and callbacks and a promise library that predates promises being built in. I didn't touch any of that. The goal was a CLI that works, not a CLI I'd have written today, and every line changed for style is a line that can break something I have no test coverage for.

The one number that captures the scale of it: `package.json` moved its engine floor from `"node": ">=4.2.0"` to [`">=20"`](https://github.com/aaronpowell/t2-cli/blob/9aa80f400594f2903b23693b38e5982d7bb7a155/package.json), and `package-lock.json` gained 9,329 lines and lost 6,558. Two lines of intent, fifteen thousand lines of consequence.

## The Windows tax

With the tool running, the remaining problems were all about the host, and they cost me more hours than anything in the diff did.

**A dead CLI process keeps the USB handle.** If you kill `t2` halfway through something, the next command can't open the device and the error tells you nothing useful. You have to go and find the orphaned `node` process and stop it explicitly, and sometimes physically unplug the board.

**`LIBUSB_TRANSFER_STALL` usually means "wait".** A freshly restarted board takes about a minute before it answers on USB, and until then this is what you get. It looks exactly like a flash failure. It isn't one, and I burned real time treating it as one before [writing it down](https://github.com/aaronpowell/tessel-2-revive/blob/95ddae903f22490fb97b4a16092bf79fe5cdd6c0/docs/getting-started.md).

**And the one I'm most embarrassed by.** Several `t2` commands stream output and never exit on their own. Run one through a PowerShell pipeline and the pipeline buffers, so you get a command that has printed nothing and won't return - which looks precisely like a hang. It wasn't hanging. It was working perfectly and I couldn't see it. The fix is to redirect to a file and read the file, and I lost an hour to a program that was doing exactly what I asked.

That last one is the sort of thing that never makes it into anyone's documentation, because once you know it it feels too obvious to write down.

## The first real win

Once all of that was true at the same time, I could run `t2 list`, `t2 version`, `t2 provision` and `t2 run` against a board, and get a JavaScript file to execute on it and stream its output back to me.

The thing worth saying clearly: **those boards were completely unmodified.** Factory firmware, factory Node, nothing flashed, nothing upgraded. The whole of this phase happened on my laptop.

Which means the answer to the question I ended the last post on is: the boards were fine the entire time. They'd been sitting in a drawer working perfectly, and the reason I couldn't talk to them was sitting on my own machine.

## Where the AI came in

Dependency archaeology is genuinely miserable work. It's wide rather than deep - hundreds of packages, each needing a small judgement about whether it's fine, deprecated, moved, or a security problem - and there's no insight at the end of it, just a tool that starts. It's exactly the kind of task I would have abandoned on a hobby project, not because it's hard but because it's boring and there's no reward until _all_ of it is done.

It's also the first appearance of the loop that ended up running this entire project: the agent proposes a change, runs the command itself, real hardware answers, and it adjusts based on what actually came back rather than what should have happened. Having something that will patiently do the tedious middle bit is what kept this alive past the first evening.

## Up next

One thing I should be clear about, because it matters later: this post is about making the CLI **install and run**. It is not about making it **correct**. There are some real bugs in how it talks to a device, and every one of them stayed hidden until I put a modern OS on a board and the old assumptions stopped holding. That's a much later post.

For now the tooling works, the boards work, and they work together. Which means the next question is the one I've been circling since the start: these boards run a JavaScript runtime from 2015 on an operating system from 2015. Can I actually move that forward, and what breaks first when I try?
