+++
title = "Building a Smart Home - Part 14 Motion, Occupancy, and Presence"
date = 2023-12-02T22:03:57Z
description = "Walking into a room, lights turning on, feels like magic."
draft = false
tags = ["HomeAssistant", "smart-home"]
tracking_area = "javascript"
tracking_id = ""
series = "smart-home"
series_title = "Motion, Occupancy, and Presence"
+++

For the last six months I've been adding to my smart home the thing that makes it feel really futuristic, lights that turn on as you enter a room and then off when you leave. I've realised that I'll go weeks without really using a light switch, at least not in our main living spaces as a result of this.

So, let's look at the three components to this, movement in a room, people being in the room and who specifically is in the room, aka, motion, occupancy and presence.

## Presence

Let's start with presence, as I think this is the most interesting, but it also the one I'm not actively using anymore.

Presence is interesting because everyone has subtle differences in the way they like things to behave. In our house, I am quite happy with the ambient light that comes in through our windows, especially in our kitchen/living downstairs, whereas my wife is more inclined to turn the lights on in situations I'd deem "adequate light levels". In this case, presence can be useful to know who is in the room and adjust the lighting to meet the preferences of the people there, but that does require knowing _who_ is in the room.

There's a great project, [ESPresence](https://espresense.com/) that can be used for this. It uses the Bluetooth signals from devices to map what's detected to an individual, done using ESP32 devices.

I have a bunch of ESP32's in a draw just looking for a project, so I decided to give it a go, after all, my wife and I both have our phones on us most of the time as well as our Garmin watches, so we're emitting Bluetooth signals all the time.

Unfortunately I couldn't get it to work as well as I'd like. It turns out that Garmin doesn't broadcast Bluetooth signals as frequently as I'd need for capture (which is probably a good thing) and to use our phones, since we're Android, you have to enable a feature in the Home Assistant mobile app which has a negative impact on battery life and it was impactful enough in my testing to be undesirable.

So I've decided to ditch presence detection for the time being, but if you want to see it in action, [here's a good video about setting this up](https://www.youtube.com/watch?v=s7kyqpq4Ev4).

## Motion

Let's talk about stuff that actually works, first is motion detection. For this, I'm using [Passing infrared sensors](https://en.wikipedia.org/wiki/Passive_infrared_sensor), or PIR sensors for short. You've likely come across PIR sensors quite frequently, ever been in an office meeting room and had the lights come on when you enter? That's most likely a PIR sensor.

PIR sensors are great because they're cheap, I have a bunch that use ZigBee (they report as [ZG-204ZL](https://www.zigbee2mqtt.io/devices/ZG-204ZL.html#tuya-zg-204zl) but never report an illumination value so they may be misidentified), meaning they run off a coin cell battery and I can mount them anywhere.

The other great thing about PIR sensors is they are **fast**. They detect motion almost instantly, so you can have lights come on as you enter a room and not have to wait for them to come on. For example, I have one at the top and another at the bottom of our stairs, so when I'm going up or down the stairs, the lights come on.

The downside to PIR sensors is that they're not great at detecting if someone is still in the room. Again, this is probably something that you've come across in an office meeting room, you're sat in a meeting and the lights go off because you've not moved enough. Not really ideal when you've got a living space that the lights came on as you entered, then you are chilling on the couch and the lights go off (yes, that happened, no, my wife wasn't amused).

## Occupancy

Since PIR sensors won't detect that you're sitting still, or at least mostly still, we're going to need something to detect occupancy, just whether or not _someone_ is in the room, not just specific individuals.

For this, I'm using [mmWave radar sensors](https://www.seeedstudio.com/blog/2022/01/03/mmwave-radar-sensing-fmcw-radar/). This isn't exactly new technology but it's really only in the last few years that it's become affordable for hobbyists.

What makes these sensors different is that they are able to detect very minor movements, such as breathing, so they're great for detecting if someone is in a room, even if they're not moving. There are two main drawbacks of these sensors, the first is that they aren't as fast as a PIR sensor, so you can't use them to turn lights on as you enter a room, you'd have a noticeable lag on that and you'd find yourself going for a light switch. The other drawback is that they detect _any_ movement in the area they cover, and that could be a fan spinning rather than a person, giving "false positives" (or false occupancy in this case since it's correctly identified movement but we really only care about human movement).

I have two different mmWave devices, the first one I got was the [EP1](https://shop.everythingsmart.io/en-au/collections/everything-presence-one) which combines a PIR and mmWave (plus a few other sensors), and the others are [Screek Workshop 2A](https://community.home-assistant.io/t/screek-human-sensor-2a-ld2450-24ghz-mmwave-human-tracker-sensor/603070) which is just mmWave (and illuminance).

### EP1 vs 2A

Both devices are ESP32 so they integrate into HA very easily using ESPHome, making setup a breeze. The EP1 is a bit more expensive, but it has a PIR sensor, so it's faster to detect movement, and this is a huge positive if you're wanting to do "lights on when you enter". On the other hand, the 2A has a really complex zone management feature, capable of detecting up to three targets across three zones (which the EP1 originally couldn't do, but now can with a firmware update, I just haven't tried it out).

I do also find the 2A to be a bit more sensitive, so it's more likely to detect movement, but that's not necessarily a good thing, especially if you're trying to avoid false positives, which sees automation firing when it shouldn't (or having complex conditional logic to avoid that). But they are a much slimmer design (due to the lack of PIR) so they can be hidden away a bit easier - I have two mounted behind couches in different rooms so that they detect you sitting on the couch but it's not "in your face".

Generally speaking, I'd go EP1 as the primary device and then use 2A's as extenders or for more nuanced scenarios.

## Home Assistant tips

These sensors are nothing if not integrated into HA, so here's some tips that I've go from having them setup in our house.

### Occupancy zone

Our downstairs living is made up of three "areas", kitchen, dining and living, which are arranged in an L shape, with the hallway coming in between the kitchen and dining. I wanted to be able to detect someone entering from the hallway and if it's dark, turn the light on, but I then want it to stay on if someone is in the zone, even if they're not moving (say, sitting on the couch watching TV).

Because of the unusual shape of the room I have three sensors in there, a PIR covering the dining area, an EP1 in the kitchen and a 2A behind the couch. The reason for this is that the best mounting point for the EP1 is in the kitchen facing towards the hallway, but that also meant that there was a dead zone in the dining and then the lounge didn't have any coverage at all.

For this, I created a binary group helper in HA called `binary_sensor.occupancy_living_room` that all sensors are in and if any of them report as "on" then the group is "on". I then use this group in my automations to determine if someone is in the room.

I've used a similar pattern with our stairs, having a PIR at the top and bottom, but a group which is "on" if either of them are on, so that if you're going up or down the stairs, the lights stay on.

### Automations

The automations with this are pretty simple, if someone enters a room, turn the lights on. For detecting the "entering" part, it's best to trigger on the PIR **directly** rather than the occupancy group, because mmWave sensors are slower to detect movement, but also can report more false positives, as mentioned above, so you can find lights being on at incorrect times as a result.

For the "leaving" part, I use the occupancy group with a timeout. In the main living zones I use a 5 minute timeout, but on the stairs and our WIR I use 30 seconds, since they are transient areas and it's unlikely that you're in them for more than 30 seconds without moving.

Also, since we have a cat who tends to walk around the house at all hours of the night, it's important to have a way cater for that. While the cat doesn't trigger the mmWave sensors (although there are other things that weirdly do which I can't figure out) she does trigger the PIR sensors. Because of this, I disable the automations when our "end of day" routine runs and then re-enable them in the morning at 5.30am (which is when one of us is getting up to go to the gym/for a run/etc.).

#### Media Room

I've started to experiment with a slightly more complex media room setup. In here I have a PIR and mmWave (Screek 2A), so the lights come on when you walk into the room and stay on while you're there watching something. But here's the thing about watching a movie, you'll often sit pretty still and I found that the 2A would detect that as no movement and turn the lights off, which is not ideal. So I've added a condition to the automation that if the TV is on, the lights stay on, even if there's no movement.

Here's that automation:

```yaml
alias: "Lighting: Media Room off"
description: ""
trigger:
  - platform: state
    entity_id:
      - binary_sensor.occupancy_media_room
    to: "off"
    for:
      hours: 0
      minutes: 5
      seconds: 0
condition:
  - condition: or
    conditions:
      - condition: state
        entity_id: media_player.media_room_tv
        state: idle
      - condition: state
        entity_id: media_player.media_room_tv
        state: "off"
action:
  - service: light.turn_off
    data: {}
    target:
      entity_id:
        - light.media_room_light
        - light.media_room_downlights
  - service: input_boolean.turn_off
    data: {}
    target:
      entity_id: input_boolean.override_media_room_occupancy
mode: single
```

You'll also notice that there's a `input_boolean.override_media_room_occupancy` in there. This is used to manually override the occupancy detection, so if you manually turn the lights off then this is set to `true` and the "lights on when movement detected" won't trigger until you turn off the TV and leave the room (which seems like a logical "we're done" condition).

### Direction of travel

When you go up our stairs and it's "dark", it's quite logically that you're next going to want the lights on the landing turned on, so I decided to experiment with creating a "direction of travel" value for our stairs. While I don't use this anymore since the mmWave sensor was added up there, I thought it might be of interest to others.

To start with, I created a template sensor:

```yaml
- sensor:
    - name: "Stair direction of travel"
      unique_id: stair_direction_of_travel
      icon: mdi:stairs
      state: >-
        {% if is_state("binary_sensor.stairs_bottom_occupancy", "on") and is_state("binary_sensor.stairs_top_occupancy", "on") -%}
          {% if states.binary_sensor.stairs_bottom_occupancy.last_changed > states.binary_sensor.stairs_top_occupancy.last_changed -%}
            down
          {%- else -%}
            up
          {%- endif -%}
        {%- else -%}
          none
        {%- endif %}
```

Here we look at the state of the two PIR sensors and when they are both on we determine which one was triggered last and set the state of the sensor to either "up" or "down". If only one is on, or neither are on, then the state is "none".

This can be combined with an automation to turn the lights on when you enter the stairs, but only if you're going up:

```yaml
- id: "1688545254314"
  alias: "Lighting: going upstairs "
  description: ""
  trigger:
    - platform: state
      entity_id:
        - sensor.stair_direction_of_travel
      to: up
  condition:
    - condition: sun
      after: sunset
    - condition: time
      before: "19:00:00"
    - condition: and
      conditions:
        - condition: state
          entity_id: light.kids_lounge
          state: "off"
        - condition: state
          entity_id: switch.upstairs_hallway
          state: "off"
  action:
    - service: light.turn_on
      data: {}
      target:
        entity_id: light.kids_lounge
  mode: single
```

## Conclusion

I've found that having lights come on as you enter a room and then turn off when you leave to be a really nice feature of our smart home. It's one of those things that you don't really notice until you don't have it anymore, and then you realise how much you miss it. I've found myself walking into rooms that don't have this and just standing there waiting for the lights to come on, only to realise that I need to turn them on myself, like a caveman!

Using a combination of PIR and mmWave really is the way to go when it comes to motion and occupancy. I do with my PIR sensors would detect LUX so that I could use them for illuminance as well, but that's not a huge deal, just means that sometimes the lights are coming on when I don't need them to.

The EP1 is really my pick of the devices, my only real complaint is that it's a bit bulky and clearly stands out when mounted, but it's something you "get used to".

I do wish I could get ESPresence working reliably, but I'm not sure that it would really improve things that much in our setup.

It'd be really cool to see how this can be applied in the bedrooms to do automatic bedtime routines for the kids/end of day triggering, but I feel like it'd be really hard to get right, and you don't want lights coming on in the middle of the night in a bedroom!
