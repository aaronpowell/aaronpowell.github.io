+++
title = "Using Flow to monitor Have I Been Pwned"
date = 2017-10-09T18:30:44+11:00
description = "How I'm using Microsoft Flow with HIBP to notify me of breaches"
draft = false
tags = ["flow", "automation"]
+++

I, like many people, use [Troy Hunt](https://troyhunt.com)'s [Have I Been Pwned](https://haveibeenpwned.com) to notify me when my account was in a data breach.

While the email notification is fine it doesn't really fit into my workflow and honestly I get that much email it's just another thing that is picked up by Clutter and filtered out of my inbox. Because of this it's often days before I even find out I was in a breach, not really ideal.

Because of the amount of email that flows through my inbox I'm constantly trying to work out what's the best way for me to bubble up the actions I need to take and then track them, as opposed to the stuff that I'll read _eventually_ (ok, never). I've played around with a couple of different ways to do this and at the moment I'm giving [Microsoft Todo](https://todo.microsoft.com/) a crack. In Todo I have all the opportunities I'm tracking as part of my [Technical Pre-Sales role]({{< ref "/posts/2017-09-27-readify-pc-12-months-on.md" >}}) as well as a bunch of personal things I need to follow up on. So this sounds like an ideal place to put my "change password cuz you were in a breach" task.

## Enter Microsoft Flow

When I want to do simple automation I crack out [Microsoft Flow](https://flow.microsoft.com/) which is a great tool to monitor a bunch of different kinds of inputs and then perform actions when triggered. So I set about a plan to combine Flow and HIBP, I wanted to:

- Have a new breach trigger a Flow
- If i'm in the breach pop an item in my todo list
- ???
- Profit

## Creating our Flow

Right, so the first thing I need to do is be notified of a breach. Now you could do this with an Email connector in Flow and look for incoming emails from HIBP but that's a bit risky, do you fuzzy match the subject? look for a from address? hope that it's landing in your inbox (which mine doesn't)?

Or do you go simple and subscribe to the [RSS feed](https://feeds.feedburner.com/HaveIBeenPwnedLatestBreaches)?

I've chosen to go for an RSS approach in Flow, it's really simple and does exactly what I want. Only down side, it'll trigger on **every** breach, not just when I'm in it.

## Am I pwned?

So we're being notified of a breach, now to work out if I was in said breach. Again Troy has made this pretty easy for me because he has an [API for HIBP](https://haveibeenpwned.com/API/v2) that is not only free, but really simple to use.

I'm going to need to make 2 API calls, first one is to the [the breach details](https://haveibeenpwned.com/API/v2#SingleBreach), which I'll need to get the domain so I can pass it across to the [breaches for account](https://haveibeenpwned.com/API/v2#BreachesForAccount) API call (I have the `Parse JSON` Flow step between these so I can get the values out of the response). This will return a `200 OK` if I was there or a `404 Not Found`.

## Raising a Notification

With that the basic structure of our Flow is done, we're about to perform some kind of notification when you were in a breach, you could do a Push notification or send an email (:stuck_out_tongue:), or as I want to do, push something across to Microsoft Todo!

### Getting Started with Outlook Tasks

Unfortunately, at the time of writing, Microsoft Todo doesn't have a Connector in Flow, so instead you've got to this all yourself. Thankfully there's a [detailed API](https://msdn.microsoft.com/en-us/office/office365/api/task-rest-operations) for Microsoft Todo, which just happens to be Outlook Tasks under the hood.

The simplest approach to this is to just HTTP Action and you're set to go... almost. There is one tricky thing to deal with still, authentication. You see, you need to provide an `Authorization` header to the Outlook API so you can work with it... kind of makes sense.

Again the simplest approach would be to use something like [Postman](https://www.getpostman.com/) to generate you a token, but that token will only last for a short period of time, so chances are you'll need to generate a new one each breach.

Instead I've created a [custom Connector](https://flow.microsoft.com/en-us/documentation/register-custom-api/) in which I can define my Authentication type (OAuth2.0 in this case) and set the appropriate details for your Office Application, and then you're good to define the Flow Actions against the Office Tasks API. I've created one that wraps around the [Create Task API](https://msdn.microsoft.com/en-us/office/office365/api/task-rest-operations?f=255&MSPPError=-2147217396#create-tasks), defined some default parameter values on the body (because don't want to type the date time local each time) and now you're good to go!

## Bringing it all together

Here's how the flow looks:

![All the flow](/images/flow-hibp-todo/flow-for-hibp.png)

The values I've set for the Todo item that's created are:

- Subject of `Update password for <domain>`
- Start Date of `<added date>`
- Due date of `<added date + 1 day>`

And there we have it, you're good to go!

## Conclusion

Well it was really simple for us to introduce a Flow that will track breaches in HIBP and if you're in it perform some kind of action, in my case create a task in Outlook Tasks using a custom Flow Connector.

If you're interested to have a play with it I've exported the Connector:

{{< gist aaronpowell a2f87eefcff320df39645c3570584599 "outlook-tasks-connector.json" >}}

And the Flow itself (although you'll need to re-map the Connector once uploaded), make sure you set **your email address** in the step where we call HIBP's API:

{{< gist aaronpowell a2f87eefcff320df39645c3570584599 "flow.json" >}}

Happy automating.