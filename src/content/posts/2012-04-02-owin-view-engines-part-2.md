---
  title: "OWIN and View Engines, Part 2"
  metaTitle: "OWIN and View Engines, Part 2"
  description: "Taking the View Engine concept one step further"
  revised: "2012-04-02"
  date: "2012-04-02"
  tags: 
    - "owin"
    - "web"
  migrated: "true"
  urls: 
    - "/web/owin-view-engines-part-2"
  summary: ""
---
In the last post we had a bit of a look at [View Engines for OWIN](https://www.aaron-powell.com/web/owin-view-engines) and in this one I want to take the idea just a little bit further.

Most web frameworks you come across will allow you to choose your own View Engine. ASP.Net MVC allows for this (although it can be tricky) and frameworks like Express.js or Nancy make it quite easy to drop in your own one.

You may be wondering why you would want to do this? Apart from the "because you can" and "freedom of choice" reasons there is a slightly more valid reason. Most view engines while being generic often have a level of speciality to them; the developers who write it don't know about every scenario you'd want to use it in. Let's say you're a Node.js programmer who has a love for CoffeeScript. You might want to use the [CoffeeKup](http://coffeekup.org/) View Engine since it allows you to write in you *native* language (I don't want to debate the merits of this it's a valid scenario) but the problem with CoffeeKup is it can't do XML (at least the last time I used it it couldn't). This may not be really that big a deal for the majority of your application but what if you've got an RSS feed? Well then you can't really expose that through your chosen View Engine so you'd want for that specific route to be able to change to a different View Engine.

# Teasing out our View Engine

The first step to making our View Engine more extensible is I'm going to pull out an interface from the `RazorViewEngine` we have:

    public interface IViewEngine
    {
        string Parse(string viewName);
        string Parse<T>(string viewName, T model);
    }
    
Now I would just have to implement that interface to create a View Engine and not take a dependency on Razor at all.

You obviously want to update the other references to `RazorViewEngine` to just be the interface, such as on our singleton and generic argument constraints. Now everywhere we'll just deal with the interface and never the concrete class.

# Enabling multiple View Engines

Essentially what we're doing there is enabling multiple View Engines and I'm going to do this via two methods on my `ViewEngineActivator` called `RegisterViewEngine` and `ResolveViewEngine`:

	public static void RegisterViewEngine(string viewEngineId, Func<IViewEngine> viewEngineActivator)
	{
		throw new NotImplementedException();
	}
	
	public static IViewEngine ResolveViewEngine(string viewEngineId)
	{
		throw new NotImplementedException();
	}
	
I'm choosing to do a lazy invocation of the View Engine, meaning that you provide a function to create it rather than a created instance. The reason I've done this is just so we don't create it until we do actually require it. But because I only want to create it once anyway I'm going to store the created View Engine once the function executes. For storage I'm going to maintain a private variable like so:

	private static Dictionary<string, Tuple<Func<IViewEngine>, IViewEngine>> viewEngines = new Dictionary<string, Tuple<Func<IViewEngine>, IViewEngine>>();
	
And now we'll update our registration method:

    public static void RegisterViewEngine(string viewEngineId, Func<IViewEngine> viewEngineActivator)
    {
        viewEngines.Add(viewEngineId, new Tuple<Func<IViewEngine>, IViewEngine>(viewEngineActivator, (IViewEngine)null));
    }

As I said I'm staging the instance until it's needed so inside the tuple I'm just storing a null value. You'll also have noticed that I'm passing in an ID for the View Engine, this is so we can easily find it later on.

Now we'll go ahead and implement our resolution method:

    public static IViewEngine ResolveViewEngine(string viewEngineId)
    {
        if (string.IsNullOrEmpty(viewEngineId))
        {
            throw new ArgumentNullException("viewEngineId", "A ViewEngine ID needs to be provided for resolution");
        }

        if (!viewEngines.ContainsKey(viewEngineId))
        {
            throw new KeyNotFoundException(string.Format("The ViewEngine ID {0} has not been registered, ensure it is registered before use", viewEngineId));
        }

        var engine = viewEngines[viewEngineId];

        if (engine.Item2 == null)
        {
            var activator = engine.Item1;
            engine = viewEngines[viewEngineId] = new Tuple<Func<IViewEngine>, IViewEngine>(activator, engine.Item1());
        }

        return engine.Item2;
    }
    
What we're doing here is:

* Ensuring that we are being provided an ID for the View Engine and that it does exist in the store
* Pulling out the tuple
* If we haven't created the View Engine yet (stored in `Item2`) we'll create it
* Return the View Engine

Now I need to make a way to register each View Engine. You *can* do this by accessing the `ViewEngineActivator` itself but that's not quite as fluent when you're working with the `IAppBuilder` so we'll chuck an extension method on there:

    public static IAppBuilder RegisterViewEngine(this IAppBuilder builder, Func<IViewEngine> viewEngine, string viewEngineId)
    {
        ViewEngineActivator.RegisterViewEngine(viewEngineId, viewEngine);
        return builder;
    }

Noting really special with this other than making our API read nicely:

	builder
		.DefaultViewEngine<RazorViewEngine>()
		.RegisterViewEngine(() => new XmlViewEngine(), "xml")
		// and so on

# Accessing the right View Engine

So we've seen how to get a View Engine by an ID but we want to make it easier. Generally speaking you're going to be only using a single View Engine for most of your routes. To this end I want to have a *default* View Engine which will be loaded up, which is what our singleton was doing for us before; I'm going to rename it to `DefaultViewEngine` to make it more discoverable and change it from being a standard get/ set to look like this:

    public static IViewEngine DefaultViewEngine
    {
        get
        {
            if (defaultViewEngine == null)
                defaultViewEngine = ResolveViewEngine("defaultViewEngine");

            return defaultViewEngine;
        }
        set
        {
            defaultViewEngine = value;
        }
    }

Now I've got a backing field and I'm also going to be working under the assumption that there's a View Engine called `defaultViewEngine`. This means that you can set it as before or alternatively set it through lazy loading (which the if condition will take care of).

# Using an alternate View Engine

We've made it to allow you to specify a default View Engine, specify alternate View Engines so let's look at how to use them.

There's two ways you could go about this, you could either add a new parameter to the route registration which is the View Engine to use or you can put it on the actual call to the View Engine. Personally I like approach two more as the View Engine isn't really related to the route but to the route handler and it also means that as I want to do some overloads for the route methods its not going to mean a lot of duplicate code (which is the same reason that we went with the `View` extension method to begin with if you remember).

This gives us an extension method like this:

    public static void View(this Response res, string view, string viewEngineId)
    {
        var viewEngine = ViewEngineActivator.ResolveViewEngine(viewEngineId);
        var output = viewEngine.Parse(view);

        res.ContentType = "text/html";
        res.Status = "200 OK";
        res.End(output);
    }
    
(And I'll leave the model-based one to your imagination)

It's pretty simple as you can see, mostly just a set of pass through method calls and it means our handler could be like:

	.View("/foo", (req, res) => {
		res.View("fooEngine");
	})
	
While it's true I'm hard-coding `text/html` as the content type that's something you can change yourself, or even make it so that the View Engine knows more about the content type that is being returned; I'll leave those as your exercises.

# Conclusion

This wrap up our look at View Engines; we've seen how to create something simple to support a single View Engine and then expanded on the concept to enable us to use a different View Engine if and when required.

As always you can check out the full code up on the [GitHub repository](https://github.com/aaronpowell/Owin.HelloWorld).