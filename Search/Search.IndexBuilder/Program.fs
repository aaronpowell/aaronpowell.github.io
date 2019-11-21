open System
open System.IO
open System.Text.Json
open System.Text.Json.Serialization
open Search
open Lucene.Net.Store
open Lucene.Net.Analysis.Standard
open Lucene.Net.Util
open Lucene.Net.Index
open Lucene.Net.Documents
open System.Collections.Generic
open JsonExtensions

[<EntryPoint>]
let main argv =
    let searchText = File.ReadAllText <| Path.Combine(Environment.CurrentDirectory, "..", "..", ".output", "index.json")

    let options = JsonSerializerOptions()
    options.PropertyNameCaseInsensitive <- true
    options.Converters.Add(JsonFSharpConverter())
    options.Converters.Add(InvalidDateTimeConverter())

    let searchData = JsonSerializer.Deserialize<SearchData>(searchText, options)

    printfn "Got data from export, there are %d posts" searchData.posts.Length

    let indexPath = Path.Combine(Environment.CurrentDirectory, "lucene")

    if Directory.Exists indexPath then
        Directory.GetFiles indexPath
        |> Array.iter File.Delete
        Directory.Delete indexPath

    let dir = FSDirectory.Open indexPath

    let analyzer = new StandardAnalyzer(LuceneVersion.LUCENE_48)
    let indexConfig = IndexWriterConfig(LuceneVersion.LUCENE_48, analyzer)
    use writer = new IndexWriter(dir, indexConfig)

    searchData.posts
    |> Array.map (fun post ->
        let doc = Document()
        let titleField = doc.AddTextField("title", post.title, Field.Store.YES)
        titleField.Boost <- 5.f
        doc.AddTextField("content", post.content, Field.Store.NO) |> ignore
        doc.AddTextField("url", post.url, Field.Store.YES) |> ignore
        let descField = doc.AddTextField("desc", post.description, Field.Store.YES)
        descField.Boost <- 2.f
        doc.AddStringField
            ("date", DateTools.DateToString(post.date.UtcDateTime, DateTools.Resolution.MINUTE), Field.Store.YES)
        |> ignore
        doc :> IEnumerable<IIndexableField>)
    |> writer.AddDocuments

    0
