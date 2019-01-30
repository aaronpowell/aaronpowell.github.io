---
  title: "Flight Mode - FileSystem API"
  metaTitle: "Flight Mode - FileSystem API"
  description: ""
  revised: "2013-05-28"
  date: "2013-05-28"
  tags: 
    - "flight-mode"
    - "offline-storage"
    - "file-system"
  migrated: "true"
  urls: 
    - "/flight-mode/file-system"
  summary: ""
---
The last piece of the puzzle when looking at offline storage options is a bit of a shift from what we've been looking at so far. Generally speaking we've been looking at how to store plain data, either through key/value stores or as objects. This time we're going to look at the other kind of data you might want to store, files.

There's two way we might want to store files, as binary data in IndexedDB or using the [FileSystem API](http://dev.w3.org/2009/dap/file-system/file-dir-sys.html). Since we looked at [IndexedDB last time]({{< ref "/posts/2013-05-27-indexeddb.md" >}}) (although didn't cover how to store Blobs, but the principle is the same as we looked at) this time we'll look at the FileSystem API.

_Side note: At the time of writing the only browser supporting this API is Chrome so this is more of a "watch this space" style post than a "go use it now" one._

The idea of the FileSystem API is to give browsers the ability to persist files either temporarily or permanent. Temporary persistence means that the browser is free to decide when it wants to get ride of the file system that has created where as permanent persistence means that it will not do an automatic cleanup of the files and folders.

Essentially what you end up with from the API is an ability to create files and folders in a sandboxed scenario. You don't have access to the real file system of the device, so no access to `My Documents` or `Program Files`, just an isolated little location to work in. So this can be really quite useful if you're say building a game, chances are you have a few assets that are required (audio, video, graphics) and the ability to retrieve them without web requests can be advantageous.

## Benefits of the FileSystem for storage

_As mentioned this API is serving a different purpose to the other storage APIs we've looked at, with the exception of IndexedDB (in a limited scenario at least) so some of the benefits are unfair comparisions._

Like IndexedDB the FileSystem API is an asynchronous API which has the obvious benefits when it comes to working with the kind of data it is designed for, storing large files you do ideally want that to be done asynchronously so that you aren't blocking the users interactions.

Another benefit is that the file system you create is completely sandboxed, meaning you don't have to worry about what others may try and do to it. The only thing you need to take into account is the persistence level of the file system, as mentioned above temporary file systems are at the browsers mercy for clean-up, but it's an opt-in to be using temporary persistence.

As with other storage options there are size limitations on the file system that is created, the difference is (at least at the time of writing) you can specify the size of the file system you want. Chrome will then determine whether the user needs to approve this storage level and if so request permission like other device-sensitive APIs (`getUserMedia` for example).

The API itself is quite nice to work with, especially if you're coming from a server background, creating new files is handled through writer streams while you have separate streams for reading files. You can store files of different types with different encodings and have a lot of flexibility to create a directory structure that suites your needs.

## Drawbacks of the FileSystem for storage

The main drawback is browser support, as mentioned Chrome is the only browser at present that implements the FileSystem API and it seems that one of their main drivers is use within their extension system. While there's nothing wrong with that it does mean that it's not really possible to utilize this API is a cross-browser scenario. There is a [shim available that uses IndexedDB](https://github.com/ebidel/idb.filesystem.js) but it does require your IndexedDB implementation to support `Blob` storage which can be a problem in Internet Explorer 10.

Another drawback is the API interactions, while it's not quite as verbose as working with IndexedDB the API itself partially relies on the DOM Level 3 events and partially relies on callbacks being provided. This means that in some instances you'll be attaching event handlers, like when you're using a `FileReader`:

	var reader = new FileReader();
	reader.onloadend = function (e) { ... };
	reader.readAsText(file);

And other times you'll have to pass a callback:

	window.requestFileSystem(window.TEMPORARY, 1024*1024, onInit, onError);

API inconsistence can be annoying for developers to work with and something that you need to be mindful of.

The final drawback I see is that there's no file system querying available, meaning you have to know where your files are stored, which can be a bit tricky when you're working with directories in your file system. Admittedly this is a minor problem, you probably shouldn't be storing files that you don't know the location of in the file system but it can still be something that you'd want.

## Implementing FileSystem storage

Unlike the other storage options I've decided to **not** cover off how to implement this API because:

1. It really wouldn't fit with the `FlightMode` API we've got so far, that's designed for non-hierarchical data
2. This is more of a _watch this space_ post than a _go use it_ one since the browser support is quite lacking
3. There is a [great article on HTML5 Rocks](http://www.html5rocks.com/en/tutorials/file/filesystem/) that'll do it more justice than I can give it

# Conclusion

The idea of being able to store files, complete files, in a structured manner on the client is a really exciting one. Admittedly there's a much narrower use-case for such an API compared to other storage options we've discussed the problems that it solves are very real and will likely become more valid as more true web applications rise.

The API itself is not back to work against, if it is a bit inconsistent and keep in mind that the specification is still in draft status so it may change in the future.
