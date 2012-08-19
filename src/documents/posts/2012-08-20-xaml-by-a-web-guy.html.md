--- cson
title: "XAML by a web guy"
metaTitle: "XAML by a web guy"
description: "So I'm starting to learn XAML..."
revised: "2012-08-20"
date: "2012-08-20"
tags: ["xaml"]
migrated: "true"
urls: ["/xaml/xaml-by-a-web-guy"]
summary: """

"""
---
A few weeks ago a new project came up at work which I moved onto, a project which is XAML based.

Now I'm very much a web guy. If you read my blog you'll know that I spend more time blogging about JavaScript than anything else. But in an effort to be a better developer I thought it was worthwhile diving into the other kind of angled brackets and give this thing ago and I want to share some thoughts of mine having spent two weeks doing XAML development.

## XAML is verbose

Oh... my... god.

I've spent my entire development career doing HTML, and quite a lot of that I spent doing HTML with Umbraco, which obviously meant that I was writing a lot of XSLT (this was about 4 - 5 years ago, when there was [no alternative][1]) and in comparison to XAML XSLT is a shinny pillar of conciseness.

I can only assume that this is why there are two GUI tools for generating XAML, having to hard-craft complex XAML files would be time consuming beyond belief (although from my understanding most people *do* hand craft them as the GUI tools are pretty flaky). Here's an example:

    <ObjectAnimationUsingKeyFrames Storyboard.TargetProperty="(UIElement.Visibility)" Storyboard.TargetName="someElement">
        <DiscreteObjectKeyFrame KeyTime="0">
            <DiscreteObjectKeyFrame.Value>
                <Visibility>Visible</Visibility>
            </DiscreteObjectKeyFrame.Value>
        </DiscreteObjectKeyFrame>
    </ObjectAnimationUsingKeyFrames>

That's a snippet from a visual state to change an element from hidden to visible. Now this is how to do it in XAML, which leads me to my next point.

## A dozen ways to skin a cat

Visual states are really cool, they are quite powerful to do the various amounts of animations that we're using in our application but to me they are really clumsy to write (seriously, you're looking at dozens of lines of XAML to make even a simple state of hiding a few elements and showing a few elements). This is where something like Blend comes into play (when it's not crashing), it's quite easy to create a simple visual state.

Alternatively I could use code to manually manipulate those properties, it's much more concise to do so (1 line vs the above 7) but then you're ending up with stuff in your code behind or you're loosing the power of animations.

And then there's binding...

## Bindings

Oh... my... god.

I don't understand how XAML, in any of it's four incarnations, doesn't have a better solution for this. Back on our Visual States, say I've got a multi-stage form, each stage has a new Visual State to show the appropriate fields, well logically I'd want to use an enum to set the current step and be able to tie that back to the UI... Right?

Yeah you'd think so, but no. There's no way in the box to do the mapping between an enum and a Visual State. You end up with a lovely whack of code behind that watches for property change events and calls visual state transitions. Woo...

## Events

I come from a world of the DOM where event wireup is pretty fucked. IE always did it one way, really old IE did it another and then there was the spec. The only nice thing was there was only one *type* of events. XAML though seems to have two independent eventing models, *traditional* .NET events and commands. Both seem to be first-class citizens, but commands seem to have been conceived outside of wedlock and thus treated like a bastard.




  [1]: http://umbraco.com/help-and-support/video-tutorials/umbraco-fundamentals/razor.aspx