--- cson
title: "The settings suck"
metaTitle: "The settings suck"
description: "Settings in Windows 8 XAML suck. Period."
revised: "2012-09-11"
date: "2012-09-14"
tags: ["xaml","windows8","rant"]
migrated: "true"
urls: ["/xaml/settings-suck"]
summary: """

"""
---
Let me say one thing first, the Settings Pane in Windows 8 XAML applications is shit. Utterly shit. I have no idea how something _so important_ to any application could be done this badly.

Ok, rant over.

# Settings problems

My first Windows 8 application I wrote using WinJS so a lot of my expectations on how settings worked in Windows 8 XAML was based off of that experience. Unfortunately from the looks of it the two teams had *very* different ideas on whether settings were important or not and thus we have drastically different experiences.

Here's the problems I've hit so far:

* Setting up settings, if you do this "too early" (ie - before the app has fired off its Activated event) it crashes as the settings pane doesn't exist
* There's no built-in settings control
* Since there's no control there's no way to navigate to a particular settings pane
* You use an event handler to register settings panes

With the exception of the last point (which sucks in both platforms) these are problems specific to XAML based Windows 8 applications. What absolutely baffles me is that there's no settings stuff built into the platform, seriously, did no one think that that **would be important**? I mean it's not like you [need to have a section in settings about privacy or anything][1].

# Problem 1 - No built in control

So let's start with the big one, the lack of built in control. It's reasonably trivial to roll you're own, as long as you take into account the following things:

* RTL vs LTR displays will open the settings on different sites, make sure you know which side the system settings are opening from and make your settings come from that site as well
* You'll want it to animate in, check out the settings on the start screen, they have a nice little fly in so you'll want to replicate that yourself
* You'll want a back button so your user can easily flick back to the overall settings pane
* Make sure it's in the allowed widths, either 346 or 646 in width

If you want to look into creating it there's a blog [here][2] or [the official sample][3] that covers all the steps you'll be wanting to go through.

But realistically don't roll your own, check out the [Callisto][4]. It has a built in settings flyout that works very similar to the one in WinJS which is ace. Maybe the next version will just roll that into the product.

# Problem 2 - Wiring up settings




  [1]: http://msdn.microsoft.com/en-us/library/windows/apps/hh694083.aspx#4.1.1_Your_app_must_have_a_privacy_statement_if_it_collects_personal_information
  [2]: http://blog.jerrynixon.com/2012/08/how-to-create-windows-8-settings-pane.html
  [3]: http://code.msdn.microsoft.com/windowsapps/App-settings-sample-1f762f49
  [4]: https://github.com/timheuer/callisto