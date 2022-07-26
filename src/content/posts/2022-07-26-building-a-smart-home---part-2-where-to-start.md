+++
title = "Building a Smart Home - Part 2 Where to Start"
date = 2022-07-26T01:10:46Z
description = "Sensors, lights, plugs, switches, wifi, ZigBee, Z-Wave, oh my..."
draft = false
tags = ["smart-home"]
tracking_area = "javascript"
tracking_id = ""
series = "smart-home"
series_title = "Where to start"
+++

When it comes to smart home _stuff_ there's so many things to look at. You can control lights, climate control, have smart appliances, play music on actions, have a camera doorbell and respond to movement, and the list goes on. This can make it very daunting when getting started and can result in decision paralysis, so you _never_ start.

And that's not even accounting for the cost of any hardware you're getting to then no do anything with!

## Where to start

As I'm getting started on my journey, this is a question I asked myself - where will I start.

Naturally, the answer to this will be different for everyone as everyone's home is different and everyone's needs are different, but here's a few decisions that I went through in trying to work out where to start.

## Define the problems

To start exploring smart home I sat down and looked at what problems I was trying to solve.

As I mentioned in the first post on designing a smart home I said that the "smarts" of the home shouldn't get in the way of the expected operation. A light switch should still switch a light, so I looked at the things that _worked_ but could work better.

From this I came up with a short list of problems:

- Forgetting the washing machine was done to hang the laundry out
- It was cold downstairs in the morning, I'd like it to warm up before we get down
- Kids not turning off the TV when asked/screen time was up
- Ensuring the house/garage are locked up when we leave
- Coming home with the kids after dark and getting them upstairs to bed while asleep

Solving any of these problems with a smart home wouldn't be revolutionary by any means, but it would help improve our families quality of life, and that's where I see a smart home really coming into play.

## The tech

As a technologist, this is really the thing I wanted to get stuck into - who doesn't love buying new tech to play with!

But the kind of problems I described above can be solved in many different ways, and then you've got different protocols to look at, wifi, ZigBee, Z-Wave, Bluetooth, and so on.

I've already decided that I'll be using Home Assistant as the core of my solution, so I needed to explore options that would integrate with it in the simplest way possible.

But since this is a DIY solution, nothing will be _simple_ so it's a good idea to start small, buy only one of a device and test it out, before committing to a fleet of them - this saved me on a recent purchase, I found a power monitoring double plug but it turned out to only report the _overall_ plug usage, not a per-outlet reading, which is what I wanted. Thankfully, I'd only bought one of them (around $30) and was able to return it, but even if I couldn't return it, $30 is a lot easier a cost to swallow than the amount it would've been if I got as many as I ultimately want to deploy.

## Summary

That comes to the end of this post, I've got a few ideas of things that I'd like to improve upon their current (non-smart) solutions to improve quality of life.

And that's how I see getting longevity out of this hobby, solving things I _actually_ want solved, rather than just tinkering and hoping the coolness factor doesn't wear off.

In the next post, we'll move on from theory and start tackling one of these problems.
