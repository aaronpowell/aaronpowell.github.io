+++
title = "Home Grown IoT - Processing Data"
date = 2019-07-01T11:20:18+10:00
description = "How I go about processing data streams from IoT devices"
draft = false
tags = ["fsharp", "iot", "azure-functions", "serverless"]
series = "home-grown-iot"
series_title = "Processing Data"
+++

[Last Time]({{< ref "/posts/2019-06-19-home-grown-iot-local-dev.md" >}}) we looked at how to get data from an IoT device and start pushing it up to Azure, now it's time for the next step, processing the data as it comes in.

I mentioned in the [solution design]({{< ref "/posts/2019-06-05-home-grown-iot-solution-design.md" >}}) that the processing of the data would happen with [Azure Functions](https://docs.microsoft.com/en-us/azure/azure-functions/?{{< cda >}}) so let's have a look at how that works.

## Processing Data with Functions

Azure Functions has built in support for processing data out of [IoT Hub](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-event-iot?{{< cda >}}) which makes it really easy to integrate. The only drawback of this is that it monitors the built-in event hub that's provided by IoT Hub and if you have multiple data structures being submitted (like I do) your Function will become complex. Instead I'm going to use the [Event Hub binding](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-event-hubs?{{< cda >}}).

## Designing Functions

When designing functions, or serverless in general, you want to keep them as small as possible; our goal isn't to create a serverless monolith! This means that part of the design requires you to think about what the role your functions will be playing. For me, they will be responsible for converting the JSON payloads that are sent from the IoT device into a structure that is stored in Table Storage. If we think about the APIs I described in [the data downloader post]({{< ref "/posts/2019-06-12-home-grown-iot-data-downloader.md" >}}) there is one endpoint, `livedata`, that provides me with the bulk of the data needed for capture.

After a bit of inspection of the real API I noticed that there were 3 buckets that this data could be represented in:

-   Panel data
-   Point-in-time summary data
-   Miscellaneous data

I made the decision to store each of these as separate tables in Table Storage (to understand more, check out the post on [data design]({{< ref "/posts/2019-06-07-home-grown-iot-data.md" >}})). Since they all come from the same originating structure I _could_ do it all in a single function, but instead I split it into 3 functions, keeping each as lightweight as possible.

## Writing Our Function

The Functions are implemented in F# ([here's how to set that up]({{< ref "/posts/2019-03-05-azure-functions-with-fsharp.md" >}})) and I'm using the [FSharp.Azure.Storage](https://github.com/fsprojects/FSharp.Azure.Storage) NuGet package to make working with the Table Storage SDK more F# friendly.

_Note: If you're going to use that NuGet package in F# Azure Functions you'll need to be really careful on the versions that you're depending on. Since Functions internally uses Table Storage there's a potential to bring in conflicting versions that results in errors. I solved this with very [explicit pinning](https://github.com/aaronpowell/sunshine/blob/c1005c8bf8ec1d295f05398556bd1bf8dccd7e36/paket.dependencies#L11-L12) in my `paket.dependencies` file._

We'll start by defining the Record Type that will be stored in Table Storage:

```fsharp
type PanelInfo =
     { [<PartitionKey>] DateStamp: string
       [<RowKey>] Id: string
       Panel: string
       MessageId: string
       Current: float // Iin#
       Volts: float // Vin#
       Watts: float // Pin#
       MessageTimestamp: DateTime // SysTime
       CorrelationId: string }
```

On the Record Type I've added attributes to represent which members will be the Partition and Row keys in Table Storage, which makes it nicer for me to work against the object model if I require. This type is used to represent the data for a single group of panels in my solar setup and gives me a view of the inbound values across Volts, Watts and Current.

To define the Function itself we create a member in the module:

```fsharp
[<FunctionName("PanelTrigger")>]
let trigger
    ([<EventHubTrigger("live-data", ConsumerGroup = "Panel", Connection = "IoTHubConnectionString")>] eventData: EventData)
    ([<Table("PanelData", Connection = "DataStorageConnectionString")>] panelDataTable: CloudTable)
    (logger: ILogger) =
        ignore() // todo
```

We attribute the member (which I've called `trigger`) with `FunctionName` so the Functions host knows to find it and knows what name to give it. Unfortunately, you'll need to explicitly state the type, F# won't be able to infur the type based on usage of the complex types in the binding (at least, not in my experience).

This Function has 3 inputs to it, the first is the Event Hub binding, which binds to an Event Hub named `live-data` using the Consumer Group `Panel` (see the [Solution Design]({{< ref "/posts/2019-06-05-home-grown-iot-solution-design.md" >}}) section **Handling a Message Multiple Times** for why I use Consumer Groups). We'll also use the `EventData` type for the input, not a `string`, so we can access the metadata of the message, not just the body (which is what comes in when the type is `string`). Next up is the output binding to Table Storage, bound as a `CloudTable`, which provides me with interop with `FSharp.Storage.Data`. Lastly is the `ILogger` so I can log out messages from the Function.

### Unpacking the Message

It's time to start working with the message, and for that I need to extract the body (and [strongly type it](https://github.com/aaronpowell/sunshine/blob/c1005c8bf8ec1d295f05398556bd1bf8dccd7e36/src/Shared/LiveData.fs#L9) with a Type Provider) and get some metadata:

```fsharp
[<FunctionName("PanelTrigger")>]
let trigger
    ([<EventHubTrigger("live-data", ConsumerGroup = "Panel", Connection = "IoTHubConnectionString")>] eventData: EventData)
    ([<Table("PanelData", Connection = "DataStorageConnectionString")>] panelDataTable: CloudTable)
    (logger: ILogger) =
    async {
        let message = Encoding.UTF8.GetString eventData.Body.Array
        let correlationId = eventData.Properties.["correlationId"].ToString()
        let messageId = eventData.Properties.["messageId"].ToString()

        let parsedData = LiveDataDevice.Parse message
```

The `EventData` object gives us access to the body of the message as an [ArraySegment<T>](https://docs.microsoft.com/en-us/dotnet/api/system.arraysegment-1?view=netframework-4.8&{{< cda >}}) but we want the whole array, which is exposed by the `Array` property. This is a UTF8 encoded byte array so we have to decode that to the string of JSON (or whatever your transport structure was). Then, because we have access to the whole message, not just the body, we can access the additional properties that are put into the message by the downloader, the `CorrelationId` and `MessageId`.

Because the data points comes up as an array of key/value pairs I created a function to find a specific point's value:

```fsharp
let findPoint (points: LiveDataDevice.Point[]) name =
    let point = points |> Array.find(fun p -> p.Name = name)
    float point.Value
```

And then use partial application to bind the parsed data to it:

```fsharp
[<FunctionName("PanelTrigger")>]
let trigger
    ([<EventHubTrigger("live-data", ConsumerGroup = "Panel", Connection = "IoTHubConnectionString")>] eventData: EventData)
    ([<Table("PanelData", Connection = "DataStorageConnectionString")>] panelDataTable: CloudTable)
    (logger: ILogger) =
    async {
        let message = Encoding.UTF8.GetString eventData.Body.Array
        let correlationId = eventData.Properties.["correlationId"].ToString()
        let messageId = eventData.Properties.["messageId"].ToString()

        let parsedData = LiveDataDevice.Parse message
        let findPoint' = findPoint parsedData.Points
```

### Writing to Storage

Because I need to write 2 panel groups to storage I created a function in the Function to do that:

```fsharp
[<FunctionName("PanelTrigger")>]
let trigger
    ([<EventHubTrigger("live-data", ConsumerGroup = "Panel", Connection = "IoTHubConnectionString")>] eventData: EventData)
    ([<Table("PanelData", Connection = "DataStorageConnectionString")>] panelDataTable: CloudTable)
    (logger: ILogger) =
    async {
        let message = Encoding.UTF8.GetString eventData.Body.Array
        let correlationId = eventData.Properties.["correlationId"].ToString()
        let messageId = eventData.Properties.["messageId"].ToString()

        let parsedData = LiveDataDevice.Parse message
        let findPoint' = findPoint parsedData.Points
        let deviceId = parsedData.DeviceId.ToString()
        let timestamp = epoch.AddSeconds(findPoint' "SysTime")

        let storePanel p =
               let panel =
                   { DateStamp = timestamp.ToString("yyyy-MM-dd")
                     Panel = p
                     Id = Guid.NewGuid().ToString()
                     MessageId = messageId
                     Current = findPoint' (sprintf "Iin%s" p)
                     Volts = findPoint' (sprintf "Vin%s" p)
                     Watts = findPoint' (sprintf "Pin%s" p)
                     MessageTimestamp = timestamp
                     CorrelationId = correlationId }
               panel |> Insert |> inTableToClientAsync panelDataTable
```

This created the record type using the panel number passed in (`let! _ = storePanel "1"` is how it's called) before handing it over to the `Insert` function from my external library. But `FSharp.Azure.Storage` library is designed to work with the client from the SDK, and convert that into a `CloudTable`, it's not 100% optimised for using in Azure Functions, this is an easy fix though, here's a function to handle that:

```fsharp
let inTableToClientAsync (table: CloudTable) o = inTableAsync table.ServiceClient table.Name o
```

Finally, because we're using F#'s async workflows and the Azure Function host only handles `Task<T>` (C#'s async) we need to convert it back with `Async.StartAsTask`:

```fsharp
[<FunctionName("PanelTrigger")>]
let trigger
    ([<EventHubTrigger("live-data", ConsumerGroup = "Panel", Connection = "IoTHubConnectionString")>] eventData: EventData)
    ([<Table("PanelData", Connection = "DataStorageConnectionString")>] panelDataTable: CloudTable)
    (logger: ILogger) =
    async {
        let message = Encoding.UTF8.GetString eventData.Body.Array
        let correlationId = eventData.Properties.["correlationId"].ToString()
        let messageId = eventData.Properties.["messageId"].ToString()

        let parsedData = LiveDataDevice.Parse message
        let findPoint' = findPoint parsedData.Points
        let deviceId = parsedData.DeviceId.ToString()
        let timestamp = epoch.AddSeconds(findPoint' "SysTime")

        let storePanel p =
               let panel =
                   { DateStamp = timestamp.ToString("yyyy-MM-dd")
                     Panel = p
                     Id = Guid.NewGuid().ToString()
                     MessageId = messageId
                     Current = findPoint' (sprintf "Iin%s" p)
                     Volts = findPoint' (sprintf "Vin%s" p)
                     Watts = findPoint' (sprintf "Pin%s" p)
                     MessageTimestamp = timestamp
                     CorrelationId = correlationId }
               panel |> Insert |> inTableToClientAsync panelDataTable

        let! _ = storePanel "1"
        let! _ = storePanel "2"

        logger.LogInformation(sprintf "%s: Stored panel %s for device %s" correlationId messageId deviceId)
    } |> Async.StartAsTask
```

And with that, for each message we received 2 entries are written to Table Storage.

## Conclusion

I won't go over each of the functions in the project as they all follow this same pattern, instead, you can find them [on GitHub](https://github.com/aaronpowell/sunshine/tree/c1005c8bf8ec1d295f05398556bd1bf8dccd7e36/src/Sunshine.Functions).

While it might feel a little like a micromanagement of the codebase by having a whole bunch of functions with less than 50 lines in them, it makes them a lot simpler to maintain and editable as you iterate the development. It also makes it scale very nicely, which I've found a few times when I've accidentally disabled the functions for 24 hours and had a huge backlog in Event Hub to process, it makes quick job of it!

I hope this gives you a bit of an insight into how you can create your own Azure Functions stack for processing data, whether it's from an IoT device, or some other input stream.
