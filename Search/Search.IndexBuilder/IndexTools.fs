module IndexTools
open System.IO
open Lucene.Net.Store
open Lucene.Net.Analysis.Standard
open Lucene.Net.Util
open Lucene.Net.Index
open Search
open Lucene.Net.Documents
open System.Collections.Generic

let cleanupIndex baseDir =
    let indexPath = Path.Combine(baseDir, "lucene")

    if Directory.Exists indexPath then
        Directory.GetFiles indexPath |> Array.iter File.Delete
        Directory.Delete indexPath
    indexPath

let private makeDoc post =
    let doc = Document()
    let titleField = doc.AddTextField("title", post.title, Field.Store.YES)
    titleField.Boost <- 5.f
    doc.AddTextField("content", post.content, Field.Store.NO) |> ignore
    doc.AddStringField("url", post.url, Field.Store.YES) |> ignore
    let descField = doc.AddTextField("desc", post.description, Field.Store.YES)
    descField.Boost <- 2.f
    doc.AddStringField
        ("date", DateTools.DateToString(post.date.UtcDateTime, DateTools.Resolution.MINUTE), Field.Store.YES)
    |> ignore
    post.tags
    |> Array.map
        (fun tag -> StringField("tag", tag, Field.Store.YES))
    |> Array.iter doc.Add
    doc :> IEnumerable<IIndexableField>

let makeIndex searchData (indexPath : string) =
    let dir = FSDirectory.Open indexPath

    let analyzer = new StandardAnalyzer(LuceneVersion.LUCENE_48)
    let indexConfig = IndexWriterConfig(LuceneVersion.LUCENE_48, analyzer)
    use writer = new IndexWriter(dir, indexConfig)

    searchData.posts
    |> Array.map makeDoc
    |> writer.AddDocuments

    indexPath