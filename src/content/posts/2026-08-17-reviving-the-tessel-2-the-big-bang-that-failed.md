+++
title = "Reviving the Tessel 2 - The Big Bang That Failed"
date = 2026-08-17T10:30:00+10:00
description = "The first OpenWrt upgrade jumped a decade in one shot. It built, flashed and booted, but left the Tessel bridge invisible and taught me to value observable experiments over bigger patches."
draft = false
tags = ["iot", "tessel", "ai"]
tracking_area = "javascript"
tracking_id = ""
series = "tessel-revival"
series_title = "The Big Bang That Failed"
+++

At the end of [the last post]({{< ref "/posts/2026-08-12-reviving-the-tessel-2-why-upgrade.md" >}}) I decided that upgrading OpenWrt was worth the risk.

There was a current upstream release, the Tessel's MT7620 hardware still belonged to a supported OpenWrt target family, and the factory image had been without security updates for about a decade. I also had an acceptance test: the board had to boot, the Tessel bridge had to start, the CLI had to connect, JavaScript had to run, WiFi had to work, and recovery had to remain repeatable.

With that decision made, there was an obvious next move — a one-shot upgrade to the latest OpenWrt release. That's the target, so go big or go home!

## Ten years in one build

The factory Tessel 2 image runs OpenWrt 15.05 on a 3.18 kernel. The first replacement image targeted OpenWrt 24.10 with a 6.6.144 kernel.

That is not really an upgrade. It is a decade of kernel, build system, device tree, driver, networking and C library changes arriving in one file.

On "paper" it didn't look like this would be that difficult to undertake. The Tessel-specific parts had already been separated conceptually into a thin overlay: a board description, some configuration, and a package containing the bridge daemons. OpenWrt still supported the broader `ramips/mt7620` target, so the task appeared to be "take current upstream and put the Tessel pieces back".

Copilot did the dependency archaeology, adapted old package definitions to the current build, and got the Tessel-specific C programs compiling against the modern toolchain. The result was a complete sysupgrade image containing the expected `tessel-tools` package and the service definitions for both bridge daemons.

In other words, this was not a failed compile masquerading as progress. The image existed. The Tessel software was in it. The services were enabled. The upgrade could move to hardware.

The OS-only image was flashed with the existing CLI path:

```powershell
t2 update --usb --openwrt-path <sysupgrade.bin>
```

Using `--openwrt-path` mattered. It updated the Linux image without involving the separate SAMD21 firmware handoff, keeping the experiment focused on the operating system.

The transfer completed. The board rebooted. The SAMD21 USB composite device went away and came back, as expected. The Linux side booted.

Then the CLI waited:

```text
INFO Looking for your Tessel...
```

And that was all it could tell us... Guess we've got a problem!

## Booted is not connected

This is where the architecture from [the archaeology post]({{< ref "/posts/2026-08-03-reviving-the-tessel-2-archaeology.md" >}}) becomes important again.

The Tessel 2 is two computers. The SAMD21 microcontroller owns the host USB connection and can reprogram the MT7620's flash. The MT7620 runs Linux and the JavaScript application. Between them sits the Tessel bridge.

On Linux, `spid` talks to the SAMD21 over SPI and exposes sockets for the module ports. Its companion, `usbexecd`, handles commands arriving over USB and connects their input and output. The CLI does not become useful merely because Windows can enumerate the SAMD21; it needs that Linux-side bridge to be alive as well.

That distinction made the result much narrower than "the board never spoke again".

The SAMD21 was alive. USB re-enumerated. Linux booted. But `spid` did not stay running on the 6.6 kernel, so the normal bridge never came up and `t2-cli` remained blind.

The board was not bricked. It was an OS with no bridge, and this kind of flips how I think about the system architecture, I assume that the OS is the "main" computer and the SAMD21 is a peripheral, but in reality it is the other way around. Since the SAMD21 is the "entrypoint", the thing that we talk to via the USB connection, **it** is the main computer, and the Linux side is a peripheral. The bridge is the only thing that connects them, and if it fails, the whole system looks dead from the outside.

And this is actually really good news as the failure was not total. The board isn't bricked by a bad OS image, we can still talk to the board via the SAMD21 and reflash it with a working image and bring the bridge back up.

## Figuring out what went wrong

The most logical explanation was that the bridge package had simply been left out of the image. Seems fair right? A modern OpenWrt build is assembled from selected packages, and successfully compiling `spid` does not automatically prove that the resulting binary was installed into the root filesystem. A missing package would explain the whole symptom without requiring any kernel mystery.

So I got Copilot to inspect the image. The package was present. `spid` and `usbexecd` were installed. Their startup services were enabled.

Well, bugger.

That mattered for more than eliminating one theory. It was an early reminder that build success, image contents and runtime behaviour are three separate gates. We had passed the first two and failed the third.

The source suggested two stronger candidates.

The old launcher for `spid` assumed a particular SPI device path:

```text
/dev/spidev32766.1
```

That name came from the old kernel and board integration; it was not a hardware law. SPI bus numbering depends on how the device is registered, and a modern device tree and driver stack had no obligation to reproduce a path chosen by the 3.18-era system.

Then there was the GPIO interface. `spid` used the legacy `/sys/class/gpio` API for the handshake lines to the coprocessor. That interface had been deprecated since the last OS builds, and the surrounding driver behaviour had changed substantially by kernel 6.6.

Either assumption could stop `spid`, and no `spid` meant no bridge.

Those were good predictions from reading the code. They were not yet hardware evidence.

That difference is easy to lose when an explanation fits the symptom perfectly. In fact, later experiments would show that the upgrade path contained other, earlier failures that a source-only comparison had not predicted. The hard-coded SPI path and legacy GPIO use were real problems, but at this point we did not know which break happened first, which ones were active on 24.10, or whether fixing either would reveal another failure underneath.

One giant jump had collapsed all of those questions into the same output:

```text
INFO Looking for your Tessel...
```

## The observability trap

My original acceptance criteria were about the final system: boot the OS, start the bridge, connect the CLI, run JavaScript, provision WiFi.

They were good product criteria and bad diagnostic criteria.

If the first four stages of a five-stage path work, but the fifth stage owns the interface that reports the first four, then the result looks identical to failing at stage one. The test can say "the system did not pass", but it cannot say why.

The one-shot upgrade changed too many variables at once:

- OpenWrt moved from 15.05 to 24.10;
- the kernel moved from 3.18 to 6.6;
- the Tessel board definition was re-expressed for a modern device tree;
- the SPI and GPIO drivers changed beneath `spid`;
- the build moved from uClibc-era assumptions to a modern musl toolchain;
- package and service integration crossed a decade of OpenWrt conventions.

Look at the number of failure points there could be here, and several could break it independently. Even if a patch made the CLI connect, there would be no proof that the diagnosis behind the patch was complete rather than lucky. I mean, I'm down to burn tokens, but this feels like it's going to be a very expensive game of whack-a-mole.

So just throwing a new "no, do it right this time" prompt at Copilot wasn't going to be enough, it was time to tackle this in a different way.

## Taking it step by step

I got Copilot to generate a list of all the OpenWrt releases between 15.05 and 24.10, and then to produce a plan for an incremental upgrade path:

```text
15.05 -> 17.01 -> 18.06 -> 19.07 -> 21.02 -> 22.03 -> 23.05 -> 24.10
```

Each hop would have its own build and hardware gate. Did the image build? Did it flash? Did Linux boot? Did the SPI device appear? Did `spid` and `usbexecd` remain running? Could the CLI connect? Could a small hardware operation cross the bridge?

The [incremental upgrade roadmap](https://github.com/aaronpowell/tessel-2-revive/blob/95ddae903f22490fb97b4a16092bf79fe5cdd6c0/docs/openwrt-incremental-upgrade.md) records the resulting method and, importantly, separates predicted breaks from hardware-validated ones.

That final distinction became the point of the work.

If 17.01 failed, the relevant change set was a few years smaller than 24.10. If 17.01 passed and 18.06 failed, the search space became one release. A theory about SPI numbering could be tested against the first kernel where the numbering changed. A theory about GPIO could wait until the release where the interface actually behaved differently. Every successful hop preserved a known-good recovery point and removed old changes from the list of suspects.

Recovery also became part of the gate rather than a reassuring paragraph in the architecture notes. A new image was not "good" merely because it booted. The process needed a deliberate route back to a validated image before the next risky flash.

Yes, this is going to be a much slower process with a lot of OS builds, but it's going to be a much more reliable process. I can observe failures and successes on a smaller scale and steer the AI accordingly.

## Up next

The first rung was OpenWrt 17.01. It was old enough to stay close to the factory kernel assumptions, new enough to expose the first real incompatibilities, and small enough that a failure could finally mean something.
