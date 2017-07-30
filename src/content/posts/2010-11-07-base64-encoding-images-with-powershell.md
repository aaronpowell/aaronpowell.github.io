---
  title: "Base64 Encoding of Images via Powershell"
  metaTitle: "Base64 Encoding of Images via Powershell"
  description: "Turning an image into a string... simply"
  revised: "2010-11-07"
  date: "2010-11-07"
  tags: 
    - "powershell"
  migrated: "true"
  urls: 
    - "/base64-encoding-images-with-powershell"
  summary: ""
---
Recently I was doing some CSS for a client but there was a bit of a problem with putting stuff into source control, basically there was a release coming up from one section of the source tree that I needed to put some images into for the CSS, but because they weren't approved for this release I couldn't commit them.

The new CSS wasn't going to be included in this release either, but I wanted to get at least some stuff source controlled (it's in a different part of the tree so I could commit it) and to achieve this with the images I decided to use base64 encoding.

If you're not aware something that modern browsers (like IE8+, FF, Chrome, etc) are starting to support is [RFC 2397][1] which is also known as the "data" URI scheme. The basic premise behind this (if you're not interested in reading the whole spec yourself :P) is to allow you to embed an encoded version of a URI response in place of the URI itself. This allows you to do funky stuff like this:

    <IMG
    SRC="data:image/gif;base64,R0lGODdhMAAwAPAAAAAAAP///ywAAAAAMAAw
    AAC8IyPqcvt3wCcDkiLc7C0qwyGHhSWpjQu5yqmCYsapyuvUUlvONmOZtfzgFz
    ByTB10QgxOR0TqBQejhRNzOfkVJ+5YiUqrXF5Y5lKh/DeuNcP5yLWGsEbtLiOSp
    a/TPg7JpJHxyendzWTBfX0cxOnKPjgBzi4diinWGdkF8kjdfnycQZXZeYGejmJl
    ZeGl9i2icVqaNVailT6F5iJ90m6mvuTS4OK05M0vDk0Q4XUtwvKOzrcd3iq9uis
    F81M1OIcR7lEewwcLp7tuNNkM3uNna3F2JQFo97Vriy/Xl4/f1cf5VWzXyym7PH
    hhx4dbgYKAAA7"
    ALT="Larry">

This technique can also be used with CSS, in background images, and it's what I decided to go with. But how do you convert an image to a base64 string? There's plenty of helper sites on the web, or maybe you can write a C# console application to do it.

I decided to go a bit different with it, since it was something I'd be doing a few times I wanted it to be quite to write and easy to run, so Powershell was what I decided to go with.

So I hit up [Jason Stangroome][2] for some Powershell wizardry (read: he told me what to code) and came up with a nifty 2-line Powershell file:

    Param([String]$path)
    [convert]::ToBase64String((get-content $path -encoding byte))

You then use it like so:

    PS> .\ImageToBase64.ps1 C:\Path\To\Image.png >> base64.txt

Jason thinks you can do it with only a single line script by putting the `Param` declaration on the same line of `convert` statement, but I think that having it on 2 lines should be fine :P.

  [1]: http://tools.ietf.org/html/rfc2397
  [2]: http://blog.codeassassin.com/
