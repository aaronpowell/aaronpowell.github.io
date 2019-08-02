+++
title = "Home Grown IoT - What's Next?"
date = 2019-08-02T09:22:44+08:00
description = "What's next with my IoT project?"
draft = false
tags = ["iot"]
series = "home-grown-iot"
series_title = "What's Next?"
+++

Over the last 8 posts I've looked at [IoT solution design]({{< ref "/posts/2019-06-05-home-grown-iot-solution-design.md" >}}) through [local development]({{< ref "/posts/2019-06-19-home-grown-iot-local-dev.md" >}}) and [DevOps]({{< ref "/posts/2019-07-22-home-grown-iot-automated-devops.md" >}}).

And with that, we're coming to the end of what I've built so far for my project and now it's time to start thinking about what I could do next with it.

## Visualisation and Reporting

This is the first thing that I want to target going forward with the project, some way to visualise the power generation. Right now, I'm just dumping the data into an Azure Table (see [the post on Data Design]({{< ref "/posts/2019-06-07-home-grown-iot-data.md" >}})) but not doing anything with it.

When it comes to the visualisation platform there's the question between build vs buy. I could create a series of charts and reports using [SVG's + React]({{< ref "/posts/2017-08-10-react-svg-chart-animation.md" >}}) but then I'll find myself in a situation where I'm going to be constantly tweaking the codebase or fixing bugs when the charts aren't quite right.

Instead, I'm going to invest in [PowerBI](https://docs.microsoft.com/en-us/power-bi/power-bi-overview?{{<cda>}}) which is part of the Microsoft platform and a really simple tool for creating reports from data sources.

### Data Cleanup

I have started playing with some reports in PowerBI and what it's lead me to realise is that I'm likely going to have to do some cleanup to the data to make it simpler to report on. Right now, I'm getting data every 20 seconds from the inverter so for a day I have a **lot** of data samples. The problem is that this data is so fine grade that it becomes difficult to have clean and consistent views across it.

Instead, it would be better to do a wider time slice that normalises the data, maybe aggregate it up into 10-minute chunks and take the mode of that time slice. This helps remove any noise from the data and produce a smoother view-over-time.

I'm yet to work out what'll be the best way to produce this normalisation of the data, but I'll be sure to blog it once it's done!

## Integrating Other Data Sources

Once you start producing a data set from a system you're monitoring it's worthwhile starting to think about other data sets that may provide greater context into the data that you've captured.

In my scenario of a monitoring solar energy generation, there's one really useful piece of context that I could capture, the weather!

By tapping into a weather feed and storing that alongside the readings from the inverter I would be able to do correlative data analysis and answer questions like _when the weather is sunny and it's midday I generate X kw/hr_.

This can then lead to being able to do anomily detection in my power generation. If I know what the weather is like I can **predict** the power generation, and if it doesn't match the expected ranges that could indicate an issue with my panels (they need cleaning, they have sustained damage, etc.).

And this is what is commonly referred to as Predictive Maintenance through IoT. On Microsoft Docs there is a walkthrough on [how to create this yourself](https://docs.microsoft.com/en-us/azure/iot-accelerators/iot-accelerators-predictive-walkthrough?{{<cda>}}) which I plan on looking into myself once I get to this phase of my project.

## Connected House

What's the end goal? A fully connected house!

If I'm able to predict the power generation then I could start optimising the utilisation of the appliances in our house. Are we generating at peak capacity? Time to run the washing machine and dishwasher.

Combine this with battery storage (something on the plans to purchase) and you can predict whether to run off the battery during the day because the weather indicates you could recharge before the solar generation stops, and sell all generated energy back to the grid, maximising profits.

Admittedly, this one is going to be a harder sell to my wife, but I want to have stretch goals! 😉

## Conclusion

I really hope you've enjoyed following this series as much as I have enjoyed making it.

I went into this project not knowing anything about IoT and planning on just running a console app on a Raspberry Pi and talking to an Azure Functions, but throughout the journey I got to explore into a bunch of the Azure IoT tooling and got to the point where I can now push a commit to GitHub and have it deployed to a Raspberry Pi within 20 minutes.
