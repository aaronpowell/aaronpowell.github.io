+++
title = "Home Grown IoT - Solution Design"
date = 2019-06-05T09:06:59+10:00
description = "How I came to the solution design for my IoT project"
draft = false
tags = ["fsharp", "iot"]
series = "home-grown-iot"
series_title = "Solution Design"
+++

Now I have an idea [for the IoT project I want to make]({{< ref "/posts/2019-05-30-home-grown-iot-prologue.md" >}}) it's time to think about how to go about building it. As I stated in the prologue I don't have any experience building a proper IoT project so this was very much a trial-and-error thing. In fact, I actually did about 3 different designs throughout the development of the project and today I want to talk about those different approaches and why certain things were scrapped.

## Design Fundamentals

From the outset I had an idea of what the basic design should look like for the solution.

![Basic solution design](/images/home-grown-iot/02-001.png)

The idea was the have a Raspberry Pi (image courtesy of my colleague [Damian Brady](https://damianbrady.com.au/)) that talks to the inverter and then when it gets the data it'll push it up to an [Azure Function](https://azure.microsoft.com/en-us/services/functions/?{{< cda >}}) which then lands the data into [Azure Table Stroage](https://azure.microsoft.com/en-us/services/storage/tables/?{{< cda >}}).

You might be wondering why I went with Azure Functions over an [App Service](https://azure.microsoft.com/en-us/services/app-service/?{{< cda >}}). Initially it was a decision made purely by cost, I want to run this solution with as little cost to myself as possible, and Azure Fuctions gives me this. Now, I could've used a free-tier App Service instead but as we'll see through the design evolution I ended up needing more of what Functions provides than just HTTP endpoints.

The same goes for the decision to use Table Storage over any other storage in Azure. My data is reasonably structured, but it's not really relational, so I don't need a full SQL server. I liked the idea of [Cosmos DB](https://docs.microsoft.com/en-us/azure/cosmos-db/introduction?{{< cda >}}) as it is essentially a NoSQL database, but it's really designed for scale well beyond the scale that my little project runs (minimum throughput is 4000 [request units](https://docs.microsoft.com/en-us/azure/cosmos-db/request-units?{{< cda >}}) per second and I'm doing 1 request every 20 seconds 🤣). If I was deploying this to monitor multiple residences I'd look at Cosmos, but for my 1 house, the ~$1 per month of Azure Storage will be fine.

Lastly, I needed to make a decision on what language I was going to build in. Given a Raspberry Pi is my deployment target it makes sense to run Linux on it so I need a language that can run on Linux. I also wanted to have a single language across the whole stack, partially so I could share code (if needed) but more so I wasn't jumping back and forth between languages. Azure Functions is the thing I'll have least control over so it was what drove my decision, but it didn't really narrow it down much because it [supports a lot of languages!](https://docs.microsoft.com/en-us/azure/azure-functions/supported-languages?{{< cda >}}#languages-in-runtime-1x-and-2x) In the end I decided to settle on [F#](https://fsharp.org) for no reasons other than I love the language and I hadn't done anything _overly_ complex with it for a while. Oh and with .NET Core I can easily run it on a Raspberry Pi. 😉

### Considering Security

When it came to the design security was something I was thinking about because, at the end of the day, the last thing you want to do with your IoT project is add another device to a botnet. Because of this I wanted to ensure that my Raspberry Pi would not need to be internet addressable, only that it would be able to communicate out of my network to Azure resources. And this is something that you should always think about when it comes to IoT projects, what are you doing to ensure they can't be compromised? Are you keeping them off the internet if they don't need to be? Are you using a VPN to communicate to your home base (cloud or on prem)? Follow the approach of least-privilege, keep things as disconnected as you can and use a push-based model or have the device establish an outbound socket rather than home base searching for the device.

## Design #1

My first cut of the solution was simple, really simple. My idea was to create a .NET Core console application that I'd rsync over to the Raspberry Pi which will talk to a [HTTP Endpoint Azure Function](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-http-webhook?{{< cda >}}). Coincidently, this is what lead me to [write this post]({{< ref "/posts/2019-03-05-azure-functions-with-fsharp.md" >}}), as I was just starting to setup my Functions project!

This idea was beautifully simple, the console application would do a HTTP GET to the endpoints I'd identified in my inverter and then just POST the response up to an Azure Function which would write it to Table Storage.

## Design #1.5

Once I was a bit underway with the development I was finding a bit of friction with the way my local workflow went. I'll do a separate blog about local dev, but ultimately I wanted to have a more predictable local environment relative to production, so I decided to introduce [Docker](https://www.docker.com/). This is easy for both the [console application](https://docs.microsoft.com/en-us/aspnet/core/host-and-deploy/docker/building-net-docker-images?view=aspnetcore-2.2&{{< cda >}}) and [Functions](https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-function-linux-custom-image?{{< cda >}}) as Microsoft provides Docker images for both of them. It also means I don't have to host my Functions on Azure, I could put them on the Raspberry Pi to reduce latency between the HTTP calls. I ended up no doing that as I didn't want to put too much load on the Raspberry Pi.

## Design #2

Everything was tracking along nicely and I started chatting with fellow Advocate [Dave Glover](https://developer.microsoft.com/en-gb/advocates/dave-glover), who specialised in IoT. Dave asked me if I'd looked at using [IoT Hub](https://azure.microsoft.com/en-us/services/iot-hub/?{{< cda >}}) as part of my solution, which I had not (I'd only vaguely heard of it and had no idea what it was for other than "IoT" 🤣). And this resulted in a pretty radical overhaul of my architecture.

### Adding IoT Hub

Up until now I had been talking directly from the console application to the Azure Functions via HTTP. Introducing IoT Hub into the mix drastically changes this, rather than talking to the Functions I talk to IoT Hub which has an event stream that I can consume. IoT Hub also allows you to send messages to the device from Azure which would be useful if you need to update configuration on the fly. There's a number of overlaps between [IoT Hub and Event Hubs](https://docs.microsoft.com/en-us/azure/iot-hub/iot-hub-compare-event-hubs?{{< cda >}}) since both are streams that you consume messages from (and in IoT Hub you actually subscribe to an Event Hub to get the messages).

And of course Azure Functions [has IoT Hub bindings](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-event-iot?{{< cda >}}), meaning that we can easily consume those messages. Now our design looks like this:

![Solution design with IoT Hub](/images/home-grown-iot/02-002.png)

Now we're no longer talking directly to the Function, instead we're pushing into the IoT Hub message stream and the Function will run whenever new message comes in. This would allow the solution to scale up much faster than it previously could, it also means that if for some reason the Function App goes offline (such as, when it's deployed) I don't drop messages, they'll just sit in the stream until they get consumed. This is also where my decision to use Functions over App Services paid off too, as I don't need any HTTP endpoints in my Functions anymore, they will all just use the IoT Hub bindings.

### Handling Multiple Message Types

When I was POST'ing at different HTTP endpoints in my Functions application it was easy to handle the different data structures that I get back from the inverter (I have 3 endpoints I monitor there). But moving to IoT Hub changed this, I no longer talk to the Function directly, I only pump messages into a message stream, so how do we handle different structures?

It's time to look at [message routing](https://docs.microsoft.com/en-us/azure/iot-hub/tutorial-routing?{{< cda >}}) in IoT Hub. Routing does what it sounds like it does, provides you with the tools to send messages to different places depending on rules that you provide to it. Through a Route you can redirect the message from the IoT Hub stream to a secondary [Event Hub](https://docs.microsoft.com/en-us/azure/event-hubs/?{{< cda >}}), [Service Bus Queue, Service Bus Topic](https://docs.microsoft.com/en-us/azure/service-bus-messaging/service-bus-queues-topics-subscriptions?{{< cda >}}) or [Blob Storage](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction?{{< cda >}}).

The way you create a Route is to define a [message query](https://docs.microsoft.com/en-gb/azure/iot-hub/iot-hub-devguide-routing-query-syntax?{{< cda >}}) against something that is important on the message, either properties of the message or the message body itself.  For example, if you were monitoring a temperature sensor and receive messages where a threshold is exceeded you can send that message to a high priority stream rather than the primary stream.

For me, because each message body is so radically different, I add a special property to the message before it is sent to IoT Hub that indicates the _type_ of message. I then redirect this to one of several different Event Hubs so that the Functions can subscribe to only the correct one and handle only a single data type.

### Handling a Message Multiple Times

The final thing I wanted to do with the new Event Hub-based Functions was shard the data a little bit. One of the endpoints that I monitor contains a lot of data that I want to look more finely at, in particular, split out the two panel groups so I can report on each independently.

This means I either have to have one large Function that does many different things, or I have to read the message multiple times. Now, you can't **actually** read the message multiple times, it's a FIFO (First In, First Out) model, so you need to setup up a [Consumer Group](https://docs.microsoft.com/en-us/azure/event-hubs/event-hubs-features?{{< cda >}}#event-consumers)-per-Function so that each Function has its own view of the message. It also means that we won't use the IoT Hub binding for Azure Functions but the [Event Hubs bindings](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-event-hubs?{{< cda >}}) instead (which are really just the same) and provide the appropriate Consumer Group to the binding.

## Complete Design

I now have all the pieces of the puzzle connected up and it looks like this:

![Complete Solution Design](/images/home-grown-iot/02-003.png)

My Raspberry Pi talks to the inverter and then sends the message up wit IoT Hub with a tag on it indicating the _type_ of message. IoT Hub will then route the message based on the _type_ to one of 3 Event Hubs (all within the same Event Hub Namespace). These Event Hubs have a consumer group-per-Function so that my Azure Functions can shard the messages into different tables with Table Storage!

I quite like how the design turned out. There may be a lot more moving parts in it that I had originally thought I'd have, but each of these play an important role, from IoT Hub allowing me to consume messages without worrying about processing them, Event Hubs allows me to direct messages to different consumption points, Azure Functions can process the data at scale (which _I_ don't need, but is important in IoT) and eventually Table Storage for unstructured data storage that I can report on in the future.

So what do you think of the design? Anything you think I've missed? Anything that's over thought?