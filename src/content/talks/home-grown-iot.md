---
title: Home Grown IoT
hidden: true
tags: ["iot"]
duration: 45 minutes
abstract: |
    At the end of 2018, I got a set of solar panels installed at home and the inverter came with a wifi endpoint in it to allow me to log into its dashboard. So like a good technologist I decided to crack open my toolbox and worked out how the dashboard worked. As it turned out it is a simple SPA that talks to a series of API endpoints that provides the data.

    But this not only requires me to be at home to access the dashboard, it only provides me with a point in time view of the data. How can I compare my power generation today to yesterday or last week? If I was able to build up enough data over time what insights could I get into my energy usage patterns? Are there other interesting things I can determine by looking at this data?

    Armed with the knowledge of how to scrape the data I decided to set about creating an IoT project that would allow me to pull the data out of my inverter and store it in the cloud for me to report on.

    So come on a journey as we look at how to create an application to run on an IoT device, push it to the cloud and leverage an eventing model to process our data. We’ll explore the local dev experience and how you build an IoT project for yourself.

audience:
    - Home hackers
    - IoT solution implementers

notes: |
    I wanted to get started with learning IoT but was unsure where to start. Conveniently I recently installed solar panels at home and they have a wifi endpoint in them.

    So what can we do with a Raspberry Pi, wifi solar system and the cloud?

    This talk grew out of a 9-part blog series I wrote and has been presented at a number of user groups around Australia and internally at Microsoft.

resources:
    - name: Blog series
      link: /posts/2019-05-30-home-grown-iot-prologue
---
