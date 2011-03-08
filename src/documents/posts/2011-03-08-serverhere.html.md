--- cson
title: "ServerHere - When you just need a webserver"
metaTitle: "ServerHere - When you just need a webserver"
description: "A tool for when you just want to server some files."
revised: "2011-03-09"
date: "2011-03-08"
tags: ["web"]
migrated: "true"
urls: ["/serverhere"]
summary: """

"""
---
I've been doing a lot of JavaScript development recently and as cool as [jsfiddle][1] there's a few things that really irk me about it (which is a topic for another day) and sometimes you just want to run the file locally to see how it goes.

So you go and create a HTML and JavaScript file on your file system and you open it in your browser and you have that crazy file system path in your address bar. Most browsers this is fine for, but IE likes to try and be a bit more secure so I'll often see this:

![IE security warning][2]

Sure you can change IE's security settings to be a little less aggressive and not give you that warning but I quite like that my browser is trying to be a bit secure, I don't see why that's such a bad thing.

But it can be a pain, if you don't accept the security warning your JavaScript doesn't work.

There's several ways I could go about solving this problem, I could use Visual Studio and IIS Express (or Cassini if you're old-school :P), I could map my local IIS install to that folder or I could write my own web server.

Guess what I did!

# ServerHere

If you guessed that I wrote my own web server then you guessed right. I've created a little project called **[ServerHere][3]** which does exactly what the name implies, *creates a web server from the current folder*.

It's a commandline tool and you use it just like this:

    PS> cd c:\SomeFolderToServe
    PS> c:\Path\To\ServerHere.exe

And there you go now you'll have a server running at `http://+:8080` (meaning `localhost` and machine name will work).

If you want to change the port it runs on you'll need to run it as an administrator and then run it like this:

    PS> c:\Path\To\ServerHere.exe /p:1234

Now it'll run on port `1234` rather than `8080` (or `6590` which is  the default administrator port, just to avoid potential conflicts).

# Conclusion

Go, [grab the source][4] and create web servers to your hears content!


  [1]: http://jsfiddle.net
  [2]: http://www.aaron-powell.com/upload/Render/javascript/ie-security.PNG
  [3]: http://hg.slace.biz/serverhere
  [4]: http://hg.slace.biz/serverhere/src