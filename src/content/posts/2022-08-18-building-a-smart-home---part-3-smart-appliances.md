+++
title = "Building a Smart Home - Part 3 \"Smart\" Appliances"
date = 2022-08-18T06:21:32Z
description = "It's time to start automating, and let's start with our appliances"
draft = false
tags = ["HomeAssistant", "smart-home"]
tracking_area = "javascript"
tracking_id = ""
series = "smart-home"
series_title = "\"Smart\" Appliances"
+++

After exploring a bit of the thought process on the _how_ and _why_ with my journey to a smart home, it's time to look at a _what_, and for that I'm going to tackle one of the problems I identified in the last post:

> Forgetting the washing machine was done to hang the laundry out

To give a bit of context, my home office is upstairs while the laundry is downstairs, and what this means is that I generally don't hear when the appliances finish their cycle, and if I don't realise until half way through the day, then it's likely that our washing isn't getting dry unless it goes in the dryer (and because we don't have solar in yet, I try to reduce the amount of time we use that as it's expensive!). Queue sad Aaron.

While yes, there's a whole heap of wifi-enabled appliances, we got new ones with the new house and they are not wifi-enabled, so going out and buying a whole new set is not something that's in the budget.

So, how do we tackle this?

## Is this thing on

How do we know if an appliance is running? The simplest way to do that is looking at whether it's using power or not and apply some basic logic of `if using power - state:running, if not using power and last state:running - state:finished`.

This means we're going to need to figure out whether the appliance is drawing power and to do that we'll get some smart switches to do power monitoring. There's a heap of switches on the market, across all protocols from wifi to ZigBee, but since I'm not ready to dive into the world of ZigBee or Z-Wave yet, I went with the [TP-Link Kasa KP115](https://www.tp-link.com/au/home-networking/smart-plug/kp115/) because they were easy to get (I got them from Bunnings, but it seems Bunnings no longer stocks them), they have a very small profile, and they connect to Home Assistant using the [TPLink Kasa integration](https://www.home-assistant.io/integrations/tplink).

I grabbed myself three of them (washing machine, dryer and dishwasher), and set them up in the Kasa app.

![Plugs in Kasa](/images/2022-08-18-building-a-smart-home---part-3-smart-appliances/01.png)

_I did setup a Kasa Cloud account for this but I've since learnt that they do support local control, so you might not need to do that, but I haven't had time (or the motivation) to go back and reconfigure the setup._

With the devices on the network it was only a matter of time until Home Assistant picked them up and then they were available as entities for me:

![Plugs available in Home Assistant](/images/2022-08-18-building-a-smart-home---part-3-smart-appliances/02.png)

Great, time to see what it can do.

## Looking at the data

When the device was added to Home Assistant it gave me several new sensors. This is the view of my washing machine (which ran a cycle earlier today):

![Sensors available](/images/2022-08-18-building-a-smart-home---part-3-smart-appliances/03.png)

From an automation standpoint, the **Current Consumption** is going to be most relevant, as that's reporting the Watts that is being drawn through the plug. We can get a good view of this over time:

![Graph of current consumption over today's cycle](/images/2022-08-18-building-a-smart-home---part-3-smart-appliances/04.png)

I reckon we can work with this. So, armed with our insights, let's make an automation.

## Automation - take 1

The first automation I created was very simplistic:

```yaml
alias: Is washing done
description: ""
mode: single
trigger:
  - platform: state
    entity_id:
      - sensor.washing_machine_current_consumption
    to: "0"
condition: []
action:
  - service: notify.mobile_app_aaron_s_phone
    data:
      message: Washing done
```

This automation will run when the washing machine stops drawing power and that seems right doesn't it? If it's not drawing power, it's done, isn't it?

Well, the blow up on my phones notifications would suggest otherwise... turns out that this automation works, but doesn't work quite right. Let's go back to the graph from before.

![Graph of current consumption over today's cycle](/images/2022-08-18-building-a-smart-home---part-3-smart-appliances/04.png)

Do you see the problem?

The problem is I'm making a false assumption that the power draw is consistent, when in reality, power goes up and down, depending on the phase of the wash cycle, and as a result, we hit the _zero power draw_ trigger with a lot of false positives.

## Automation - take 2

So it turns out that what I really should be doing is using the `for` parameter of the trigger and have it say `if the power is zero for <some duration> - finished`. Because I'm sure this is a solved problem, I decided to search the Home Assistant forms and came across [this blueprint](https://gist.github.com/sbyx/6d8344d3575c9865657ac51915684696), which you can install here:

[![Open your Home Assistant instance and show the blueprint import dialog with a specific blueprint pre-filled.](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgist.github.com%2Fsbyx%2F6d8344d3575c9865657ac51915684696)

If you've not used a blueprint, it's a pre-configured automation in which you just plug in the relevant values, and this one is designed around _appliance finished_ scenarios. Once the blueprint is imported, you can use it as the base for a new automation:

![Blueprint starting point](/images/2022-08-18-building-a-smart-home---part-3-smart-appliances/05.png)

The other thing I like about this blueprint is that it has both _start_ and _stop_ actions that can be configured, so when the appliance crosses the threshold to be considered as started you can do _something_ and then when it's completed do something else.

![Blueprint starting point](/images/2022-08-18-building-a-smart-home---part-3-smart-appliances/06.png)

Here's what the automation now looks like, and if we hit save, it's good to go (and my phone won't get spammed!).

## Bonus points - tracking state

Mainly for fun, but also because I think it might be useful in the future, I decided to expand the actions of the automation to give more rich information about the appliance, specifically, track when the appliance last started, and what its current state is.

This will mean I can make my dashboard look like this:

![Blueprint starting point](/images/2022-08-18-building-a-smart-home---part-3-smart-appliances/07.png)

For this, I created two inputs, [date time](https://www.home-assistant.io/integrations/input_datetime/) and [text](https://www.home-assistant.io/integrations/input_text/). Next, in the _on start_ phase of the blueprint, I set the values of those to their relative states, and then when it's finished, I change the text input from `Running` to `Finished`.

Here's the complete automation:

```yaml
alias: "Appliance finished: Washing"
description: ""
use_blueprint:
  path: >-
    sbyx/notify-or-do-something-when-an-appliance-like-a-dishwasher-or-washing-machine-finishes.yaml
  input:
    power_sensor: sensor.washing_machine_current_consumption
    actions:
      - service: notify.mobile_app_aaron_s_phone
        data:
          message: Washing finished!
          title: 🧺 Laundry
      - service: input_text.set_value
        data:
          value: Finished
        target:
          entity_id: input_text.washing_machine_enriched_status
      - if:
          - condition: time
            before: "19:00:00"
            after: "07:00:00"
            weekday:
              - mon
              - tue
              - wed
              - thu
              - fri
        then:
          - service: tts.google_translate_say
            data:
              entity_id: media_player.whole_house
              message: Washing finished
        else: []
    pre_actions:
      - service: input_text.set_value
        data:
          value: Running
        target:
          entity_id: input_text.washing_machine_enriched_status
      - service: input_datetime.set_datetime
        data:
          datetime: "{{ now().strftime('%Y-%m-%d %H:%M:%S') }}"
        target:
          entity_id: input_datetime.washing_machine_last_started
```

Setting the `last_started` requires a value to be set using a template, which you can only do in YAML, but it just grabs `now()` and formats it for storage.

Also, for fun, I have it announce on all our Google Homes when the washing finishes using the Text To Speech (TTS) service, but that's wrapped in a condition that only allows it Monday - Friday between 7am and 7pm, so not to wake anyone. Ask me how I knew to add that 😅!

## Summary

Here we've seen how I turned a dumb appliance into a smart one, and done a small quality of life improvement.

By using power monitoring and a simple automation, we can determine when an appliance is running, and by tracking that, work out when it's finished to give you the feedback needed.

I've actually had this automation running for a few months now (I originally set it up at our rental), and it's **by far** the most relied upon one that I have.

Sure, there has been a few hiccups - the Kasa plugs occasionally lose connection to Home Assistant (sometimes they go into 'local only' mode but I'm not sure what triggers that), but since I put them on fixed IP's they've been better.

I've got some ideas on how to improve the notifications more, like if I'm out, don't send the notification until I'm home, but that's well down the priority list. For now, this is doing the job nicely.
