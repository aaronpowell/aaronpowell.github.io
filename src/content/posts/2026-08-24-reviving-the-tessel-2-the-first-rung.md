+++
title = "Reviving the Tessel 2 - The First Rung"
date = 2026-08-24T10:30:00+10:00
description = "The first incremental OpenWrt hop exposed a real SPI registration break, but only after a diagnostic image made the otherwise opaque failure observable."
draft = false
tags = ["iot", "tessel", "ai"]
tracking_area = "javascript"
tracking_id = ""
series = "tessel-revival"
series_title = "The First Rung"
+++

The [last post]({{< ref "/posts/2026-08-17-reviving-the-tessel-2-the-big-bang-that-failed.md" >}}) we went through the first attempt at getting a modern OpenWrt on the boards using a one-shot upgrade from the factory image, and it failed. The conclusion was that we need to do smaller jumps, so let's start by going to the next release, 17.01, and see if we can get a working bridge.

## A smaller jump, on purpose

Going from the factory OpenWrt 15.05 image to 17.01 still crosses years of changes, it's a much smaller jump. More importantly, it gives us a question that can be answered:

> Can the Tessel-specific board description and bridge software survive the first nearby release when the build is assembled from current upstream sources?

The overlay contained the board device tree, the `tessel-tools` package, and the configuration needed to produce a Tessel image. The bridge daemons were still the same old C programs: `spid` talks to the SAMD21 over SPI and exposes the Unix sockets used by the JavaScript layer, while `usbexecd` carries commands and standard input/output over the USB path.

The build itself found several pieces of historical baggage before it reached hardware. LEDE 17.01 still pointed at dead project infrastructure, some old compiler sources had moved, the target-device configuration symbol had a different name, and the bridge source met a musl header collision. None of those were runtime discoveries. They were build and toolchain compatibility fixes, and the record keeps them separate from changes made because the board failed.

The resulting image was a real artifact: a complete 17.01.7 sysupgrade image with the Tessel bridge package compiled into it. That passed the first gate. It did not prove that Linux would boot on the board, that the SPI device would exist, or that the bridge could connect to the host. The [incremental roadmap](https://github.com/aaronpowell/tessel-2-revive/blob/95ddae903f22490fb97b4a16092bf79fe5cdd6c0/docs/openwrt-incremental-upgrade.md) records those build findings separately from the later hardware gates.

Those were the next gates.

## The first flash was still a black box

The first 17.01 image flashed through the existing OS-only USB path. The transfer completed, the board rebooted, and the SAMD21 USB device re-enumerated.

From the host's point of view, though, the result looked familiar:

```text
Looking for your Tessel...
```

_sad trombone_

The POWER indicator kept blinking, and there was no bridge-level evidence to tell us whether Linux had failed early or whether Linux was running and `spid` was failing just as it had on the 24.10 attempt.

That distinction matters. A missing `/dev/spidev` node, a crash-looping daemon, an init failure, and a kernel that never reaches userspace can all collapse into the same host-side symptom when the only diagnostic interface is the bridge that is not working.

There were reasonable theories. The cross-release flash might have preserved configuration from the factory image. The new image might be missing a boot-critical Tessel component. Or the SPI bus and device-tree changes might already be incompatible with `spid`. At this point they were theories, not findings.

The first response was not another speculative patch. It was to make the image observable.

## Giving the board another way to talk

Since we're only relying on talking to the board over USB, which uses the bridge to get to the Linux "side", Copilot suggested that we add another entrypoint - wifi and SSH. This wasn't going to be a product image, and it did not repair the USB bridge, it just created a second route into the Linux side if Linux had booted far enough to bring up the radio and network services.

The next flash also used the CLI's no-save-config path. That removed one confounding variable: the test would not carry the factory `/etc/config` state into the new release.

This was a much better experiment because its outcomes separated the hypotheses:

- If the diagnostic access point appeared, Linux had booted and the networking stack was alive.
- If SSH worked, we could inspect the actual kernel and service state instead of inferring it from a waiting host CLI.
- If the bridge still failed from that shell, the failure was downstream of Linux boot.
- If the image still could not bring up the access point, the problem was earlier than `spid`.

So we flashed the board (I was about to be a glorified "replugger" who would just unplug and replug a USB device 🤣), and the access point and SSH shell came up. That ruled out the cheap explanations that the kernel had simply failed to boot or that the image had omitted the basic networking and login pieces. The board **was** running Linux. The blinking POWER indicator had been a poor proxy for system health: it reflected that the Tessel-specific setup had not completed, not that the entire operating system was dead.

Now the failure could be measured.

## The first hard break

I SSH'ed to the board so I could get a diagnostic shell, and it showed that there was no usable `spidev` node for the coprocessor. A shortened excerpt from the kernel and service logs recorded the more precise version:

```text
spi_master spi0: spi_device register error .../spidev@1
spi_master spi0: Failed to create SPI device ...
spid: Error opening SPI device /dev/spidev0.1
```

The flash controller, chip-select 0, registered. The coprocessor's chip-select 1 did not. With no device node, `spid` could not open the SPI device; without `spid`, the bridge sockets never became useful; without the bridge, `t2-cli` remained stuck looking for a Tessel.

This was the first result in the ladder that connected a host symptom to a concrete board-level failure.

It also corrected the mental model inherited from the factory source. The original Tessel device tree put the coprocessor at chip-select 1 on the same SPI controller as the flash. Upstream's MT7620 support represented that hardware with the flash on `spi0` and the coprocessor on a second controller. The old arrangement depended on out-of-tree changes that the clean upstream 17.01 driver did not reproduce.

So the fix was not “make `spid` retry harder”. The device tree moved the coprocessor to `spi1` at chip-select 0, enabled that controller, and added the missing `spi_cs1` pinmux. Trimming the pin group to the actual chip-select pin also freed the POWER/user LED. The launcher stopped assuming the historical `/dev/spidev32766.1` path and selected the available `spidev` device instead.

These changes were still a hypothesis until the board ran them. A clean device-tree build can be perfectly wrong about hardware.

## The gate passes

The rebuilt diagnostic image was flashed and checked through the SSH path first. This time the kernel created the coprocessor device:

```text
/dev/spidev1.0
```

`spid` started without the missing-device error or a crash loop. The SPI log showed the coprocessor registering, and the POWER indicator became steady.

The final test crossed the whole architecture rather than stopping at a shell prompt:

```text
host> node repos/t2-cli/bin/tessel-2.js list --usb
USB    LEDE
```

That line is small, but it proves several links at once: the host reached the SAMD21, the coprocessor bridge reached Linux over SPI, Linux had a working `spid`, and the CLI received a response. The first rung was no longer just a successful build. It was a hardware-validated hop. Hurrah! The Tessel 2 was alive again.

There was still a warning about the device tree using the generic `spidev` compatible string. On the 4.4 kernel it was a warning that allowed the device to register and work. It was not yet the hard failure we would later meet on newer kernels. That distinction became another reason to keep the ladder: a warning can be harmless at one rung and fatal at another.

## What the first rung changed

The result was not “17.01 is supported now”. It was more useful than that.

First, the clean-upstream-plus-thin-overlay method was viable. The board-specific work did not need to remain entangled with a ten-year-old OpenWrt fork.

Second, the initial black box was not a mysterious incompatibility spread across the entire operating system. The diagnostic route narrowed it to one registration failure, then the kernel source and device tree explained why the failure happened.

Third, the smallest useful patch was not necessarily in the component that printed the error. `t2-cli` was only reporting that the bridge was absent. The fix lived in the board description, pinmux, and SPI-controller model underneath the daemon.

And finally, the experiment changed what “success” meant. A build is not a boot. A boot is not a bridge. A bridge is not an end-to-end Tessel workflow. Each hop needs its own observable gate, and recovery needs to remain available before the next flash.

That question did get answered, eventually, and on real hardware rather than on paper: the same clean-upstream-plus-thin-overlay approach carried through 18.06, 19.07, 21.02, 22.03, 23.05, 24.10, and on to 25.12, with the generic `spidev` device-tree binding turning from a harmless warning into a hard refusal partway up that climb, and a handful of other kernel-specific breaks turning up and getting fixed one rung at a time. None of that was visible yet from this first rung - it's a future post problem. What mattered here was narrower: the method worked once, on the release closest to the factory image, and it worked because the failure was made observable before it was explained.

That is the advantage of climbing one rung at a time. When the next step breaks, the failure has fewer years hiding inside it.

## AI leading the process

Up until now Copilot had been in the role of researcher and assistant - it collated all the docs together, built out a plan, and, yes, did try the initial one-shot upgrade, but I was still the one making all the decisions. Now it was time to flip that around. I'm no kernel dev, nor am I an embedded systems engineer, but Copilot _can be_. It can read the kernel source, it can read the device tree, and it can read the board overlay. It can also read the diagnostic shell output and the host CLI logs. It can then reason about what is missing, what is present, and what is expected.

Ultimately, Copilot did not “see” the broken board, it just has some basic `stdout` that it's trying to process, but it can infer a lot from that. When it produced the wifi-enabled boot image and flashed it, now I was its assistant, I had to log into the board and give it back the answers it was looking for. Now we're very much working as a team, and as we continue to climb the rungs, Copilot is "learning" more about this feedback loop and being able to make more informed decisions about what to try next.