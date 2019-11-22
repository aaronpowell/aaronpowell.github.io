namespace Search.Site

open Microsoft.AspNetCore.Components
open FSharp.Control.Tasks.V2
open Lucene.Net.Store
open System
open System.Net.Http
open System.IO
open System.Threading.Tasks
open System.IO.Compression
open Lucene.Net.Index
open SearchResult

module Task =
    let Ignore(resultTask: Task<_>): Task = upcast resultTask

type SearchComponent() =
    inherit ComponentBase()
    let mutable dir: FSDirectory = null
    let mutable reader: IndexReader = null
    let mutable http: HttpClient = null

    let downloadIndex() =
        task {
            let path = Path.Combine(Environment.CurrentDirectory, "index.zip")

            use! stream = http.GetStreamAsync("/index.zip")
            use file = File.Create path
            stream.CopyTo file
            return path
        }

    let extractZip path = ZipFile.ExtractToDirectory(path, Environment.CurrentDirectory)

    [<Inject>]
    member _.Http
        with get () = http
        and set value = http <- value

    member val IndexLoaded = false with get, set

    override this.OnInitializedAsync() =
        task {
            let! indexPath = downloadIndex()
            extractZip indexPath

            dir <- FSDirectory.Open(Environment.CurrentDirectory)
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
