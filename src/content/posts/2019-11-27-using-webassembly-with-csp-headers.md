+++
title = "Using WebAssembly With CSP Headers"
date = 2019-11-27T11:39:21+11:00
description = "Have you setup Content Security Policies? Do you want to use WebAssembly? Well here's what you need to do"
draft = false
tags = ["wasm", "javascript"]
+++

This year I've been doing a bit with WebAssembly, aka WASM, (see [tags: wasm](/tags/wasm/)) and I've been wanting to upload some experiments to my blog. Simple enough, since my website is a static website I just drop in some files to the right folder, upload them with the rest of the website and it just works. Right?

## Enter CSP

When I [redid my blog as a static website]({{< ref "/posts/2017-07-27-site-rebuild.md" >}}) a few years ago I decided that I'd look into having some proper security policies in place for a static site, in the form of Content Security Policy Headers, or CSP Headers. [Scott Helme](https://scotthelme.co.uk/) has a great [CSP Cheat Sheet](https://scotthelme.co.uk/csp-cheat-sheet/) if you're wanting to get started learning about CSP and why it can be valuable to include. I combined this with [Report URI](https://report-uri.com), a service that Scott runs, to monitor _potentially_ malicious attacks on my website.

## Why CSP

My site is pretty much read-only, so why would I want CSP on it? Well, the main reason is to get a bit of experience in how to set up CSP, maintain it as a site evolves and generally learn about good security practices for web applications. I have noticed a bonus side effect of it though, because I have to whitelist everything that's happening on my site I naturally block a lot of stuff that I didn't know was being injected, such as the Disqus ads! I use Disqus for comments but their ads are served off a different domain to the comment engine, and I've never whitelisted that domain, so my site doesn't have the clickbait sponsored junk all over the bottom of the post!

I have a rather long CSP in place, you'll see it if you look into the network requests of your browsers and it does the job nicely. So when I added some WASM to my blog and went to the page I didn't expect it to fail.

## WASM + CSP

After deploying everything and it wasn't working I opened the dev tools only to find this error:

> Wasm code generation disallowed by embedder

Umm... ok...? That's a new one to me, I've never hit that problem on any of my projects before and it worked on dev, so there must be something different in production, of which the only difference is the CSP headers.

A bit of research led me to [this proposal](https://github.com/WebAssembly/content-security-policy/blob/master/proposals/CSP.md) in the WebAssembly spec. It turns out that because WASM creates a nice little sandbox for apps to play in that also means there's a nice little sandbox for malicious actors to play in too, and we don't want that. The proposal is to introduce some new directives into CSP specifically to allow WASM to be executed, but at the moment it can be handled by using the `unsafe-eval` against `script-src`. Now, this is risky as you're punching a rather large hole in your CSP protection, so I'd recommend that you only add that directive to paths that specifically need it, not just every path on your site. But once it's in place you're WebAssembly code will be executable!

## Conclusion

CSP headers are a good idea to have in place, regardless of how complex your site is or what the risk of malicious actors poses to it, it's better to do security-by-default than as an afterthought, but you will need to watch out if you're trying to combine this with WebAssembly.

At present you need to use `unsafe-eval` in the `script-src` (at a minimum) until the `wasm-unsafe-eval` directive lands.

Now go forth and be secure!