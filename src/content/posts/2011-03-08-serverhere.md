---
  title: "ServerHere - When you just need a webserver"
  metaTitle: "ServerHere - When you just need a webserver"
  description: "A tool for when you just want to server some files."
  revised: "2011-03-09"
  date: "2011-03-08"
  tags: 
    - "web"
  migrated: "true"
  urls: 
    - "/serverhere"
  summary: ""
---
I've been doing a lot of JavaScript development recently and as cool as [jsfiddle][1] there's a few things that really irk me about it (which is a topic for another day) and sometimes you just want to run the file locally to see how it goes.

So you go and create a HTML and JavaScript file on your file system and you open it in your browser and you have that crazy file system path in your address bar. Most browsers this is fine for, but IE likes to try and be a bit more secure so I'll often see this:

![IE security warning][2]

Sure you can change IE's security settings to be a little less aggressive and not give you that warning but I quite like that my browser is trying to be a bit secure, I don't see why that's such a bad thing.

But it can be a pain, if you don't accept the security warning your JavaScript doesn't work.

There's several ways I could go about solving this problem, I could use Visual Studio and IIS Express (or Cassini if you're old-school :P), I could map my local IIS install to that folder or I could write my own web server.

Guess what I did!

# ServerHere

If you guessed that I wrote my own web server then you guessed right. I've created a little project called **[ServerHere][3]** which does exactly what the name implies, *creates a web server from the current folder*.

It's a commandline tool and you use it just like this:

    PS> cd c:\SomeFolderToServe
    PS> c:\Path\To\ServerHere.exe

And there you go now you'll have a server running at `http://+:8080` (meaning `localhost` and machine name will work).

If you want to change the port it runs on you'll need to run it as an administrator and then run it like this:

    PS> c:\Path\To\ServerHere.exe /p:1234

Now it'll run on port `1234` rather than `8080` (or `6590` which is  the default administrator port, just to avoid potential conflicts).

# How do it work

There's a nifty little class in the .NET framework called [HttpListener][4] and this is the core of building your own web server. Basically it's a little class for handling the HTTP protocol.

To use it you need to create a new instance of the class and then specify some prefixes:

    var listener = new HttpListener();
    listener.Prefixes.Add("http://localhost:8080/");
    listener.Start();

Now you have a server running and listening on port 8080, via localhost. You can specify what ever hostname you want, or port number (but keep in mind that if you want to run a non-standard port you need to run as an administrator).

To actually handle the requests you can do it synchronously or asynchronously, obviously depending what's best for your scenario. ServerHere listens asynchronously so I'll cover that off (if you're interested in synchronous usages check the MSDN docs).

First off we'll create our web server class:

    public class HttpServer
    {
        private readonly HttpListener _listener;

        public HttpServer()
        {
            _listener = new HttpListener();
			_listener.Prefixes.Add("http://localhost:8080/");
			_listener.Start();
			
			_listener.BeginGetContext(HandleResponse, null);
        }

        public void HandlerResponse(IAsyncResult result) { ... }
    }

What we're using here is the `BeginGetContext` method, this will then deal with an async request. When the `Context` (which is a HttpContext basically) is ready (ie - someone has requested a URL) you can handle it, write to it, etc:

	private void HandleResponse(IAsyncResult result)
	{
		HttpListenerContext context;
		try
		{
			context = _listener.EndGetContext(result);

		    _listener.BeginGetContext(HandleResponse, null);
		}
		catch (HttpListenerException)
		{
			return;
		}

		using (var response = context.Response)
		{
			response.StatusCode = 200;
			response.ContentType = "text/plain";
			using (var writer = new StreamWriter(response.OutputStream))
			{
				writer.Write("Hello World!");
				writer.Flush();
			}
			response.Close();
		}
	}

This method will do the following:

* Grab the context from the listener (you want to catch the `HttpListenerException` which will be thrown if the server is shutting down)
* Keep the server alive by re-issuing a `BeginGetContext`
* Get the response from the context
* Set a status code
* Set a content type
* Write something to the response

I'll leave it as an exercise to the reader to work out how to react to different URLs, return more useful responses, etc.

# Conclusion

To wrap up we've seen a handy little tool for a scenario that you'll probably never come across.

We then looked at the basics for creating your own web server.

Now go, [grab the source][5] and create web servers to your hearts content!


  [1]: http://jsfiddle.net
  [2]: https://www.aaron-powell.com/upload/Render/javascript/ie-security.PNG
  [3]: http://hg.slace.biz/serverhere
  [4]: http://msdn.microsoft.com/en-us/library/system.net.httplistener.aspx
  [5]: http://hg.slace.biz/serverhere/src