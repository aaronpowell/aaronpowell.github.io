+++
title = "Building a Smart Home - Part 16 Seasonal Automation's"
date = 2024-09-01T04:03:16Z
description = "Spring has sprung here in Australia and it's time for the house to adapt"
draft = false
tags = ["HomeAssistant", "smart-home"]
tracking_area = "javascript"
tracking_id = ""
series = "smart-home"
series_title = "Seasonal Automation's"
+++

In the [2024.4 release](https://www.home-assistant.io/blog/2024/04/03/release-20244/) of Home Assistant, the [Labels](https://www.home-assistant.io/docs/organizing/labels/) feature was introduced. This feature allows you to add labels to entities, areas, and automations. This is a great feature for organisation as you can apply as many as you want and then perform actions based on those labels.

Previously, I'd tackled this style of organisation (and the organisation that Categories introduced) by putting keywords into the names of my automations, and while this worked, it wasn't as clean as I would have liked.

One of the things I setup with this is adding season labels, **Spring**, **Summer**, **Autumn**, and **Winter**, and putting them on automations that are only relevant for that season. While this helps with the visual organisation, there's also the benefit of automating automations based on the season. For example, we have motorised blinds in our house, and in summer, if the temperature of the room exceeds the desired threshold, we'll automatically close them, but in winter, we'll leave them open as a) it's unlikely they'll exceed the threshold and b) we want the sun to help heat the room.

## Automating Based on Season

Firstly, we need to know what season it is, and we can do that using the [Seasons](https://www.home-assistant.io/integrations/seasons/) integration. This integration will create a sensor that will tell you what season it is based on the date. With the integration setup, we can access `sensor.season` and trigger automations based on value change.

```yaml
alias: Toggle seasonal automations
description: ""
trigger:
  - platform: state
    entity_id:
      - sensor.season
condition: []
action: []
```

I'm going to use the `choose` action to determine what season it is and then trigger the relevant steps:

```yaml
action:
  - choose:
      - conditions:
          - condition: state
            entity_id: sensor.season
            state: winter
        sequence: []
```

In the `sequence` block, we're going to run `automation.turn_off` and `automation.turn_on` actions to turn on and off the relevant automations.

```yaml
action:
  - choose:
      - conditions:
          - condition: state
            entity_id: sensor.season
            state: winter
        sequence:
          - metadata: {}
            data:
              stop_actions: true
            target:
              label_id:
                - summer
                - spring
                - autumn
            action: automation.turn_off
          - metadata: {}
            data: {}
            target:
              label_id: winter
            action: automation.turn_on
```

Notice that we pass in the `label_id` of the labels we want to turn off and on. This is a list, so you can pass in as many as you want, and it means that we can have automations that are relevant for multiple seasons.

Repeat this for all four seasons then with our automations labeled appropriately, we can have the house adapt to the season automatically.

## Conclusion

This is a crazy simply solution to something that I was previously doing manually, either by having a whole heap of conditions within automations to handle the concept of seasonality, or by manually turning on and off automations (which of course I'd forget to do). This is a great example of how a simple feature can have a big impact on the usability of Home Assistant.

The `automation.turn_off` and `automation.turn_on` actions with labels as the target is a powerful feature that I use for other use-cases, such as disabling certain automations overnight (mostly motion sensors) or toggling automations for when we have house sitters (which you can read more about in [Part 11 of this series]({{<ref "/posts/2023-04-27-building-a-smart-home---part-11-house-sitter-mode.md/">}})).

If you haven't tried Labels yet, I highly recommend you do, as it's a great way to organise your Home Assistant setup, and a nifty way to automate your automations.
