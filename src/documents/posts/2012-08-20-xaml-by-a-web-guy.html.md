--- cson
title: "XAML by a web guy"
metaTitle: "XAML by a web guy"
description: "So I'm starting to learn XAML..."
revised: "2012-08-19"
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


  [1]: http://umbraco.com/help-and-support/video-tutorials/umbraco-fundamentals/razor.aspx