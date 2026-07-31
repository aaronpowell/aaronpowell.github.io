+++
title = "Reviving the Tessel 2 - Archaeology"
date = 2026-08-03T10:30:00+10:00
description = "Before you can fix something you have to know what it is, so I went digging through a decade of stale repos to find out what's actually running on a Tessel 2."
draft = true
tags = ["iot", "tessel", "ai"]
tracking_area = "javascript"
tracking_id = ""
series = "tessel-revival"
series_title = "Archaeology"
+++

Last time I said these boards run Linux, and that I didn't know that when I started.

That sounds like a small thing but it changes everything about how you approach the problem. I'd spent years thinking of the Tessel 2 the way the marketing described it - a microcontroller you program in JavaScript. If that's your mental model then a dead board is a firmware problem, and firmware problems are things you flash your way out of. But it isn't a microcontroller. It's a small Linux computer with a microcontroller bolted to the side of it, and once you know that, the whole shape of the problem changes.

So this post is the archaeology. What's actually on these boards, how the pieces fit together, and where the seams are - because nearly every problem I hit over the following weeks turned out to be at a seam.

## Two computers in a trenchcoat

The single most useful thing I learnt is that the Tessel 2 is two processors with completely different jobs, pretending to be one device.

The MediaTek MT7620n is the one I mentioned in [the last post]({{< ref "/posts/2026-07-31-reviving-the-tessel-2-the-boards-in-the-drawer.md" >}}). It's a MIPS32 SoC, the same class of chip you'd find inside a cheap home wifi router, and it does the router-shaped things - wifi, Ethernet, the two USB host ports - plus it runs Linux and it runs your JavaScript.

The Atmel SAMD21 is an ARM Cortex-M0+ microcontroller running bare-metal C firmware. No OS. It owns the two module ports, which means every GPIO toggle, every I2C transaction, every ADC read is actually the SAMD21 doing the work. It's also the USB bridge to your host machine.

Why bother with two chips? Two reasons, and they're both good ones.

The first is timing. Linux isn't a real-time OS, and toggling a pin with precise timing from a busy Linux userspace is unreliable in a way that's really annoying to debug. Hand that job to a microcontroller with nothing else to do and it becomes deterministic again.

The second reason is the one I came to appreciate a _lot_ over the following weeks: the SAMD21 can reprogram the SoC's SPI flash over USB. That means a bad Linux image is always recoverable. You can push a completely broken OS onto the board, watch it fail to boot, and then just... put a different one on. From the host. Over the same USB cable.

I want to be clear about how much that single design decision mattered, because I'm about to spend several posts putting increasingly experimental operating systems onto hardware I can't replace. If the Tessel 2 were brickable I would not have started. The entire project is downstream of a choice someone made in 2015 to spend a bit more on a coprocessor.

## The seam

Last post I said the two chips talk to each other over SPI, which is true and also not very useful. Here's what actually happens.

There's a C daemon on the Linux side called `spid` - the SPI daemon. It sits on the SPI bus and exposes it as three Unix domain sockets: `/var/run/tessel/usb`, `/var/run/tessel/port_a` and `/var/run/tessel/port_b`. There's a second daemon, `usbexecd`, which accepts commands over the USB link and wires up stdio. Both are small C programs from `t2-firmware/soc/`, installed as part of an OpenWrt package called `tessel-tools`.

When you write `require('tessel')` in your code, you get a shim installed at `/usr/lib/node/`, and it doesn't touch hardware at all. It opens a socket. So the path for something as simple as turning on an LED is:

```
your JS:  tessel.led[0].high()
   ↓  (encoded as command bytes)
tessel-export.js → net socket → /var/run/tessel/port_a
   ↓
spid → SPI bus
   ↓
SAMD21 firmware → toggles the actual pin
```

The JavaScript API isn't a hardware API. It's a protocol client. Everything it does is "encode a command, write it to a socket, let a C daemon put it on a wire, let a microcontroller act on it."

That's an elegant design and it has a lovely property I'll come back to much later in this series: because all the real-time work lives in C and in MCU firmware, the JavaScript runtime is almost swappable. Node isn't doing anything special. It's writing bytes to a socket.

It also has a failure mode that I want to plant here, because it defines the first half of everything that follows.

If `spid` doesn't start, the board boots perfectly. Networking comes up. You can SSH in. Everything looks completely healthy. And nothing on the module ports works, `t2 run` fails, and the CLI can't see the board over USB. There's a line in my own notes from weeks later that I think is the best summary of it: _this is not a brick - it's an OS with no bridge._

A board that's fine except for the one thing you wanted it for is a much harder problem than a board that's dead, and I hit that state more than once.

## All the way down

So what's the actual stack? From the bottom:

- **MediaTek MT7620n**, MIPS 24KEc core, no floating-point unit, roughly 580MHz.
- **OpenWrt Chaos Calmer 15.05-rc2** - and yes, that's `rc2`, a release candidate. These boards shipped on a pre-release and were never moved off it.
- **Linux kernel 3.18.**
- A **custom board port** for the `ramips/mt7620` target, living in a fork of OpenWrt whose last commit is from July 2018.
- **`t2-firmware`** - `spid`, `usbexecd`, the SAMD21 firmware, and the `tessel` JS library.
- **Node.js 4.2.1**, cross-compiled against uClibc.
- **`t2-cli`** on the host, talking to the board over USB, or over the network via mDNS and SSH.

The whole OS is a squashfs image of about 4.3 MB, which is a genuinely impressive bit of engineering and also the source of a lot of constraints later on.

<!-- AARON: every github.com/aaronpowell/... link in this post 404s until the repos are public. Confirm before publishing. -->

There's a detail in the [build config](https://github.com/aaronpowell/openwrt-tessel/blob/master/config.mk) I keep coming back to. The image is built with its opkg package feed pinned to `http://downloads.openwrt.org/chaos_calmer/15.05-rc2/%S/packages`. Plaintext HTTP, and a feed for a release candidate that stopped existing years ago. So the boards were shipped pointing at a package repository that was always going to disappear, over a protocol that couldn't tell if it had been tampered with.

None of this was negligence, to be clear. It was 2015, the project was moving fast, and shipping on `rc2` with a feed pinned to `rc2` is an entirely normal thing to do when you fully intend to ship `rc3` next month. The problem isn't the decision, it's that nobody ever got to make the next one.

The security picture that falls out of that is about what you'd expect. Node 4 went end-of-life in 2018. Chaos Calmer 15.05 hasn't had a security patch in roughly a decade. The SSH daemon is a Dropbear old enough that a modern OpenSSH client refuses to connect to it at all unless you explicitly re-enable a key exchange algorithm that was deprecated for good reasons - you need `-oKexAlgorithms=+diffie-hellman-group1-sha1` just to get a shell.

That last one is a nice illustration of the shape of this whole project. The board is fine. The board answers. It's the rest of the world that moved.

## Seven repos and a build environment

"The information is all on GitHub" is true, and it's also doing a lot of work in that sentence.

Here's what you actually need to have read to understand a Tessel 2:

- **[`t2-cli`](https://github.com/aaronpowell/t2-cli)** - the host-side CLI. Every `t2 <something>` you type goes through here.
- **[`t2-firmware`](https://github.com/aaronpowell/t2-firmware)** - the SAMD21 firmware, the `spid`/`usbexecd` daemons, the DFU bootloader, and the Node hardware shim.
- **[`openwrt-tessel`](https://github.com/aaronpowell/openwrt-tessel)** - the overlay. Board target config, and the Tessel-specific OpenWrt packages: `node`, `tessel-tools`, `tessel-app`, `tessel-mdns`.
- **[`openwrt`](https://github.com/aaronpowell/openwrt)** - a fork of OpenWrt itself, with the board patches.
- **[`uboot-mt7620`](https://github.com/aaronpowell/uboot-mt7620)** - the bootloader.
- **[`t2-build`](https://github.com/aaronpowell/t2-build)** - the build environment, a Docker image based on Ubuntu Bionic, which is itself out of support now.
- **[`t2-release`](https://github.com/aaronpowell/t2-release)** - the release plumbing that assembles and publishes images.

That's seven, before you get to the module libraries, the hardware repo with the KiCad files, and the docs site source. And they're at different ages, they overlap, and in a few places they disagree with each other. The `openwrt` fork calls its base Barrier Breaker, from around 2014. The image it produces reports itself as Chaos Calmer 15.05-rc2. Both statements are true and it takes a while to work out why.

This is what I meant last post about the information not being gone. It isn't gone. It's just that "not gone" and "usable" are very different things, and the gap between them is a weekend of reading.

## The host problem

Then there's my actual machine.

`t2-cli` is a Node application that speaks to the board over USB, which means native bindings - the `usb` npm package, compiled C++ against whatever Node you've got. It was written for the Node 4 and 6 era. It also has an SSH stack of similar vintage. Neither of those things ages gracefully, and both of them age worst on Windows.

The obvious answer is WSL2, except WSL doesn't get USB devices for free. You need `usbipd-win` to attach the device across, which is a real tool that works fine, but it's another moving part in a stack that already has too many.

And there's a third option that I rejected immediately and want to be explicit about: I could have just used a Linux box. I've got one. It would have worked. But the entire reason these boards sat in a drawer for six years is that the toolchain didn't work on the machine I actually use, and "solve that by using a different machine" isn't solving it, it's agreeing with it.

Even the repos fight Windows. The OpenWrt fork carried 348 USB modem descriptor files whose names contain colons - things like `0421:03a7`. NTFS won't have a bar of that, so the repository simply cannot be cloned on Windows. Not "builds with warnings". Cannot be checked out.

## What "modern" would have to mean

By the end of all that reading I had something better than a list of problems - I had a spec. Four things had to be true:

1. **An operating system with an actual patch stream.** Not 15.05-rc2. Something still being maintained.
2. **A JavaScript runtime that isn't a decade old**, on a CPU that's going to make that difficult.
3. **A CLI that installs and runs on current Node**, on Windows, without a second machine.
4. **A flash and recovery path I can't destroy the board with**, so that failing is cheap and I can afford to be wrong a lot.

Every post after this one is chasing one of those four.

## How this map got made

Here's the part that matters, and I want to be careful about the claim because the obvious version of it is wrong.

The tempting story is "the documentation was lost and AI recovered it." That's not what happened, and I said as much at the end of the last post. The information was all there. Seven repos, a docs site that mostly still resolves, source for everything.

What AI actually did was _reconcile_ it. Seven repos' worth of partial, overlapping, differently-aged descriptions of the same device, some of them stale, at least two of them contradicting each other on something as basic as which OpenWrt release this is - checked against what the live board actually reported when you asked it. That's the job. It isn't retrieval, it's resolution, and it's the kind of tedious cross-referencing work that I would simply never have done on a Tuesday night.

The [architecture document](https://github.com/aaronpowell/tessel-2-revive/blob/main/docs/architecture.md) I've been quoting from throughout this post didn't exist before this project. It got written by reading all seven repos and probing a running board, and then I went through it and checked it. Some of it was wrong and got corrected - you'll see a decent example of that later in the series where a confident conclusion turned out to be backwards.

My mental model going in was "it's a little Linux board that runs Node." What came out the other side was the map above. Same information, both times. The difference is that one of them is usable.

## Up next

Now that I know what's on the boards, the next question is whether I can talk to them at all. Turns out the answer is "not from Windows, not with a modern Node, and not without breaking a few things first" - so next time we go after the CLI.
