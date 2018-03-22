+++
title = "Integration Testing Umbraco With Chauffeur"
date = 2018-03-22T10:51:52+11:00
description = "How to use Chauffeur to make it easier to create integration tests against the Umbraco API"
draft = false
tags = ["umbraco", "chauffeur"]
+++

One of the design goals of [Chauffeur](https://aaronpowell.github.io/chauffeur) was to make it easy to extend, and that was the reason why I separated the core of Chauffeur out of the console application that you use to interact with it, resulting in the two NuGet packages. This means that really all the power of Chauffeur actually resides within the [`Chauffeur`](https://nuget.org/packages/Chauffeur) package and the runner really just creates an instance of the core class in there, `UmbracoHost`.

Some time ago when I was trying to work out how to avoid some nasty regressions I hit across Umbraco versions I decided to create a suite of [Integration Tests](https://github.com/aaronpowell/Chauffeur/tree/master/Chauffeur.Tests.Integration) to go along with the Unit Tests that I already had in there, but in doing so I'd need to "start Umbraco", but I didn't want to be running IIS Express because it would just be really hard to interact with.

I decided to see just how far I could push Chauffeur to help with this, I mean, I was already pretty familiar with how Umbraco works internally and that I was essentially starting Umbraco in the console application, so it got me thinking, could I start Umbraco in a test runner?

Long story short, yes, yes I can run Umbraco in a test runner! I won't go into the details of that here, it's kind of convoluted what you need to do, but you can see on my CI server that it _just works_.

Last month when I was up at [uduf](https://uduf.net) I was talking with people about testing Umbraco and how I was doing it with Chauffeur. One of the people I chatted to was [Nathan Woulfe](https://twitter.com/nathanwoulfe), author of [Plumber](https://github.com/nathanwoulfe/Plumber), an Umbraco workflow tool. Together we've started working on [Chauffeur integration for Plumber](https://github.com/nathanwoulfe/Plumber/tree/chauffeur), but last week I saw him tweet this:

{{< tweet 974530297176907776 >}}

Well I saw a challenge, I know I can use Chauffeur to test Chauffeur, but could I use Chauffeur to test someone elses library?

A night on the couch and a beer later I replied with this:

{{< tweet 974598409893044224 >}}

:tada:

Admittedly it was pretty hacky to do so my next goal was to make it easier.

## Introducing Chauffeur.TestingTools

Today I published a preview build of a new NuGet package, [`Chauffeur.TestingTools`](https://www.nuget.org/packages/chauffeur.testingtools), which will be part of the Chauffeur v1.1 release that I'm working on at the moment.

This NuGet package extracts the logic that I had in my Integration Tests into something that's more generic (I even ported my [Integration Tests to using it](https://github.com/aaronpowell/Chauffeur/commit/325180bc7ce9da7edc8d7d203a7e86052bc95500)!).

## Creating Umbraco integration tests with Chauffeur.TestingTools

So what do you get with this package? Right now you get an abstract class called `UmbracoHostTestBase` which you inherit from to:

1. Set up a location for the SQL CE database that is unique to that test run
2. Starts Chauffeur with fake input and output streams that you can interact with

Let's look at a basic test:

```csharp
public class HelpTests : UmbracoHostTestBase
{
    [Fact]
    public async Task Help_Will_Be_Successful()
    {
        var result = await Host.Run(new[] { "help" });

        Assert.Equal(DeliverableResponse.Continue, result);
    }
}
```

That. Is. All.

The `UmbracoHostTestBase` uses its constructor to setup everything because that's how [xunit works](https://xunit.github.io/docs/shared-context.html#constructor). Now I don't dictate that you use xunit, if you use anything else I'd love to know how you go and if it doesn't work so we can work together to make it compatible.

The class then exposes the Chauffeur "Host" as a `Host` property that you can execute Chauffeur commands against.

### Working with IO

Let's say you want to read the output of your deliverable? Easy, there's a `TextWriter` property that uses the `MockTextWriter` class I ship and it exposes all the messages written by `WriteLineAsync` as a collection.

What if you want to simulate user input (reading from the console)? Well that's covered too, the `TextReader` property exposes an instance of `MockTextReader` that you can call the `AddCommand` function to add user input to a stack. Be aware that it's read in FIFO mode, so you'll need to order your "reads" correctly.

### Gotcha's when doing Umbraco integration tests

So there's a few things that you **need** to do that are manual steps (or at least, manual at the moment):

**You'll need the Umbraco config files.**

That stuff that lives in `/config`? Yeah you'll need to copy those into your Integration Test project and then set them to be copied to the build output (Properties -> Copy to Output Directory), since Umbraco's internal API's will try and read those files.

This also means you kind of need a web.config, _kind of_. You don't need the full Umbraco web.config, just the `configSections` definition for `umbracoConfiguration`, the `umbracoConfiguration` (pointing to the right config files), a connection string (SQL CE does work!), the `DbProviderFactories` and `membership`.

Check out my app.config in the integration tests of Chauffeur for an example of how it all works.

### Using SQL CE

SQL CE works nicely for integration tests, it's how I do Chauffeur's integration tests, and one of the things the base class does is setup a unique directory for the `Umbraco.sdf` file, so you don't have clashes across multiple tests. But there is a manual step, you need to copy the `amd64` and `x86` directories from the `UmbracoCms` NuGet package (they are in the `UmbracoFiles/bin` folder) into your `bin/Debug` (or whatever the output folder of your tests is). If you don't do this you'll get a really obscure error message, and I can't work out a simpler way to do it than manual copy/paste.

### Working with the Umbraco Services

It's all good that you can run Chauffeur deliverables but what if you're doing something with just plain Umbraco services, maybe reading DocTypes, creating content, etc.?

Again, I got you covered! Since the base class basically starts Umbraco you have access to all Umbraco services off their singletons. Here's a really basic test that ensures you get all the standard data type definitions on install:

```csharp
public class NonChauffeurTests : UmbracoHostTestBase
{
    [Fact]
    public async Task All_Data_Types_Installed()
    {
        // respond with "yes" to install SQL CE
        TextReader.AddCommand("y");
        var result = await Host.Run(new[] { "install" });

        var dataTypeDefinitions = ApplicationContext.Current.Services.DataTypeService.GetAllDataTypeDefinitions();

        Assert.Equal(24, dataTypeDefinitions.Count());
    }
}
```

## Conclusion

This is my first cut of trying to make it easier to integration test Umbraco and I'd really like to hear from anyone who has a crack at using this stuff!