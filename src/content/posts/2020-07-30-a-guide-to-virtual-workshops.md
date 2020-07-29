+++
title = "A Guide to Virtual Workshops"
date = 2020-07-30T04:55:27+10:00
description = "I recently ran my first virtual workshop and wanted to share how I did it and some thoughts I had on doing it"
draft = false
tags = ["public-speaking", "conference"]
cover_image = "/images/a-guide-to-virtual-workshops/003.png"
+++

Since the COVID-19 pandemic started I've done a number of virtual events (I shared my thoughts on being successful with them [last week]({{<ref "/posts/2020-07-20-online-events-experience-from-three-perspectives.md">}})) but earlier this week I did something new, I ran a two-day workshop as part of the [NDC Melbourne](https://ndcmelbourne.com) virtual event programming.

{{<tweet 1287549519786151936>}}

The workshop was the [React for Beginners workshop]({{<ref "/talks/react-workshop.md">}}) that I've been running as part of NDC Sydney for the past few years (and originally created with [Jake Ginnivan](https://twitter.com/JakeGinnivan)) but normally it's done in person in person, so I wanted to do a write up on how I ran it virtually, what worked and where I feel there's room for improvement.

## Considerations for Online Workshops

When I was getting prepared to deliver the workshop there were a few things that I started to consider on what would make the experience as seamless for attendees. Since I'm pretty familiar with how to deliver the workshop in person, I wanted to try and replicate as much of a normal experience as I could, even though I wasn't able to walk about the room and talk to people.

The first thing to think about is how would I engage with the attendees. I mentioned in my [online events post]({{<ref "/posts/2020-07-20-online-events-experience-from-three-perspectives.md">}}) that you can run an event in one of two formats, conference call or broadcast. Since a workshop should be an interactive experience a conference call format is the optimal way to go, I can see the people (if they turn on their camera) and we can talk to each other. NDC uses WebEx as the platform for this (I did have an option for Zoom, but WebEx is their preferred), it does what you need it to do, but _personally_ I would avoid WebEx as a platform as I found it clunky to use and the desktop app error prone (I ended up running it in the browser which was more stable).

The next consideration I had was how would we make it optimal for people to see the slides and code as I share it. Having been on both sides of virtual tech presentations I know what it's like when the text is hard to read because I forgot to bump the font size, but then you also need to consider latency and visual artefact on the stream, will the text be legible? So, you need to think about what the best way for everyone will be to ensure they can watch what you're presenting.

Finally, since the workshop is hands on, attendees build something throughout, I needed to think through what options we'd have to replace the normal experience of an instructor coming and sitting next to them to pair on a problem.

## Setting Up a Studio

I've been doing some video stuff recently (including streaming every Friday on [my Twitch channel](https://twitch.tv/NumberOneAaron)) so I've been learning about how to use [OBS Studio](https://obsproject.com/). OBS (Open Broadcast Software) is an open source application for creating video streams and gives you the ability to take different inputs, combine them together, produce a single output feed. It can be a bit daunting to get started with but you'll find plenty of videos on YouTube ([here's a good starting point](https://www.youtube.com/watch?v=EuSUPpoi0Vs)) and once you get the basics down, it's really fun to see how you get set everything up and make you look professional.

### Camera

For the workshop, I was presenting from my home office which looks like this.

![My home office](/images/a-guide-to-virtual-workshops/001.jpg)

This room use to be our baby room, before our kids started to share, but it still contains some of the facilities of being a baby room, like the nappy change table, one of their wardrobes, and generally, piles of junk. This isn't really what I wanted everyone to have to deal with in my background (and I don't need it for calls that I'm on or when I'm streaming), but I don't have the facilities to setup a green screen behind me, since there's a door in the way.

Thankfully, there's a solution to that, a **virtual** green screen. Early on in the pandemic one of my colleagues introduced me to [XSplit VCam](https://www.xsplit.com/vcam), which runs as an interception of your webcam feed and allows you to do things like background blur, virtual backgrounds or background removal. It's not perfect, as it's using image detection to work out where a person is in the image and do removal of everything else, but it's good enough. Using XSplit with a virtual background I now look like this:

![Look, no background!](/images/a-guide-to-virtual-workshops/002.png)

You can see the edges of me are fuzzing out, but overall, it's a better picture than the junk background. If you can smooth out what's behind you (I closed the wardrobe and draped a solid-colour towel over the hanging stuff) then it'll become even better. It might not be as good as a proper green screen but it's a lot simpler to use!

### Presenting

When it comes to presenting online, you'll share your screen (or share an app) and everyone sees that in full screen, but the cameras are pushed away to focus on the content. This starts removing the personalisation aspect of the session as you lose the connection to the presenter. Not ideal if we're going to be spending two days together on a call.

To tackle this, I decided to change the presentation format up from a screen share to creating using a virtual camera.

![Presenting setup in OBS](/images/a-guide-to-virtual-workshops/003.png)

Using OBS I created a scene which is made up of three components, my camera feed via XSplit with background removal, a background image for NDC Melbourne and my screen. I layered my camera on top of everything so I'm now sitting in front of the slides (or code) and can talk to the slides just over my shoulder.

I then created another scene for when we were in code which increased the size of the shared screen and decreased the size of me.

![Coding scene](/images/a-guide-to-virtual-workshops/004.png)

With these two scenes I, as the presenter, was clearly visible the whole time making it easier to maintain a connection to the audience, even though I can't see them.

Lastly, this video feed needs to be sent back out over the presentation platform (WebEx in this case), and to do that you'll need a virtual camera plugin for OBS. [Scott Hanselman](https://twitter.com/shanselman) has a [great post on how to set this up](https://www.hanselman.com/blog/TakeRemoteWorkerEducatorWebcamVideoCallsToTheNextLevelWithOBSNDIToolsAndElgatoStreamDeck.aspx) and I went down the route of using NDI to expose the feed from OBS and then NDI's virtual camera to send the feed over the call.

#### Downsides to Virtual Cameras

Mostly, this approach worked really well for us, but there is a downside to using a virtual camera rather than traditional screen sharing, and that is that conference call software is designed to have the person who's speaking as the camera in focus. This can be a problem when your camera is **also** your presentation medium, since if someone else's audio comes in (they ask a question or they aren't on mute and make a noise) all of a sudden your camera is defocused and people can't follow along.

My tip here is to have everyone on mute _by default_, so that you are considered the active speaker, or if your software allows it, get people to pin the camera view of you. You'd best doing a tech check or two to practice just how it'll work and what your attendees will see so you can be prepared to help someone through a loss of video.

### Lightening the Load

Anyone who's used OBS, whether it's to stream coding or gaming, will know that it can be heavy on system resources, combine this with an app doing virtual a green screen, running a browser + editor + whatever tooling you need and finally, connecting to the call you're presenting on, well you need to have a pretty powerful machine.

Alas, I don't have that. Sure, I've got a top-spec'ed Surface Book 2, but it isn't quite powerful enough for all this stuff (as you'll may have seen if you've joined any of my Twitch streams). So, I needed to think creatively here, or I would fall back to the obvious solution to just simplify my life and not try and run a production studio in conjunction to the call.

Enter NDI.

[NDI](https://en.wikipedia.org/wiki/Network_Device_Interface), Network Device Interface, is a standard for sharing audio and video over a network connection. If you want to splash some cash you can buy devices that you connect as an external monitor that then makes it available as a network source to OBS, but I don't have a \$1000 to spend, so instead we'll go with a software solution, [OBS's NDI plugin](https://obsproject.com/forum/resources/obs-ndi-newtek-ndi%E2%84%A2-integration-into-obs-studio.528/).

Using this plugin, you can expose OBS from one machine to be received by another machine on as an input to NDI's virtual camera. This means that I no longer needed to connect to WebEx on my laptop, and instead have that running on a separate device, freeing up some CPU cycles for everything else. This also meant that I had a level of redundancy. If my laptop that's running the slides/demo went offline, it didn't kill the call, I could still chat with attendees while doing a recovery on my main device (thankfully it didn't happen, but it was in the back of my mind), similarly if the call dropped I could re-connect and the screen would easily come back up at the exact correct place.

This did mean that my Surface Book 2 was outputting an NDI stream over my wifi network to my Surface Pro4 that was turning it into a webcam to push out via WebEx. Yeah, totally not an over-engineered setup at all! 😂

## Improving Accessibility

One of the biggest hurdles with online events is accessibility. I'm lucky to have a decent (by Australian standards) internet connection at home, a large screen, good hearing and vision, but not everyone is in the same situation. And also, given that it was two days online I was anticipating that at some point the video would lose frames and the quality would drop, I wanted some way to ensure that the attendees would be able to still read what I was presenting.

### PowerPoint

I was presenting the slides out of PowerPoint and this gives you some options in how you can improve access to the slides for attendees. If you're on a Windows machine you can use [Office Presentation Services](https://support.microsoft.com/office/broadcast-your-powerpoint-presentation-online-to-a-remote-audience-25330108-518e-44be-a281-e3d85f784fee?{{<cda>}}), which allows you to start a presentation and then share a URL to the slides to the attendees. Attendees can then connect in their browser and watch along as you move through a deck, as well as download the slides (if you enable it). Alternatively, if you have a Microsoft 365 account you can use [Live Presentations](https://support.microsoft.com/office/present-live-engage-your-audience-with-live-presentations-039aa2cc-67fa-4fb5-9677-46ed8a060c8c?{{<cda>}}) which works similar, but gives you a QR code for the attendees to scan (as well as the URL), live transcription and reactions. The transcription feature even offers the viewer the ability to change the language that the transcription is played in, so if English isn't their preferred language, they can optimise for their experience.

The only downside of this was that all the hard work I'd put in to creating a fancy scene setup in OBS and stung together with NDI so that they still had a connection to the talking head was put aside, but that's a minor point when it comes to improving the accessibility of content for your audience.

### Code

As you might've noticed in the screenshot above of my editor, I have a rather random colour pallet in use. I figure that an editor is somewhere I'm spending a lot of time, so why not make it bright and fun, so I switch between a few really whacky themes, but I do appreciate that this isn't everyone's preference, we all have the font size just right, the colours that work best for us and windows docked where they need to be. Also, as I mentioned above, the chance of a degraded video quality is high, and you don't want people to fall behind because they're dropping frames.

To reduce this barrier we can use [Visual Studio Live Share](https://visualstudio.microsoft.com/services/live-share/?{{<cda>}}) which is a service that allows you to setup a remote connection into your editor that anyone can join and collaborate in (or watch if you make it read-only). The best part is that while I might be using VS Code, others can use Visual Studio or just connect in the browser, meaning that people could follow along in _their_ preferred experience, not in what you deem to be optimal. When I was talking with some of the attendees, one made a comment that they found this useful as they could then go exploring the codebase themselves, which I hadn't thought of as a benefit, but it meant if they wanted a reminder of how we did something earlier, they didn't need me to swap to a different file, they could just do it themselves.

Another idea with Live Share, which we didn't use this time but I want to try in future, is that attendees can share **their** editor with the teacher, allowing you to pair through a problem, just like you would do in person by sitting with a student.

## Hitting the Ground Running

Having run this workshop in person a few times I know that one of the challenges that we always faced is ensuring that people were able to start writing code quickly, and not spending time installing software and getting an environment setup. When you're in person you can easily sit with someone and work through an error they are receiving, but it's a lot harder when it's virtual, so to streamline the process make sure that you have a really comprehensive setup guide that people can follow before you get started. Detail out potential error messages that will come up and how to work through them, so that people can be as ready as possible before getting started.

Another option worth exploring (but wasn't viable for _this_ workshop) is using [Visual Studio Codespaces](https://visualstudio.microsoft.com/services/visual-studio-codespaces/?{{<cda>}}) or [VS Code Remote Containers](https://code.visualstudio.com/docs/remote/containers). Both of these options allow you to configure the development environment and have it ready to go with all needed dependencies and extensions (for VS Code) so that people don't need to worry about _what version of the runtime do I need?_ issues. There is a limitation of people either needing an Azure account (since Codespaces isn't free) or Docker to run a container, but if your tool chain is complex, maybe it's a small price to pay to save setup complexity.

Also, consider recording a welcome video for your attendees. Introduce yourself and the workshop to them, talk to them about what they'll learn, cover off the setup guide, setup ground rules, etc. so that people are as prepared as they can be coming into day one.

## Be Interactive

This is the biggest learning I took away as a teacher, just how much harder interaction is in a virtual workshop. People can be shy and not want to speak up on a call, I can understand that, so it's up to you as the instructor to foster interaction with participants.

Look to leverage things like polls or quizzes throughout the workshop so that people can test their knowledge. Avoid asking questions of the floor and instead ask directly to an attendee. These are two things I didn't do and looking back it was a missed opportunity.

But also deviate from "the script" to inject some personality. I changed my VS Code theme throughout the workshop to mix it up and then talked about different themes. I got sidetracked when looking for something in search results and started talking about a random topic instead. My kids pop their heads in because they were at home and bored because it was raining. I joked with one of the attendees who was in the UK, so they were doing the workshop from midnight to 8am about having lunch at 4am is simply weird.

## Conclusion

Online workshops are hard, much harder than a normal presentation because you are no longer able to sit with your students and just check in with them, but there are things you can do to make it a bit easier.

Think about how you're going to feel connected with the attendees. Sure, I might have had an over-engineered setup in place, but it was a bit of fun and injected some of my quirky personality into it.

Think about how you can improve accessibility. Leverage tools like presenting your slides on a publicly accessible URL and using Live Share for everyone to jump into your editor.

Think about how you can simplify everyone's setup experience, remembering that you're unlikely to be able to see their screen and help them debug, so give them the tools beforehand. Or, if it's possible, pre-provision an environment with Codespaces or a Dockerfile.

Think about how to be interactive. I realise now that I wasn't as interactive as I should've been, so it could've been a very long two days of people watching PowerPoint and someone code. So, make sure they feel a part of the event.

Lastly, have fun. It's a long time to be learning but if you're having fun as a teacher that'll impart on your students.
