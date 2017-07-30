---
  title: "Introducing Chauffeur"
  date: "2014-06-09"
  tags: 
    - "umbraco"
    - "chauffeur"
    - "deployment"
  description: "Introducing Chauffeur, a new classy way to delivery changes around Umbraco instances."
---

Over the last few months I've been tweeting out information about a new Open Source project for Umbraco I've been working on called **Chauffeur**. In this post I want to introduce you to what Chauffeur is and what it can do for you and your Umbraco projects.

# Elevator pitch

Deployment is hard, getting changes from one environment with Umbraco has never been an easy problem to solve. Need to add a new Document Type then you end up with manual steps in the web UI, parsing files on first request and compare to the database, backup/restore or a combination of any of these.

But really these 'structural items' (Document Types, Data Types, Templates, Macros, etc) are the kinds of things that are a deployment step, until they are done you can't really say that the new iteration of the site is ready.

Chauffeur comes at this problem from a different angle, to remove the human element from deployments. Be it deploying changed from one developers machine to another or from staging to production.

**You should be able to automate these changes with repeatable scripts that can be run before the website comes up.**

Basically Chauffeur is a console application which you can run without having to start IIS to interact with Umbraco instances. So remove the human factor from doing your deployments. Make it simple, make it automated and make it repeatable.

## Screen Cast

Because a picture paints 1000 words I decided to also do a simple screencast of Chauffeur, check it out, then continue reading to get a fuller picture.

<iframe width="420" height="315" src="//www.youtube.com/embed/sG5xbqnZc5k" frameborder="0" allowfullscreen></iframe>


# Hello Chauffeur

At its core Chauffeur is a .NET host for Deliverables, which are _something_ for Chauffeur do. This host can be hosted anywhere but the primary host is a console application, `Chauffeur.Runner.exe`. The executable is then run from inside the `bin` folder of your Umbraco instance so it can load up the whole Umbraco API.

So like I said you have Deliverables and this is something that Chaffer does it could be:

* Installing the Umbraco database
* Import Data Types/Document Types/etc
* Provide information about the Document Types in your instance

## Chauffeur.Runner

When you want to use Chauffeur you start it up with the `Chauffeur.Runner.exe`, this console application gives you a simple command prompt:

![Chauffeur Prompt](/get/chauffeur/prompt.PNG)

From here you can execute a Deliverable, in this case I've used `help`:

![Chauffeur Help](/get/chauffeur/help.PNG)

So from `help` you can see all the Deliverables that are available, you can write your own too! In fact Chauffeur uses the same `TypeFinder` that Umbraco itself uses so discovery is done like in Umbraco itself.

## Deliverables

The core of everything is the Deliverable and everything in Chauffeur is a Deliverable, including the Help system and `quit`!

What a Deliverable does is entirely up to the author of it, you've got access to the Umbraco API's... within reason, you won't have anything that depends on `HttpContext` because well... it's a console application! You can access the Umbraco API's via constructor injection as Chauffeur has its own IoC container.

A Deliverable has a name and option aliases. The name is the _primary_ way you call it and it's expected to be unique. Aliases are more like fall backs, only if a name isn't found for what you typed in will Chauffeur look for an alias.

Let's say we use the `install` deliverable, it'd go like this:

![Chauffeur Install](/get/chauffeur/install.PNG)

First of Chauffeur looked for a connection string (no connection string, it won't work) and then at the provider. In the sample above I've used SQLCE and I didn't have a `sdf` file on disk so Chauffeur has prompted to create one (if you're not using SQLCE you'll need to have the DB already on the server, or create a Deliverable to do that :P) and then it goes aheaad and runs all the Umbraco database scripts to create you an empty database. All of this **is done via a console application** so you didn't need to start IIS to achieve it!

# Deliveries

One of the goals of Chauffeur was the be automated so while being able to fire up a console application and type commands into it that's not particularly automated so for that you can do one of two things:

1) You can pass the name of the Deliverable via the CLI
2) Use the `delivery` command

## The `Delivery`

This is a unique Deliverable in that it doesn't do anything against Umbraco _directly_, instead you create a Delivery file which is a series of Deliverables to be executed, like so:

    ## 001-install.delivery
    install y
    user change-password 0 default my-secret-password
    package DataTypes
    package DocumentTypes
    package Macros

So this delivery will install Umbraco (and the `y` flag will be passed to the prompt to create a SQLCE file) then update the user password then import a series of Data Types, Document Types and Macros.

When running the `delivery` Deliverable:

    umbraco> delivery

It will do a scan of the Chauffeur directory (`App_Data\Chauffeur`) for all `*.delivery` files, order them by their name (which is why I've used a numerical prefix) and then execute each Deliverable one-by-one.

Once it completes it then tracks that the delivery has been run and it **won't run it again**, so if you keep using `delivery` one an environment it won't try and delivery deliveries that have previously been delivered!

The idea is that you check all your `*.delivery` files into source control (maybe do something smarter around the user password though...) so you can then get everything from source control and easily setup the whole environment without the need for database backup/restore processes.

# Getting Chauffeur

Chauffeur is _currently_ only available as a set of NuGet packages, the [Chauffeur](https://www.nuget.org/packages/chauffeur) and [Chauffeur.Runner](https://www.nuget.org/packages/chauffeur.runner) are separate so if you want to write your own Deliverables you don't need the `exe`.

Chauffeur also requires you to be using Umbraco 7.1.1 because there have been a few bug fixes and more importantly the new Membership API.

You can also get the latest build via the NuGet feed from our [build server](https://ci.appveyor.com/nuget/chauffeur-lhiitmat2vwj).

Finally this is an Open Source project and you can [find it on GitHub](https://github.com/aaronpowell/Chauffeur) including more documentation.

# Conclusion

I'm really excited by Chauffeur and the idea of doing automation of deployments with Umbraco in a way which doesn't require user interaction.