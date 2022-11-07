+++
title = "Building a Smart Home - Part 5 Bin Day"
date = 2022-11-07T05:43:39Z
description = "What day do the bins go out? What bins are we putting out this week?"
draft = false
tags = ["smart-home"]
tracking_area = "javascript"
tracking_id = ""
series = "smart-home"
series_title = "Bin Day"
+++

Where I live, we have three bins that we can put out, depending on the week, red for household rubbish, yellow for mixed recycling and green for garden waste. The red bin goes out each week, but the yellow and green alternate every other week, so you need to know which one it is that week and like a lot of people, I never know which week it is, so I sneakily wait until my neighbours put their bins out and then I put mine out, following their colour choices!

But really, this is the kind of quality-of-life improvement that I should be able to solve with a smart home, so I decided to add it.

## Getting the data into Home Assistant

The first step is to get the data into Home Assistant. Thankfully, HA has a calendar feature, so it's just a matter of having something that goes into that feed and then we should be all sorted right?

My friend [Tatham](https://tath.am) pointed me to [Waste Collection Schedule](https://github.com/mampfes/hacs_waste_collection_schedule), a custom component for Home Assistant that does exactly what I need. Well, it would if my council was there... No biggie, I'll just add it myself.

### Adding a new council

The first step is to find a feed for your local council that has the data available. I live in the [Inner West Council](https://www.innerwest.nsw.gov.au/) and they have a [waste calendar](https://www.innerwest.nsw.gov.au/live/waste-and-recycling/waste-calendar) on their website, which you can pop in your address and get a display like this:

![Waste calendar](/images/2022-11-07-building-a-smart-home---part-5-bin-day/01.png)

Great, it's a calendar, or at least providing data that can be mapped to a calendar, all I need to do now is find the endpoint that that's calling and I'm all set. I set about digging through how it worked and figured the best place to start was the network tab in my browser:

![The network request for an ASMX web service](/images/2022-11-07-building-a-smart-home---part-5-bin-day/02.png)

Oh dear... It's an ASMX web service, which is something from old-school ASP.Net WebForms days, which I haven't used in a long time. I'm not sure if it's still a thing, and it's a HTTP POST, so it's going to be a bit tricky to break down, but let's try anyway. We'll start with the payload:

```json
{
  "schedulerInfo": {
    "ViewStart": "/Date(1667052000000)/",
    "ViewEnd": "/Date(1670076000000)/",
    "EnableDescriptionField": true,
    "MinutesPerRow": 30,
    "TimeZoneOffset": 36000000,
    "VisibleAppointmentsPerDay": 2,
    "UpdateMode": 0,
    "moduleID": 58152,
    "userID": 0,
    "filterPermissions": 6,
    "filterGroups": "",
    "filterApptTypes": ""
  }
}
```

Oh dear... ASP.Net serialized DateTime strings, this just gets better... Let's check out the response:

```json
{
  "d": [
    {
      "__type": "Telerik.Web.UI.AppointmentData",
      "ID": 752,
      "EncodedID": "/wEC8AXS5ORUZvoJJiHck83LcbtXaRd/GhDgLBkE78COC0wM0g==",
      "Start": "/Date(1584540000000)/",
      "End": "/Date(1584626400000)/",
      "Subject": "Garbage Bin",
      "Description": "Thursday by 4.30pm",
      "RecurrenceState": 1,
      "RecurrenceParentID": null,
      "EncodedRecurrenceParentID": null,
      "RecurrenceRule": "DTSTART:20200318T140000Z\r\nDTEND:20200319T140000Z\r\nRRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=TH\r\n",
      "Visible": false,
      "TimeZoneID": "AUS Eastern Standard Time",
      "Resources": [
        {
          "__type": "Telerik.Web.UI.AppointmentData",
          "ID": 752,
          "EncodedID": "/wEC8AXS5ORUZvoJJiHck83LcbtXaRd/GhDgLBkE78COC0wM0g==",
          "Start": "/Date(1584540000000)/",
          "End": "/Date(1584626400000)/",
          "Subject": "Garbage Bin",
          "Description": "Thursday by 4.30pm",
          "RecurrenceState": 1,
          "RecurrenceParentID": null,
          "EncodedRecurrenceParentID": null,
          "RecurrenceRule": "DTSTART:20200318T140000Z\r\nDTEND:20200319T140000Z\r\nRRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=TH\r\n",
          "Visible": false,
          "TimeZoneID": "AUS Eastern Standard Time",
          "Resources": [
            {
              "__type": "Telerik.Web.UI.ResourceData",
              "Key": 385,
              "Text": "Garbage Bin (red lid) - MarrZone15B",
              "Type": "AppointmentTypeID",
              "Available": true,
              "EncodedKey": "/wECgQO8KfWqRezwxWlACrW+iXp1yPOARWUInQEsFugq6PPmWA==",
              "Attributes": {
                "name": "Garbage Bin (red lid) - MarrZone15B",
                "backcolour": "#EE0031",
                "bordercolour": ""
              }
            },
            {
              "__type": "Telerik.Web.UI.ResourceData",
              "Key": 3,
              "Text": "Public",
              "Type": "PrivacyID",
              "Available": true,
              "EncodedKey": "/wELKYwBQ01Eb3ROZXQuQ29tbW9uLmVjQ2FsZW5kYXIuQ29tbW9uLkVudW1lcmF0aW9ucytBcHBvaW50bWVudFByaXZhY3ksIENNRG90TmV0LkNvbW1vbiwgVmVyc2lvbj0xMS41LjE1LjU2LCBDdWx0dXJlPW5ldXRyYWwsIFB1YmxpY0tleVRva2VuPW51bGwDHumVwtOrf2dqNRWC26d+4JZSY0Owz4D1NkVQi9COlYk=",
              "Attributes": {}
            },
            {
              "__type": "Telerik.Web.UI.ResourceData",
              "Key": 2,
              "Text": "Implementation Staff",
              "Type": "People",
              "Available": true,
              "EncodedKey": "/wECAr6LF7CwU/mH1D0Fnnna3lyFqUBUtQQ7fRbNCKf+z84Q",
              "Attributes": {
                "strFirstName": "Implementation",
                "strLastName": "Staff"
              }
            }
          ],
          "Attributes": {
            "PrivacyID": "3",
            "tt_location": "",
            "UserName": "Implementation Staff",
            "tt_apttype": "Garbage Bin (red lid) - MarrZone15B",
            "tt_subject": "Garbage Bin",
            "OrganiserUsers": ",",
            "AllowDelete": "False",
            "AllowEdit": "False",
            "tt_aptprivacy": "3",
            "AppointmentTypeID": "385",
            "ViewerGroups": "",
            "ExternalURLOpenNewWindow": "False",
            "OrganiserGroups": "",
            "AttendeeUsers": "",
            "ExternalURL": "",
            "AttendeeGroups": "",
            "Location": "",
            "UserID": "2",
            "ViewerUsers": "",
            "tt_description": "Thursday by 4.30pm",
            "SyncWithExchange": "False",
            "Title": "Garbage Bin"
          },
          "Reminders": []
        }
        // snip
```

**OH DEAR**... I've truncated the response here (it's over 1000 lines!) and having spent some time going through it, it's not something I could figure out (this first record start/end date is back in 2020 from what I can deserialize!). Which isn't that surprising, the data is designed to be used by the Telerik Calendar control (from what I can determine), so it's really only designed for use within that control.

I spend a few evenings trying to make sense of the data structures in the JSON payload, to work out what I can change in the POST body to _maybe_ get more useful data, but it was feeling like a mostly pointless effort... it's time for a new approach.

### Adding a new council - take two

Since the website isn't going to be much use, it's time to rethink the strategy for how I can get the data. Some web searching and digging through the council website (yes, I read a lot of the council website!) was leading my nowhere, until I re-read the original [waste calendar](https://www.innerwest.nsw.gov.au/live/waste-and-recycling/waste-calendar) and noticed that there's an app. First off - why do I need an app for my local council, but I digress...

If I can get the waste schedule on the mobile app, it's going to have an API that's easier for me to parse. I installed the app on my phone and now it's time to work out what it's doing. This is something I've done in the past using Telerik Fiddler, basically what you use Fiddler on your computer as a proxy, configure your mobile to use your computer as the proxy and then monitor the network traffic ([here's a guide from Telerik](https://www.telerik.com/blogs/how-to-capture-android-traffic-with-fiddler)).

For some reason I couldn't get the root certificate installed, so I wasn't seeing any of the traffic contents, but I _was_ seeing the routes it was hitting and what I saw was a bunch of requests to https://marrickville.waste-info.com.au. Unfortunately, this is a CMS that I don't have the login details for, so it was feeling like a dead end again.

I decided to have a poke around some of the other Australian council implementations in the HACS component when I stumbled into one that looked interesting, it was hitting a `waste-info.com.au` address too. It wasn't `marrickville`, but it was still on there, so maybe this CMS is something I can figure out by going through other implementations.

Through browsing the code, it seemed like the data is gained by building a request across a series of other endpoints, first we get the suburb ID from the localities, then we get the street ID, and then a property ID before getting the details for the property! Using the browser, I tested following each endpoint and eventually I got a to:

```json
{
  "collection_day": 4,
  "collection_day_2": null,
  "zone": "zone 15",
  "shs": null,
  "collections": [
    {
      "id": 19,
      "bin_type": "recycle",
      "recurrence": "fortnightly",
      "collection_day": 5,
      "next_collection_date": "2022-11-18"
    },
    {
      "id": 20,
      "bin_type": "organic",
      "recurrence": "fortnightly",
      "collection_day": 5,
      "next_collection_date": "2022-11-11"
    }
  ]
}
```

Success!

I copied the reference implementation, tested it locally and sent a PR, so now [Inner West Council has been added](https://github.com/mampfes/hacs_waste_collection_schedule/blob/master/doc/source/innerwest_nsw_gov_au.md)!

## Adding to Home Assistant

Now that the component supports my location (I manually added the Python file while I waited for the PR to merge in), it was time to add it to my Home Assistant dashboard.

![Displaying on HA dashboard](/images/2022-11-07-building-a-smart-home---part-5-bin-day/03.png)

That's what I display on the dashboard. I got the card idea from Tatham and it's using the [`https://github.com/thomasloven/lovelace-template-entity-row`](https://github.com/thomasloven/lovelace-template-entity-row) custom card.

Here's the YAML for the card:

```yaml
type: entities
entities:
  - type: custom:template-entity-row
    entity: sensor.next_collection
    name: "{{ states.sensor.next_collection.state }}"
    state: |-
      {% set days_to = state_attr('sensor.next_collection', 'daysTo') %}
      {% if days_to == 0 %}
      Today
      {% elif days_to == 1 %}
      Out Tonight
      {% elif days_to <= 7 %}
      {{ (now() + timedelta(days = days_to)).strftime('%A') }}
      {% else %}
      in {{days_to}} days
      {% endif %}
    active: "{{ states.sensor.next_collection.attributes.daysTo <= 1 }}"
    icon: mdi:trash-can-outline
  - entity: sensor.next_garden_collection
    type: custom:template-entity-row
    name: Green bin
    condition: "{{ states.sensor.next_garden_collection.attributes.daysTo <= 7 }}"
  - entity: sensor.next_recycling_collection
    type: custom:template-entity-row
    name: Yellow
    condition: "{{ states.sensor.next_recycling_collection.attributes.daysTo <= 7 }}"
  - entity: sensor.next_rubbish_collection
    type: custom:template-entity-row
    name: Red bin
theme: minimalist-desktop
```

The top is a template that looks works out how long is left and shows a friendly description for when the next collection is, and then I show more details such as which bins there are.

I'm also using a custom sensor for `next_collection` which computes from the calendar info:

```yaml
- platform: waste_collection_schedule
  name: next_collection
  add_days_to: true
  details_format: generic
  value_template: '{{value.types | join(", ")}}'
```

## Automations

I currently have a single automation that does a broadcast message the day that the bins are due to go out:

```yaml
- id: "bin_day"
  alias: "Reminder: Bins"
  description: ""
  trigger:
    - platform: time
      at: 08:00:00
  condition:
    - condition: time
      weekday:
        - thu
  action:
    - service: tts.google_translate_say
      data:
        entity_id: media_player.nestaudio0935
        message: Today's bins are {{ states.sensor.next_collection.state }}
  mode: single
```

I should probably update the automation to use something from the HACS component rather than hard-coding `thu` as the day, but that'll come if they change my day of pickup.

I've contemplated having something that does an additional reminder if the bins aren't put out in time, maybe have some presence sensor on the bin and check their location, but I'm not sure if that's worth the effort, plus this was more to know if it's yellow or green bin day, not to remind me to put them out (I'm pretty good on that front).

## Conclusion

I'm pretty happy with how this turned out, it was a fun to do some reverse engineering of the mobile app and figure out how to get the data. I'm also happy that I was able to contribute to the HACS component, so hopefully it'll be useful to others.

I think there's more I could do from a dashboard level to make it more useful, but I'm happy with what I've got for now.

If you're doing something similar, I'd love to hear about it, so please let me know in the comments!
