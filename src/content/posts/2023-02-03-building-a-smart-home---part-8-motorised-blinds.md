+++
title = "Building a Smart Home - Part 8 Motorised Blinds"
date = 2023-02-03T02:44:03Z
description = "Next job on the smart home, motorised blinds"
draft = false
tags = ["HomeAssistant", "smart-home"]
tracking_area = "javascript"
tracking_id = ""
series = "smart-home"
series_title = "Motorised Blinds"
+++

We've got a lot of windows in our new house, for example the main bedroom has four windows. This means we have an awesome amount of natural light (we rarely need to turn lights on during the day!) but we're forever having to go around opening and closing them.

Because of this, motorised blinds have always been an appealing idea to me so it's time to tackle this aspect of the smart home.

The blinds we have are roller blinds and there's two ways to motorise them, a motor within the blind itself or something you run the chain through. Since the blinds are brand new, I didn't want to replace them by putting a motor into them, instead I decided to go with the simpler option of having a controller on the wall to run the chain through. I also feel this to be a less invasive solution and easier to walk back from in future.

## There's motors and then there's motors

Researching around, there are a lot of different options out there, some are ZigBee, some are Z-Wave, some are Bluetooth/Bluetooth Low Energy (BLE) and some are RF. You might have noticed wifi isn't an option and that's because wifi is not a particularly common protocol for these kinds of devices. Wifi requires a lot of energy (relatively speaking) so it's not ideal for battery powered devices like these and we are going to have a motor which also requires power so we're better sticking to a low-powered communication protocol.

While I was trying to work out what options to go with a friend offered me three different ones that he wasn't using (under the provision that I don't return them 🤣), [Teptron Move](https://teptron.com/products/move-2, [Soma Smart Shades 2](https://www.ozsmartthings.com.au/collections/smart-blinds/products/soma-smart-shades) and [Axis Gear](https://helloaxis.com/). The first two are Bluetooth/BLE and the Gear uses ZigBee.

_Quick aside as I haven't mentioned ZigBee before. [ZigBee](https://en.wikipedia.org/wiki/Zigbee) is a wireless protocol designed for low-powered devices and somewhat common in the smart home ecosystem. It works a bit like a mesh wifi network but operates separately to wifi (it does share 2.4GHz) but you need a hub of some sort that will turn the ZigBee signal into something consumable on your network/within Home Assistant. You'll find plenty of stuff on YouTube about ZigBee if you want to learn more. Personally, I use a [ConBee II](https://www.ozsmartthings.com.au/collections/zigbee/products/conbee-ii-zigbee-usb) for my ZigBee hub and [ZigBee2MQTT](https://www.zigbee2mqtt.io/) in Home Assistant._

The Soma was a device that I had been looking at as one to get, it's a small and compact unit, which would wouldn't be offensive on our windows, compared to a lot of options. It also has integration to Home Assistant, at least at a cursory glance (more on that later), so it seemed like it could fit the bill.

The Move is less appealing aesthetically as it's quite a tall unit with buttons on the outside. It also didn't have a solar panel, instead you need to rely on a wall plug or ensure you recharge the battery frequently. It also doesn't have any HA integration that I have been able to find, which isn't surprising as it's a BLE device, meaning that it can only be controlled via the phone app or directly on the device. Because of this, I'm not installed it anywhere, maybe in the future if I feel the desire to reverse engineer the BLE comms from the app (but probably not...).

The last of the ones I was given was the Axis Gear, which is both BLE and ZigBee and while the BLE aspect doesn't have HA integration, using ZigBee it can be, woo!

Time to get integrating.

## They All Kind of Suck

After following all the install guides for both the Soma and Gear (although I mounted them with 3M sticky strips rather than screws incase I want to get rid of them) and the conclusion I came to is that the whole ecosystem just kind of sucks. Let's start with the design of the control units.

What I like about the Soma is that it's small and sleek but the trade off from that is there's no external controls... so how do you control it? via the companion mobile app. This means we're going to be breaking one of our core rules, our blind isn't going to be easy to control by just anyone.

The Gear is better in this regard, it has a modern design, which fits the look we're going for, and a touch bar on the front that you can control the blind position, meaning you don't need to open the app once it's initially setup to control the blind. It's not perfect, you still need to know to look for the touch bar and if the blind is closed you have to reach around it to get to the controller, but it's an improvement over the Soma... it sucks less.

### Apps

Both of these options require you to use BLE for the initial setup (the Axis Gear is ZigBee but it doesn't support setting positions via ZigBee, it's either via the app or using magic button combinations) and of course they have their own apps, which means I have two different apps to control my blinds.

And this is **the biggest** pain point with motorised blinds, you either have to buy into a single platform or you end up with a range of apps that you're controlling via. Long-term, this is likely to be less of a problem as you will find the one that works for you and go "all in" with that one, but while you're investigating it sucks, and you're either spending money on devices to mothball them later, or you don't replace the less-desirable ones and suck it up.

Neither of the apps are terrible, they find the blind easily enough, you can set positions, control the position, set schedules, etc. but really what I want is a single platform to control them all.

Enter Home Assistant.

### Home Assistant

Once the units were setup it was time to integrate them with Home Assistant. I started with the Soma as there's a [Soma Connect HA integration](https://www.home-assistant.io/integrations/soma/), awesome... no, no it wasn't.

Turns out that you don't integrate the blinds directly, instead you need a [Soma Connect](https://www.ozsmartthings.com.au/products/oz-soma-connect) hub to bridge the blinds into Home Assistant. Well that sucks.

It kind of makes sense. Up until recently there wasn't native Bluetooth support in HA, so it couldn't talk to the blinds, the Soma Connect does that and HA talks to it. But it meant that I would have to spend more for a device that only _kind of_ fits what I want.

Thankfully, while digging around the Home Assistant forums I found out that the Soma Connect software [can be installed on a Raspberry Pi](https://support.somasmarthome.com/hc/en-us/articles/360035521234-Install-SOMA-Connect-software) (seemingly they were having supply issues with the official devices so the software was released). I've got a stack of Pi's laying around, so I dusted one off, flashed an SD card with the Soma Connect software, booted it up and it _just worked_. Seriously, it just worked! Home Assistant picked it up, it'd already found the blind and connected with it, I was actually kind of shocked. So now I have a Pi that lives under the bed that is controlling one of the blinds.

The Gear is different in that it supports ZigBee and while their docs assume you're using something like a SmartThings or Alexa as the ZigBee hub, I had no problems finding it using my ConBee II stick that is my ZigBee hub. You have to use the Axis app to enable "hub mode" (which then renders the app useless as I guess they disable BLE? seems odd that you can't use both) and once that was done I found it to pair pretty quickly with my network and it appeared in Home Assistant as a [cover entity](https://www.home-assistant.io/integrations/cover/) so it can be opened/stopped/closed.

Since I have both the Soma and Gear in our bedroom (and still two manual blinds... which we never open now 🤣) I created a [cover group](https://www.home-assistant.io/integrations/group/#cover-groups) so we have a single entity in HA for "Parents blinds" that we can open/close them all at once.

For automations, they aren't very exciting, at 9am the blinds will open and at 7pm they'll close. I'm thinking of getting a humidity sensor in the bathroom to detect when the shower is on and close the blinds, since you have to walk past them to get to our walk in robe, but it's pretty rare that we're not done in the bathroom by 9am anyway (plus - gotta give the neighbours a show every now and then 😉).

### Randomly Failing

Every now and then the blinds don't work. Most of the time it's the Soma that fails to respond so we'll find the blinds still open when going to bed (annoying) or it just never opened (less annoying), meaning I either yell at the Google Home to trigger the blind or get out my phone and use the HA app. I haven't dug into logs to work out what might be the problem, instead I may just add an automation that checks if the blind didn't open/close to then rerun the command.

I managed to pick up two more Axis Gear's for the kids bedrooms and it took about three months to get them working. I mounted them on the wall but they weren't being detected in the Axis app. Thinking they might be DOA I used a Bluetooth packet sniffing app and found that they _were_ broadcasting on Bluetooth when being put into pairing mode, it was just my phone that couldn't find them. I contacted Axis support, and after a lot of back and forth (yay timezones and holidays - was about six weeks of back and forth!) they concluded that they were probably on a really outdated firmware and the Android app can't find it, instead I'd need to try the iOS app... but I don't have any iOS devices... so I had to wait until we had someone over with an iPhone who was willing to let me install stuff on their phone (I don't get why but apparently the iOS app can detect a wider range of firmware versions or something). I managed to find a ~~victim~~ volunteer and the Gear's appeared immediately in the iOS app, I upgraded their firmware and then they connected to the Android app. I was then able to enable smart home mode and bring them into my ZigBee network (the fact I have to use the app for that is annoying, because if the app ever gets removed from the store I'm stuffed), well, one of them works and one of them doesn't. I've got one that I need to keep trying to pair as it's reporting that it's connected but it fails to respond to commands (at least it can be manually controlled via the touch bar).

## Final Thoughts

We've now got four blinds operating across two different ecosystems and the conclusion I've drawn on motorised blinds is that this is a space that's not approachable to the average home owner.

When they work, they are great, in the morning one of our kids blinds opens and it'll close again at night, the other doesn't without manual control and it's going to take me a while to work out the fix for it (and it might mean I have to buy more ZigBee routes as the network might be too stretched for it).

And the price-point makes it very hard to get into, you either have to be willing to invest a few hundred dollars and accept that some of that will be a lost investment, or you have to hope you back a winner first time.

### Soma Smart Shades 2

As I said, these were one of the top contenders for me when I first started researching motorised blinds but having used them, they aren't for me.

While I thought the lack of external buttons would be great as it meant a smaller, sleeker unit, it fails the family test - there's no way to control it without the app. Combine this with the need for a hub to bring it into HA (or have any remote control), the cost starts to blow out.

Add on top that it randomly just doesn't respond when it should so it's off the list of future investments. I probably won't remove it, at least not for the time being as I don't have an alternative device, so instead I'll have to work around the problem with more software solutions.

### Axis Gear

I have mixed feelings about this device. I like the design of it, how easy it is to use and that it integrates easily (well, easily-ish) into my ZigBee network. But when it doesn't work, it's a real pain. While writing this I noticed that both of the kids blinds failed to close tonight, one is reporting unavailable and the other is saying the battery is flat (despite the solar panel being plugged in). I _think_ my ZigBee network is too thin at that part of the house so I may need another router, and I'll have to dig into a battery problem _goes off to find the multimeter to test 12 AA batteries_.

But **the** most frustrating part is they are no longer in production! The company has made a new device, [Ryse](https://www.helloryse.com/), which I don't think looks as good. It's also dropped ZigBee support and the solar panel, meaning that you either need to have a wall socket nearby or buy their battery pack **plus** their hub, which doesn't seem to have HA support anyway.

Yay, another dead end.

## Wrapping Up

Motorised blinds really appealed to me initially, but now having tried them out I'm rather... whelmed. I'm not overwhelmed by them nor am I underwhelmed, I'm just... whelmed.

Maybe the ones that go into the blind itself rather than control the chain are a better investment, but with an entry price of around $200 _per blind_, that's a heavy investment to do our whole house.

So, should you add it to your smart home priority list? Well, it depends how much money and effort you're willing to invest in experimenting. Be warned, at one point I was using Wireshark to debug a BLE traffic dump... yeah, it got rough (I didn't end up needing to do that, hence I didn't mention it before).
