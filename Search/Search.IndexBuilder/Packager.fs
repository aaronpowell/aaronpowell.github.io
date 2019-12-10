module Packager

open System.IO
open System.IO.Compression

let packageIndex baseDir indexPath =
    let packagePath = Path.Combine(baseDir, "index.zip")
    if File.Exists packagePath then
        File.Delete packagePath

    ZipFile.CreateFromDirectory(indexPath, packagePath, CompressionLevel.Fastest, false)
