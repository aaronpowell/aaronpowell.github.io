+++
title = "Reviving My Blog With AI"
date = 2025-12-03T03:11:44Z
description = "A look at how I used AI to help me revive my blog after a year of neglect."
draft = false
tags = ["blogging", "ai", "webdev"]
tracking_area = "javascript"
tracking_id = ""
+++

What's this, a blog post after not having written one all year? Look, I'm sure I could make up some excuses about being busy with work, life, and the general chaos of the world, but the truth is, I just lost my blogging mojo. However, as the year is coming to a close I decided to do at least some minor maintenance on my blog, and in doing so I thought it would be a great opportunity to document the process of reviving my blog with a little help from AI.

## Clone, build, fail, repeat

The first step in any blog maintenance is cloning the repository and running a build to see what state things are in. I cloned the repo, ran `hugo`, and... nothing. The build failed immediately. It turns out that the version of Hugo I had installed locally was much newer than what the blog was last built with, and Hugo had introduced breaking changes since then. Well, that was frustrating. Look, I'm sure I could have read the error messages and dug through the hundreds of files in the repo to fix everything, but this is the era of AI assistance, and I'm lazy, so I decided to see if GitHub Copilot could help me out.

## Fixing build issues with Hugo

Hugo’s first build crashed, exposing errors from shortcodes that no longer behave like they did in 2024. Copilot translated the logs into actionable hints and pointed at the culprits—`github`, `gist`, and `tweet`. We removed the brittle GitHub repo embed (which was something custom I'd built and look, I'm sure the code is _somewhere_ in my GitHub...) in favor of a simple link and reduced every `gist` embed to a pair of clean Markdown URLs.

From there it was whack-a-mole across sixteen posts that still referenced the deprecated `tweet`, `twitter`, or `tweet_simple` shortcodes. Copilot helped hunt them down, flagged both spaced and unspaced forms (seriously, past Aaron?!), and drafted the direct `https://x.com/<user>/status/<id>` links that now keep the context but without any remote fetches. Each wave of edits was followed with a full `hugo --buildDrafts --buildFuture` run to make sure we hadn’t invented new problems; by the end the only remaining warning was Hugo reminding me those shortcodes will vanish in a future release—no breaking errors, no missing embeds, just a tidy diff full of Markdown links.

Now that the build was working again, it was time to give the design a refresh, something to _make it pop_.

## Creating a new theme

The original theme had served faithfully for the past few years, but compared to today’s design language it felt cramped and colourless. I asked Copilot to scaffold a fresh base—hero, navigation, cards, footer—and it answered with a glassy, modern layout that emphasised typography and generous spacing. From there I layered in custom Sass tokens, built out the hero animation and CTA buttons, and tightened every component until the homepage finally had the polish I always wanted. The best part was how quickly I could iterate: Copilot implemented a change, I'd review it, give it suggestions on what I did/didn't like about it (annotated screenshots FTW!), and set it on its merry way.

I had created the last theme from scratch, and while I did a lot of CSS _back in the day_, my skills are very much rusty, especially when it comes to modern layout techniques like Flexbox and Grid. What took me a few solid days of fighting with CSS back then was done in, like, 30 minutes with Copilot's help.

## Supporting light and dark mode

You know what all the cool kids have on their websites these days? Light **and** dark mode. So, naturally, for this new design I wanted both, and I just fired off another prompt to Copilot. It helped punch out a theming system based on CSS custom properties: a `set-theme` mixin emits the palette for light and dark, the root follows `prefers-color-scheme`, and a new toggle in the navigation lets anyone override the default. A little JavaScript stores the selection in `localStorage`, updates the emoji/iconography, and snaps the DOM into the chosen mode without a reload. I smoke-tested both palettes—dark hero gradients, light mode cards, rotating headline—fixing subtle contrast issues Copilot flagged along the way until everything felt cohesive regardless of the time of day.

## Reducing build output size

Once the new theme was ready I went to deploy it, only to have the build fail because it was too big to deploy to Static Web Apps. SWA has a limit of 250mb for the free tier (I think...), which is what I'm using for hosting my blog. Look, yeah I know the blog has a lot of images and other assets, but I didn't think it would be that big, so I switched to Standard tier (500mb limit), and deployed again... and it failed again. Turns out the blog was over 600mb now. Well, shit.

I downloaded the CI output because it was time to work out where all the bloat was coming from. My initial hunch was that it was just a lot of really legacy assets, after all, I've been blogging for nearly 20 years, and I know there's some ZIP files in here from pre-OSS code hosting platforms (no, sourceforge wasn't my jam). I looked at the size of each of the top-level folders and I was shocked to notice that, no the assets wasn't that large (relatively speaking), it was the `tags` folder, with over 400mb in there. This folder contains a HTML file for each tag on my website, so you can go to the `csharp` tag and get all posts that are, well, tagged with `csharp`. But what I didn't realise it what I was **also** generating an XML file for RSS on each tag, yes, each tag was also an RSS feed, and with over 200 unique tags on my blog (ok - fixing taxonomy is a problem for another day 😅), that adds up. Also, it was totally not needed.

So it was back to Copilot Chat and started a little diagnostic sprint. Prompt one was a deceptively simple _"why am I generating an RSS feed for each tag?"_ Copilot dissected the project immediately: Hugo’s default taxonomy outputs were spawning an `index.xml` beside every tag page, and because the config inherited the defaults. Prompt two: _"yeah, can you disable it"_ kicked off a quick solution loop (look, you don't need to be super detailed in the prompt 🤣). Copilot proposed the edit (explicit `taxonomy`/`term` outputs set to `HTML` only), patched `config.toml`, suggested re-running `hugo --buildDrafts --buildFuture`, and surfaced the clean build log. With the redundant feeds gone and the site weight ticking downward, I had momentum to keep chipping away at the rest of the oversized assets.

This chat session turned into the perfect postscript. I opened with the ask, _"I want to experiment with a new feature… I want to run an image compression step,"_ and Copilot laid out the whole experiment: a `feature/image-compression` branch, a Sharp-powered `scripts/compress-images.js`, npm scripts for static and `.output` runs, plus VS Code tasks so future me can trigger the same workflow without leaving the editor. A dry-run delivered the proof—199 images trimmed for a 40 MB delta—without touching a single byte.

The next prompt, _"can we change the compress-images.js to use JavaScript modules rather than require,"_ pushed the helper into modern ESM territory. Copilot swapped the imports, flipped `package.json` to `"type": "module"`, refreshed the lockfile, and re-ran `npm run compress:images -- --dry-run` to confirm nothing broke. From there I nudged, _"now can you integrate it into the github actions workflows,"_ and Copilot slotted the compressor straight into the Hugo job with `actions/setup-node`, an `npm ci`, and a post-build `node scripts/compress-images.js --input "$GITHUB_WORKSPACE/$OUTPUT_FOLDER"` step so every artifact upload ships the leanest bits possible.

With the image compression in place and the tag RSS feeds disabled, the final build output was down to a manageable 220mb, well within the free tier limits of Static Web Apps. Time to deploy!

## That's a wrap!

What started as simple maintenance—clone, build, deploy—turned into a full renovation powered by AI assistance. GitHub Copilot helped me navigate breaking changes, modernize a stale design, implement light/dark theming, and optimize build output, all in a fraction of the time it would have taken solo. The real win wasn't just fixing errors or shipping a fresh coat of paint; it was rediscovering the joy of tinkering with my blog without the friction that had kept me away all year.

And you know what the best part is, most of this blog post was able to be written by Copilot as well, I just asked it to summarise the chat sessions, then I went through and edited it to make it sound more like me. So AI writing blog posts about using AI to update my blog, I feel like this is delightfully peak laziness. 😅
