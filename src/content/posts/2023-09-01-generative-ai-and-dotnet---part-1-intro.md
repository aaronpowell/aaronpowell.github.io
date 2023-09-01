+++
title = "Generative AI and .NET - Part 1 Intro"
date = 2023-09-01T06:24:30Z
description = "It's time to start a new series with everyone's favourite topic of the moment, AI!"
draft = false
tags = ["dotnet", "ai"]
tracking_area = "dotnet"
tracking_id = ""
series = "ai-dotnet"
series_title = "Intro"
+++

I've missed a lot of the recent hype trains, I skipped over blockchain, I avoided web3, and I'm not dumb enough to have believed NFT's were anything but a scam, but I'm not going to miss out on the AI hype train! Toot toot!

Over the past few weeks I've been digging into how we can build stuff with .NET and AI, specifically [Generative AI](https://en.wikipedia.org/wiki/Generative_artificial_intelligence) which we see with platforms such as [OpenAI](https://openai.com/), and more specifically [Azure OpenAI Service](https://azure.microsoft.com/services/openai/?{{cda}}).

While there is heaps of content out there on using these services I've noticed that it tends to be heavy in Python, and while I'm not against Python, it's not a language I'm overly familiar with, so I wanted look at how we can use these services with .NET. Also, a lot of the content is really skewed towards people who are already well versed in the terminology, the concepts, and the tools, so I wanted to try and make this a bit more accessible to people who are new to the space.

So, over this series I'm going to share my learnings on the APIs, SDKs, and the like. The goal here isn't to "build something" but rather to share what I've learnt, the mistakes I've made, the things I've found confusing, and the code I've had to rewrite umpteen times because "oh, that's a better way to do it".

But before we get started, I want to make something clear - I am 100% a consumer in this AI story, I'm not an AI expert, an AI researcher, or have any real understanding on how AI models work, and I think that's an important way to approach this; I'm approaching it as someone who knows how to code and is just trying to do it against a new set of libraries.

Now, without further ado, let's talk theory.

## What is Generative AI?

Throughout this series I'll be looking at a specific part of the AI landscape and that's Generative AI. After all, AI isn't anything new, it's been around for decades, but what is new is the way it can generate new content, and this is what makes things like OpenAI stand out from previous AI systems.

I'm going to keep referring back to OpenAI, as that's the platform I'm using (well, I use it with Azure OpenAI Service), but there are other platforms out there that will have their own APIs and SDKs. I don't have experience with them so I can't comment on them, but I'm sure the concepts will be similar.

So, what is Generative AI? Well, it's a system that can generate new content based on existing content. For example, you can give it a sentence and it will generate a new sentence based on what we started with, aka, _the prompt_.

For example, if we give it the prompt "The quick brown fox jumps over" it might return us "the lazy dog", as that's the most likely continuation, or **completion** to use the correct terminology, of that sentence. But it might also return us "the moon", or "the fence", or "the lazy dog jumps over the moon", or "the lazy dog jumps over the fence", or "the lazy dog jumps over the moon and the fence", or so on.

_Fun fact: I used a completion for that last sentence, so that's an example of the AI in action!_

Obviously this is a huge oversimplification of what this is, but it's enough to ground our understanding, and we'll build on that throughout the series.

## OpenAI and Azure OpenAI Service

Before I wrap up this post I want to mention a bit about OpenAI and Azure OpenAI Service. It might seem a bit confusing that I refer to the two of them interchangeably, but that's because they have an overlap, AOAI (isn't that a fun acronym!) builds on top of OpenAI, providing the same Large Language Models, or LLMs that OpenAI provides, but with the added benefit of being able to run it in Azure, and in doing so bring in enterprise-centric features that you'd expect from security to integration with other data sources to content filtering.

But when it comes to working with them from a SDK level, they operate very similar. In fact, the .NET SDK that we'll be using has the ability to change between pointing to AOAI or OpenAI when establishing the connection, so you can easily switch between the two.

But more on that next time.

## Next Time

That will do us for this post, mostly this post was about introducing the new series and setting the scene for what we'll be looking at.

In the next post we'll look at the basics of how we can use the SDK to connect to the service, and how we can use it to generate completions.
