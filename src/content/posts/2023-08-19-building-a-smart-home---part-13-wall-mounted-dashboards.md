+++
title = "Building a Smart Home - Part 13 Wall Mounted Dashboards"
date = 2023-08-18T23:05:18Z
description = "Let's take our smart home to the next level with a wall mounted dashboard!"
draft = false
tags = ["HomeAssistant", "smart-home"]
tracking_area = "javascript"
tracking_id = ""
series = "smart-home"
series_title = "Wall Mounted Dashboards"
+++

![Dashboard time!](/images/2023-08-19-building-a-smart-home---part-13-wall-mounted-dashboards/001.png)

I finally took the plunge and did the thing I'd been wanting to do for a while now. I built a wall mounted, well fridge mounted, dashboard for my smart home. I've been wanting to do this for a while now, but I've been putting it off because I didn't want to spend the money on a tablet.

After all, I looked at this problem just the same as I look at any other addition to the smart home, experiment first, then buy. So, what did I have around that I could use? Well, I have a few old Surface Pro devices laying around and I figured that a Surface Pro 4 would be a good candidate for this experiment. I mean, it's a tablet, it's got a screen, a battery, what more do I need!

There's plenty of videos out there on how to do a dashboard, but every one that I've seen is using an Android tablet of some variety and here I am with a Windows device, so I figured I'd document my journey.

## The Software

There are three different approaches I explored for running Home Assistant as a dashboard, the simplest option is to just run Edge full screen and calling it a day. The next option is to install the website as a PWA, but that's a bit annoying because I don't have an SSL certificate for my local Home Assistant instance, so it shows a "not secure" banner across the top of the screen (and since it's running locally I want to use the local address rather than my Nabu Casa endpoint). The final option is to install the Home Assistant app from the Android store using [Windows Subsystem for Android](https://learn.microsoft.com/windows/android/wsa/), aka WSA.

WSA is an interesting idea, I think it might be the best option, but for the moment I'm just running the browser in full screen mode and it's going well enough - although I have had a few instances where the browser hasn't refreshed, so I've had to manually refresh the page.

## HASS.Agent

The other core piece of software I'm using is [HASS.Agent](https://github.com/LAB02-Research/HASS.Agent), which is a "service" that you run to provide a local API for interacting with Home Assistant, and to feed sensor data back from the device. It can also be used to run commands on the device, exposing these commands as buttons or similar HA entities.

We'll come back to HASS.Agent later in the post 😉.

## Configuring a user account

Here's an interesting conundrum, unlike using something like an iPad or Android tablet, Windows is really designed to be a multi-user operating system. So, how do we configure a user account for our dashboard? Well, I'm glad you asked!

My first though was to use [Windows Kiosk Mode](https://docs.microsoft.com/windows/configuration/kiosk-single-app). This really seems like the perfect solution, it's designed for exactly this use case, but there was a problem, it can only run a fairly restricted style of app, and while it would run Edge, it seemed that it would lose the authenticated session to HA - which is not really ideal as you don't want to be putting in credentials all the time.

The other problem that I hit with Kiosk Mode is that I couldn't get it to run HASS.Agent, which I kind of need.

Since it's a Windows 11 device, it really wants me to use a Microsoft account, but that's not ideal - I don't really want to setup another Microsoft account, nor do I want my account to be logged in for anyone to use! So, I created a local account with minimal permissions and I disabled the need for it to have a password or PIN on login, as it's not like you want to be putting in a PIN constantly.

So I configured HASS.Agent to start on boot, logged into Home Assistant in Edge and it's ready to go.

## Dashboard on, dashboard off

I know that screen burn-in isn't really _a thing_ like it was in the past, but that doesn't meant that I want the screen on 24/7, at the very least, that's not really a great use of energy. So how are we going to manage this?

### The built-in way

Conveniently, HASS.Agent has [commands](https://hassagent.readthedocs.io/en/latest/commands/command-basics/) as a feature, which allows you to create a button/switch/etc. in HA that will _do something_ on your device. There's a bunch of built in ones, such as to turn the screen on and off. Success!

Well, it would be but it wasn't. While I'm not really sure what the underlying Windows issue is, what I have observed is that the way HASS.Agent performs the wake-up is by issuing a `SendKey` command (specifically using [this API](https://learn.microsoft.com/dotnet/api/system.windows.forms.sendkeys?view=windowsdesktop-7.0)) that presses `KEY_UP` [according to the source code](https://github.com/LAB02-Research/HASS.Agent.Shared/blob/main/src/HASS.Agent.Shared/HomeAssistant/Commands/KeyCommands/MonitorWakeCommand.cs). The problem is that when you sleep the screen with the built-in [`Monitor Sleep` command](https://github.com/LAB02-Research/HASS.Agent.Shared/blob/main/src/HASS.Agent.Shared/HomeAssistant/Commands/InternalCommands/MonitorSleepCommand.cs) the Surface Pro doesn't respond to `SendKey` commands.

I tried a bunch of different ways to diagnose this, including observing what the Windows Event Viewer reports at a system level on the sleep operation, but there was nothing that indicated what was _wrong_.

But there is another way in which a Windows device can sleep the screen, and that's when you have a screen idle timeout after the duration set in the Power Management.

What I observed with this is that when the screen turns off due to an idle timeout you can issue a `SendKey` command and wake the screen up. I did some more testing against Event Viewer to see if I could see what was different between idle timeout and sending the `WM_SYSCOMMAND` and I could not find anything different other than the message indicating that the screen was turned off because of idle timeout vs `WM_SYSCOMMAND`... so 🤷.

This means we're going to need to find a different solution to managing the screen turning off.

### The hacky way

With all this knowledge we can look at a hacky solution, hack the power config settings! These settings allow you to control when the device will turn off the screen (and turn itself off) when on battery or AC power.

While you'd normally do this via the Settings UI, you can also use the `powercfg` command line too, which means we can make a custom command in HASS.Agent to execute that. I created two commands, one that will disable the idle timeout completely and one that sets a short idle timeout:

- Disable timeout: `powercfg /change monitor-sleep-ac 0`
- Enable timeout: `powercfg /change monitor-sleep-ac 1`

With these commands we're changing `monitor-sleep-ac`, the idle timeout of the monitor when plugged in (which it always will be). When it's set to `0` then it won't timeout, otherwise it'll timeout after 1 minute.

### Adding an automation

Now that we've figured out how we can turn the screen on and off, it's time to make an automation that uses these. I have an occupancy sensor in the kitchen where the dashboard is to be mounted, so I'm going to have it turn the screen on if occupancy is detected with the `MonitorWake` command in HASS.Agent and then disable the idle timeout, and when occupancy has been cleared for 5 minutes, enable the 1 minute timeout.

Here's the YAML for the two automations:

```yaml
alias: "Kitchen Dashboard: Enable sleep"
description: ""
trigger:
  - platform: state
    entity_id:
      - binary_sensor.occupancy_living_room
    from: "on"
    to: "off"
    for:
      hours: 0
      minutes: 5
      seconds: 0
condition:
  - condition: state
    entity_id: input_boolean.kitchen_dashboard_sleep_enabled
    state: "on"
action:
  - service: button.press
    data: {}
    target:
      entity_id: button.kitchendashboard_enablesleep
  - service: input_boolean.turn_off
    data: {}
    target:
      entity_id: input_boolean.kitchen_dashboard_sleep_enabled
mode: single

alias: "Kitchen Dashboard: Wake up"
description: ""
trigger:
  - platform: state
    entity_id:
      - binary_sensor.occupancy_living_room
    from: "off"
    to: "on"
condition:
  - condition: state
    entity_id: input_boolean.kitchen_dashboard_sleep_enabled
    state: "off"
action:
  - service: button.press
    data: {}
    target:
      entity_id: button.kitchendashboard_disablesleep
  - service: input_boolean.turn_on
    data: {}
    target:
      entity_id: input_boolean.kitchen_dashboard_sleep_enabled
  - service: button.press
    data: {}
    target:
      entity_id: button.kitchendashboard_monitorwake_localuser
mode: single
```

I've also put in there an `input_boolean` helper to track if the sleep is enabled/disabled on the device, as this means that we can avoid running the wake up automation if the screen didn't turn off - basically when occupancy was cleared but hadn't been cleared for long enough to trigger the "enable sleep" automation.

Now as you enter the area the screen will turn on and sleep is disabled, then when you leave the area for 5 minutes the screen will enter the idle mode.

## Mounting

Because of the layout of our kitchen I don't really have any wall space to mount the tablet in a convenient location (the space I would use has two pin boards for the kids artwork, school notices, etc.), so instead I mounted it on the fridge:

![Dashboard time!](/images/2023-08-19-building-a-smart-home---part-13-wall-mounted-dashboards/001.png)

On the back of the device I have two 3M velcro picture hanging strips, each rated to like 3kg which is probably an overkill but better safe than sorry! The reason I went with these strip type is so that I can easily remove the device if I need to attach a keyboard and do anything with it. I was considering getting some heavy-duty magnets instead and fixing them to the back, but this was a nice, cheap initial solution.

The power cable snakes from the side of the fridge, and since it's on the right door of our fridge the cable only just pops out, which works well enough.

I did mount it is just the right location that when the door of the fridge is opened it won't hit the wall of the fridge nook... just. But you know what they say, measure once, cut twice (or something like that...).

## Conclusion

All in all, I'm pretty happy with how this has turned out and my wife _doesn't hate it_, so, win, and it was a good way to utilise some existing hardware that I had rather than going out and purchasing a new tablet just for this.

The Surface Pro 4 just about the right size for our fridge, it takes up the space well without looking either too big or too small, but I can imagine that if it was on a wall it might look more out of place so if I do ever get to the point of being able to wall mount something, I'd possibly look at a different device.

HASS.Agent is a nifty little addition and I like how well it works for what I need in controlling the device. I have some other sensors that I've exposed about the state of the Surface Pro, such as whether it's charging or not, and I'm contemplating using a smart plug to control the battery charge/discharge rather than having it constantly charging, but I know that the battery of this one is not great at the moment, so I feel like it'd probably find itself going flat pretty quickly and the plug would flip-flop a lot.

One thing I do wish is that this was running on ethernet rather than wifi, as then I could use Wake on LAN, allowing the device the actually sleep (and thus better handle power management) but I don't have a convenient ethernet port, plus it would look rather ugly. I explored using WoL with wifi but it doesn't seem to work.

In my next post I'll talk about the dashboard itself and what I'm doing to make something that's better designed for the location, rather than the one I use on my phone.
