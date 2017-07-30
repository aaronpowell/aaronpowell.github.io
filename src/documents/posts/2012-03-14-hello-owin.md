---
  title: "Hello OWIN"
  metaTitle: "Hello OWIN"
  description: "An introduction to OWIN and building a server."
  revised: "2012-03-14"
  date: "2012-03-14"
  tags: 
    - "owin"
    - "web"
  migrated: "true"
  urls: 
    - "/web/hello-owin"
  summary: ""
---
Long time readers of my blog will probably be aware that I've become quite a fan of [Node.js](http://nodejs.org). One of the things that I've liked about working with it is that it's very bare bones so you're working very closely with the HTTP pipeline, something that you don't do with ASP.Net (WebForms in particular, MVC is much closer but still a reasonable abstraction).

About 18 months ago a .NET project popped up on the radar though, a project called [OWIN](http://owin.org). OWIN isn't really a coding project though, it's a specification that defines how web applications and .NET web servers should communicate with each other. The nice thing about this is that is is really bare bones, like with Node.js OWIN defines a very thin layer on top of HTTP which can be very powerful.

# Hello OWIN

So you've decided you want to get started with OWIN, well where do you start?

As I mentioned about OWIN is really just a specification and if you read the [About](http://owin.org/#about) page it states:

> OWIN defines a single anonymous delegate signature, and therefore introduces no dependencies; there is no OWIN source code.

That means that you don't *actually* build against OWIN*, you want to look at some of the modules built on top of it.

**Note this isn't entirely true, you can build against the OWIN NuGet package but it's painfully difficult to anything :P. Check out [this](https://github.com/loudej/firefly/blob/541d0a77648dc1214fe280fa0b3a143e2d3a0373/src/sample/HelloWorld/Program.cs) for an example of a Hello World on just OWIN.*

Instead you probably want to have a look at [Gate](http://nuget.org/packages/gate), which is a set of helpers that sits on top of OWIN and makes it a bunch nicer to work with and it's what I'm going to use in this example.

The first thing I wanted to do was replicate the Node.js demo of creating a basic Hello World server:

	var http = require('http');
	http.createServer(function (req, res) {
	  res.writeHead(200, {'Content-Type': 'text/plain'});
	  res.end('Hello World\n');
	}).listen(1337, '127.0.0.1');
	console.log('Server running at http://127.0.0.1:1337/');
	
So if this is our goal how do we go about it with OWIN and Gate?

## Project Setup

Since there's no Gate project template (that I've found) we'll start with just a C# Class Library project. To this you'll want to add a dependency on Gate (and that'll include OWIN) and we're ready to go.

Most OWIN hosts (we'll talk about that in a minute) use a convention that to run there needs to be a public class named `Startup` in the root namespace of the assembly you're running, so we'll make one:

	public class Startup {
		public static void Configuration(IAppBuilder builder) {
		
		}
	}
	
Inside our `Startup` class we've got a `Configuration` method (taking `IAppBuilder` which comes from OWIN). This method is where we will define how to handle the requests that are coming in, basically where we define our Hello World.

## Creating a configuration

I'm going to use the `RunDirect` extension method (which resides in the `Gate` namespace) as it's as close as we get to the above Node.js function structure, and it looks like this:

        public static void Configuration(IAppBuilder builder) {
            builder
                .RunDirect((req, res) => {
                    res.Status = "200 OK";
                    res.ContentType = "text/plain";

                    res.Write("Hello World!\r\n")
                    	.End();
                });
            }
            
The code should be fairly easy to understand, we get two inputs and `Request` object and a `Response` object. These come from `Gate` (and this is why I recommend Gate over raw OWIN) and are really just dictionaries with a couple of helpful properties and methods for doings the simple stuff you'd want to be doing. 

## Hosting our application

If you're still following along you'll remember me saying that OWIN is really just a specification, it defines what the communication interfaces look like but it doesn't define *how* they should work, for that you're going to need an OWIN host. The ideal way to do this is through [ghost](http://whereslou.com/2012/02/20/ghost-exe-a-generic-host-for-owin-applications). Ghost is just an executable that you can run against a class library and spin up your project. Unfortunately I've been having [problems running ghost](https://github.com/owin/gate/issues/74) so rather than looking at producing something that requires hosting we can look at making our application **self hosting**. For this I'm going to use [Firefly](http://loudej.github.com/firefly) as it's a nice and simple host for OWIN applications, so go and install it from NuGet.

Now we've got the dependency on Firefly we need to make an executable rather than a class library. Start by adding a Program class and a Main method like so:

	class Program {
		static void Main(string[] args) {
		
		}
	}

Then you can go into your project properties and change the output type to a Console Application and set the appropriate startup object. All easier than creating a new project I think ;).

I'm also going to add a dependency on `Gate.Builder` which is another utility library that takes away some of the grunt work for setting up your application host. With this we're going to do 3 things:

* Create builder for our application (an implementation of `IAppBuilder`)
* Create a Firefly server
* Provide Firefly with our application

This is what our `Main` method will now look like:

        static void Main(string[] args)
        {
            var builder = new AppBuilder();
            //Tell the builder to use our configuration
            var app = builder.Build(Startup.Configuration);

            //Start up the server on port 1337
            var server = new ServerFactory().Create(app, 1337);

            Console.WriteLine("Server running at http://127.0.0.1:1337/");

            //Stay running!
            Console.ReadKey();
        }
        
# Conclusion

There we go hit F5 and your app will be running, just the same as our initial Node.js example and the full code can be found [here](https://gist.github.com/2032972).

It turns out that this isn't overly difficult to do, the trick is finding the various dependencies that you require, remember I use:

* Gate
* Gate.Builder
* Firefly

In the next post we'll look at how to handle requests in a better fashion with a basic middleware implementation.