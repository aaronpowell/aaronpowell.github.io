---
  title: "OWIN and View Engines"
  metaTitle: "OWIN and View Engines"
  description: "A look at how you'd put together a View Engine for OWIN."
  revised: "2012-03-23"
  date: "2012-03-23"
  tags: 
    - "owin"
    - "web"
  migrated: "true"
  urls: 
    - "/web/owin-view-engines"
  summary: ""
---
In the [last post](https://www.aaron-powell.com/web/owin-responses) we looked at improving our responses in OWIN by adding some extensions methods to the response object and the next logical step for this is to think about HTML. While what we've brought together thus far is useful if you're creating something that is just a web API if  you want to create an actual web site you probably need to respond with some HTML.

To this end we're going to need to think about creating a *View Engine* that will be responsible for our HTML generation. The reason I want to go down this path is it makes it nicer if we want to add some level of dynamic data to the HTML we're serving, say insert a user name or other things like that.

# Picking our language

HTML isn't a language that has dynamic features to it so we need to look at a templating language to leverage for this. If you look around there's plenty of different HTML templating languages like HAML, Spark, Jade or even Razor.

Since I want to make it something easy to understand for the .NET developer I'm going to use Razor as my templating language, and I'm going to use the [RazorEngine](http://razorengine.codeplex.com/) project to help me out (it saves me writing all the bootstrapping code).

# Approaching the View Engine

So we're going to use Razor but *how* are we going to use it? We need some way to "create" our View Engine and then we will want to interact with it.

Since the View Engine could be a little bit complex I'm going to create a class which will represent the engine. This will also mean that I can do some caching within the View Engine to ensure optimal performance.

With that in mind how are we going to interact with the View Engine? We obviously don't want to spin it up every single time, instead I want it to always be available. So this means that I'm going to have a static that lives *somewhere* which I'll want to interact with.

Finally how will we get that View Engine instance? Do we have it magically created or do we want it lazy-loaded?

These are all things to be considered but my approach is going to be:

* Use a singleton for the View Engine
* Have a `ViewEngineActivator` which we access it through
* The user must explicitly register the `ViewEngine` they want to use in code

## Coding the View Engine

Thinking about the View Engine there's not a lot that the class would have to publicly expose, in fact I really think you only want two methods, one that takes a view name, one which takes a view name and a model.

So the View Engine will look something like this:

	public class RazorViewEngine
	{
		public string Parse(string viewName)
		{
			return Parse<object>(viewName, null);
		}
		
		public string Parse<T>(string viewName, T model)
		{
			throw new NotImplementedException();
		}
	}
	
Cool that's not very complex, let's start on the activator:

	public static class ViewEngineActivator
	{
		public static RazorViewEngine ViewEngine { get; set; }
	}
	
And now we'll make it possible to register a View Engine:

	public static IAppBuilder UseViewEngine<TViewEngine>(this IAppBuilder builder)
		where TViewEngine: RazorViewEngine, new()
	{
		ViewEngineActivator.ViewEngine = new TViewEngine();
	}
	
	/* snip */
	builder.UseViewEngine<RazorViewEngine>();
	
Now  that the infrastructure code is all there we need to think about how we would go about reading in the views and turning them into something we can send down as a response. In our View Engine we're going to need to know where to find the views. I like conventions so I'm going to expect them to be in the `views` folder at the application root. But I'm a nice guy so I think it should be possible to put the views into another folder if you desire so I'll add some constructors like so:

    public RazorViewEngine()
        : this("views", "_layout")
    {
    }

    public RazorViewEngine(string viewFolder, string layoutViewName)
    {
        ViewFolder = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, viewFolder);
        LayoutViewName = layoutViewName;

        if (!Directory.Exists(ViewFolder))
            throw new DirectoryNotFoundException("The view folder specified cannot be located.\r\nThe folder should be in the root of your application which was resolved as " + AppDomain.CurrentDomain.BaseDirectory);
    }
        
I'm also going to check to make sure that the views folder *does* exist. I'm also wanting support a "layout" view so that you can do reusable HTML; it just makes sense.

Since you're now able to specify the Views folder I'll add another extension method so you can provide that instead of using the default way:

	public static IAppBuilder UseViewEngine<TViewEngine>(this IAppBuilder builder, TViewEngine viewEngine)
		where TViewEngine: RazorViewEngine
	{
		ViewEngineActivator.ViewEngine = viewEngine;
	}
	
This also means that you could super-class the `RazorViewEngine` if you want and provide additional functionality.

Next up we'll start implementing our `Parse<T>` method. 

    public string Parse<T>(string viewName, T model)
    {
        viewName = viewName.ToLower();

        if (!viewCache.ContainsKey(viewName))
        {
            var layout = FindView(LayoutViewName);
            var view = FindView(viewName);

            if (!view.Exists)
                throw new FileNotFoundException("No view with the name '" + view + "' was found in the views folder (" + ViewFolder + ").\r\nEnsure that you have a file with that name and an extension of either cshtml or vbhtml");

            var content = File.ReadAllText(view.FullName);

            if (layout.Exists)
                content = File.ReadAllText(layout.FullName).Replace("@Body", content);

            viewCache[viewName] = content;
        }

        return Razor.Parse(viewCache[viewName], model);
    }
    
What you'll see here is I'm creating a cache of views that get discovered for performance so it's all shoved into a static dictionary that I've got*. Assuming that this is the first time we'll look for the layout view and current view, raise an error if the view isn't found, and then combine them all together.

**This is pretty hacky code and doesn't take concurrency into account; make sure you do double-lock checking!*

One convention I'm adding myself is that the "body" (aka, the current view) will be rendered where ever you place an `@Body` directive. This is because we're using Razor *the language* which is slightly different to MVC's Razor. The language doesn't include the `RenderBody` method, that's specific for the implementation. When creating your own view engine though you're at liberty to do this how ever you want. You could alternatively create your own base class that handles the body better, me, I'm lazy and want a quick demo.

I finish off caching the generated template so that next time we can skip a bunch of the lookup steps and then get RazorEngine to parse the template and send back the HTML*.

**I'm not sure if this is the best way to do it with RazorEngine, I think you can do it better for caching but meh. Also, you don't have to return HTML, you could use this engine to output any angled-bracket content.*

# Using our View Engine

Now that we have our View Engine written we need to work out how we'll actually use it. Like we did in the last post I'm going to use extension methods on the Response object to provide the functionality:

    public static void View(this Response res, string view)
    {
        var output = ViewEngineActivator.ViewEngine.Parse(view);

        res.ContentType = "text/html";
        res.Status = "200 OK";
        res.End(output);
    }
    
    public static void View<T>(this Response res, string view, T model)
    {
        var output = ViewEngineActivator.ViewEngine.Parse(view, model);

        res.ContentType = "text/html";
        res.Status = "200 OK";
        res.End(output);
    }

This is pretty simple, we're really just acting as a bridge between the response and the view engine. Sure I'm also making the assumption that it's `text/html` that we're returning despite saying above we can do any angled-bracket response, changing that can be your exercise dear reader.

# Bringing it all together

So we've got everything written let's start using it:

	builder
		.UseViewEngine<RazorViewEngine>()
		.Get("/razor/basic", (req, res) =>
		{
			res.View("Basic");
		});
		
Pretty simple to use our View Engine now isn't it!

# Conclusion

In this post we've had a look at what it'd take to produce a basic View Engine on top of OWIN, building on top of the knowledge and concepts of the last few posts.

In the next post I'm going to take the idea of a View Engine one step further and give the user a lot more power.

As always you can check out the full code up on the [GitHub repository](https://github.com/aaronpowell/Owin.HelloWorld).
