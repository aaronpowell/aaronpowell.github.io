module IndexTools

open FSharp.Control.Tasks.V2.ContextInsensitive
open System.IO
open System
open System.Threading.Tasks
open System.IO.Compression

let downloadIndex (getStream : string -> Task<Stream>) =
    task {
        let path = Path.Combine(Environment.CurrentDirectory, "index.zip")

        use! stream = getStream "/index.zip"
        use file = File.Create path
        stream.CopyTo file
        return path
    }

let extractZip path =
    let outputPath = Environment.CurrentDirectory
    ZipFile.ExtractToDirectory(path, outputPath)
    outputPath