+++
title = "Learning Golang through WebAssembly - Part 1, Introduction and setup"
date = 2019-02-04T09:00:00+11:00
description = "Introducing a new series on learning Go by writing WebAssembly"
draft = false
tags = ["golang", "wasm", "javascript"]
series_intro = "This blog is part of a series I'm writing about learning how to write Go (Golang) by targeting what I'm familiar with, web development. The series consists of the following parts:"
series = "golang-wasm"
series_title = "Introduction and setup"
+++

## Introduction

I've always liked tinkering with different technology and trying to stay abreast of things that look interesting. One thing that's been on my radar for a while now is [Go, aka Golang](https://golang.org), but as someone who predominately does web development in the browser I was never quite sure _where_ Go could fit into what I tend to build.

Another thing that I'd been meaning to pick up is [Web Assembly, aka WASM](https://webassembly.org/), but again I've never quite had the time to pick it up. If you're not familiar with WASM, it's a new component of the web platform to allow developers to use high level languages like C, C++, Rust, Go, .NET, etc. in the browser in a native way, rather than converted to JavaScript. I'm by no means a WASM expert, but after a week of digging into things I've found some really interesting tidbits I'll share along the way.

As I recently [started a new Developer Relations job]({{< ref "/posts/2019-01-14-starting-2019-with-a-new-job.md" >}}) I decided that now was the perfect time for me to start exploring these technologies.

And as it so happens Go's 1.11 release last year includes [experimental WASM support](https://golang.org/doc/go1.11#wasm), so it looks like it's meant to be.

So I have decided to put together a series that looks at the experience of using Go, learning WASM and how it all fits into the tool chain that we tend to use as web developers.

We won't build anything particularly complex, the Go support is experimental at best, but it should give you enough of a starting point to work out where to go next.

## Getting Setup

The first thing you'll need to do is to setup a development environment. Go works on all major operating systems and I've used Windows + [Windows Subsystem for Linux (WSL)](https://docs.microsoft.com/en-us/windows/wsl/about?{{< cda >}}). My colleague Scott Coulton has written how to setup a [WSL dev environment, including Go](https://medium.com/devopslinks/windows-for-a-linux-guy-823276351826) that I followed.

~~One thing I will note is that I haven't managed to get code completion working in VSCode at the moment, something seems incorrect in the way I've setup my `GOPATH` and `GOROOT`, but so far it hasn't been _too_ painful for me to work without code completion.~~ Once I got my `GOPATH` and `GOROOT` set properly and defined as environment variables in both Windows and Linux (WSL) it worked fine.

### `GOPATH`, `GOROOT`, huh?

This is something that confused the heck out of me initially when I was getting setup, what these two things are and what do they do.

By default when installing on Windows Go will want to install into `C:\Go`. I am not really a fan of this, there should be 3 things at the `C:\` level, `Program Files` (including the `x86` folder), `Users` and `Windows` (now in reality you'll have a few more things but they are all system-level things) so I wanted to change it. As a result of setting up [Docker + WSL](https://blogs.technet.microsoft.com/virtualization/2017/12/08/wsl-interoperability-with-docker/) I already had a Go folder at `C:\Users\<me>\go` and figured that'd be a good place to install Go into.

And this is where things starting going wrong. Because of this I had both my `GOPATH` and `GOROOT` pointing to the same folder, which seemed logical to me, after all, that's where Go was.

Nope, the Go commands kept throwing errors at me and this is because these two paths **can't** be combined. The reason for this is that they represent two different concepts within Go:

* `GOROOT` - this is where Go is installed and where all of the Go system components are installed to. I use `C:\Users\<me>\goroot` for that
* `GOPATH` - this is Go's user space, where packages you pull down end up (such as `goexec` which we'll use in the next article). I use `C:\Users\<me>\go` for that

So if you were to combine them you'd run the potential of trashing the "core" of Go.

## Editors and Browsers

I use [VS Code](https://code.visualstudio.com) as my text editor and it has some great plugins for working with Go, but you can use whatever you would like.

As for browsers, well WASM is still pretty new so you'll want an evergreen to make it work. I did have some problems with Edge so I tended to stick to Chrome and Firefox, but with Edge moving to Chromium shortly I see that problem going away. I have also been told that the demo we'll build doesn't seem to work on iOS Safari or Chrome Android, but I think that might be related to [this issue](https://github.com/golang/go/issues/27462), so stick to a desktop browser (also, you get dev tools there).

We will need [Node.js](https://nodejs.org) eventually, but not first up, so go ahead and install it (I uses the latest v11 release) if you don't already have Node.

## Conclusion

Ultimately this was pretty short post to set the stage for what we're about to undertake.

Don't worry if you've never written a line of Go, or you've never heard of WebAssembly, we'll take this journey together.