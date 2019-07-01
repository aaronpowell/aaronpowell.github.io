+++
title = "Home Grown IoT - Data Downloader"
date = 2019-06-12T09:47:13+10:00
description = "Let's start diving into the codebase, starting with capturing data"
draft = false
tags = ["fsharp", "iot"]
series = "home-grown-iot"
series_title = "Data Downloader"
+++

We talked last time about [how to structure data]({{< ref "/posts/2019-06-07-home-grown-iot-data.md" >}}) for IoT projects and some of the decisions that led me to the structure that I have ultimately taken with the project, so this makes it seem like a good time to start looking at the code, in particular, the code I use to capture the data from the inverter itself.

I'll be focusing on the code for the Downloader, which lives in [this part of the GitHub repo](https://github.com/aaronpowell/sunshine/blob/277c31fcb612d3866daf7759beb9525826778c2c/src/Sunshine.Downloader) and also touch on a bit on the general development approaches I went with for the project.

## Codebase Basics

Let's start with some of the basics of how the codebase works. As I mentioned in the [prologue]({{< ref "/posts/2019-05-30-home-grown-iot-prologue.md" >}}) I chose to do this as an F# .NET Core application so that I could easily deploy it to both Linux and Windows. I'm also using Docker for the development and deployment (I'll cover local development in a future post though) to make it easier for me to control the dependencies and environment.

I also opted to use [Paket](https://fsprojects.github.io/Paket/), which is an alternative package manager to NuGet that is very common in the F# community but also introduces the concept of a lockfile to better handle transitive dependencies or conflicting dependency versions. I will admit that I'm not sold on Paket, I did have a number of times where I was having to actively fight it and it also isn't a .NET Core tool, meaning you need `mono` if you want to use Linux/WSL or rely on the [in-development-and-unsupported-version](https://github.com/fsprojects/Paket/issues/2875) (which is actually what I do). But in the end I got it all working, so I am careful not to touch it, lest I break things! 😝

The codebase is broken up into 3 projects, Downloader (which we'll cover today), Functions and Mock API (for local development). These all live in the `src` folder alongside some shared files (in `Shared`). The root of the git repo contains the usual git files, my `azure-pipelines.yml` for the build pipeline (I'll talk Pipelines in the future), the Paket files and a `.sln`. Admittedly, I do most of the development in VS Code, but sometimes I fire up full Visual Studio, especially when trying to visualise the dependency tree.

## The Downloader

It's time to start looking at the Downloader and in doing so learn a bit about how the ABB inverter exposes its API. But there's one thing I want to make clear from the outset:

<p style="color: #f00; font-weight: bold">I am working against an undocumented API on the inverter, and using it in a way it was not intended to be used. Accessing your inverter in this manner shouldn't break anything but it just might. I take no responsibility for any damage you might somehow do! Do this at your own risk!</p>

With the disclaimer done let's look at how we'll get the data. The first job for me was to work out how to actually get the data, after all, this isn't a documented API, so I needed to work out just what endpoints existed and what I needed to access.

The approach I took for this was to sit with the network tools in my browser open while I was on the dashboard for the inverter and just watched the XHR network events. Given I'd already determined it to be an AngularJS application it was really just a matter of watching the network traffic to find the things that were most useful. Through doing that I found 4 interesting API endpoints (there were others but either I can't work out what they are for, or they are just keep-alive tests):

-   `/v1/specs`
    -   This API describes the devices that are available and returns a JSON payload ([example](https://github.com/aaronpowell/sunshine/blob/277c31fcb612d3866daf7759beb9525826778c2c/src/Shared/sample-data/specs.json)) that gives me the information about the `device` (the inverter) and the `logger` (the thing that sends data to ABB's cloud platform)
    -   Ultimately, this API is a metadata endpoint which I don't _need_ to call, but I do because it means I don't have to hard-code anything about my device in the solution
    -   The dashboard seems to invoke this when the AngularJS application first starts up, and never again (I guess the values are in the JavaScript memory)
-   `/v1/livedata/list`
    -   This is one of two API's under `livedata` and it is another metadata endpoint, this time it gives me the information about what sensors are being monitored by the inverter that I can get data from. It also provides information about them like their unit of measure, description (which, generally speaking, isn't actually descriptive!) and decimal precision. Again I have [an example](https://github.com/aaronpowell/sunshine/blob/277c31fcb612d3866daf7759beb9525826778c2c/src/Shared/sample-data/live-data-list.json) on GitHub
    -   The dashboard seems to invoke this approximately every 5 minutes. I don't know why it would refresh this, hopefully the sensors don't change that often!
-   `/v1/livedata`
    -   This is the juicy bit, here's where the data is useful, this returns the values for the sensors described by `livedata/list` ([example](https://github.com/aaronpowell/sunshine/blob/277c31fcb612d3866daf7759beb9525826778c2c/src/Shared/sample-data/live-data.json))
    -   The dashboard calls this **a lot**, approximately every 30 seconds, which stands to reason as it is the primary data feed
-   `/v1/feeds`
    -   This API confuses me as it is always called with a bunch of query string values that returns the `Pgrid` in 5 minute blocks. By looking at the data it _appears_ that `Pgrid` is to do with the power (watts) to the grid from the inverter (and that stands to reason from the name) but I wasn't able to work out anything else I could adjust on the query string if I wanted to get other metrics. I think I do get this information in `livedata` too, but it can't hurt to have it captured twice, and after all, they made a dedicated API for this for a reason. Anyway, the structure of this response is quite weird ([example](https://github.com/aaronpowell/sunshine/blob/277c31fcb612d3866daf7759beb9525826778c2c/src/Shared/sample-data/pgrid-sum.json)) but it's not _too_ hard to consume
    -   The dashboard seems to invoke this approximately every 5 minutes, and given the response is 5 minute time slices, there's no need to call it more frequently than that

Armed with our 4 APIs to call we can start building our application.

### API Helpers

The API I'm accessing is secured using Basic Authentication, which added an `Authorization` token to the request that contains a base 64 encoded string of `username:password`, not super secure, but it'll do. We'll make a little helper function to generate that for us:

```fsharp
let getAuthToken username password =
    sprintf "%s:%s" username password
    |> ASCIIEncoding.ASCII.GetBytes
    |> Convert.ToBase64String
```

To access the API I'm using [FSharp.Data](http://fsharp.github.io/FSharp.Data/)'s [HTTP Utilities](http://fsharp.github.io/FSharp.Data/library/Http.html) and wrapped that up in a function called `getData`:

```fsharp
let getData authToken baseUri (path : string) =
    let url = Uri(baseUri, path)
    printfn "Requesting: %s" (url.ToString())
    Http.AsyncRequestString
        ( url.ToString(),
          httpMethod = "GET",
          headers = [ Accept HttpContentTypes.Json
                      Authorization (sprintf "Basic %s" authToken) ] )
```

This function takes the token (output from `getAuthToken`) and the API base for the inverter, to which we add the specific API path. This little function then wraps up the setting on the appropriate headers and issuing the request to get the JSON response back for us to use.

### Starting the Application

When the Downloader starts up it prints out the [logo](https://github.com/aaronpowell/sunshine/blob/277c31fcb612d3866daf7759beb9525826778c2c/src/Sunshine.Downloader/Logo.fs) (helps me spot in the logs when it restarts 🤣) and then establishes a connection to Azure IoT Hub.

### Establishing IoT Client Connections

With the solution I either run this locally or on my Raspberry Pi I adjust the way I establish the connection, and importantly, the type of connection. For local development I connect to IoT Hub as a [managed device](https://docs.microsoft.com/en-us/azure/iot-hub/iot-hub-device-management-overview?{{< cda >}}) but when it's on the Raspberry Pi it's deployed using IoT Edge as a [module](https://docs.microsoft.com/en-us/azure/iot-edge/iot-edge-modules?{{< cda >}}). I'll cover both of these topics in greater detail when I do local development and deployments, but know that there's not a whole lot different in the way you connect, other than one uses the [`DeviceClient`](https://docs.microsoft.com/en-us/dotnet/api/microsoft.azure.devices.client.deviceclient?view=azure-dotnet&{{< cda >}}) and the other uses the [`ModuleClient`](https://docs.microsoft.com/en-us/dotnet/api/microsoft.azure.devices.client.moduleclient?view=azure-dotnet&{{< cda >}}).

Because of this, I have a little wrapper around the clients (they don't share a common base type other than `Object`) using an F# Record Type and exploiting functions-as-references:

```fsharp
module IoTWrapper
open Microsoft.Azure.Devices.Client
open Microsoft.Azure.Devices.Shared

type IoTConnectionWrapper =
  { SendEventAsync : Message -> Async<unit>
    GetTwinAsync : unit -> Async<Twin> }

let getIoTHubClient iotConnStr =
    async {
    return! match iotConnStr with
            | null | "" ->
              async {
              let amqpSetting = AmqpTransportSettings(TransportType.Amqp_Tcp_Only) :> ITransportSettings;
              let! client = [| amqpSetting |]
                            |> ModuleClient.CreateFromEnvironmentAsync
                            |> Async.AwaitTask
              do! client.OpenAsync() |> Async.AwaitTask
              return { SendEventAsync = fun msg -> client.SendEventAsync msg |> Async.AwaitTask
                       GetTwinAsync = fun () -> client.GetTwinAsync() |> Async.AwaitTask } }
            | _ ->
              async {
              let client = DeviceClient.CreateFromConnectionString iotConnStr
              return { SendEventAsync = fun msg -> client.SendEventAsync msg |> Async.AwaitTask
                       GetTwinAsync = fun () -> client.GetTwinAsync() |> Async.AwaitTask } } }
```

`getIoTHubClient` takes a connection string (which is passed for local development) and uses pattern matching to check if I did provide a connection string (implied local development) or not. _Side note: I love F# pattern matching!_

Using the pattern of `| null | "" ->` allows me to test on a few different outcomes and have them all result in the same block, whereas `| _ ->` means "anything that wasn't previously matched. I'm also making extensive use of [F# Async Workflows](https://docs.microsoft.com/en-us/dotnet/fsharp/language-reference/asynchronous-workflows?{{< cda >}}) to unwind the C# `Task` API and make it fit better into F#'s approach to async.

### Using IoT Twins

When it comes to working with an IoT solution the code that is running on the device is likely to be quite generic, after all, it's deployed to potentially hundreds of devices, so you don't want to be embedding secrets into the codebase because then you have the same secret everywhere. While **I** might only have 1 device I'm working with I still didn't want to embed the username, password and IP address of my inverter in the code (I don't want **that** on GitHub!) so I need some way to get them onto the device in a secure manner.

Initially, I went down the path of setting environment variables on the Docker container when it started to pass them in, but that is quite a bit trickier when it comes to deploying to the IoT devices, instead I decided to use a [Device Twin](https://docs.microsoft.com/en-us/azure/iot-hub/iot-hub-devguide-device-twins?{{< cda >}}) (side note: if you're using a `ModuleClient` you'd use a Module Twin, which is the same as a Device Twin but scoped to just that module). A Device Twin is a JSON configuration file for the device that is stored in Azure and can either be updated by the device or through the portal/`az` cli (and by extension, any third party tooling).

Within my Twin I added a new `Desired Property` with the authentication information for the API:

```json
  // snip
  "properties": {
    "desired": {
      "inverter": {
        "username": "...",
        "password": "...",
        "url": "http://..."
      },
      "$metadata": {
          // and so on
      }
    }
  }
```

Then it's a matter of [getting the Twin info](https://github.com/aaronpowell/sunshine/blob/277c31fcb612d3866daf7759beb9525826778c2c/src/Sunshine.Downloader/Program.fs#L21-L23):

```fsharp
    async {
    let! iotClient = getIoTHubClient iotConnStr

    let! twin = iotClient.GetTwinAsync()

    let iotProperties = parseDesiredProperties twin.Properties.Desired
```

`parseDesiredProperties` is a [little function](https://github.com/aaronpowell/sunshine/blob/277c31fcb612d3866daf7759beb9525826778c2c/src/Sunshine.Downloader/IoTWrapper.fs#L28-L32) to help unpack the `TwinCollection` that is returned into a type that is useful for me:

```fsharp
open FSharp.Data
type DesiredProperties = JsonProvider<""" {"inverter":{"username":"user","password":"pass","url":"http://localhost/"},"$version":4} """>

let parseDesiredProperties (data : TwinCollection) =
  data.ToJson() |> DesiredProperties.Parse
```

You might notice I'm using the [JSON Type Provider](http://fsharp.github.io/FSharp.Data/library/JsonProvider.html) from FSharp.Data here, I use that a lot to convert the JSON representations back to strongly typed objects.

Now I can do some partial application to setup the `getData` function for use multiple times within the application:

```fsharp
let token = getAuthToken iotProperties.Inverter.Username iotProperties.Inverter.Password
let getData' = getData token (Uri iotProperties.Inverter.Url)
```

What this means is that whenever I need to make an API call I can use `getData'` which already has the access token and inverter base URI arguments applied.

### Polling APIs

The other moderately complex piece is polling each of these APIs on different schedules. I could go down the route of using something like [Hangfire](https://www.hangfire.io/) but then I would also need to include a SQL Server (or similar) to have the polling managed effectively, and that'd add cost + complexity. If I was doing this for multiple devices I'd recommend it, but for a single device that's primarily for personal use, downtime and lost data isn't the end of the world.

Instead, I'm using `Async.Start` from the F# Async Workflows to spawn a new thread and then running a recursive function, [like this](https://github.com/aaronpowell/sunshine/blob/277c31fcb612d3866daf7759beb9525826778c2c/src/Sunshine.Downloader/Program.fs#L49-L57):

```fsharp
let rec dataPoller() = async {
    match! getLiveData getData' deviceId with
    | Some liveData -> do! sendIoTMessage iotClient "liveData" correlationId liveData
    | None -> ignore()

    do! int(TimeSpan.FromSeconds(20.).TotalMilliseconds) |> Async.Sleep
    dataPoller() |> Async.Start }

dataPoller() |> Async.Start
```

Here I call the `livedata` API once every 20 seconds (that way with latency, etc. I get about 1 every 30 seconds), use pattern matching against the [API wrapper I have](https://github.com/aaronpowell/sunshine/blob/277c31fcb612d3866daf7759beb9525826778c2c/src/Sunshine.Downloader/LiveData.fs#L25-L39), which returns an [`Option`](https://docs.microsoft.com/en-us/dotnet/fsharp/language-reference/options?{{< cda >}}) for error handling, and assuming it was successful sends the data to IoT Hub. And why did I use a recursive function? Well, it's only a recursive function in the fact that the function calls itself, it doesn't actually pass any data into the new invocation, and we could do this as a loop of some variety, but a recursive function like this is more of a common F# pattern. You might be wondering about stack overflow exceptions, thankfully F# has some pretty good optimisations around recursive functions so I shouldn't hit it, I've had it running for a number of days now resulting in hundreds of thousands of messages, and it hasn't crashed! _... yet_

### Linking API Calls Together

Each API call is happening in a separate background job, handled by a separate recursive function, all running on different threads, which means that it is difficult to know which message is related to which other messages. I wanted to be able to relate all messages back to a time slice centred around the `livedata/list` API call, since it's polled the most infrequently. I do this by using a `CorrelationId` that is stored in a [mutable F# variable](https://github.com/aaronpowell/sunshine/blob/c1005c8bf8ec1d295f05398556bd1bf8dccd7e36/src/Sunshine.Downloader/Program.fs#L33). Each time the `livedata/list` API is called [the variable is updated](https://github.com/aaronpowell/sunshine/blob/c1005c8bf8ec1d295f05398556bd1bf8dccd7e36/src/Sunshine.Downloader/Program.fs#L39) and since the variable is defined before all the recursive functions, each one has access to it via closure scopes.

I then created a [helper function](https://github.com/aaronpowell/sunshine/blob/c1005c8bf8ec1d295f05398556bd1bf8dccd7e36/src/Sunshine.Downloader/Utils.fs#L9-L16) to wrap the call to the IoT client (either `ModuleClient` or `DeviceClient`, via the wrapper type I made):

```fsharp
let sendIoTMessage<'T> client route correlationId (obj : 'T) =
    let json = obj |> toS
    let msg = new Message(Encoding.ASCII.GetBytes json)
    msg.Properties.Add("__messageType", route)
    msg.Properties.Add("correlationId", correlationId.ToString())
    msg.Properties.Add("messageId", Guid.NewGuid().ToString())
    printfn "Submitting %s with correlationId %A" route correlationId
    client.SendEventAsync msg
```

Here we create a new `Message` to sent to IoT Hub with a JSON serialised message, then some metadata is added to it, `__messageType` which is used by the IoT Hub routing to route the message to the right Event Hub, the `correlationId` to link messages and a unique `messageId` so that if a message is processed multiple times we can link those processes together.

### Keeping the Application Running

The last thing I need the application to do is not exit, since it doesn't know to wait until the background jobs stop. Initially, I was going to rely on `Console.ReadLine()` and leave it waiting until a newline character was sent, but this doesn't work if it's running in a Docker container without `stdin` attached (ie: a non-interactive container), which is how it's deployed to the Raspberry Pi.

Conveniently there's a way that we can test for that, [`Console.IsInputRedirected`](https://docs.microsoft.com/en-us/dotnet/api/system.console.isinputredirected?view=netcore-2.2?{{< cda >}}), and we can combine it [like so](https://github.com/aaronpowell/sunshine/blob/277c31fcb612d3866daf7759beb9525826778c2c/src/Sunshine.Downloader/Program.fs#L72-L77):

```fsharp
printfn "Background jobs running, now we're waiting... "
if Console.IsInputRedirected then
    while true do
        do! Async.Sleep 300000
else
    Console.ReadLine() |> ignore
```

Now depending on how our container starts we either wait for a newline character to terminate or the application will run indefinitely.

## Conclusion

The full codebase for the Downloader is [available on GitHub](<(https://github.com/aaronpowell/sunshine/blob/277c31fcb612d3866daf7759beb9525826778c2c/src/Sunshine.Downloader)>) (and I've pinned this post to the commit that is `HEAD` at the time of writing).

We've seen in this post how we can leverage some F# language features like partial application and pattern matching to tackle some of our goals and seen how we can have credentials/secrets provided to a device without the need to embed them in the application.

I hope this gives you some insights into the approach I've taken to scrape data from my inverter. I'd love feedback on the approach, is there anything that could be done simpler? Doesn't make sense? Seems overengineered?
