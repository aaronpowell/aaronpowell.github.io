---
  title: "What's the time Mr Wolf?"
  date: "2015-12-07"
  tags: 
    - "fsharp"
    - "FsAdvent"
  description: "Telling the time with F# and ntp."
---

> Tis the season, and to get into the festive spirit I'm contributing to the [2015 F# Advent calendar](https://sergeytihon.wordpress.com/2015/10/25/f-advent-calendar-in-english-2015/).

Recently I was working with a client who had a need to do some business processes on at certain times. So how do you know what the time is? We crack out `System.DateTimeOffset` don't we!

Well it turn out that there is a flaw when it comes to using that in the form of [clock drift](https://en.wikipedia.org/wiki/Clock_drift), that think when your microwave and phone ar no longer showing the same time, even though you are sure you set it to the same time the other day!

On Windows you can dive into your date time settings and there's an option to sync with a time-server. By default this is `time.windows.com` and I've seen that dialog plenty over my IT career but had never really paid much attention to _how my computer knows it's 11.59pm 24th December_, have you? So your computer will sync to this place, it'll sync periodically (you have some control over it, but not a lot), and this posed a problem for my client, clock drift could have a problem for them.

## Well, what time IS it?

If we're establishing our problem we need to know what time it is, very accurately. Well there's a particular kind of clock which are highly specific, the [atomic clock](https://en.wikipedia.org/wiki/Atomic_clock). Since these things are kind of big you can't really put it on your desk so let's think of the next thing, how does Windows know what time it is? Well this happens using an atomic clock (or similar precision device like a GPS) and done via the [Network Time Protocol (ntp)](https://en.wikipedia.org/wiki/Network_Time_Protocol). You connect to a ntp server which then connects to a has synched up server until you hit an atomic clock, or a **stratum 0** time instrument.

Well ntp is pretty simple a protocol, you use a UDP socket and get a byte array, 48 characters in length, which has all the important information.

So let's implement a ntp client in F#.

## Talking to the server

The first thing we're going to need to do is to connect our ntp server. I'm going to keep using `time.windows.com` as my sample, but there's plenty of different time servers, of varying stratum levels (`time.windows.com` is stratum 4, which means there are 4 off the _source_).

I'm going to resolve the IP of my server first, let's create a `getEndPoint` function:

    let getEndPoint (server : string) =

Next I'm going to use `System.Net.Dns` to get the IP address:

    let getEndPoint (server : string) =
        let address =
            Dns.GetHostEntryAsync(server)

But this is an `async` method (and C# `async`) so we'll do some pipelining:

    let getEndPoint (server : string) =
        let address =
            Dns.GetHostEntryAsync(server)
            |> Async.AwaitTask
            |> Async.RunSynchronously

This returns an `IPHostEntry` which then I can use to get the IPs for the host and I'll take the first IP from that:

    let getEndPoint (server : string) =
        let address =
            Dns.GetHostEntryAsync(server)
            |> Async.AwaitTask
            |> Async.RunSynchronously
            |> fun entry -> entry.AddressList
            |> fun list -> list.[0]

Finally I'll create the endpoint connection using port `123` which is the standard ntp port:

    let getEndPoint (server : string) =
        let address =
            Dns.GetHostEntryAsync(server)
            |> Async.AwaitTask
            |> Async.RunSynchronously
            |> fun entry -> entry.AddressList
            |> fun list -> list.[0]
        new IPEndPoint(address, 123)

Now we're ready to connect our ntp server via a UDP socket:

    let getTime (ipEndpoint : IPEndPoint) =
        let ntpData =
            [| for i in 0..47 ->
                match i with
                | 0 -> byte 0x1B
                | _ -> byte 0 |]

        let socket = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, ProtocolType.Udp)
        socket.Connect(ipEndpoint)
        socket.ReceiveTimeout <- 3000
        socket.Send(ntpData) |> ignore
        socket.Receive(ntpData) |> ignore
        socket.Close()
        ntpData

F# makes generating the data packet array really easy and using a `match` means that we can set the various bytes as they need to be set (for example I'm initialising a version in the first byte). I _should_ be setting the `Originate Timestamp` at bytes 32 - 39 which you could also do in the match but I'm a bit lazy (note: not doing this means it's harder to work out the time based on latency).

## Extracting our data

Now I have a byte array that is full of useful information that has been returned from our ntp server, but it's in raw bytes and they aren't overly readable so we probably want to split that apart. I'm going to create a record type to represent it:

    type NtpResponse =
        { Stratum : int
        ReferenceTime : DateTime
        OriginateTime : DateTime
        ReceiveTime : DateTime
        TransmitTime : DateTime }

Then we'll make a function to break apart our byte array

    let extractor (ntpData : byte[]) =
        { Stratum = int ntpData.[1]
          ReferenceTime = DateTime.Now
          OriginateTime = DateTime.Now
          ReceiveTime = DateTime.Now
          TransmitTime = DateTime.Now }

The first bit that I'm extracting is the stratum, which tells us what _level_ the server is. This information is useful if you're wanting to know how close a server is to the time source, as the further away from the time source the more network hops have occurred. We're also casting the value from a byte to an int, which in F# we need to be more explicit about than if we were doing it in C#

But the more important part of the data that we have is the date/time components, which are 8 bytes starting at 16, 24, 32 and 40 respectively, so let's look at how we can get them out of the array.

The 8 bytes that make up the timestamp are comprised of a 64 bit fixed point timestamp which we need break into the 32 bit integer value representing the seconds since Unix Epoch and 32 bit floating point value that is the precision of the timestamp.

To do this I'm going to create a function that takes the 8 bytes and gets me a timestamp:

    let extractTime ntpData position =
        let intPart = BitConverter.ToUInt32(ntpData, int position)
        let fracPart = BitConverter.ToUInt32(ntpData, int position + 4)

We're using `uint32` to represent the data that we're pulling out (since it could be a large number). But the next this we need to deal with is that the value is [Big Endianness](https://en.wikipedia.org/wiki/Endianness) notation so it needs to be swapped for us to use. Well that function isn't too hard to write...

    let swapEndianness (x : uint64) =
        (((x &&& uint64 0x000000ff) <<< 24) + ((x &&& uint64 0x0000ff00) <<< 8) + ((x &&& uint64 0x00ff0000) >>> 8)
        + ((x &&& uint64 0xff000000) >>> 24))

Now we can update our `extractTime` method with this to generate the miliseconds and create our `DateTime` object:

    let extractTime ntpData position =
        let intPart = BitConverter.ToUInt32(ntpData, int position)
        let fracPart = BitConverter.ToUInt32(ntpData, int position + 4)
        let ms =
            ((swapEndianness (uint64 intPart)) * uint64 1000)
            + ((swapEndianness (uint64 fracPart)) * uint64 1000) / uint64 0x100000000L
        (new DateTime(1900, 1, 1, 0, 0, 0, DateTimeKind.Utc)).AddMilliseconds(float ms)

It's times like this I really miss the operator overloading of C#...

With our `extractTime` method working let's go back to completing the `extractor`:

    let extractor extractTime (ntpData : byte[]) =
        let extractor' = extractTime ntpData
        let referenceTime = extractor' 16
        let originateTime = extractor' 24
        let receiveTime = extractor' 32
        let transmitTime = extractor' 40

        { Stratum = int ntpData.[1]
          ReferenceTime = referenceTime
          OriginateTime = originateTime
          ReceiveTime = receiveTime
          TransmitTime = transmitTime }

And with a bit of partial application we can bind the `extractTime` method to the `ntpData` so that it is simpler to invoke.

## Finishing it all up

With all our functions written we can now work out what the time is:

    let time = getEndPoint "time.windows.com"
                |> getTime
                |> extractor extractTime

    printfn "The time is %s" (time.TransmitTime.ToString("dd/MM/yyyy hh:mm:ss.fffffff"))

And we're done. Well _mostly_, I've left a few exercises to you dear reader if you'd like to finish this off:

* Set the `Originate Time` in the data you send to the ntp server
* Use the time the request was sent from the client with the time on the server to determine the **real** time without latency (using the [clock synchronisation algorithm](https://en.wikipedia.org/wiki/Network_Time_Protocol#Clock_synchronization_algorithm))
* Extract the other parts from the response packet, like version, poll interval (so you know how often you can hit the server), etc

## Conclusion

Time is all relative but with ntp we can work out just how relative it is. With a little bit of F# we can query a ntp server and get the time information back. Hopefully this has been a bit of fun looking at how one of the protocols we take for granted works.
