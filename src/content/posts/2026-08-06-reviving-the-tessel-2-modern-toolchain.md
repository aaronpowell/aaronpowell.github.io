+++
title = "Reviving the Tessel 2 - Getting the Old Tooling to Run Again"
date = 2026-08-06T10:30:00+10:00
description = "Before I could talk to a Tessel 2 I had to get a command line tool from 2015 running on a 2026 machine, which turned out to be a bigger project than I expected and didn't touch the hardware at all."
draft = false
tags = ["iot", "tessel", "ai"]
tracking_area = "javascript"
tracking_id = ""
series = "tessel-revival"
series_title = "Getting the Old Tooling to Run Again"
+++

At the end of [the last post]({{< ref "/posts/2026-08-03-reviving-the-tessel-2-archaeology.md" >}}) I said the next question was whether I could talk to these boards at all. The first thing to do is just assess the current state of the tooling, and to do that we'll install the `t2-cli`:

```bash
npm install t2-cli
```

Their docs do state to use `-g` and install globally, but a) I'm not doing that and b) we don't need to do that anymore thanks to `npx`. So the install kicks off and, well, it goes about as well as to be expected:

```
npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
npm warn deprecated fstream-ignore@1.0.5: This package is no longer supported.
npm warn deprecated npmlog@4.1.2: This package is no longer supported.
npm warn deprecated rimraf@2.7.1: Rimraf versions prior to v4 are no longer supported
npm warn deprecated osenv@0.1.5: This package is no longer supported.
npm warn deprecated har-validator@5.1.5: this library is no longer supported
npm warn deprecated glob@7.2.3: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
npm warn deprecated are-we-there-yet@1.1.7: This package is no longer supported.
npm warn deprecated nomnom@1.8.1: Package no longer supported. Contact support@npmjs.com for more info.
npm warn deprecated gauge@2.7.4: This package is no longer supported.
npm warn deprecated uuid@3.4.0: uuid@10 and below is no longer supported.  For ESM codebases, update to uuid@latest.  For CommonJS codebases, use uuid@11 (but be aware this version will likely be deprecated in 2028).
npm warn deprecated request@2.88.2: request has been deprecated, see https://github.com/request/request/issues/3142
npm warn deprecated fstream@1.0.12: This package is no longer supported.
npm warn deprecated uglify-es@3.2.0: support for ECMAScript is superseded by `uglify-js` as of v3.13.0
npm warn deprecated tar@2.2.2: Old versions of tar are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
```

Look, this isn't that surprising given the last release was at the start of 2020, and the one prior being 2018. Anyway, let's try to run the CLI and see what happens:

```bash
.\node_modules\.bin\t2.cmd list
```

Which then produced:

```
INFO Searching for nearby Tessels...
ERR! Detected CLI crash [Error: LIBUSB_TRANSFER_STALL] { errno: 4 } Error: LIBUSB_TRANSFER_STALL
ERR! Error submitting crash report Error: This operation requires an internet connection
ERR!     at GetAddrInfoReqWrap.callback (D:\tmp\tessel2-install-test\node_modules\t2-cli\lib\remote.js:13:18)
ERR!     at GetAddrInfoReqWrap.onlookup [as oncomplete] (node:dns:111:17) Error: This operation requires an internet connection
ERR!     at GetAddrInfoReqWrap.callback (D:\tmp\tessel2-install-test\node_modules\t2-cli\lib\remote.js:13:18)
ERR!     at GetAddrInfoReqWrap.onlookup [as oncomplete] (node:dns:111:17)
WARN No Tessels Found.
```

Ouch.

There are two errors in there and they're worth pulling apart. `LIBUSB_TRANSFER_STALL` I'll come back to later on, because it turns up a lot in this project and it's rarely what it looks like. The one that caught my eye is the other one: _This operation requires an internet connection_.

I had an internet connection. It was fine. So I went and looked at the file the stack trace names.

## Four addresses that don't exist anymore

The whole of [`lib/remote.js`](https://github.com/aaronpowell/t2-cli/blob/f52a5e143c4a6b3ffccb3b26e3e1c6ff35dab4ca/lib/remote.js) is twenty-four lines. The first seven are these:

```js
var dns = require('dns');

const remote = {
  CRASH_REPORTER_HOSTNAME: 'crash-reporter.tessel.io',
  BUILDS_HOSTNAME: 'builds.tessel.io',
  PACKAGES_HOSTNAME: 'packages.tessel.io',
  RUSTCC_HOSTNAME: 'rustcc.tessel.io',
```

Four hostnames, hard-coded. Firmware builds, the package feed, the Rust cross-compiler service, and crash reporting. Every one of them is NXDOMAIN today - not "returns an error", not "times out", simply no such name. There's nothing at the other end left to answer.

The part I find genuinely poignant is that `tessel.io` itself still resolves. The apex outlived every single service underneath it.

And line 13, nine lines below that first hostname, is the one my stack trace was pointing at:

```js
  ifReachable(url) {
    return new Promise((resolve, reject) => {
      dns.lookup(url, error => {
        if (error) {
          reject(new Error('This operation requires an internet connection'));
```

That's the entirety of how the tool decides whether something is reachable: one DNS lookup, and one message when it fails. There's no way for it to tell _you are offline_ apart from _this host doesn't exist anymore_, because when it was written those genuinely were the same problem. So it blamed my connection. My connection was fine. The machine it was looking for was the thing that had gone.

That's the shape of the whole problem, in four lines of a constants file. I'd been thinking of `t2-cli` as old software, and old software you can usually coax into running. But this isn't a tool that's merely out of date. It's a tool with a set of assumptions baked into it about a company that no longer exists, and roughly half of what it wants to do is reach out to machines that were switched off years ago.

So this post is about getting that tool working again on a current machine - and the part I didn't expect going in is that none of it touches the hardware. Not one byte changed on a board.

## A note on where this one comes from

The rot is real, and this is the point where I handed it over to AI to get the thing working again. Which is also why this post reads a bit differently to the rest of the series.

Most of this series is written from a running log - I've got checkpoints, command output and boot captures for nearly all of it, and where I'm going from memory instead I'll say so.

This stretch of work is the exception. The session that did the modernisation is gone, and what survives is the commit. So for this post I'm reading a diff rather than a diary. That means I can tell you exactly what changed and why it had to change, but I can't tell you the order I hit things in or how long any of it took, and I'd rather say that than invent it.

## Replaced, patched, deleted, left alone

The commit that does most of the work is [`9aa80f4`](https://github.com/aaronpowell/t2-cli/commit/9aa80f400594f2903b23693b38e5982d7bb7a155), which touches 18 files, with a follow-up the next day in [`1b399db`](https://github.com/aaronpowell/t2-cli/commit/1b399db6107abec5c4c7aad5c0654ba04a90e433) that dealt with the `usb` package specifically. Between them it breaks down into four kinds of change, and I think the four categories are more interesting than the diff.

**Replaced.** Every one of those dead hostnames became a configurable URL with a sensible default. Firmware builds now come from GitHub Releases via a `builds.json` manifest, and there are environment variables (`T2_ARTIFACT_REPOSITORY`, `T2_RELEASES_BASE_URL`, and friends) for anyone who wants to point it somewhere else. Nothing clever, but it's the difference between a tool that can fetch a firmware image and one that can't.

There's a small piece of continuity here that made me smile. The build referenced in that manifest is pinned to commit `c61b3d89`, which is the exact same commit I spent the last post chasing through seven repositories to work out which OpenWrt version these boards were actually built from.

**Patched.** The `usb` package changed its public shape between major versions - what used to be the module itself moved to a property on it. That's the follow-up commit, and the fix is [a line that reads `var usb = rawUsb.usb || rawUsb`](https://github.com/aaronpowell/t2-cli/blob/1b399db6107abec5c4c7aad5c0654ba04a90e433/lib/usb-connection.js#L31), which is not beautiful but works against both. Back in the main commit there's stream handling to suit modern Node, and connection state tracking so a closed connection stops trying to read from itself.

**Deleted.** This is the category I didn't expect to need. The `postinstall` script used to run two things; now it runs one:

```
- "postinstall": "t2 install drivers --loglevel=error || true; t2 install homedir --loglevel=error || true;"
+ "postinstall": "t2 install homedir --loglevel=error || true;"
```

Installing USB drivers automatically on every install made sense in 2015, but today, we don't need a custom driver to be installed, so this step would either do nothing or fail. I left those commands in the CLI if you want/need them, but I haven't used them so I don't know if they'll still work.

**Left alone.** This is the important one and it's invisible in a diff. The temptation with a codebase this old is to modernise all of it - it's all `var` and callbacks and a promise library that predates promises being built in. I didn't touch any of that. The goal was a CLI that works, not a CLI I'd have written today, and every line changed for style is a line that can break something I have no test coverage for. Maybe in the future I'll revisit it and modernise the JavaScript, but that's a yak to be shaved another day.

## The Windows tax

With the tool running, the remaining problems were all about the host, and they cost me more hours than anything in the diff did.

**A dead CLI process keeps the USB handle.** If you kill `t2` halfway through something, the next command can't open the device and the error tells you nothing useful. You have to go and find the orphaned `node` process and stop it explicitly, and sometimes physically unplug the board.

**`LIBUSB_TRANSFER_STALL` usually means "wait".** A freshly restarted board takes about a minute before it answers on USB, and until then this is what you get. It looks exactly like a flash failure. It isn't one, and I burned real time treating it as one before [writing it down](https://github.com/aaronpowell/tessel-2-revive/blob/95ddae903f22490fb97b4a16092bf79fe5cdd6c0/docs/getting-started.md).

**Dealing with output.** While the CLI is scanning it runs a spinner, the little `-`, `\`, `|`, `/` cycle you've seen in a hundred command line tools. On a terminal that's fine, it's exactly what it's for. The problem is what it does when nobody's watching. It writes a character to stderr every 50 milliseconds, and it checks whether it's attached to a terminal only to decide _which_ carriage return to send - an ANSI cursor move if it is, a plain `\r` if it isn't. It never checks whether it should just be quiet. So redirecting to a file doesn't turn it off, it fills the file: a five second scan lands about a hundred `-\|/` characters and a hundred carriage returns wrapped around the one line I actually wanted. Driving all this from an agent, where the streams get merged and read back as plain text, that turns into a lot of noise around not much signal. The fix was mundane - capture to a file, put a timeout on the run, and teach the agent to throw the spinner characters away before it tried to read anything.

That last one is the sort of thing that never makes it into anyone's documentation, because once you know it it feels too obvious to write down.

## The first real win

Once all of that was true at the same time, I could run `t2 list`, `t2 version`, `t2 provision` and `t2 run` against a board, and get a JavaScript file to execute on it and stream its output back to me.

The thing worth saying clearly: **those boards were completely unmodified.** Factory firmware, factory Node, nothing flashed, nothing upgraded. The whole of this phase happened on my current machines.

Which means the answer to the question I ended the last post on is: the boards were fine the entire time. They'd been sitting in a drawer working perfectly, and the reason I couldn't talk to them was sitting on my own machine.

## Where the AI came in

Dependency archaeology is genuinely miserable work. It's wide rather than deep - every one of those deprecation warnings at the top of this post is a small judgement about whether it's fine, replaceable, or an actual security problem, and none of them is interesting on its own. `nomnom` sets the tone nicely: it's the very first `require` in the CLI's entry point, so it loads before the tool does anything at all, and npm's advice on it is to contact support. There's no insight at the end of any of this, just a tool that starts. It's exactly the kind of task I would have abandoned on a hobby project, not because it's hard but because it's boring and there's no reward until _all_ of it is done.

It's also the first appearance of the loop that ended up running this entire project: the agent proposes a change, runs the command itself, real hardware answers, and it adjusts based on what actually came back rather than what should have happened. Having something that will patiently do the tedious middle bit is what kept this alive past the first evening.

## Up next

One thing I should be clear about, because it matters later: this post is about making the CLI **install and run**. It is not about making it **correct**. There are some real bugs in how it talks to a device, and every one of them stayed hidden until I put a modern OS on a board and the old assumptions stopped holding. That's a much later post.

For now the tooling works, the boards work, and they work together. That means we've hit our goal!

![Meme book cover titled "Getting an Arduino LED to Blink" with a subtitle "And then losing interest"](/images/2026-08-06-reviving-the-tessel-2-modern-toolchain/book-meme.jpg)

Jokes aside, I could have very easily just paused at this point because the goal _can the board work?_ is done, but there's still a lot of rot in this project and that's what we're going to start digging into next time.
