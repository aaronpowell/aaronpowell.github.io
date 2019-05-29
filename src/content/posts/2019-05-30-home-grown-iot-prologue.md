+++
title = "Home Grown IoT - Prologue"
date = 2019-05-30T08:06:52+10:00
description = "Some beginning words on the Home Grown IoT project I've been working on for a while"
draft = false
tags = ["fsharp", "iot"]
series = "home-grown-iot"
series_title = "Prologue"
+++

I've always been a bit of a hardware tinkerer. Growing up my dad would bring home old radios, telephones and other electronics from work and hand them to me along with a screwdriver and multimeter and let me poke around with them. I had an electronics kit that had all kinds of sensors, lights and switches that you could connect together to make whatever you wanted to make. We had breadboards, wires, soldering irons, resistors, capacitors, LED's, switches and everything in between to make random little pieces of electronics.

When we got our first computer, a 486 66 DX (with a turbo button!), I pulled it apart, with strict instruction to a) know where the cables went and b) no soldering irons! Helped set up our home token ring network and eventually wire our house with ethernet.

So when cheap, consumer-grade IoT became prevalent with Raspberry Pi's and Arduino's it seemed only natural that I'd grab some myself and play around with them.

And I did what everyone does with an IoT device...

![Getting an Arduino LED to Blink; And Then Losing Interest; Looks like it's back to pixels for you!](/images/home-grown-iot/01-001.png)

<cite>[Source @ThePracticalDev](https://github.com/thepracticaldev/orly-full-res/blob/master/gettinganarduinoledtoblink-big.png)</cite>

Seriously, I have a Pi that is _somewhere_ in my house, I'm unsure where though, it's just in a box somewhere. Similarly, I have a bunch of NodeMCU chips which have 4MB memory, 16 pins and wifi that just sit on a shelf gathering dust.

The problem I have when it comes to IoT projects is that I just have no idea what to make, and that is half the battle.

## Sparking an Idea

At the end of 2018 my wife and I decided to get solar panels put on our roof. We got a total of 18 panels that have a peak output of 5.5kWh, more than enough energy production for our home needs. We also got an inverter, an [ABB UNO-DM series](https://new.abb.com/power-converters-inverters/solar/string/single-phase/uno-dm-3-3kw-4-0kw-4-6kw-5-0kw-tl-plus) inverter to connect the panels to our mains and push excess power generated back to the grid.

The interesting thing about inverters these days is that pretty much all of them come with a built-in wifi endpoint, which of course ours does. I connect it to the wifi and I am presented with some dashboards.

![System Overview](/images/home-grown-iot/01-002.png)

![Generation Summary](/images/home-grown-iot/01-003.png)

Well, that's pretty nifty isn't it?

But I'm a dev at the end of the day, so what do I do next? Fire up the dev tools of course!

![Finding network requests](/images/home-grown-iot/01-004.png)

And what I found was that the dashboard is just an AngularJS application over a series of HTTP endpoints secured with basic authentication. What's more is that the data is just basic JSON payloads!

![Example network respose](/images/home-grown-iot/01-005.png)

## My Home Grown IoT Project

I now have something sitting on my home network that is generating interesting data, and what's more it's running a web server that I can connect to using an authentication model I can implement with very little effort.

This gives me something to aim for. My goals for the project were as follows:

* Create a solution that can run on a Raspberry Pi to pull the data from my inverter
* Store the data somewhere
* Create my own dashboards to view the power generated
* See what else is interesting in the data

Since this would be more first foray into a proper IoT project I wanted to _do it right_. I wanted an easy local development experience, including being able to develop when I'm not at home; I want it to be easy to deploy; I want to avoid exposing my Pi (or inverter) to the public internet.

So over the last few months I've slowly chipped away at it and have finally deployed [Sunshine](https://github.com/aaronpowell/sunshine), my solar panel monitoring system! The code is up on GitHub if you wish to have a poke around, but it's designed around _my_ setup, so it's not really a general purpose solution. At its core it's a .NET Core application (written in F#) that runs on Docker, using [Azure IoT Hub](https://docs.microsoft.com/en-us/azure/iot-hub/?{{< cda >}}) for device connectivity, [Azure IoT Edge](https://docs.microsoft.com/en-us/azure/iot-edge/?{{< cda >}}) to deploy with [Azure Pipelines](https://azure.microsoft.com/en-us/services/devops/pipelines/?{{< cda >}}) and data processing with [Azure Functions](https://azure.microsoft.com/en-us/services/functions/?{{< cda >}}).

Throughout this series I'm going to go through how I went about building the project, the technologies I've used, the decisions I made and why I made them. I've learnt a lot building this (I've overhauled it majorly a few times 🤣) and hopefully it'll give you some pointers on where to go with your own IoT projects.