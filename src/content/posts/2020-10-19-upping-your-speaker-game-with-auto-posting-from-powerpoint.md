+++
title = "Upping Your Speaker Game With Auto Posting from PowerPoint"
date = 2020-10-19T09:28:16+11:00
description = "Solving problems no one has with tools they don't need!"
draft = false
tags = ["public-speaking"]
+++

Last week I was procrastinating on my talk for [NDC Sydney](https://ndcsydney.com) and realised I had a lot of links that I wanted to share with people who would be watching the session, but wasn't sure what would be the best way to do it. As a virtual event, NDC had a slack channel for the conference, so it'd just be a case of putting the links in there.

But I started to wonder, how could I make it a bit more interesting, and then I remembered that a couple of weeks ago I came across this tweet from [Scott Hanselman](https://hanselman.com/)

{{<twitter 1305520517529567233>}}

As someone who's been doing a bunch of stuff with OBS, I liked the idea, it's a nifty way to change up the experience when presenting and giving the audience something different compared to your traditional picture-in-picture view.

And this gave me an idea, since we can use the PowerPoint interop API to read the notes, why couldn't we use it to push to Slack instead?

So, I built that. You'll find the code on GitHub for [PowerPoint to Places](https://github.com/aaronpowell/PowerPointToPlaces), along with some instructions on how to get it working.

{{<video "/images/powerpoint-to-slack.mp4">}}

Feel free to give it a try, but be aware that it's written by me, for me, so I make no claims that it'll work for you, but if people think it'd be a useful tool, let's make it more general purpose!
