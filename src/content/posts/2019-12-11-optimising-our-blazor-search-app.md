+++
title = "Optimising Our Blazor Search App"
date = 2019-12-11T09:10:03+11:00
description = "The load time for our Blazor + Lucene.NET app is a bit slow, let's look at how to optimise it."
draft = false
tags = ["wasm", "dotnet", "lucene.net", "fsharp"]
+++

When we [build a search app using Blazor + Lucene.NET]({{<ref "/posts/2019-11-29-implementing-search-in-blazor-webassembly-with-lucenenet.md">}}) it did a good job of creating our search application but when you run it it's kind of slow and that's because we're downloading the JSON representation of my blog and generating the Lucene.NET index each time. Then when we looked at [hosting the Blazor app]({{<ref "/posts/2019-12-10-can-you-use-blazor-for-only-part-of-an-app.md">}}) the main motivation was to use static files rather than getting Blazor to do heavy lifting to generate HTML every time.

After talking to [Dan Roth](https://twitter.com/danroth27) and Microsoft Ignite I got thinking, could we pre-generate the index and ship it down as a static resource somehow?

## Lucene Index Primer

If we're going to ship the index to the browser rather than build it there we need to understand what the index is. Since Lucene aims to be as fast a search index as it can it uses a series of binary files to store the indexed data. If you look into a generated index you'll find files such as `_0.cfe` or `segments.gen`. The numbered files are kind of like a database, containing the documents that were indexed and the tokens extracted from the fields, whereas the segments files create a map to where everything is stored.

Ultimately though, we're going to have multiple files and the names of them are not deterministic as indexing and re-indexing can result in newly generated files or old ones not being cleaned up yet, depending on how well you flushed-on-write.

So we're going to need to get creating.

## Generating Our Index

Before that though we need a way to repeatably generate the index, and to do that we'll add a new project to our solution:

```sh
dotnet new console --name Search.IndexBuilder
dotnet sln add Search.IndexBuilder
```

The `IndexBuilder` project is a console application that will replace much of the functionality that our WASM project had in building the index, so it's going to need some NuGet packages:

```xml
<ItemGroup>
    <PackageReference Include="Lucene.Net" Version="4.8.0-beta00006" />
    <PackageReference Include="Lucene.Net.Analysis.Common" Version="4.8.0-beta00006" />
    <PackageReference Include="System.Json" Version="4.7.0-preview3.19551.4" />
    <PackageReference Include="FSharp.SystemTextJson" Version="0.6.2" />
</ItemGroup>
```

This also means we can remove `System.Json` and `FSharp.SystemTextJson` from the `Search.Site` project (in time, once we've moved the code).

Inside the newly created `Program.fs` file we can start working on the index creation, first step is to get the JSON for my blog. Rather than downloading it from my website I'm traversing the disk to get it ([since the Search App is in the same git repo](https://github.com/aaronpowell/aaronpowell.github.io/tree/master/Search)):

```fsharp
[<EntryPoint>]
open System
open System.IO

let main argv =
    let searchText = File.ReadAllText <| Path.Combine(Environment.CurrentDirectory, "..", "..", ".output", "index.json")

    0
```

Now to parse the JSON into our object model like before:

```fsharp
open System
open System.IO
open System.Text.Json
open System.Text.Json.Serialization
open Search
open JsonExtensions

let main argv =
    let searchText = File.ReadAllText <| Path.Combine(Environment.CurrentDirectory, "..", "..", ".output", "index.json")

    let options = JsonSerializerOptions()
    options.PropertyNameCaseInsensitive <- true
    options.Converters.Add(JsonFSharpConverter())
    options.Converters.Add(InvalidDateTimeConverter())

    let searchData = JsonSerializer.Deserialize<SearchData>(searchText, options)

    printfn "Got data from export, there are %d posts" searchData.posts.Length

    0
```

Then we'll finish off with cleaning up previous indexes, making a new one and generating a deployment package:

```fsharp
open System
open System.IO
open System.Text.Json
open System.Text.Json.Serialization
open Search
open JsonExtensions
open IndexTools
open Packager

[<EntryPoint>]
let main argv =
    let baseDir = Environment.CurrentDirectory
    let searchText = File.ReadAllText <| Path.Combine(baseDir, "..", "..", ".output", "index.json")

    let options = JsonSerializerOptions()
    options.PropertyNameCaseInsensitive <- true
    options.Converters.Add(JsonFSharpConverter())
    options.Converters.Add(InvalidDateTimeConverter())

    let searchData = JsonSerializer.Deserialize<SearchData>(searchText, options)

    printfn "Got data from export, there are %d posts" searchData.posts.Length

    cleanupIndex baseDir
    |> makeIndex searchData
    |> packageIndex baseDir

    0
```

The `cleanupIndex` function is a little function responsible for removing a previous index:

```fsharp
let cleanupIndex baseDir =
    let indexPath = Path.Combine(baseDir, "lucene")

    if Directory.Exists indexPath then
        Directory.GetFiles indexPath |> Array.iter File.Delete
        Directory.Delete indexPath
    indexPath
```

And the `makeIndex` function is the same as we had in the `OnInitializedAsync` function of our component, so I won't inline it here (you can find it [on GitHub](https://github.com/aaronpowell/aaronpowell.github.io/blob/master/Search/Search.IndexBuilder/IndexTools.fs)).

That leaves us with one last function, `packageIndex`.

## Packaging the Index

Remember in the previous post that we noticed that you can use `System.IO` in Blazor and there is a file system available to you (fun fact, it's a Linux file system!)? Well that got me thinking since we're able to write to it with Lucene.NET we should be able to write **anything** to it, and since we can use any netstandard library we could use an archive as the delivery mechanism!

And that's just what we'll do, we'll use [`System.IO.Compression.ZipFile`](https://docs.microsoft.com/en-us/dotnet/api/system.io.compression.zipfile?view=netcore-3.0&{{<cda>}}):

```fsharp
module Packager

open System.IO
open System.IO.Compression

let packageIndex baseDir indexPath =
    let packagePath = Path.Combine(baseDir, "index.zip")
    if File.Exists packagePath then
        File.Delete packagePath

    ZipFile.CreateFromDirectory(indexPath, packagePath, CompressionLevel.Fastest, false)
```

The `packageIndex` function will take in a starting directory and the path to the index, and put all those index files into a zip archive. Now we have a file that can be put on our server at a known location with a known file name for use in the component!

## Updating the Component

With the logic to build the index pushed off to a console application, we can now drastically simplify the component that we've created. First we'll download the zip file as a stream and write it to disk:

```fsharp
let downloadIndex() =
    task {
        let path = Path.Combine(Environment.CurrentDirectory, "index.zip")

        use! stream = http.GetStreamAsync("/index.zip")
        use file = File.Create path
        stream.CopyTo file
        return path
    }
```

_Note: This still uses the `HttpClient` injected via the Blazor Dependency Injection framework._

See how we're able to use `GetStreamAsync` to stream the file and copy that stream to a `FileStream`? This is how you download a file in **any** .NET Core project, nothing special here even though it's in WebAssembly.

Then create another function to unpack the zip:

```fsharp
let extractZip path = ZipFile.ExtractToDirectory(path, Environment.CurrentDirectory)
```

Finally, the `OnInitializedAsync` can be updated:

```fsharp
override this.OnInitializedAsync() =
    task {
        let! indexPath = downloadIndex()
        extractZip indexPath

        dir <- FSDirectory.Open(Environment.CurrentDirectory)
        reader <- DirectoryReader.Open dir

        this.IndexLoaded <- true
    }
    |> Task.Ignore
```

Look at that, 25 lines down to 12, and since Lucene.NET is very efficient at opening indexes the application now only takes as long as it takes to download and extract the zip archive (we're talking fractions of a second vs ten's of seconds). You'll find the fully updated component [on GitHub](https://github.com/aaronpowell/aaronpowell.github.io/blob/master/Search/Search.Site/SearchComponent.fs).

## Conclusion

Like with the original experiment to run Lucene.NET in Blazor WebAssembly I was pretty amazed that this "just worked", especially since it involves downloading a zip file, writing it "to disk" and then unpacking the archive. I remember early in my career that it was nearly impossible to do that on the server and now it's less than 50 lines of code running in the browser!

That aside I think this is a nifty way to think about optimising Blazor applications. It's very easy to forget that Blazor WASM is going to be running on every client that connects, so they are all going to be doing the heavy lifting, so if there's an opportunity to offload some of that work and simplify what the client has to do, then it makes sense to do it.

Here it was a case of generating a Lucene.NET index that we then download, but it could be any number of things that your application would normally "create on startup".

But in the end it all "just works", which you can see on my [sites search feature]({{<ref "/search.md">}}) and the full source code is in [the `Search` folder on my blog's GitHub repo](https://github.com/aaronpowell/aaronpowell.github.io/tree/master/Search).