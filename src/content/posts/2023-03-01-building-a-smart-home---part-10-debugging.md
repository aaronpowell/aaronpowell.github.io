+++
title = "Building a Smart Home - Part 10 Debugging!"
date = 2023-03-01T07:20:28Z
description = "You know what's fun? Having to debug your own home..."
draft = false
tags = ["HomeAssistant", "smart-home"]
tracking_area = "javascript"
tracking_id = ""
series = "smart-home"
series_title = "Debugging!"
+++

When you get down to it, a smart home is partially a software solution, and like any good software solution there are bugs. I've recently been spending some time "debugging" my home, and I thought I'd share some of the things I've learned.

## Case sensitivity

For home security, I have an automation that runs every night when my phone goes on the wireless charger to close the garage door and gate. This is to ensure that if I forget to close them, they will be closed before I go to bed. Here's part of that automation:

```yaml
alias: "Security: End of day"
description: ""
trigger:
  - platform: state
    entity_id:
      - sensor.aaron_s_phone_charger_type
    to: wireless
condition:
  - condition: time
    after: "21:00:00"
  - condition: state
    entity_id: group.persons
    state: Home
```

I didn't think much of it, I just assumed the automation was working, but one day I noticed that the automation hadn't run any of the actions. That's weird, it says it ran, so I had a look at the traces for the automation and I found that it bailed out on the `condition`.

The `group.persons` entity is defined as so:

```yaml
group:
  persons:
    name: All People
    entities:
      - person.aaron
      - person.mel
```

And I knew that we were both home, but looking back through the history it turned out the automation had _never_ run. Ok, we've got a bug to fix. Having a look at the trace log for the automation, I noticed this when it hit the `condition`:

```
Result:
result: true
state: home
wanted_state: Home
```

_sigh_ I had a typo in the automation, I had `Home` instead of `home`. I fixed the typo and the automation started working as expected... well, it actually uncovered another bug.

## Why is the gate open

A few posts ago I wrote about [controlling out motorised gate]({{<ref "/posts/2023-01-16-building-a-smart-home---part-7-motorised-gate.md">}}) and it's basically the same approach we have for the garage door (the motor operates in a very similar manner).

Let's go back to the automation from the last section, and look at the actions:

```yaml
alias: "Security: End of day"
description: ""
trigger:
  - platform: state
    entity_id:
      - sensor.aaron_s_phone_charger_type
    to: wireless
condition:
  - condition: time
    after: "21:00:00"
  - condition: state
    entity_id: group.persons
    state: home
action:
  - service: cover.close_cover
    data: {}
    target:
      entity_id:
        - cover.garage_door
        - cover.roller_gate
  - service: lock.lock
    data: {}
    target:
      entity_id: lock.0x000d6f0010c98b1e
mode: single
```

It does two things, calls `cover.close_cover` to close the garage and gate, and `lock.lock` to lock the front door. I can see in the trace that they run as expected, and thankfully the front door was locked, but why are the gate and garage door open?

Well, it turns out that the `cover` entities I had for both had a bug in them. I had defined them as so:

```yaml
- platform: template
  covers:
    garage_door:
      device_class: garage
      friendly_name: "Garage Door"
      value_template: >-
        {% if is_state('binary_sensor.garage_door_contact','on') %}
          Open
        {% else %}
          Closed
        {% endif %}
      open_cover:
        - service: switch.turn_on
          data:
            entity_id: switch.garage_door
      close_cover:
        - service: switch.turn_on
          data:
            entity_id: switch.garage_door
      stop_cover:
        service: switch.turn_on
        data:
          entity_id: switch.garage_door
      icon_template: >-
        {% if is_state('binary_sensor.garage_door_contact','on') %}
          mdi:garage-open
        {% else %}
          mdi:garage
        {% endif %}
```

Can you see the problem? The `close_cover` (and `open_cover` for that matter) are defined to call `switch.turn_on` which triggers the Shelly to turn on and start the motor. The problem is, it will do this without first checking _should it do it_, the service doesn't know the state of the garage or gate, that's provided by a `binary_sensor` (from an Aqara contact sensor) and is only visually represented by the `value_template` and `icon_template`.

To fix this I had to change the `close_cover` (and `open_cover`) to have a condition that checks the door state first:

```yaml
- platform: template
  covers:
    garage_door:
      device_class: garage
      friendly_name: "Garage Door"
      value_template: >-
        {% if is_state('binary_sensor.garage_door_contact','on') %}
          Open
        {% else %}
          Closed
        {% endif %}
      open_cover:
        - condition: state
          entity_id: binary_sensor.garage_door_contact
          state: "off"
        - service: switch.turn_on
          data:
            entity_id: switch.garage_door
      close_cover:
        - condition: state
          entity_id: binary_sensor.garage_door_contact
          state: "on"
        - service: switch.turn_on
          data:
            entity_id: switch.garage_door
      stop_cover:
        service: switch.turn_on
        data:
          entity_id: switch.garage_door
      icon_template: >-
        {% if is_state('binary_sensor.garage_door_contact','on') %}
          mdi:garage-open
        {% else %}
          mdi:garage
        {% endif %}
```

Now if the sensor returns "off", which means the door is open, it can call `switch.turn_on` and close the garage, but if it's "on" (the door is closed) it won't call `switch.turn_on` and the garage door won't move.

No more waking up to the garage door open!

## Why did that light turn on

I've talked at length about [how I control our fans]({{<ref "/posts/2022-10-24-building-a-smart-home-part-4-ceiling-fans.md">}}) and to make them better I [added some Shelly's]({{<ref "/posts/2023-01-05-building-a-smart-home---part-6-lighting.md">}}) so now the ceiling fans pretty much don't get turned off, from a power standpoint, we just send the right RF signals.

Well, the other day at 1am my wife and I were rudely woken up to the light in our bedroom being on at fully brightness. Queue me fumbling around to grab my phone, open the HA app, finding it not responding for some reason and having to get out of bed to turn the light off (and wait the 10s for it to turn off - thanks to an automation).

This wasn't the first time I'd noticed the fan light in our room turning on at random times and only the second time that it'd done it in the middle of the night to wake us up, so it was time to figure out what was going on.

When I was awake in the morning I went to the HA logs and found that the light was turned on by this automation:

```yaml
alias: "Lighting: Toggle parents light on switch change"
description: ""
trigger:
  - platform: state
    entity_id:
      - binary_sensor.parents_bedroom_channel_1_input
      - binary_sensor.parents_bedroom_channel_2_input
 condition: []
action:
  - if:
      - conditions:
          - condition: template
            value_template: "{{ is_state(light, 'on') }}"
            alias: Light on
        then:
          - if:
              - condition: time
                after: "21:00:00"
            then:
              - delay:
                  hours: 0
                  minutes: 0
                  seconds: 10
                  milliseconds: 0
          - service: light.turn_off
            target:
              entity_id: "{{ light }}"
    else:
      - service: light.turn_on
        target:
          entity_id: "{{ light }}"
mode: single
variables:
  light: >-
    {{ 'light.parents_fan' if trigger.entity_id ==
    'binary_sensor.parents_bedroom_channel_1_input' else
    'light.parents_downlights' }}
```

In this case I'm using the Shelly's in **Detached Switch** mode and relying on the automation to turn them on or off as required. The mistake I have here is what triggers we're using, or more accurately, I have an assumption about the `state` that the switch can be to trigger the automation.

I incorrectly assumed that the state of the switch would be `on` or `off`, but it turns out there is at least one other state, `unavailable`. This state happens if the Shelly reboots, loses power or the network connection is lost. In this case the automation is triggered and the light is turned on.

Now Shelly's are pretty stable devices, but the reason that I hit it this particular time is that we'd had a restart in our UDM from an update, so the network dropped briefly, the Shelly went to `unable` and then the automation triggered and turned the light on.

To fix this, I made the triggers a lot more specific, I really only care if you go from `on` to `off`, or vice versa, so I changed the automation triggers to:

```yaml
trigger:
  - platform: state
    entity_id:
      - binary_sensor.parents_bedroom_channel_1_input
      - binary_sensor.parents_bedroom_channel_2_input
    to: "on"
    from: "off"
  - platform: state
    entity_id:
      - binary_sensor.parents_bedroom_channel_1_input
      - binary_sensor.parents_bedroom_channel_2_input
    to: "off"
    from: "on"
```

I also decided to use a `choose` action rather than an `if` and only handle the `on` and `off` case.

The light now works as expected and we haven't had any more random light turning on in the middle of the night.

## Why won't the light turn off

From one light problem to another and again the culprit is the fan lights, but this time in our kids bedrooms. The kids have two lights in their room, the fan light and a wifi LED bulb in their lamp that can do a bunch of colours and effects, the main one we use being a nightlight effect. For their fan lights I have an automation that turns the light on or off, unless it's after bed time, then instead of turning it off, it'll turn the lamp to Night Light, which in turn turns the fan light off.

```yaml
alias: "Lighting: Kids fan light switch toggle"
description: ""
trigger:
  - platform: state
    entity_id:
      - binary_sensor.kid1_room_input
      - binary_sensor.kid2_room_input
condition: []
action:
  - if:
      - condition: template
        value_template: "{{ is_state(light, 'on') }}"
    then:
      - if:
          - condition: time
            after: "18:45:00"
        then:
          - service: light.turn_on
            data:
              effect: Night light
            target:
              entity_id: "{{ lamp }}"
        else:
          - service: light.turn_off
            target:
              entity_id: "{{ light }}"
    else:
      - service: light.turn_on
        target:
          entity_id: "{{ light }}"
mode: single
variables:
  light: >-
    {{ 'light.kid1_fan' if trigger.entity_id ==
    'binary_sensor.kid1_room_input' else 'light.kid2_fan' }}
  lamp: >-
    {{ 'light.kid1_lamp' if trigger.entity_id ==
    'binary_sensor.kid2_room_input' else 'light.kid2_lamp' }}
```

It might seem like we have an overly complex set of automations, like the fact that we don't always control the light from the switch, but using the nightlight like this works great as we can set the scene of the bedroom in one set of commands and it's controllable from HA and the Google Home, so the kids can control it themselves.

But there's a problem, what happens if it's after 6.45pm and the lamp is _already_ in Night Light mode? Well, the switch will set the effect but it doesn't change anything which means that it doesn't trigger the next automation in the chain, so the light stays on and there's **no way to turn it off** (short of using the HA app). Yeah, this wasn't wasn't a great experience when I was helping our youngest change his PJ's in the middle of a night after an accident, having to then fumble around turning the lamp off and back on to get it off the effect to then turn the fan light off.

Again, this was a relatively easy fix, I added an additional condition to check if the lamp had the effect set to Night Light and if it did, then don't set it again, go to the turn off light step.

```yaml
alias: "Lighting: Kids fan light switch toggle"
description: ""
trigger:
  - platform: state
    entity_id:
      - binary_sensor.angus_s_room_input
      - binary_sensor.reuben_s_room_input
condition: []
action:
  - if:
      - condition: template
        value_template: "{{ is_state(light, 'on') }}"
    then:
      - if:
          - condition: time
            after: "18:45:00"
          - condition: template
            value_template: >-
              {{ not is_state(lamp, 'unavailable') or not is_state(lamp, 'on')
              }}
        then:
          - service: light.turn_on
            data:
              effect: Night light
            target:
              entity_id: "{{ lamp }}"
        else:
          - service: light.turn_off
            target:
              entity_id: "{{ light }}"
    else:
      - service: light.turn_on
        target:
          entity_id: "{{ light }}"
mode: single
variables:
  light: >-
    {{ 'light.angus_fan' if trigger.entity_id ==
    'binary_sensor.angus_s_room_input' else 'light.reuben_fan' }}
  lamp: >-
    {{ 'light.anguss_lamp' if trigger.entity_id ==
    'binary_sensor.angus_s_room_input' else 'light.wiz_rgbw_tunable_355b12' }}
```

(I also check if the lamp isn't `unavailable` as one of the bulbs tends to go offline randomly and can only be fixed by a power cycle... not ideal in the middle of the night).

## Wrapping up

Ah debugging, who'd think I would have to do that of my own house, but here we are!

The problems that I've looked at here are really easy mistakes to make as a beginner with Home Assistant.

If you're putting state-based conditions, ensure that you verify the case of the states that you're testing against, especially if they are states that are generated by non-standard entities. Diving into the traces of the automations can be a great way to see what's going on and why things aren't working as expected.

Also, be aware of the states beyond the ones that you actually care about. Because I wasn't taking into consideration the `unavailable` state, I was getting unexpected results - the lights were turning on. Having additional conditions to check for the states that you don't care about can help to avoid these issues.

Lastly, when using templated entities, ensure that you know where the state is maintained. Because the state of my cover entities are separated from the entity itself - we're using template to display the right label/icon, it didn't actually know to not trigger the switch that opens/closes the garage/gate. But it's an easy fix with conditions on the service calls.

With these fixes sorted out everyone is a lot happier. Sure, there'll be more bugs to come, but knowing these things that can catch me out will help me to avoid them in the future.
