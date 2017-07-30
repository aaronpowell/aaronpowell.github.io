---
  title: "How to check if a file exists in Windows 8"
  metaTitle: "How to check if a file exists in Windows 8"
  description: "Ever wondered how to check if a file exists in Windows 8?"
  revised: "2012-09-24"
  date: "2012-09-24"
  tags: 
    - "windows8"
    - "winjs"
    - "c#"
    - "winrt"
  migrated: "true"
  urls: 
    - "/winrt/check-if-file-exists"
  summary: ""
---
Sometimes things are simple, sometimes they aren't when you think they should be. One such thing in Windows 8 development is checking if a file exists...

In a Windows 8 app (be it C# or JavaScript) you work with the [`StorageFolder`][1]. Since we are sandboxed and don't really have file-system access we don't have the `System.IO` namespace as we're use to meaning we have an entirely new set of APIs for reading a writing files (although it's nice that they are built around being asynchronous). The fun thing about `StorageFolder` is it has no method like `FileExistsAsync`. Yep, there's no API which will allow you to work out whether a file exists or not...

So how do you do it?

# EDD, Exception Driven Development

If you've done much Windows 8 development you'll have learnt that a lot of the methods you'd expect to return null values or have a `TryGetFoo` method will actually raise an exception when the take can't be completed. `StorageFolder` is no exception to this rule.

Although I can't find it documented anywhere it seems that the only way you can check if a file exists if with this:

    StorageFile file;
    try {
        file = await ApplicationData.Current.LocalStorage.GetFileAsync("foo.txt");
    }
    catch (FileNotFoundException) {
        file = null;
    }

It seems to consistently throw the `FileNotFoundException` when it doesn't exist (which I guess makes sense :P), but the problem is that you end up with this try/ catch block where you're essentially swallow an exception (and everything in my programming past tells me that that's a bad idea).

Well the logic is pretty straight forward so here's an extension method:

    public static class StorageFolderExtensions
    {
        public static async Task<bool> FileExistsAsync(this StorageFolder folder, string fileName)
        {
            try
            {
                await folder.GetFileAsync(fileName);
                return true;
            }
            catch (FileNotFoundException)
            {
                return false;
            }
        }
    }

Or grab the [gist](https://gist.github.com/3773739).

# WinJS file exists

So that above is all well and good in C#/ XAML Windows 8 applications, but what if you're like me and would prefer to just use WinJS?

Well the API is slightly less shit for WinJS, true you still don't have any easy way to check if a file exists or not but instead of being exception based it handles it through [promises][2]:

    var folder = Windows.Storage.ApplicationData.current.roamingFolder;
    folder.getFileAsync('foo.txt').then(function (file) {
        //process with a valid file
    }, function (e) {
        //no file was found
    });

While this is _somewhat_ nicer as you don't have to try/ catch the error it's still not ideal. One of the main problems here is there's no way to know _what_ error was raised. Since JavaScript doesn't have typed error handling like C# any error that comes from the `getFileAsync` method goes into the same error handler. This can be a bit of a pain although I'm struggling to find any documentation on what else could be raised.

There's three things you can do in this case:

1. Assume that it is the WinJS equivilent of `FileNotFoundException` and treat all errors the same (this is probably the best way, you don't have a file, do you really care why?)
1. You can check the message contains something stating the file didn't exist, but if you do this make sure you're taking localisation into account!
1. Cast it to it's _base error type_ and go from there. This isn't overly robust as the best you can do is `e instanceof WinRTError` as it's not _of type_ `FileNotFoundException`

If you're really keen here's an _extension method_ for doing it in WinJS in a very basic manner ([and gist][3]):

    Windows.Storage.StorageFolder.prototype.fileExistsAsync = function(fileName) {
        var folder = this;
        return WinJS.Promise(function (complete, error) {
            folder.getFileAsync(fileName).then(function() {
                complete();
            }, function() {
                error();
            });
        });
    };

But realistically I wouldn't bother, since WinJS uses a Promise for this you can pretty easily split out the logic branch between the found/ not found process without the need for an ugly try/ catch block in place. Hell if you don't want to do anything when there isn't a file then you can drop the error callback all together and the application will carry on its merry way.

# Conclusion

There's no built in method for determining if a file exists or not from a Windows 8 application using the `StorageFolder` API. If you're using C# you're going to need to handle the `FileNotFoundException` and go from there. A simple extension method is easy to create if you're doing a lot of file IO and want to check files exist. WinJS is marginally better though the different async handling but really it's just hiding the try/ catch away behind another layer. In this case you can provide different callbacks for the different states which can make the code a little cleaner.

  [1]: http://msdn.microsoft.com/library/windows/apps/BR227230
  [2]: http://msdn.microsoft.com/en-us/library/windows/apps/br211867.aspx
  [3]: https://gist.github.com/3773776