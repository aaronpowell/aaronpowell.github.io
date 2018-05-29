---
  title: "OWIN and Middleware"
  metaTitle: "OWIN and Middleware"
  description: ""
  revised: "2012-03-15"
  date: "2012-03-15"
  tags: 
    - "owin"
    - "web"
  migrated: "true"
  urls: 
    - "/web/owin-and-middleware"
  summary: ""
---
In my [last post](https://www.aaron-powell.com/web/hello-owin) I looked at getting started with the basics of OWIN and how to create a server which wont do anything overly useful. In this post I want to go a step further and look at how we can start introducing our own layers on top of OWIN (and Gate) to make it nicer to do like *web stuff*.

# It's all about the modules

One of the aims of OWIN is to be very lightweight and as we saw in the last post OWIN itself doesn't really have anything in it and it doesn't really do anything. This means that you're entirely responsible for what you do and don't have included in your server. What this means is that OWIN is very modular, it's a mix-and-match of what you want to include in your project and if you don't want something then don't include the assembly, but it also means that you often have to do something yourself, and this is done through modules.

# Middleware

In comes the concept of [Middleware](http://en.wikipedia.org/wiki/Middleware); now this isn't a new concept in software but it's probably foreign to most .NET developers, particularly ASP.Net as we've always had it built in and never needed to think about it. But with OWIN it's not so, you've kind of got to start from scratch.

*Now this isn't entirely true, there's already OWIN middleware out there like [Nancy](http://nancyfx.org/), [Kayak](https://github.com/kayak/kayak) and [Gate.Middleware](http://nuget.org/packages/gate.middleware) to name a few, but I want to introduce the concept and what to do to make a basic middleware. Really you want to be looking at existing libraries to give you what you need.*

Back in the last example we had a single method that was handling all the requests that were coming in, be they to `/` or `/favicon.ico`, a HTTP GET or POST, everything was handed to this one method. But this isn't really ideal now is it? You can't really expect an application to be run out of a single delegate now can you? Let's start with a simple handler.

# Handling different verbs

I want to start by making it easy to filter requests by the HTTP verb used, so I can have different handlers for GET, POST, PUT, etc. This is a pretty common scenario we'd want to handle if we're building a RESTful service so let's get started.

To implement this I want to extend the `IAppBuilder` interface that we came across in our last post through the use of extension methods and I'm also going to build on top of [Gate](http://nuget.org/packages/gate) for simplicities sake. So I'll start with crating our class:

    public static class Middleware {
        public static IAppBuilder Get(this IAppBuilder builder, /* todo - something goes there */) {
            throw new NotImplementedException();
        }
    }
    
So this is our extension method, we're going to extend `IAppBuilder` but what will the argument(s) be that we're passing in? Well we're going to want something to execute, we're going to want a delegate, and since I want the consumer of my API to be able to get pretty good control over what's happening I'll pass in a `Request` and `Response` object which come from Gate:

    public static class Middleware {
        public static IAppBuilder Get(this IAppBuilder builder, Action<Request, Response> app) {
            throw new NotImplementedException();
        }
    }
    
This allows me to consume the API like so:

	builder.Get((req, res) => {
		res.Status = "200 OK";
		res.ContentType = "text/plain"
		res.Write("Hello World!\r\b").End();
	});

But what does the implementation look like? It's all well and good to have an API but if all it does is throw a `NotImplementedException` it's kind of a shitty API...

So inside out `Get` method we need to ensure that we're only invoking the delegate provided when it's correct to do so, aka, when the request has come in as a HTTP GET.

The OWIN specification is nice enough to tell us what is happening in the request as it's coming in through the use of a few [environment variables it defines](http://owin.org/spec/owin-1.0.0draft5.html#EnvironmentDictionary), the one of interest to us is `owin.RequestMethod`. From here we can work out if we actually have to do something with the request or hand it off to something else.

The crux of what we're going to be coding will sit on top of the `IAppBuilder.Use<TApp>` method, and we'll also return this to allow for method chaining (since `Use` returns an `IAppBuilder`) and it'll look like so:

        public static IAppBuilder Get(this IAppBuilder builder, Action<Request, Response> app) {
            return builder.Use<AppDelegate>(next => (env, result, fault) => {
                throw new NotImplementedException();
            });
        }
        
The generic type we're going to be specifying is that of [AppDelegate](http://owin.org/spec/owin-1.0.0draft5.html#ApplicationDelegate) which defines a few basic arguments (read the spec!)and ultimately allows us to do some processing. The first step of which we want to check the HTTP Verb that has come in:

        public static IAppBuilder Get(this IAppBuilder builder, Action<Request, Response> app) {
            return builder.Use<AppDelegate>(next => (env, result, fault) => {
                if ((string)env["owin.RequestMethod"] == "GET") {
                    // yay
                } else {
                    // nay
                }
            });
        }
        
That's pretty simple isn't it, a request comes it, it gets handed to our delegate, we run a condition against and and if it matches we want to then pass that along to the handler that our API consumer provided us:

        public static IAppBuilder Get(this IAppBuilder builder, Action<Request, Response> app) {
            return builder.Use<AppDelegate>(next => (env, result, fault) => {
                if ((string)env["owin.RequestMethod"] == "GET") {
                    var req = new Request(env);
                    var res = new Response(result);
                    app(req, res);
                } else {
                    // nay
                }
            });
        }
        
When we match our verb we're creating a Request and Response object (these are helpers from Gate) which the handler can then manipulate. The handler is invoked (it's the `app` variable) and our processing is on its way.
        
But what do we do if it's not a GET request? Welcome to the world of delegates. You'll notice that there was a `next` variable defined to represent the `AppDelegate`, well we haven't used it yet, but that's what comes into play now when you don't want to handle the current request (or can't), we hand it off to someone else then it's their damn problem.

        public static IAppBuilder Get(this IAppBuilder builder, Action<Request, Response> app) {
            return builder.Use<AppDelegate>(next => (env, result, fault) => {
                if ((string)env["owin.RequestMethod"] == "GET") {
                    var req = new Request(env);
                    var res = new Response(result);
                    app(req, res);
                } else {
                    next(env, result, fault);
                }
            });
        }
        
Ta-Da! We've got our handler that will:

* Take a delegate of something to execute when we've got a request
* When a request comes in it'll check if matches our desired verb
* If it's a matched verb then we'll hand it to our delegate
* Otherwise give it back to your server for someone else to deal with it

You can then go and create extensions for all the verbs you want supported as well.

# Conclusion

In this post we've had a bit of a look at what to do to make it a bit easier to work with OWIN by starting our own layer of middleware. We created a little middleware helper to give us easy methods to provide delegates for the different HTTP verbs and hopefully given you a starting point for where you could build out other middleware features.

Next time we'll look at what you need to do to have routing included in your application.

I've decided to create a [GitHub repository](https://github.com/aaronpowell/Owin.HelloWorld) which you can see the code and follow the progress of these blog posts.