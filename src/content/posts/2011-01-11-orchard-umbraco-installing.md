---
  title: "Orchard & Umbraco - The install experience"
  metaTitle: "Orchard & Umbraco - The install experience"
  description: "A comparison between the install experience between Orchard CMS and Umbraco Juno"
  revised: "2011-01-16"
  date: "2011-01-11"
  tags: 
    - "orchard"
    - "umbraco"
  migrated: "true"
  urls: 
    - "/orchard-umbraco/installing"
  summary: "<strong>Official install documentation</strong>\n<br />\n<a href=\"http://orchardproject.net/docs/Installing-Orchard.ashx\" title=\"Orchard Install\">Orchard</a>\n<br />\n<a href=\"http://umbraco.org/help-and-support/video-tutorials/getting-started/installing-with-web-pi\" title=\"Umbraco Install\">Umbraco</a>"
---
# Overview

In this article I'm going to be looking at the install experience of Orchard and Umbraco and what are the differences between the two.

This is from a series in Orchard and Umbraco, [the overview can be found here][1].

# The Install Experience

For this article I've gone out and grabed the [Orchard 1.0 release][2] and [Umbraco 4.6.1 release][3] (Web Deploy version), and the first thing I noticed is that they are basically the same in terms of download size, with Orchard being slightly smaller, it's 7.08Mb where as Umbraco is 7.50Mb. This is nice, both are sub 10Mb (by a long way), and something I wouldn't have a problem storing in a source control system.

I'm going to use IIS Web Deploy for both installs, this way we're playing on a equal footing from the get go. I could have use the [Microsoft Web Platform Installer (Web PI)][4] for it, but at the time of writing the Umbraco instance in Web PI I found to be 4.5.2, which is not the latest stable (**Note: Since writing this post Umbraco Juno 4.6.1 is now available in Web PI**). For both products if it's your first install, or you're not someone who's familiar with IIS I'd **strongly** recommend that you use Web PI, in fact it's the recommended install process for both of them.

With both releases downloaded it's time to get started on actually installing.

## Configuring IIS

*For this I'm going to assume some basic IIS knowledge, and that you have [Web Deploy][5] already installed on your machine.*

The first thing that you need to do is create an empty IIS web site for each project (Umbraco does run in virtual directory, and I'm sure Orchard does to, but I want to run them as stand alone applications, that's how I would be using them in a production instance so it makes sense for me), I've created one called `orchard-v1` and one called `umbraco-461`:

![IIS][6]

Next you need to select one of the web sites (I'm starting with Orchard) and use Web Deploy to import the downloaded package.

## Installing Orchard

Once we kick off the Web Deploy install we get an overview of what Orchard is going to install, a nice simple overview:

![Orchard step 1][7]

Cool, it's nice and simple, just two folders that it needs to access, App_Data and Media, that's quite nice but I'm not sure what that means for plug ins (but that's an issue for another day :P). Click next and we'll work with the database which I can choose if I want to use an existing database or if we want to create a new one, or not have a database at all. I'm wanting to have the full experience, so I'm going to create a new database, this takes us to the next step which has a nice large set of options:

![Orchard step 3][9]

Now I can configure all my settings, Orchard wants to install into a virtual directory, so I've blanked out the first property as I want it to be in the root of the web site I created in IIS. I put in my database information and click next.

This brings us to the end of the IIS install in which I receive a nice overview of what was just done.

Sweet, Orchard is installed, now let's go onto Umbraco.

## Installing Umbraco

I start by selecting my Umbraco IIS web site, choosing to import from the downloaded package, and again we get an overview of what Umbraco is going to do:

![Umbraco step 1][11]

The first thing I think is **WOW**, that's a LOT of folders which Umbraco needs to configure permissions for! As an experienced Umbraco user I tend not to think twice about it, but someone new Umbraco might find this strange. The majority of these folders are required for the plugin support of Umbraco, and a bit of a by-product of there not being a 'simpler' plugin format (ie - a single folder where plugins would go). You can get away with changing many of those permissions later, but at the moment you have to accept it and move on :P.

Like with the Orchard install Umbraco will ask if you want to do a database or not. Again I'm going to choose to install a new database just as I did with Orchard. And just like Orchard theres a set of fields to set the path (again I want it at the root so I clear that field), the database information, etc:

![Umbraco step 3][13]

Something that's interesting about this form as opposed to Orchard I was only asked to enter the database passwords once each, where as Orchard asks you to confirm the database user password (and the admin password if you're created a new database too). There's benefits to both and there's annoyances to both so I wouldn't say that either is my preferred solution. I'll admit I didn't try putting in non-matching passwords so I don't know how Web Deploy would handle it vs a wrong password, but that's something for someone else to try out (this post is going to be long enough, I don't want to add every conditional branch into it).

Once I click next and Web Deploy finishes you get a similar summary as you get with Orchard (and which I wont bore you with the screen shot this time :P).

And that's it, we're done with installing our sites. Now we're going to configure our two web applications.

## Configuring Orchard

So I've fired up my browser and navigated to the Orchard site I just installed, first thing I'm given is an option to configure the site I just installed:

![Orchard step 5][14]

Hang on a sec, what's the prompt about databases, I thought I did that as part of the Web Deploy process? I would have expected that to be setup, oh well let's just select the settings again:

![Orchard step 6][15]

Hmm... not even the connection string information was set in there so I now have to manually enter a connection string, this is rather annoying as I've already gone through this with the Web Deploy process. At least the Orchard team have put in the information about what a connection string would look like that you can use as a template, because after all who remembers the format of a connection string without Google, sorry Bing :P.

Anyway I filled out all my settings, clicked Finish and bang, my website is ready for work:

![Orchard step 7][16]

Fantastic! Let's have a go at configuring our Umbraco install.

## Configuring Umbraco

If you've looked at Umbraco in the past you'll probably know that it's had a reputation as having an underwhelming install experience. It looked tired and wasn't really representative of the product that Umbraco is today. Well good news this has been revamped in Umbraco Juno, and the installer is looking very sexy indeed.

Umbraco first starts up with an overview of the installer steps that you'll be going through:

![Umbraco step 4][17]

Next we're presented with the license which Umbraco ships with ([MIT][18] if you're not going to read the picture):

![Umbraco step 5][19]

I quite like this (from an open source standpoint), since it's an open source project it's good to know what the license is up front. Orchard too is open source, but you have concerns about using open source having the license thrust in your face gives you a final chance to bail out. 

*On a side note I wasn't actually aware of what the Orchard license was, I didn't see a direct link from the home page (it's on the [Mission Statement][20] page though). It is quite prominent on the CodePlex site though, and it's the [New BSD license][21] if you're interested.*

Once you accept the license you move onto the screen where you configure your database. Like Orchard it doesn't seem to realise I did database setup steps already too, but unlike Orchard when I clicked 'Yes I have a database' the following form fields are already populated with my connection string information. Bit of a win on top of Orchard, I don't have to put it in again (assuming you're using MS SQL, I'm not sure what happens with the other database options). A nice side note on the database installer is that there are a few more options than with Orchard including MySQL, which I'm not sure if Orchard supports or not. This is obviously something to keep in mind for hosting provider choice too.

Moving on I am asked to set my admin details:

![Umbraco step 7][22]

Now that I've finished configuring my user I finally get to the point of choosing some defaults for my site. This is new in Umbraco Juno (well it's a revamp from what was previously available as starter kits):

![Umbraco step 8][23]

I'm going to use a blog, since the default Orchard install is a blog as well, and next I get to choose one of the default skin options:

![Umbraco step 9][24]

We're going with a basic theme which is similar to the one which is used by Orchard, again I'm trying to get the experience between the two as similar as I can.

And now we're finished, Umbraco gives us a finishing screen:

![Umbraco step 10][25]

From here you can launch into the back office or view the site that we're just installed:

![Umbraco step 11][26]

And we're done!

# Conclusion

Two CMS products, two different install experiences. I quite like the simple experience which Orchard provides you with, a lot of the time that I'm working with a CMS I'm not interested in starter kits or anything, I already have a set of requirements to work with and they don't match what comes with the starter kits.

That said though Orchard does install some basic content pages, and I don't know how you install without them (there was no obvious option I came across) and this is a bit annoying as once it's installed I have to go back and remove them anyway. It'd be nice if I could have a way in which you could install a completely blank Orchard instance (and if there is a way please let me know).

Umbraco on the other hand has a rather involved configuration process, and it has a number of different starter kits which you can choose from, or you can choose to install a blank site (sorry my screenshot cut that option out). For me this is a much nicer option since often I'm wanting a blank CMS. That said the configuration experience is a bit more tedious as it's quite verbose in the steps that you need to go through, which is both a pro and a con, it gives a lot of visibility, but if you're an experienced user like myself you've seen it all a thousand times before.

Both products have really polished looking install experiences, and in my opinion both have pros and cons. I like the simple, no-fuss experience of Orchard, but I am bothered by the fact that it didn't detect my database settings from the Web Deploy steps. Umbraco on the other hand did pick up the database information (to a certain extent) and has a much wider variety of starter kits for getting going, but it's a lot longer a process.


  [1]: /orchard-umbraco
  [2]: http://orchard.codeplex.com/releases/view/50197#DownloadId=197216
  [3]: http://umbraco.codeplex.com/releases/view/59025#DownloadId=197061
  [4]: http://www.microsoft.com/web/downloads/platform.aspx
  [5]: http://www.iis.net/download/webdeploy
  [6]: /get/orchard-umbraco/iis.png
  [7]: /get/orchard-umbraco/orchard-install/001.png
  [8]: /get/orchard-umbraco/orchard-install/002.png
  [9]: /get/orchard-umbraco/orchard-install/003.png
  [10]: /get/orchard-umbraco/orchard-install/004.png
  [11]: /get/orchard-umbraco/umbraco-install/001.png
  [12]: /get/orchard-umbraco/umbraco-install/002.png
  [13]: /get/orchard-umbraco/umbraco-install/003.png
  [14]: /get/orchard-umbraco/orchard-install/005.png
  [15]: /get/orchard-umbraco/orchard-install/006.png
  [16]: /get/orchard-umbraco/orchard-install/007.png
  [17]: /get/orchard-umbraco/umbraco-install/004.png
  [18]: http://www.opensource.org/licenses/mit-license
  [19]: /get/orchard-umbraco/umbraco-install/005.png
  [20]: http://orchardproject.net/mission
  [21]: http://www.opensource.org/licenses/bsd-license.php
  [22]: /get/orchard-umbraco/umbraco-install/007.png
  [23]: /get/orchard-umbraco/umbraco-install/008.png
  [24]: /get/orchard-umbraco/umbraco-install/009.png
  [25]: /get/orchard-umbraco/umbraco-install/010.png
  [26]: /get/orchard-umbraco/umbraco-install/011.png