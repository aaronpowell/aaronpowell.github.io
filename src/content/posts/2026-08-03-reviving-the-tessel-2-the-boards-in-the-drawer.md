+++
title = "Reviving the Tessel 2 - The Boards in the Drawer"
date = 2026-08-03T09:00:00+10:00
description = "AARON: one sentence. This is the meta description and the card blurb on the homepage. Something like: I have a drawer full of hardware from a company that no longer exists, and this is the log of getting it running again."
draft = true
tags = ["iot", "openwrt", "tessel", "ai"]
tracking_area = "javascript"
tracking_id = ""
series = "tessel-revival"
series_title = "The Boards in the Drawer"
+++

<!--
================================================================================
SCAFFOLD — post 1 of the Tessel revival series. Not a draft, a frame.
Headings and intent notes only. Aaron writes the prose.

FRONT MATTER NOTES (conventions verified against this repo, 2026-07-30):

* draft = true deliberately. Flip to false when you're happy with it.

* DATE IS LOAD-BEARING. The theme orders series posts by publish date
  (themes/aaronpowell/layouts/partials/series.html ranges over
  `.Site.RegularPages.ByDate`) — there is no explicit part index, the numbers
  are generated. So this post MUST keep the earliest date of the twelve.
  2026-08-03 is a Monday and sits after your last published post
  (2026-07-03). If you move it, move it EARLIER, never later, and leave
  room ahead of it — there are 11+ posts to follow.

* AARON DECISION: `series = "tessel-revival"` is a guess at the series key.
  Whatever you pick, every post has to use the same string exactly or the
  series list silently splits in two. Lock it here first.

* AARON DECISION: tags. `iot` and `ai` are already in use on the site.
  `tessel` and `openwrt` would be new. Fine, but deliberate.

* AARON DECISION: tracking_area = "javascript" — every previous IoT /
  hardware / smart-home post on the site uses that value, so it's the
  consistent pick. `""` is also in recent use if you'd rather.

* series_intro is supported by the theme (renders above the series list on
  every post in the series) but no post on the site currently sets it. If
  you want a standing one-liner across all twelve, add it here.

LINKS: the tessel-2-revive repo is still PRIVATE. Every place that wants a
source link is marked `<!-- LINK-PENDING -->` so they can be swept in one
pass once you decide. Do not add real links to it until it's public — they
will 404.
================================================================================
-->

## The drawer

<!--
INTENT: Open on the object, not the project. ~150 words.
The image is a drawer with dead hardware in it from a company that doesn't
exist any more. Land that in the first two sentences — it's the hook for the
whole series.

AARON — only you have this:
- How many boards? And what condition are they in — all identical, or a mix?
- Where did they come from? Bought, given, conference swag, work?
- Roughly when? (The Tessel 2 shipped 2015-2016, so somewhere in there.)
-->

<!-- AARON: how many boards, and where did they come from? -->

## What a Tessel 2 actually was

<!--
INTENT: ~200 words. Just enough that a reader who's never heard of one
understands why it was appealing. Do NOT go deep — post 2 is the full
teardown, and this post is the hook.

The factual scaffolding below is verified from the project's own docs and
from the live hardware. Rewrite in your voice, but the facts are checked:

- A dev board you programmed in JavaScript. Not "JavaScript-ish" — Node,
  npm packages, `t2 run app.js` and it ran on the board.
- Two processors: a MediaTek MT7620n (MIPS32, ~580MHz) running Linux and
  doing WiFi/Ethernet/USB and executing your JS, plus an Atmel SAMD21
  (ARM Cortex-M0+) coprocessor that owns the two module ports and the USB
  connection. They talk to each other over SPI.
- Two 10-pin module ports (A and B) giving GPIO, SPI, UART, I2C and ADC,
  with a range of first-party click-in modules — that was the pitch, you
  didn't breadboard anything.
- The developer experience was the product. Plug in USB, `t2 list`,
  `t2 run app.js`. Deploying to hardware felt like `node app.js`.

ONE DETAIL WORTH PLANTING HERE, because it detonates in post 8: the MT7620n
has NO FLOATING POINT UNIT. Drop it as a throwaway spec line now and don't
explain it — one clause in a list of specs, no signposting.

  Note to future self on why this is the fuse. The payoff in post 8 is NOT
  "no FPU is hard". It's better than that: the JavaScript runtime only ever
  worked because the KERNEL WAS FAKING THE FPU, and modern kernels stopped
  doing it. The factory node 4.2.1 is o32 HARD-float — floating-point
  instructions, on a chip with no floating-point unit — and it ran fine for
  a decade because the 15.05 kernel had FP emulation compiled in, quietly
  trapping and emulating every one of them. Modern OpenWrt kernels ship
  `# CONFIG_MIPS_FP_SUPPORT is not set` (their own userspace is soft-float,
  so they don't need it), and the moment the board moved to one, node died
  with SIGILL. The trap: building a soft-float node doesn't save you either,
  because V8's JIT emits FPU instructions at runtime regardless of the ABI
  the binary was compiled with — hard-float 4.2.1 and a purpose-built
  soft-float 8.11.3 both died the same way. That's a "the thing you depended
  on was an undocumented kindness" story, and it's worth eleven posts of
  patience. Verified: build/openwrt-incremental/build.sh:113-121, :232.
-->

<!-- AARON: what drew you to it at the time? The JS story, the modules, something else? -->

## What I did with them

<!--
INTENT: ~200 words. The personal middle of the post — the bit that makes it
a story rather than a changelog. Entirely yours.

AARON — specific questions, answer whichever have answers:
- What did you actually build with them? Anything that ran for real, or all
  experiments?
- Was any of it public — a talk, a demo, a blog post, a workshop? If there's
  an old post on this site we should `{{< ref >}}` to it, name it here.
- What did you INTEND to build and never got to?
- Did you buy modules too, or just the boards?
-->

<!-- AARON: what did you build, and what did you mean to build? -->

## When it went quiet

<!--
INTENT: ~200 words. The turn. Hardware doesn't die when a company does —
the software supply chain does. This section is the thesis of the post,
so it needs to land, but keep it in the register of "I noticed" rather than
"here is a post-mortem of a startup".

AARON — only you have this:
- When did you notice it had gone quiet? Was there a moment — an
  announcement, a dead link, a docs site that stopped loading — or did you
  just gradually stop opening the drawer?
- Did you follow the company's story at the time (acquisition, wind-down),
  or find out later?
- Be as generous or as brief about the company as you want. Suggestion:
  brief. The series is about the hardware outliving the software, and a
  post-mortem of someone else's business isn't the interesting part.

VERIFIED FACT you can lean on: the ecosystem was left mid-sentence rather
than shut down cleanly. The boards kept working perfectly — they just
stopped being reachable by anything modern.
-->

<!-- AARON: when did you notice it had gone quiet, and what tipped you off? -->

## Why they stayed in the drawer

<!--
INTENT: ~250 words. THE most important factual section in the post, because
it makes "I couldn't really use them" concrete. Vague decay is boring;
specific decay is the hook for eleven more posts.

These are all verified against the live boards and the project's own docs.
Use them as a short list, not a wall of text — each one is a post later:

- The board still boots. It has always still booted. It runs OpenWrt
  Chaos Calmer **15.05-rc2** — a *release candidate*, from 2015, on Linux
  kernel 3.18. That's the firmware it shipped with, it was never moved off
  it, and its package feed is pinned to
  `http://downloads.openwrt.org/chaos_calmer/15.05-rc2/…` — plaintext, and
  gone. The boards are pointed at a package feed for a pre-release that
  stopped existing years ago.
- The JavaScript runtime on the board is Node 4.2.1, built against uClibc.
  Node 4 went end-of-life in 2018. Everything you'd want to npm install
  today assumes a runtime at least three major versions newer.
- The host-side CLI — `t2-cli`, the thing that gives you `t2 run` — is a
  Node app written for Node 4/6 with native USB bindings. On a current
  Node it does not install. Step zero fails. (That's post 3.)
- `t2 update`, the built-in "get the latest firmware" command, points at an
  update feed that isn't there any more. It 404s.
  <!-- Keep this in the past/original-state tense. There IS a working feed
       now (releases/builds.json, v25.12.5-node8-r5), but the repo is
       private so it 404s for everyone except Aaron. The statement above
       describes the state he found the boards in, which is accurate and
       unaffected. Post 10 is where the feed gets built. -->
- I'm on Windows, which turns a USB-and-mDNS problem into a harder
  USB-and-mDNS problem. (Post 2 lays out that constraint; post 9 is where
  it gets expensive.)

THE LINE TO LAND: none of these are hardware failures. Every single path
back to the board ran through a service, a registry, or a runtime that had
rotted. The boards are fine. The scaffolding around them isn't.

AARON — one slot here:
- What made you pick them up NOW? A project you wanted them for, a
  clear-out, curiosity, something you read? This is the trigger for the
  whole series and it's the one bit of motivation only you can supply.
-->

<!-- AARON: what made you pick them up again now, after all this time? -->

## What this series is

<!--
INTENT: ~200 words. Set expectations, then get out.

Where it ends up (all verified, safe to state):
- The boards now run OpenWrt 25.12 on kernel 6.12 — ten years and eight
  upgrade hops on from 15.05-rc2 and kernel 3.18.
- They run JavaScript again, on a CPU with no floating point unit, which
  took more doing than it sounds.
- They join WiFi, they're discoverable, and the CLI works from Windows.
- I deploy code to them from inside an AI coding tool, through a canvas
  extension built for the purpose.

Tone to set:
- This is long and it goes deep — kernel configs, flash layouts, SPI
  drivers, a lot of hex.
- It does NOT clean up the failures. The wrong turns are in here on
  purpose, including a couple where the evidence looked decisive and
  wasn't. That's most of the value.
- Every technical claim in it was run on real hardware.

RECOMMENDATION (agreed across both sessions): let the theme's generated
series list do the roadmap. It already renders the full series on every
post, and a hand-maintained list of twelve here will drift as the series
shifts. If you want post 1 to stand alone for someone landing on it cold,
one sentence naming the arc beats a numbered list.
-->

## The part I'll argue properly at the end

<!--
INTENT: ~150 words, and then STOP. This plants the AI framing. It does not
argue it — post 12 argues it, with evidence. Planting and then paying off
eleven posts later is the whole structure.

The claim, in your words (from your own framing): AI has been the real
success story here. Without it, these boards would not have been able to be
updated. This project would not have happened.

Why it belongs in post 1 rather than only post 12: a reader who gets to the
end of a 12-part embedded Linux series and *then* hears "by the way, AI"
will reasonably feel it was bolted on. Saying it up front makes the rest of
the series the evidence.

Keep it honest and small here:
- State it as a claim you'll defend later, not a conclusion.
- Be specific about what the bet actually was — you were not going to
  hand-port an embedded Linux distro across ten years of releases in your
  spare time, and you knew it. Something had to be able to hold the whole
  problem at once.
- Do NOT list what AI did well here. That's post 12, and it's stronger
  when the reader has watched it happen for eleven posts first.
- Resist the urge to pre-empt the objections. Post 12 handles them, and it
  handles them better because it can point at real transcripts.

RECOMMENDATION (agreed across both sessions): one paragraph, stated flat.
Understating the claim here makes post 12 land harder. Overselling it in
post 1 invites the reader to start arguing before they've seen any
evidence, and the evidence is the whole point.
-->

<!--
================================================================================
CHECKLIST BEFORE PUBLISHING THIS ONE

[ ] Every `<!-- AARON: ... -->` slot answered or deliberately dropped
[ ] `series` key locked, and identical to what posts 2-12 will use
[ ] date still EARLIER than every other post in the series
[ ] description filled in (it's the card blurb and the meta description)
[ ] photos of the boards — see below
[ ] draft = false
[ ] LINK-PENDING sweep — only once the repo is public

IMAGES: convention on this site is src/static/images/<series-slug>/NN-NNN.png,
referenced as /images/tessel-revival/01-001.png. So post 1's images are
01-001.png, 01-002.png, ... Create src/static/images/tessel-revival/.
A photo of the actual drawer would do a lot of work for this post.

INTERNAL LINKS: use the Hugo ref shortcode, not URLs —
{{< ref "/posts/2026-08-10-reviving-the-tessel-2-archaeology.md" >}}
It fails the build on a typo, which is what we want across twelve
cross-linked posts. Forward links to posts 2-12 can't be added until those
files exist, or the build breaks.
================================================================================
-->
