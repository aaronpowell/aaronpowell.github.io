+++
title = "Building a Smart Home - Part 11 House Sitter Mode"
date = 2023-04-27T00:11:23Z
description = "It's time to go on a holiday, but what about your smart home?"
draft = false
tags = ["HomeAssistant", "smart-home"]
tracking_area = "javascript"
tracking_id = ""
series = "smart-home"
series_title = "House sitter mode"
+++

When designing a smart home I've reiterated many times that the goal was to make it work regardless of who was there and that existing expectations of how things like switches work are maintained.

But naturally as you start to evolve the smart home more you will end up doing customisations around your household routines. In our house we have a few, one example is the night time routine for the kids bedrooms - at a scheduled time their light will come on, then when they flip the switch to turn it off it will also turn on their night light (there's a few nuances to it though).

This kind of thing works for us and our kids, but it might not work for others, and it was something we had to tackle recently when we went on holidays and had a house sitter.

## Entre House Sitter Mode

The astute reader might have noticed when I talked about [smart door locks]({{<ref "/posts/2023-02-13-building-a-smart-home---part-9-door-locks.md">}}) that I have a generic automation that will enable/disable a PIN for any user one of those users was called `house_sitter`. This is combined with a script that I have to generate a new four-digit PIN for that user.

```yaml
generate_front_door_pin:
  alias: Generate a random PIN
  description: Generate a random PIN for a specific User
  fields:
    user:
      description: The entity_id which the User's PIN is stored in
      example: input_text.lock_house_sitter_pin
  sequence:
    - alias: Randomise PIN
      service: input_text.set_value
      target:
        entity_id: "{{ pin_entity_id }}"
      data:
        value:
          "{% for n in range(4) -%}\n  {{ [0,1,2,3,4,5,6,7,8,9]|random }}\n{%-
          endfor %}\n"
```

I have this called from another script:

```yaml
setup_front_door_house_sitter_pin:
  alias: Setup front door house sitter PIN
  description: Create a new house_sitter PIN and enable it
  sequence:
    - alias: Randomise PIN
      service: script.generate_front_door_pin
      data:
        pin_entity_id: input_text.lock_house_sitter_pin
```

To use these I have added a `input_boolean` to indicate if we want to enable or disable the house sitter mode:

```yaml
input_boolean:
  house_sitter_mode:
    name: House Sitter Mode
    icon: mdi:home-account
```

And then we have an automation that listens for the changes to its state:

```yaml
- id: "security_toggle_house_sitter_lock_access"
  alias: "Security: Toggle House Sitter lock access"
  description: ""
  trigger:
    - platform: state
      entity_id:
        - input_boolean.house_sitter_mode
  condition: []
  action:
    - if:
        - condition: state
          entity_id: input_boolean.house_sitter_mode
          state: "on"
      then:
        - service: script.setup_front_door_house_sitter_pin
          data: {}
      else:
        - service: script.clear_front_door_house_sitter_pin
          data: {}
  mode: single
```

Great, now we have a way to know within Home Assistant if we are in house sitter mode or not, and with that we can adjust our automations.

## Tweaking the automations

There are two approaches that I've tackled for this problem space and I'll cover both of them here. The first is that we can add a condition to our automations to check if we are in house sitter mode or not, and either let the automation run or not.

I initially went down this route for automations but I ultimately found that it wasn't scalable, you would have a lot of automations that you add this condition to, and if you add more conditions to the automation you have to be careful that they don't conflict with each other.

Instead, I went down the route of creating an automation that would run when the `input_boolean` is triggered and then it would enable/disable the automations that I wanted to change. The idea is that you disable the automations that are unique for how your household operates, and then enable the automations that are generic and work for anyone.

```yaml
alias: "System: House sitter automation management"
description: ""
trigger:
  - platform: state
    entity_id:
      - input_boolean.home_mode_house_sitter
    from: "off"
    to: "on"
  - platform: state
    entity_id:
      - input_boolean.home_mode_house_sitter
    from: "on"
    to: "off"
condition: []
action:
  - service: automation.{{ family_action }}
    target:
      entity_id:
        - automation.bedtime_lights_out
        - automation.climate_aaron_s_office
        - automation.climate_aaron_s_office_off
        - automation.lighting_kids_fan_light_switch_toggle
        - automation.lighting_toggle_on_switch_change
        - automation.system_wol_aaron_s_pc
  - service: automation.{{ house_sitter_action }}
    target:
      entity_id:
        - automation.lighting_parents_fan_house_sitter_mode
        - automation.lighting_parents_downlights_house_sitter
        - automation.security_house_sitter_arrived
mode: single
variables:
  family_action: "{{ 'turn_off' if trigger.to_state.state == 'on' else 'turn_on' }}"
  house_sitter_action: "{{ 'turn_on' if trigger.to_state.state == 'on' else 'turn_off' }}"
```

The automation will look at the state of the `input_boolean` and generate two variables using a template to work out which service we need to call, `turn_on` or `turn_off`, and then it will call the service for the family and house sitter automations.

I find that this approach, enable/disable automations rather than conditions, a much better option for me, as it's easy to add more automations to the list and it's clear when looking at the automation list in Home Assistant what is enabled and what isn't (and that makes debugging easier!).

## Conclusion

This is a simple approach to managing the automations that you want to enable/disable when you are in house sitter mode, and it's one that I've found works well for me. I'm sure there are other approaches that you could take, and I'd love to hear about them if you have any.
