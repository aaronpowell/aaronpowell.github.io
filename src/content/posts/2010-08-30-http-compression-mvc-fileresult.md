---
  title: "Using HttpCompression libraries and ASP.NET MVC FileResult"
  metaTitle: "Using HttpCompression libraries and ASP.NET MVC FileResult"
  description: "An interesting quirk I found from ClientDe"
  revised: "2010-09-11"
  date: "2010-08-30"
  tags: 
    - "asp.net-mvc"
    - "clientdependency"
    - "umbraco"
  migrated: "true"
  urls: 
    - "/http-compression-mvc-fileresult"
  summary: ""
---
While working on some improvements around the way the styles are handled on my blog (and so they don't get trashed whenever I update the code with that of the main repository) I decided that I would use [ClientDependency][1] to handle this.

It was quite easy, I added ClientDependency in, re-configured the Views to use it and refactored the CSS so that it was possible to have my CSS along side the other CSS.

All was well and good until I noticed a problem, all the images on my blog were no longer working, they were coming up as broken images. That's not good, I kind of need them... So I did a bit more investigation, all the download links were also broken. Ok, that's *really* not good...

I rolled back source control and it seemed that everything was working just fine before I added ClientDependency, but ClientDependency shouldn't have any effect on downloads... Should it?

So I did some digging, I was doing everything that should have been done to return a file, hell, it was even more basic than you'd expect:

	public virtual ActionResult Render(string path)
	{
		if (_fileRepository.IsFile(path))
		{
			var fullPath = _fileRepository.MapPath(path);
			return File(fullPath, _mimeHelper.GetMimeType(fullPath));
		}
		return Redirect("/");
	}

That looks fine right... right?! *Yes, that is fine :P*

##Hunting for bugs

Well it was time to start finding the problem, and I had a feeling this was going to be a doosy. I started by disabling ClientDependency and then the images did start working (although my CSS fell apart...), so I was 100% convinced that the problem was with it, but what could it be, I'm working with binary files here, not CSS.

So I crack out my debugger and start stepping through the ClientDependency source and what I first notice is that I don't know anywhere near as much about it as I would have like to! Eventually I find something a little bit off. Because ClientDependency runs as a HttpModule it fires for the request of the image, well that's my first red-flag. And I start worrying, if it's having the image through its pipeline maybe it's doing something it shouldn't be.

The next thing I start looking for is a check of the content type, hoping that it's ignoring the image request... but no joy.

In fact, that's exactly the problem! The way ClientDependency works is that it adds a filter to the HttpRequest which processes the contents of the page and then in-turn transforms it in the manner of which we require. The problem is, it didn't ignore the image content type, in fact it turned it into a string, processed it and returned the original string, but now it was no longer a binary object.

Cock...

##He'll be making a ContentType and checking it twice

So this is a very obvious problem, we're not ignoring the images, we're treating their request as though it is any text/plain request, so I put in a conditional check to ignore the image requests, drop it into my blog and hit refresh. But still no joy... I check again that I did put the line of code in, attach the debugger and spin it off.

To my surprise though the content type property of my response is not `image/png` as I expected it expected it to be, but instead it's `text/plain`. Err, WTF? I spin up Charles and check, nope, Charles is saying that it's `image/png` in the browser. I spin up PowerShell and write a simple web request script, again it's telling my `image/png`. Well why the hell is the HttpModule telling me otherwise?

###An event by any other name...

So I start doing some research and realise that we're using the event [HttpApplication.PreRequestHandlerExecute][2] to do the transform, but fun fact is that this is too early in the request life cycle. At this point the Request object is populated, but it's not been handled, so the object doesn't have the appropriate ContentType set.

After a bit more research I fine a better event to suite my needs, [HttpApplication.PostRequestHandlerExecute][3], and this is the one recommended when doing filters against the HttpResponse.

Now my ContentType property is set up and I can do checking against it, and the fix now works nicely (there currently isn't a ClientDependency release available with this fix yet, so if you need it you'll have to grab it from the source).

##A word of caution

The reason I've made this post is to bring this oversight to peoples attention. While doing the research to fix this problem I looked at a few different libraries which add custom filters (either to remove whitespace, or to gzip responses, etc) and I didn't find any of them *doing content type checking of the response*. Generally speaking you shouldn't need to do this, and in the past it's not really been needed as it wasn't as common place to have ASP.NET web applications actually return a file. But with the advent of MVC and the easy in which you can use `FileResult` it's something to watch out for.

There's nothing wrong with using HttpModule's to compress your response, clean up your HTML or run what ever other filter you may desire, but make sure you're using one that understands that not everything running through the ASP.NET life cycle can be handled as a string ;).


  [1]: http://clientdependency.codeplex.com
  [2]: http://msdn.microsoft.com/en-us/library/system.web.httpapplication.prerequesthandlerexecute.aspx
  [3]: http://msdn.microsoft.com/en-us/library/system.web.httpapplication.PostRequestHandlerExecute.aspx

