namespace Search.Site

open Microsoft.AspNetCore.Components
open FSharp.Control.Tasks.V2
open Lucene.Net.Index
open Lucene.Net.Store
open System.Net.Http
open System.Threading.Tasks
open SearchResult
open IndexTools

module Task =
    let Ignore(resultTask: Task<_>): Task = upcast resultTask

type SearchComponent() =
    inherit ComponentBase()
    let mutable dir: FSDirectory = null
    let mutable reader: IndexReader = null

    [<Inject>]
    member val Http: HttpClient = null with get, set

    member val IndexLoaded = false with get, set

    override this.OnInitializedAsync() =
        task {
            let! indexPackagePath = downloadIndex this.Http.GetStreamAsync
            let indexPath = extractZip indexPackagePath

            dir <- FSDirectory.Open indexPath
            reader <- DirectoryReader.Open dir

            this.IndexLoaded <- true
        }
        |> Task.Ignore

    member val SearchTerm = "" with get, set
    member val SearchResults = Array.empty<Post> with get, set

    member this.Search() =
        match this.SearchTerm with
        | "" -> ignore()
        | term -> this.SearchResults <- search term reader
