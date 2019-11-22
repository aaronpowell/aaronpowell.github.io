module SearchResult

open Lucene.Net.QueryParsers.Classic
open Lucene.Net.Analysis.Standard
open Lucene.Net.Util
open Lucene.Net.Search
open Lucene.Net.Index

type Post =
    { Title: string
      Url: string
      Tags: string []
      Description: string
      Score: float32 }

let search (term: string) (reader: IndexReader) =
    use analyzer = new StandardAnalyzer(LuceneVersion.LUCENE_48)

    let qp =
        MultiFieldQueryParser
            (LuceneVersion.LUCENE_48, [| "title"; "content"; "tag"; "desc" |], analyzer,
             dict
                 [ "title", 1.f
                   "tag", 5.f
                   "content", 1.f
                   "desc", 1.f ])
    qp.DefaultOperator <- Operator.OR

    let query = qp.Parse <| term.ToLowerInvariant()

    printfn "Query: %A" query

    let searcher = IndexSearcher reader
    let sorter = Sort(SortField.FIELD_SCORE, SortField("date", SortFieldType.STRING))
    let topDocs = searcher.Search(query, 20, sorter)

    match topDocs.ScoreDocs.Length with
    | 0 -> Array.empty
    | _ ->
        let maxScore =
            topDocs.ScoreDocs
            |> Array.map (fun hit -> (hit :?> FieldDoc).Fields.[0] :?> float32)
            |> Array.max

        topDocs.ScoreDocs
        |> Array.map (fun hit ->
            let doc = searcher.Doc hit.Doc
            let score = (hit :?> FieldDoc).Fields.[0] :?> float32
            { Score = score / maxScore
              Title = doc.Get "title"
              Url = doc.Get "url"
              Description = doc.Get "desc"
              Tags =
                  doc.Fields
                  |> Seq.filter (fun f -> f.Name = "tag")
                  |> Seq.map (fun f -> f.GetStringValue())
                  |> Seq.toArray })
