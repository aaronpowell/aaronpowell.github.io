+++
title = "Building a Smart Home - Part 4 Ceiling Fans"
date = 2022-10-24T04:25:19Z
description = "It's starting to get warm in Sydney, let's get the ceiling fans working with Home Assistant"
draft = false
tags = ["smart-home"]
tracking_area = "javascript"
tracking_id = ""
series = "smart-home"
series_title = "Ceiling Fans"
+++

When we designed our new home, we decided to add ceiling fans to each of the bedrooms, mostly because, while we have a HVAC system in place that is ducted throughout the house, sometimes you just want some basic air movement in a room, especially when it's humid but not hot, and a HVAC is a lot more expensive to run than a ceiling fan.

But, ceiling fans tend to be pretty dumb, and I wanted to look at how to integrate them into my smart home, so let's take a look at that today. We installed fans from [Lucci Air](https://www.lucciair.com/) (I'm not sure the exact model) and they have a remote control, so I'll be looking at that style of fan. If you've got something else, maybe some of the ideas here will resonate, but I can't guarantee it.

But first...

## Ceiling fans are great example of terrible UX

In the first post of this series I brought up the topic of [Norman Doors](https://99percentinvisible.org/article/norman-doors-dont-know-whether-push-pull-blame-design), a term used to describe something that doesn't work the way you'd expect it, and for me, they are the perfect example of how something can be wrong in a smart home.

Take the remote controlled ceiling fan. I have a switch on the wall that when I flip it, the state of the light changes. Great, that's to be expected. And I have a remote that I can use while laying in bed and way to turn the fan on. Again, great... except it's not.

It turns out that these fans (and we had a different Lucci module at the place we rented) are a broken UX design. You see, the switch on the wall isn't changing the state of the light _per se_, it's changing the power state of the circuit, and it just so happens that the fan remembers it's last state (and the default last state when they were installed is "light is on"). So, if I flip the switch the circuit either has power or doesn't, and when it has power, the remote can be used to control the fan speed or turn the light off, but when it doesn't have power, the remote can't do anything. This manifested itself as a problem in the rental as we'd go to bed, but then want the fan on in the middle of the night, but to do that you flip the switch, light up the room and then quickly hit the "turn light off" button... hopefully without waking the other sleeping person in the room.

See, broken UX.

So you can address this by removing the switch all together and now it's just remote controlled, but again, you've broken your UX. When someone walks into the room they _expect_ a switch, but it's not visible, and now you're left explaining "so, you have to find the remote first, then use that to..." and invariably, one of the kids has hidden the remote.

This is a perfect example of everything that can go wrong when you try to make something "smart". Sure, a remote isn't a "smart home device" but in this case it's filling the role and doing so in a way that means you have to constantly "train" people on how to use a room, which is not what you should want.

Ok, complaining done, back to the blog post.

## Ceiling fan remote control

Given that we have a remote that is used to control the fan functions, it stands to reason that it's using some signal to communicate with the fan, and that signal is probably using some sort of RF protocol (I'm not sure what frequency this one uses, but knowing it is not required for the solution). And if it's something being broadcast, well, we can simulate that broadcast right?

For that, I decided to use the [Broadlink RM4 Pro](https://www.ozsmartthings.com.au/products/broadlink), which is capable of broadcasting RF and IR signals. I was already using one of these at the rental to blast IR as the reverse cycle AC unit (as I couldn't be bother replacing the batteries 🤣), so it seemed like a decent enough starting point. Also, there's a [Broadlink integration for Home Assistant](https://www.home-assistant.io/integrations/broadlink/) which makes it easy to control the device. And for a bonus, the Broadlink device works on local control, so you don't need to have it connected to the internet to use it.

Once the device was provisioned and integrated into Home Assistant, it was ready to get going.

## Teaching the Broadlink

As the RM4 is an RF blaster and doesn't know anything about my fan, I need to train it up, and thankfully, that's something we can do from Home Assistant.

Navigate to **Developer Tools** -> **Services** and from the service options, you'll find a `remote.learn_command` service to execute. This will set the device into learning mode and it'll pickup any signals we send to it:

```yaml
service: remote.learn_command
data:
  device: parents_fan
  command: light
  command_type: rf
target:
  entity_id: remote.broadlink_rm4_pro
```

The fields of relevance here are:

- `device` - This is the name of the device (aka remote) we're teaching the Broadlink about. This is just a name, so you can call it whatever you want, but it's a good idea to make it descriptive.
- `command` - This is the name of the command we're teaching the Broadlink about. This is also just a name, but again, it's a good idea to make it descriptive.
- `entity_id` - This is the Home Assistant entity ID of the Broadlink device we're teaching.

Click the **Call Service** button and the device will start listening (the indicator light will turn orange), and now we're ready to go.

_Note: The **Call Service** button will turn green after a few seconds, but I didn't find I'd need to wait for it._

While the device is in listening mode, press the button on the remote you want to teach (I found I'd have to hold it down for ~10 seconds), and then when released the indicator light will go off, then turn back on as orange, indicating it's in learning mode again (or still... I'm not sure). Once it's back to orange, press the button on the remote again, this time you don't have to do a long press, the indicator light will turn off, and your remote code is learnt.

If you want to verify this, open the your file editor extension (VS Code or File Editor) and navigate to the `.storage` folder. In there, you'll find a file named `broadlink_remote_<id>_codes`. If you open it you'll see this:

```json
{
  "version": 1,
  "minor_version": 1,
  "key": "broadlink_remote_<id>_codes",
  "data": {
    "parents_fan": {
      "light": "<some long code here>"
    }
  }
}
```

This is where you'll find the commands that have been learnt, and is a handy reference if you're like me and forget what they are called.

Repeat the above steps for each of the buttons on the remote you want to learn.

### Testing a command

Once you've learnt a command, you can test it by executing the `remote.send_command` service:

```yaml
service: remote.send_command
data:
  device: parents_fan
  command: light
target:
  entity_id: remote.broadlink_rm4_pro
```

We have a light that goes on and off, woo!

## Making our fan

With the commands learnt, it's time to make a fan in Home Assistant that we can control, but since this is going to be a completely virtual fan, we have no physical indicators of state, I'm going to create some helpers to track state for us.

```yaml
input_boolean:
  parents_fan_state:
    name: "Parents Bedroom: Fan state"
    icon: mdi:fan
input_number:
  parents_fan_speed:
    name: Parents fan speed
    icon: mdi:fan
    step: 1
    min: 0
    max: 6
    mode: slider
```

The `input_boolean` is really just tracking if the fan is on or off, and we could probably do that as a calculated value (we'll see why shortly), but I like to be explicit and it's not really any overhead. As for the `input_number`, this is tracking the speed of the fan. My fan has six speeds, but I've added a seventh position, `0`, which I'm using to indicate `off` (hence why we could do a calculated value rather than explicit boolean state).

Since I've got four fans in the house, I'm going to use a series of scripts to execute the commands, as I find they are a bit more portable and discoverable - plus I can reuse them outside of the fan entity itself:

```yaml
script:
  fan_off:
    alias: Turn a fan off
    fields:
      fan:
        description: The fan to turn off
        example: parents_fan
    sequence:
      - service: input_number.set_value
        data:
          entity_id: input_number.{{ fan }}_speed
          value: 0
    mode: single
    icon: mdi:fan-off
  fan_on:
    alias: Turn a fan on
    fields:
      fan:
        description: The fan to turn on
        example: parents_fan
    sequence:
      - service: input_number.set_value
        data:
          entity_id: input_number.{{ fan }}_speed
          value: 1
    mode: single
    icon: mdi:fan-speed-1
```

These scripts are really just wrappers for the specific state, for the `off` I set the `input_number` helper to `0`, and the way I know which helper to use is by having a convention to the name of the entities, `fan` is going to be the device name when we learnt the commands, making it quite easy to have reusable scripts.

Next, let's create a script to set the speed:

```yaml
fan_set_speed:
  alias: Set the speed of a fan
  icon: mdi:fan
  fields:
    fan:
      description: The fan to set the speed of
      example: parents_fan
    speed:
      description: The speed of the fan
      example: "1"
  sequence:
    - service: remote.send_command
      data:
        device: "{{ fan }}"
        command: fan_speed_{{ speed | round (0, 'floor') }}
      target:
        entity_id: remote.broadlink_rm4_pro
    - if:
        - condition: template
          value_template: "{{ (speed | round (0, 'floor')) == 0 }}"
      then:
        - service: input_boolean.turn_off
          data:
            entity_id: input_boolean.{{ fan }}_state
      else:
        - service: input_boolean.turn_on
          data:
            entity_id: input_boolean.{{ fan }}_state
    - service: input_number.set_value
      data:
        entity_id: input_number.{{ fan }}_speed
        value: "{{ speed }}"
  mode: single
```

This script will be callable from other scripts and automations and will take two inputs, the `fan` (which is the device name) and the speed to set. It will then send the command to the Broadlink using the `remote.send_command` service (like in our testing) and since I suffixed the command names with the speed, we can pull that out nicely, and then we set the on/off state of the fan before updating the `input_number` helper with the requested speed.

## The fan entity

With our scripts and helpers setup, we can create a fan using the [Template Fan](https://www.home-assistant.io/integrations/fan.template/) integration:

```yaml
fan:
  - platform: template
    fans:
      parents_fan:
        friendly_name: Parents Fan
        unique_id: parents_fan
        speed_count: 6
        value_template: "{{ states('input_boolean.parents_fan_state') }}"
        percentage_template: "{{ (100 * (int(states('input_number.parents_fan_speed'))/6)) | round(0, 'floor') }}"
        turn_off:
          service: script.fan_off
          data:
            fan: parents_fan
        turn_on:
          service: script.fan_on
          data:
            fan: parents_fan
        set_percentage:
          service: script.fan_set_speed_state
          data:
            fan: parents_fan
            speed: "{{ percentage }}"
```

There's some metadata of the fan, such as the name and entity ID, but then we start computing some values from the helpers we defined above. The `value_template` will read the state from the `input_boolean` (and here's where we could compute it if desired) and then `percentage_template` is used to turn the speed into a percentage to display on the slider. Since we're storing the numerical speed (as that maps cleaner to our commands), we need to convert it to a percentage, and I just round it down since sixths isn't a clean round fraction.

Adding the `turn_on` and `turn_off` actions is easy, they'll just call the scripts we setup, but the `set_percentage` is going to require a new script (to avoid the calculations being embedded in the entity):

```yaml
fan_set_speed_state:
  alias: Set the tracking value for the fan speed
  icon: mdi:fan
  fields:
    fan:
      description: The fan to set the speed of
      example: parents_fan
    speed:
      description: The speed of the fan
      example: "1"
  sequence:
    service: input_number.set_value
    data:
      entity_id: input_number.{{ fan }}_speed
      value: "{{ (speed / 100) * 6 | round(0, 'ceil') }}"
```

This script a generic version of the on/off scripts, it takes the percentage value and converts it to a speed value, and then sets the helper. Having the deal with percentages, especially in my case of numbers that don't round cleanly, is a bit of a pain, but it's the best I could come up with.

And with that all setup, we can add it to our UI (I'm using the [mushroom cards add-on](https://github.com/piitaya/lovelace-mushroom) for the fan card):

![The fan entity in the UI](/images/2022-10-24-building-a-smart-home-part-4-ceiling-fans/01.png)

We're almost done, but there's something we still need, to actually call the `fan_set_speed`, as all we're doing is setting the `input_number` helper.

## The automation

To call our script, I'm using an automation that is set to trigger on the `input_number` changing:

```yaml
automation:
  - id: set_fan_speed
    alias: "Climate: Set fan speed"
    trigger:
      - platform: state
        entity_id:
          - input_number.parents_fan_speed
    action:
      - service: script.fan_set_speed
        data:
          fan: "{{ fan }}"
          speed: "{{ states(trigger.entity_id) }}"
    variables:
      fan:
        "{{ trigger.entity_id | regex_replace(find='input_number.', replace='',
        ignorecase=False) | regex_replace(find='_speed', replace='', ignorecase=False)
        }}"
```

As I integrate more of the fans, I'll add more of them to the `entity_id` on the trigger, but we're starting simple.

Since we're going to need the name of the fan for the script, and I was smart enough to put that in the name of the `input_number`, we can use a regex to pull it from `trigger.entity_id` and then pass it to the script, while grabbing the state (ie - numerical speed) from the entity that triggered the automation.

_Aside: In retrospect, I should have had the device as the suffix of the `input_number`, rather than in the middle of the entity name, but now I've got it everywhere and I'm too lazy to go back and change it._

Now, whenever something triggers a change to the fan speed value, this automation will be triggered, the script is called and the fan does it's thing. So far, I've set this up with some other automation's based on the temperature and humidity in the room, as well as a custom Google Assistant routine so I can say "Hey Google, parents fan speed" and it goes faster!

## Conclusion

I'm pretty happy with how this turned out, especially since I find the "default" UX of these fans really frustrating. In fact, we don't even have the remotes anywhere in the rooms, they just sit in the downstairs "junk draw" (you know the one!).

It's not a perfect solution though, it doesn't address the core issue of poor UX completely, as the switch on the wall will still break the circuit, and I can't track that, so the state can get out of order, we've had a few incidents when my wife or kids couldn't turn on the fan's light but it was because the switch was off on the wall, so they flipped it since it didn't respond to a voice command, but that just killed the circuit power so then the state in Home Assistant was out of sync. I've got some ideas on how to address that, but I'm waiting for that hardware to arrive before I can try that out.

But from an automated house perspective, it works well. We've had some humid nights recently and it's been nice to come to bed to find that the fan is already spinning and we didn't have to do anything. I've also got the light in the fan (which uses the [Light Template entity](https://www.home-assistant.io/integrations/light.template/)) configured with an automation against the kids lamps, so when we enable the "Night light" effect on them, it'll turn off the overhead light - and it's worked about 90% of the time 🤣.

If anyone has thoughts on how to improve this, or any other ways they've gone about integrating remote controlled ceiling fans, I'd be keen to hear about it!
