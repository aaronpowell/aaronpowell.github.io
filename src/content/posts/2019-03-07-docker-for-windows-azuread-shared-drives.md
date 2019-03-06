+++
title = "Docker for Windows AzureAD and Shared Drives"
date = 2019-03-07T09:03:55+11:00
description = "How to share drives when using AzureAD to log into Windows"
draft = false
tags = ["docker"]
+++

Now that I [work for Microsoft]({{< ref "/posts/2019-01-14-starting-2019-with-a-new-job.md" >}}) I have a device that I sign in using Azure Active Directory (AzureAD or OrgID) rather than the Microsoft Account (MSA) that I use to use.

When setting up a new device I went to share my disk to Docker for Windows so I can mount volumes. Unfortunately there is a [bug in Docker for Windows with authentication using AzureAD](https://github.com/docker/for-win/issues/132).

Everyone's solution seems to be to create a local admin account, which I find unappealing. A local account means it's not sync'ed anywhere and I run the risk of losing stuff when I format a device.

My solution? Add my MSA to the device and set it as an administrator level account. A quick login using that account, then a log straight back out (I don't intend to use that account anyway) and back to my AzureAD login. Now I can share the volume, enter my MSA credentials, and we are done!

So next time I'm setting up a device to use AzureAD as the login I'll also add my MSA as an admin just so I can share a volume to Docker. Seems overkill, but 🤷‍♂, you gotta do what you gotta do.