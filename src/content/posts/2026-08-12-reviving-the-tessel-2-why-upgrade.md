+++
title = "Reviving the Tessel 2 - Should You Even Upgrade?"
date = 2026-08-12T10:30:00+10:00
description = "The Tessel 2 still worked, but its OpenWrt base was a decade old. Before touching the image I had to decide whether upgrading was worth the risk."
draft = true
tags = ["iot", "tessel", "ai"]
tracking_area = "javascript"
tracking_id = ""
series = "tessel-revival"
series_title = "Should You Even Upgrade?"
+++

As we established at the end of the last post, we have a working-on-Windows path to being able to deploy code onto my Tessel 2 board and that brings us onto the next question, whether upgrading the OpenWrt version on the board is even worth it. I mean, it's not a simple task, remember that we're working with a device that has no screen, no normal console, and a path to recovery that I don't know whether it exists, let alone works. That is a good way to turn a working bit of hardware into true e-waste.

So before Copilot and I get to tackling anything, I wanted an answer to a less exciting question: is the OpenWrt project still active enough to be a useful base, and is this particular version old enough that the risk of leaving it alone is worse than the risk of changing it?

## What is actually on the board

The factory image is OpenWrt Chaos Calmer 15.05-rc2 from 2015, running a 3.18 Linux kernel. The processor is a MediaTek MT7620N - a MIPS32 chip with no hardware floating-point unit - and it runs the Linux side of the board.

That description matters because "old Linux" is too vague to make a decision from. The old image brings along its userspace as well: a 2015-era Dropbear, WPA2-only WiFi, old dnsmasq, an OpenSSL 1.0.x environment, and a package feed that no longer exists.

The feed is the simplest test. A package manager that cannot reach its repository is not just inconvenient. It means the device has no normal way to receive a fix, replace a broken package, or install something needed by an application. It is frozen in place.

The [security assessment for staying on 15.05](https://github.com/aaronpowell/tessel-2-revive/blob/3ec27c5a5525caee1b37a220cefbe3a5bc5e98d8/docs/security-threat-assessment.md) makes the useful distinction here: an isolated, single-purpose hobby device is not automatically a disaster. With the radio off, a single-host segment, constrained egress, and physical security, the residual risk can be accepted. But that is a risk decision, not a claim that the software is fine.

The part that keeps getting worse is the patch gap. 15.05 received no security patches for roughly a decade when I wrote this assessment. Every new vulnerability adds to a system that has no supported branch to move to and no live feed to update from. 

And if I'm thinking of actually using these devices in my house to _do stuff_ it's important to remember that the *S* in **IoT** stands for security.

## Is OpenWrt still alive?

Yes, but that answer needs a qualifier.

Some quick web searching and it's clear that OpenWrt is still releasing new versions and maintaining current branches (look, I never said I was someone who was in the embedded Linux space and actually knew what OpenWrt was until a few weeks ago!). The current release is OpenWrt 25.12, released in 2026, with a 6.12 kernel, and that seems like an admirable target to get running on the board.

So OpenWrt is active but it doesn't tell me if anyone upstream is maintaining the Tessel 2 compatibility, or if they even know it exists. That's a separate problem that we're going to need to solve as part of this planning and eventual work.

The useful bit is that the Tessel is not a completely unique computer from the operating system's point of view. It is an MT7620N board in the ramips target family, with a board description and a small amount of Tessel-specific software layered on top. The [incremental roadmap](https://github.com/aaronpowell/tessel-2-revive/blob/560b3c4faf2bc71201d06143904c83dfc39a4a01/docs/openwrt-incremental-upgrade.md) describes the approach as a clean upstream release plus a thin Tessel overlay.

That is the difference between "there is a current Linux distribution" and "there is a plausible route from this ten-year-old image to it". The first fact is interesting. The second is what makes it relevant.

## What about the alternatives?

There are other ways to put Linux on a MIPS board. Buildroot could produce a small system. Yocto could produce a carefully controlled image. Debian has supported MIPS variants and a much larger general-purpose userspace.

None of those options is impossible. They are just worse fits for this particular board.

OpenWrt already has the target family, the networking model, the package system, the kernel configuration machinery, and the general shape of a router-class image. The Tessel-specific work can be kept in a board description, a small package containing the bridge daemons, and a few configuration changes.

Starting again with Buildroot or Yocto would mean taking ownership of more of the system before I had even proved the hardware bridge on a modern kernel. Debian would give me a much larger userspace, but not a ready-made answer for a 32 MB flash router SoC or the Tessel's SPI and USB arrangement.

This isn't a technology ranking. If the goal were a general Linux computer, I would make a different comparison. For this goal - a small appliance with an existing OpenWrt board path - OpenWrt has the least new surface area.

## What would an upgrade buy?

The obvious answer is security, but that is too narrow.

Moving away from 15.05 means a supported kernel and userspace, a newer cryptographic stack, a live signed package feed, newer SSH algorithms, and a WiFi stack that can support modern security features. So... nothing major 🤣. More importantly, it means we could keep upgrading in the future to maintain the security of the boards with minimal effort as I would be able to apply a patch instead of waiting another decade and starting an archaeology project.

There are limits. The OpenWrt upgrade does not make the on-device JavaScript runtime current. The newest Node runtime we can use on this soft-float MIPS board is 8.11.3. It also does not make the Tessel bridge magically compatible with every newer kernel. The `spid` and `usbexecd` pieces are old software with old assumptions about SPI devices and GPIO.

So the upgrade is not _purely_ "make the Tessel modern", it is "put the operating system on a supported foundation, then deal honestly with the board-specific work that remains".

## The argument for leaving it alone

The counterargument is reasonable.

This is a hobby board on a home network. It does not hold secrets. Given that the device has an ethernet port it can be kept off WiFi and isolated from other devices. Replacing the firmware risks losing the very thing I am trying to preserve, and at this point the recovery path is still a hypothesis rather than something I have used successfully.

If those are the requirements, staying on 15.05 can be a defensible choice. Disable the radio, keep the board on a segment with no lateral peers, constrain its outbound traffic, treat it as an immutable appliance, and record the accepted EOL risk with a review date.

That is a useful answer because it gives the project a stopping point. Not every old board needs to become a supported platform. Sometimes the right decision is to leave a known, isolated device alone.

But given what I have in mind for these devices, I simply don't have network ports in the right places to realistically be able to run them on ethernet, so they'd either be offline (not useful for my scenarios) or I'm punching holes in walls (low spouse approval factor).

Guess it looks like an upgrade is going to be the right pathway forward.

## The decision

I wrote down the acceptance criteria before starting the uplift:

- the board boots the new image;
- `spid` and `usbexecd` are running;
- `t2 provision` works;
- `t2 run` can execute JavaScript;
- WiFi still works when deliberately enabled;
- the recovery path is real and repeatable.

That last one is the important constraint. An upgrade that boots once but cannot be recovered is not a platform. It is a successful experiment with a bad failure mode.

The decision, then, was not that OpenWrt would solve everything. It was that OpenWrt was still active, the Tessel's hardware fit was good enough to justify the work, and the cost of staying frozen was now larger than the risk of moving carefully.

The next post is where that decision met reality: the one-shot jump built, flashed, and left the board silent.

## Where AI helped

This was the sort of decision I would normally have made by instinct. OpenWrt is familiar, the alternatives are all substantial projects, and a hobby board makes it easy to say "good enough" without writing down what good enough means.

AI turned that vague choice into a threat assessment and a branch comparison. It made the assumptions visible, separated the risks that network isolation actually mitigates from the ones it does not, and forced me to write acceptance criteria before I started flashing images.

That did not make the decision correct by itself. It made the decision inspectable. I could challenge the assumptions, replace a stale branch target, and decide whether the remaining risk was acceptable before putting a board on the line.
