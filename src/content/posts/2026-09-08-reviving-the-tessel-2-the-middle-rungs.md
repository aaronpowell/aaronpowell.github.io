+++
title = "Reviving the Tessel 2 - The Middle Rungs"
date = 2026-09-08T10:30:00+10:00
description = "The 18.06 and 19.07 hops carried the SPI fix forward, exposed two false-success flash paths, and found a new rootfs split panic before the 21.02 kernel boundary."
draft = false
tags = ["iot", "tessel", "ai"]
tracking_area = "javascript"
tracking_id = ""
series = "tessel-revival"
series_title = "The Middle Rungs"
+++

The [last post]({{< ref "/posts/2026-08-24-reviving-the-tessel-2-the-first-rung.md" >}}) got the Tessel 2 from the factory-era image to LEDE 17.01. That first rung did more than produce a newer image: it made the failure observable, moved the coprocessor onto the upstream `spi1` controller, and trimmed the MT7620 pinmux so chip-select 1 actually registered.

The next two releases looked less dramatic on paper. Both 18.06 and 19.07 still use a 4.14 kernel. The CS1 patch should carry forward. This was supposed to be the easy part of the ladder.

It was easier than the first rung, but not automatic. The flash path itself lied about success, 18.06 proved that the SPI fix was portable, and 19.07 found a genuinely new boot failure hiding in the firmware partition.

## The fix that carried forward

The 18.06 device tree kept the same upstream representation:

```text
spi0: spi@b00   flash, chip-select 0
spi1: spi@b40   Tessel coprocessor, chip-select 0
```

The only kernel change needed for the coprocessor was still the pinmux correction. On the 4.14 tree, the stock device tree calls the group `"spi refclk"`, so the patch had to keep that name and change only its width:

```text
FUNC("spi refclk", 0, 37, 3)
FUNC("spi refclk", 0, 37, 1)
```

That single-line trim retains the mode bit that puts pin 37 on the second chip-select, while freeing pins 38 and 39 for the Tessel LEDs. The device tree and `spid-start` changes from 17.01 were unchanged. This is exactly the kind of carry-forward we wanted: not copying a patch because the version number looks similar, but checking the source around the patch and finding the same group name and the same hardware model.

## A successful flash that did nothing

Before the board could validate 18.06, the update command produced a very convincing false positive. The image transferred, the CLI printed `Finished`, and the board rebooted. It was still running 17.01.

The missing piece was not SPI. OpenWrt 17.01 and later append `supported_devices` metadata to sysupgrade images. When the running system checks an image, it compares that metadata with the board's device-tree `compatible` values. Our image profile defaulted to `tessel`, while the board identified itself as `tessel,tessel2`. The check refused the image:

```text
[sysupgrade] Device tessel,tessel2 not supported by this image
[sysupgrade] Supported devices: tessel
```

The normal `t2 update` path does not force past that check. The transfer therefore succeeded while the write never happened. That is a particularly dangerous kind of success: the host reports progress, the board reboots, and only a version check after a clean power cycle reveals that nothing changed.

For the intermediate hardware gates, `T2_FORCE_FLASH=1` was the deliberate escape hatch. The image was the correct MT7620 Tessel image; only its identity metadata was too narrow. A permanent image-side `SUPPORTED_DEVICES := tessel tessel2` fix belongs in the later chain-wide rebuild, not mixed into a single-delta validation image.

There was a second flash-path problem, and it explained why the first 19.07 attempt appeared to succeed and then returned to the old release. Before sysupgrade, `t2-cli` used to replace `/lib/upgrade/common.sh` with a bundled Chaos-Calmer-era copy. That old file was useful for avoiding the bridge daemons on genuinely old images, but 18.06 and later moved the upgrade routine out of `common.sh` and renamed it `do_upgrade_stage2`.

Replacing the modern file deleted the function that the newer sysupgrade expected to call. The board rebooted without writing the image. The CLI had performed a transfer, not an upgrade.

The fix was to make `fixOldUpdateScripts()` inspect the pristine files in `/rom` before overwriting anything. If the image has the modern `do_upgrade_stage2` layout, it restores that version and skips the legacy replacement. The command also started exposing the device-side sysupgrade output when forced, which turned an invisible no-op into evidence we could act on.

The lesson was uncomfortable but useful: a flash command has at least three gates. Bytes must reach the board, sysupgrade must accept the image, and the right release must boot afterwards. “Finished” only proves the first one.

## 18.06: the first middle rung passes

Once the metadata check was forced and the update-script clobber was out of the way, the 18.06 image was a straightforward test of the 17.01 fix.

The board came up as:

```text
OpenWrt 18.06.9, r8077-7cbbab7246
Linux 4.14.206
```

The important checks all passed:

```text
/dev/spidev1.0
spi spi1.0: force spi mode3
spid: Starting
host> t2 list --usb
USB    OpenWrt
```

The POWER LED was steady too, confirming that the pin-38 side effect of the pinmux trim carried forward. The old `buggy DT: spidev listed directly in DT` warning was still present, but it was only a warning on this kernel: the node existed and `spid` opened it.

There was one benign startup race. `spid` could start before `usbexecd` had created its socket, log one connection error, and then be respawned by procd. It recovered and stayed up. That was worth recording separately from a crash loop or a missing SPI device; the observable result was a working bridge.

18.06 therefore passed as the first genuine middle rung. The CS1 fix was not a 17.01 accident.

## 19.07: the kernel boots, but Linux cannot find root

The same 4.14 pinmux patch applied cleanly to 19.07. The build source showed the same `"spi refclk"` group, and the image contained the same `spi1` coprocessor node. After fixing the flash path, the board wrote the image and started the kernel.

Then it panicked before userspace:

```text
Kernel command line: console=ttyS0,115200 rootfstype=squashfs,jffs2
Creating 4 MTD partitions on "spi0.0":
  "u-boot"
  "u-boot-env"
  "factory"
  "firmware"
VFS: Cannot open root device "(null)" or unknown-block(0,0)
Kernel panic - not syncing: VFS: Unable to mount root fs
```

This was a much better failure than the original black box. U-Boot loaded the kernel. Both SPI controllers registered. The CS1 fix was working. The failure was at the boundary between the firmware partition and the root filesystem: the `firmware` partition never split into `kernel` and `rootfs`, so there was no root device to mount.

The reason was a small configuration difference between two releases that share a kernel series. 18.06's MT7620 kernel fragment enabled `CONFIG_MTD_SPLIT_FIRMWARE=y`, so the name-based parser recognised a bare partition labelled `firmware`. 19.07 dropped that symbol from its MT7620 defconfig. At the same time, newer upstream boards were moving toward a device-tree `compatible = "denx,uimage"` parser.

Adding that `compatible` looked like the obvious fix. It was also wrong for this board description. Tessel's flash partitions are bare children of the flash node, not leaves inside a `fixed-partitions` container. On hardware, the compatible line caused the `firmware` child to disappear from the fixed-partition enumeration entirely. The table went from four partitions to three, and the board still panicked.

The adopted fix was deliberately less ambitious: restore the byte-for-byte bare partition layout and inject `CONFIG_MTD_SPLIT_FIRMWARE=y` into the 19.07 target kernel fragment. Putting it in the top-level seed configuration does not work; `make defconfig` silently drops a kernel symbol that belongs in the target fragment.

The rebuilt image produced the partitions Linux needed:

```text
mtd3: "firmware"
mtd4: "kernel"       <- split from firmware
mtd5: "rootfs"       <- mounted as root
mtd6: "rootfs_data"  <- overlay
```

The second 19.07 flash reached userspace with OpenWrt 19.07.10 and kernel 4.14.275. `/dev/spidev1.0` existed, `spid` and `usbexecd` stayed up, Wi-Fi reached `wlan0`, and `t2 list --usb` again returned `USB    OpenWrt`. The only SPI complaint was the expected non-fatal generic-spidev warning.

That changed the roadmap. The claim that 17.01 through 19.07 was purely mechanical was too strong: 19.07 needed one bounded kernel-config fix. But it was also exactly why the ladder existed. The failure was isolated to rootfs partition discovery instead of being confused with CS1, the bridge, or the flash transport.

## The next boundary

With 18.06 and 19.07 validated, the ladder reached the edge of the 4.14 band. The next rung, 21.02, moves to kernel 5.4, so it is the first place where the harmless warning about generic `spidev` might become a real refusal.

The plan is to verify before changing anything. The 21.02 source still needs the carried-forward CS1 patch, and the 19.07 firmware split should remain enabled as a belt-and-suspenders config check. But the spidev rule must be tested on the actual kernel: if `compatible = "spidev"` still creates `/dev/spidev1.0`, the whitelist can wait; if the node disappears, the coprocessor needs a real whitelisted compatible such as `rohm,dh2228fv`.

That is the pattern now: carry only what source evidence says is still needed, flash with every gate visible, and let the board decide where the next rung breaks.

## Sources and evidence

- [Incremental OpenWrt upgrade roadmap](https://github.com/aaronpowell/tessel-2-revive/blob/main/docs/openwrt-incremental-upgrade.md), especially the 18.06 and 19.07 hop records.
- [OpenWrt upgrade progress log](https://github.com/aaronpowell/tessel-2-revive/blob/main/docs/openwrt-upgrade-progress.md), including the hardware boot captures and failed `denx,uimage` attempt.
- [Incremental build harness](https://github.com/aaronpowell/tessel-2-revive/blob/main/build/openwrt-incremental/build.sh), which maps releases to kernel patch directories and injects the mtdsplit symbol.
- [First-rung post]({{< ref "/posts/2026-08-24-reviving-the-tessel-2-the-first-rung.md" >}}), for the original CS1 diagnosis and validation gate.
