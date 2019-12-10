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
