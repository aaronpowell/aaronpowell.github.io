+++
title = "Building a Smart Home - Part 1 Design"
date = 2022-07-18T05:28:52Z
description = "I'm building a smart home, so come join my journey"
draft = false
tags = ["HomeAssistant", "smart-home"]
tracking_area = "javascript"
tracking_id = ""
series = "smart-home"
series_title = "Design"
+++

In the middle of 2020, while the COVID pandemic was really hitting full steam, my wife and I made a decision, we'd demolish our house and build a new one, seems like the perfect time!

Well, about 6 weeks ago, we moved into our new house and it was time for me to tackle the thing I'd been hanging out to do, making this into a smart home.

So with this happening, I'm going to kick off a new series on my blog, sharing my journey in building a smart home.

Because we've built this home from scratch I was able to take a lot of inspiration from what I've been seeing people doing online when it comes to their smart homes and incorporate it into my plans.

## Human-centred design

From following people online, the first thing that I did was plan, plan what it was that we were going to do with the house, and to do that I tackled this with a human-centred design.

For our house there's 4 primary users with a range of technical skills (from myself to my 4 year old), with a range of secondary users such as our parents and friends. With this in mind, how do we make a smart home?

**The home will only be as smart as it's dumbest user**. You see, over the years the design of every day items have been iterated on and people have built expectations based of that design. [Dan Norman](https://en.wikipedia.org/wiki/Don_Norman) wrote a book called [The Design of Everyday Things](https://en.wikipedia.org/wiki/The_Design_of_Everyday_Things) which culminated in the term [Norman Doors](https://99percentinvisible.org/article/norman-doors-dont-know-whether-push-pull-blame-design/).

{{< youtube yY96hTb8WgI >}}

But how does this apply to a smart home? If we think about the kinds of things we can add some intelligence to, lights are a common starting point but are also an easy way to break expected design. If I can walk up to a light switch and flip it to change the state, it's not smart, it's a broken design.

After all, our house shouldn't require a manual to live in and operate.

As an aside - we do have something that I would put in this category of poor design, our fans. We put fans in each of our bedrooms and they are a broken user experience. There's a switch on the wall and it'll turn on the light in the fan, and we have a remote to turn the fan on/adjust speed. Then if you turn off the switch the light goes off... and so does the fan 😒. Turns out the switch controls power to the whole circuit, not just the light, so if you want the fan on you have to flip the switch, turn it on with the remote then use the remote to turn off the light, which isn't great in summer and you want to turn the fan on during the night (we had the same ones in the place we rented, so we're familiar with them). I'll talk about solving that in a future post.

## What's smart then

So how do we make a house smart while not breaking the expectations that we have as users?

To achieve this, I'm going to be tackling it from a progressive enhancement point of view. Take our light switch example, a light switch should still operate as a light switch, but it should also be adaptive to our needs. If I'm watching a movie in the media room, it should adjust the lighting accordingly.

## The tech

Right now, we're still in the early stages of "smartening" the house, so the tech aspect of it is _basic_, but there are two core pieces to it, first is Google Home. My wife and I are both Android phone users, so we use Google Assistant a bit, and for a few years we've had some Google Home/Nest speakers to set timers/play music/etc., so it makes sense for that to be the primary user interface.

For the brains of the operation, I'm using [Home Assistant](https://www.home-assistant.io/) as a hub, running on a Raspberry Pi 4 (HAOS install - the Pi 4 is dedicated for Home Assistant). I originally experimented with a Pi 3a for running Home Assistant, but kept finding that I was running out of memory on the device, so I upgraded to a Pi 4.

I also configured it to boot from USB, rather than the SD card (which is the default), so you don't have to worry about the write-lifetime (I fried an SD card while experimenting and lost a whole setup).

## Networking

The other part of my plans was how to tackle networking. Since moving out of home, I've always seemed to deal with shit wifi. I've built hodgepodge systems of routers with bridging access points, Ethernet over Power bridges, strung ethernet cables, and they've always been, at the best, _ok_.

Since we're building from scratch I decided to _do this right_, and that meant running CAT6a everywhere of importance, then having access points covering the aspects of our house. Basically, if the device won't move (TV, desktop PC, etc.) it should get ethernet, otherwise it can use wifi.

With our new house the NBN connection comes into the garage, with two downstairs living spaces (one at each end of the floor), an upstairs living space, as well as a home office. These were the points deemed necessary to have ethernet, as then I can run a cable to each TV, as well as to my home office.

I've gone with [Unifi](https://www.ui.com/) products (while they are more expensive, I'm happy to be in the prosumer market) and have a setup consisting of a Unifi Dream Machine (UDM) - NBN comes into that, a USW Lite 16 port PoE switch and 3 InWall HD's (one behind each TV). The garage has an 8 ports going out to the house, which go to our TV's, 2 to my office, 1 to my wife's office and 2 external for cameras.

In total, we have 32 ethernet ports across the UDM, Lite 16 and InWall HD's (in reality, less as the Lite 16 runs the InWall's), and that gives me plenty of ports to run everything where they need to be.

Is it overkill? Probably. Do I get full signal strength everywhere in the house? Absolutely.

![The beautiful network rack](/images/2022-07-18-building-a-smart-home---part-1-design/01.jpg)

## Power

The other thing to plan for when designing for a smart home is power. The rule of thumb is that you can never have enough power points, and even when you've put them all in, they'll still not be enough.

For the main points in our house, behind the TV's, I put 4-plug wall plates, which will give enough to do direct plugging in for most appliances, but you can always expand with power boards as needed. For example, our media room had power for the TV, Xbox and Xbox controller charger, which leaves one left over for a soundbar (or similar) in the future, before having to put in an expander (we also have an additional 2 points elsewhere for the recliners 😉).

We have some oddities in some rooms though, like our laundry has a heap of single power points, rather than doubles, so I'll have to review that down the track when laundry is the space to _make smart_.

## Summary

This brings me to the end of the first post in this series.

Coming into this project with a from-scratch house build has made it a lot easier for me to design for what I want, rather than having to retrofit into the house.

I really think that the most important aspect is approaching a smart home from the _human_ perspective is important. Making it "smart" by just throwing tech in the house will run the risk of breaking expectations that people will have on how things work. No one wants to live with a Norman Door every day.

So, think through your connectivity, think through your power requirements, but most importantly, think through the people who will use the house and design for them.
