---
  title: "OWIN Responses"
  metaTitle: "OWIN Responses"
  description: "A look at how to give power to our responses by making different response types easier to handle"
  revised: "2012-03-19"
  date: "2012-03-19"
  tags: 
    - "owin"
    - "web"
  migrated: "true"
  urls: 
    - "/web/owin-responses"
  summary: ""
---
In the last post we looked at [Routing in OWIN](https://www.aaron-powell.com/web/owin-routing) as we built up a simple little route engine. Today I want to look at how to bring power to our responses by making it easier to respond with different types.

In ASP.Net MVC you're probabily use to write code like this:

	public ActionResult Index() {
		return Json(new { FirstName = "Aaron", LastName = "Powell" });
	}
	
Here our Action (which comes from our Route) is defining that we want to output JSON to the response and it gives us a nice way which we can do it. Let's see about adding something similar to our application.

# Responding with JSON

We'll start with an easy task, we'll make it easier to respond with JSON. To do this there's two things which we need to do:

* Ensure the appropriate content type is set on the response
* Put a value into the response that is valid JSON

With those two requirements in mind we need to think about is just how we want the API to work, do we want an extension method on the `IAppBuilder` interface? If so how do we handle different request types, are we going to have a lot of boilerplate code to cover all that? Or maybe we should go with the [Nancy](http://nancyfx.org) approach and have a return value from our delegate. At the moment our delegate just executes some code; well maybe we could have it return instead. This would be advantageous as it would be somewhat familiar to MVC developers.

But neither of these options are really ideal in my opinion as they require a lot of code to make them work. We'd be constantly writing extension methods to handle this and when we get to another type (say XML) we'd either have to create yet another extension method or ensure we have a viable base type that we can return (which is what `ActionResult` does for MVC). Admittedly this is may be a symptom of our design thus far, but keep in mind that this is more about exploring the various concepts without adding huge amounts of overhead.

So this leaves us with one final option, augment the `Response` object to have these methods on it. This is the approach I want to go with as it feels cleaner (and it's more familiar to me coming from [Express.js](http://expressjs.com/)). Rather than super-classing the `Response` object which we already have (like we did with the `Request` object) I'm going to stick with good ol' fashioned extension methods. This makes it much easier to include the methods and also avoids having to change our delegate signatures (like we did when we introduced `RoutedRequest`) so we'll spin up a new class:

	public static class RouteExtensions 
	{
		public static void Json(this Response res, dynamic obj, bool useJavaScriptNaming = true)
		{
			throw new NotImplementedException();
		}
	}
	
This is the basis for our extension method, I'm taking in two arguments, one of which is optional. The *main* argument, `obj` will represent the value which we want to serialize and send down to the client. I'm also having an optional boolean argument (defaulted to true) which will indicate whether we want to use JavaScript naming conventions (more on that in a second).

For the serialization we're going to be using the [JSON.Net](http://json.codeplex.com/) serializer as it really is awesome.

The first things we want to do in our extension method are setting the content type and status code (since we can assume here that it'll be successful by this being called; you could pass in the status code if you wanted but for simplicities sake we'll hard code it):

    public static void Json(this Response res, dynamic obj, bool useJavaScriptNaming = true)
    {
        res.ContentType = "application/json";
        res.Status = "200 OK";

       	throw new NotImplementedException();
    }
    
Lovely, now to think about serialization. As I said I'm going to use JSON.Net and the reason I'm having the optional boolean argument is because .NET naming conventions are different to JavaScript (.NET uses PascalCase where as JavaScript is all about camelCase) so I want to force the conversion myself but allow people to opt-out of it if they want (which is something we've needed on the project I'm on at the moment). Luckily JSON.Net allows us to do this very easily:

    public static void Json(this Response res, dynamic obj, bool useJavaScriptNaming = true)
    {
        res.ContentType = "application/json";
        res.Status = "200 OK";

        var serializer = new JsonSerializer();

        if (useJavaScriptNaming)
            serializer.ContractResolver = new CamelCasePropertyNamesContractResolver();

        res.End(JObject.FromObject(obj, serializer).ToString());
    }
    
See, quite easy. We start by creating a serializer, check the boolean argument and add a contract resolver of `CamelCasePropertyNamesContractResolver` if we want to do JavaScript naming and finish off by ending the response with a serialized object.

*There may be an easier way to do this, I'm hardly a JSON.Net expert this is just the way I've come across doing it and it works fine for my needs.*

# Sending out JSON

Once importing the namespace for our extension methods we can get cracking on using it:

	builder.Get("/json", (req, res) => {
		res.Json(new { FirstName = "Aaron", LastName = "Powell" });
	});
	
Yeah it's just that simple! And since this is all within the scope of the request you can access any of the properties you have on your request (such as your named arguments) and work them into the response:

	builder.Get("/json/:name", (req, res) => {
		res.Json(new { Name = req.UrlSegments.name });
	});
	
# Conclusion

So this wraps up a quick look at how we can start enriching our responses by adding different response types. Using the method described above you could easily create methods to return text, XML, or even a VCard, basically anything you want from your application.

It's all starting to come together nicely but there's something quite important missing... HTML. In our next instalment we'll look at producing a View Engine to respond with HTML.

As always you can check out the full code up on the [GitHub repository](https://github.com/aaronpowell/Owin.HelloWorld).