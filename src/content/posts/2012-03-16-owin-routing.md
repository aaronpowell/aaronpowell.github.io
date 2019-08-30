---
title: "OWIN routing"
metaTitle: "OWIN routing"
description: "Now it's time to do some routing on top of OWIN"
revised: "2012-03-16"
date: "2012-03-16"
tags:
    - "owin"
    - "web"
migrated: "true"
urls:
    - "/web/owin-routing"
summary: ""
---

[Last time around](https://www.aaron-powell.com/web/owin-and-middleware) we started looking at middleware in OWIN and how to handle different request types. So now comes the next logical step, how do we handle different URLs? Currently we don't have the facilities to handle different URLs, aka routing, so let's work on that.

## Understanding routing

Before we dive into coding our solution it's a good idea to think about what routing really is. You're probably familiar with this from ASP.Net MVC with code such as:

        routes.MapRoute(
            "Default",                                              // Route name
            "{controller}/{action}/{id}",                           // URL with parameters
            new { controller = "Home", action = "Index", id = "" }  // Parameter defaults
        );


What's really important is line three, where we are defining what the URL we are going to be targeting looks like. With MVC routing we do a few other things such naming the route and providing default values for the segments of the URL that we're trying to match but that's not really of interest to us. If we think about the kinds of URLs we're going to constructing we can break it down as:

-   There'll probably something static in the URL
-   Retrieve records we'll probably have some kind of pattern to match
-   Some URL segments may be useful in the handler

Ok we understand a bit of _how_ we want to construct our route matching let's set about implementing it. To do this we're going to build on top of the extension methods we built last time, but for this we're going to need to be passing in a URL, well a pattern to match the URLs.

# Defining our route matching

The first thing we'll do is look at the routes systems in other middleware projects like [Nancy](https://github.com/NancyFx/Nancy/wiki/Defining-routes), [Express.js](http://expressjs.com/guide.html#routing) on Node and [Sinatra](http://www.sinatrarb.com/intro.html#Routes) on Ruby. Something that we can see from these three projects (and other middleware projects out there) is that they support the URL matching scenarios I described above (coincidence?) and they do it is similar ways. All allow you to do:

-   A static value
-   A named value
-   This is slightly different in Nancy to the other two, Nancy uses `{name}` to define a named value where as the others use `:name`
-   A pattern-matched value

For this example I'm going to use the Sinatra/ Express.js routing style (`:name` not `{name}`).

## Breaking down our route matching

So now that we know what we want to be able _do_ in our URLs let's think about _how_ we'd do it.

Static values should be pretty easy, it's just a string that we want to match against and equality statements should be right to take care of that, let's move on.

Named values is next on the list, what we want to do here is take this particular URL segment and then grab the value to provide into our handler, maybe we can get away with just sub-stringing here?

Pattern matching... hmm that's an interesting one, but you know what it's not really that hard, there's a very simple way to do pattern matching... Regex!

## Regex ALL the things!

Let's say we want this URL to match:

    /users/1234/unsubscribe/email@mail.com

The URL has two static sections to it, `/users/` and `/unsubscribe/`, it also has two dynamic sections, something that we can assume is an id and an email address. Both of these segments likely to be useful within our handler so we'd want to be able to capture them. And if we think about the id segment it's likely we have some kind of a pattern that could represent it and for the email we just want to capture it (althought it's true we could also put a pattern in place to match the email [but email matching is complex](http://haacked.com/archive/2007/08/21/i-knew-how-to-validate-an-email-address-until-i.aspx) so I don't want to match it in our URL, that's for the business logic to validate).

Now let's look at a pattern for the URL to meet our requirements:

    /users/(?<id>\d{1,5})/unsubscribe/:email

Alright that's looking good, we've got a regex to restrict our id to be what we have known in our system and we've said we want to capture the email, but how would we _actually_ match that URL? The answer... regex the whole URL (regardless of whether I now have [two problems](http://regex.info/blog/2006-09-15/247))! The reason I want to regex the URL is otherwise we have to do a bunch of string splitting, manipulation and guff code just to match all the segments, which is really what we are doing in a Regex itself.

So I'm going to start with a new extension methods class called `Routing` and we'll focus on processing GET requests (and can refactor later for the other verbs). Inside this class I'm going to create a private method to break down our URL pattern into something that'll actually match:

        private static Regex RouteToRegex(string route)
        {
           throw new NotImplementedException();
        }


The first thing I want to do is split out each segment of the URL:

        private static Regex RouteToRegex(string route)
        {
            var parts = route.Split(new[] { "/" }, StringSplitOptions.RemoveEmptyEntries).AsEnumerable();

            throw new NotImplementedException();
        }


This gives us an array like so:

    parts[0] == "users"
    parts[1] == "(?<id>\d{1,5})"
    parts[2] == "unsubscribe"
    parts[3] == ":email"

Well then, three out of those four parts _look like regexs already_, want to match the work **users**, well **users** will do that. Want to capture a number one to five characters in length, well we've got a named capture group for that too. The only thing that doesn't look like a regex is `:email`, but is something that looks unique and we could match against.

Now we need to go through the array and find any of these `:email`-esq values and turn them into **named catch-all groups** as that's what we want to do. Again, regex comes to the rescue, and with this I'm going to some LINQ trickery:

        private static readonly Regex paramRegex = new Regex(@":(?<name>[A-Za-z0-9_]*)", RegexOptions.Compiled);
        private static Regex RouteToRegex(string route)
        {
            var parts = route.Split(new[] { "/" }, StringSplitOptions.RemoveEmptyEntries).AsEnumerable();

            parts = parts.Select(part => !paramRegex.IsMatch(part) ?
                part :
                string.Join("",
                    paramRegex.Matches(part)
                        .Cast<Match>()
                        .Where(match => match.Success)
                        .Select(match => string.Format(
                            "(?<{0}>.+?)",
                            match.Groups["name"].Value.Replace(".", @"\.")
                            )
                        )
                    )
                );

            throw new NotImplementedException();
        }

First off I've created a regex to _match our catch-all_ which resides in the static field. Next I'm going to go through each of the URL segments and if they aren't a match to the pattern then they are already regexable and we'll just return them, otherwise we'll get all the matches and then them into the named catch-all capture group. Our array will then look like this:

    parts[0] == "users"
    parts[1] == "(?<id>\d{1,5})"
    parts[2] == "unsubscribe"
    parts[3] == "(?<email>.+?)"

Lastly we'll rejoin all the regex parts with `/` separators so that it is back to being a URL as well as put start and end terminators (we'll also make it case-insensitive and compile the regex for speed):

        private static Regex RouteToRegex(string route)
        {
            var parts = route.Split(new[] { "/" }, StringSplitOptions.RemoveEmptyEntries).AsEnumerable();

            parts = parts.Select(part => !paramRegex.IsMatch(part) ?
                part :
                string.Join("",
                    paramRegex.Matches(part)
                        .Cast<Match>()
                        .Where(match => match.Success)
                        .Select(match => string.Format(
                            "(?<{0}>.+?)",
                            match.Groups["name"].Value.Replace(".", @"\.")
                            )
                        )
                    )
                );

            return new Regex("^/" + string.Join("/", parts) + "$", RegexOptions.Compiled | RegexOptions.IgnoreCase);
        }


Ta-Da! We now have a matching algorithm like so:

    ^/users/(?<id>\d{1,5})/unsubscribe/(?<email>.+?)$

Paste that into your favourite regex tester and take it for a whirl!

# Matching our route

Now that we _can_ match our route maybe we should expose that. As I said we'll create an extension method that allows us to do this:

    public static IAppBuilder Get(this IAppBuilder builder, string route, Action<Request, Response> app)
    {
    	throw new NotImplementedException();
    }

This looks like the one from the last post but we're taking in a route as the first argument, meaning we can do:

    builder.Get(@"/users/(?<id>\d{1,5})/unsubscribe/:email", (req, res) => {
    	res.ContentType = "text/plain";
    	res.End("Unsibscribed\r\b");
    });

The logic of this method isn't going to be much different to the ones from the last post with the addition of doing a match against our regex:

        public static IAppBuilder Get(this IAppBuilder builder, string route, Action<Request, Response> app)
        {
            var regex = RouteToRegex(route);

            return builder.Use<AppDelegate>(next => (env, result, fault) =>
            {
                var path = (string)env["owin.RequestPath"];

                if (path.EndsWith("/"))
                {
                    path = path.TrimEnd('/');
                }

                if ((string)env["owin.RequestMethod"] == "GET" && regex.IsMatch(path))
                {
                    var req = new Request(env);
                    var res = new Response(result);
                    app(req, res);
                }
                else
                {
                    next(env, result, fault);
                }
            });
        }


So up front we create our regex and then inside the handler we will match against it as well as checking the Request verb. You'll see that we're getting the URL (path) out, again this comes from the OWIN Environment Variables. The only other thing we're doing is stripping the trailing `/`. This is more personal preference (and I'm sure some SEO expert can give a good reason for it) but you don't have to remove it if you don't want, you'd just have to ensure the regex can handle that scenario.

But now we're able to filter the requests by URL and it's all going to track nicely for us!

# Capturing our URL segments

As I said earlier in the post generally when we have a specific URL segment to match we do that because we care about the value and we'll be wanting it in our handler. Currently though we're not passing that in are we? Well we should solve that! At the moment I'm using the Gate `Request` object for the handler but it wont really do what I want here, at least not in an overly discoverable way (since it inherits from a `Dictionary<string, object>` it's not too hard but I want to make it easier). Instead I want to extend it, so I'm going to create a superclass called `RoutedRequest`.

In the `RoutedRequest` class I want to surface any of the matched segments and to do this I'm going to use a [helper class I wrote a while ago for using Dynamics]({{< ref "/posts/2010-07-05-dynamics-library.md" >}}) and pass in a dictionary that represents all matched values. This makes our `RoutedRequest` class nice and simple:

    public class RoutedRequest : Request
    {
        public RoutedRequest(IDictionary<string, object> env, Regex regex, string path):
            base(env)
        {
            var groups = regex.Match(path).Groups;
            var dic = regex.GetGroupNames().ToDictionary(name => name, name => groups[name].Value);

            UrlSegments = new DynamicDictionary<string>(dic);
        }

        public dynamic UrlSegments { get; private set; }
    }

Now once we update the `Get` method we can update our handler like this:

    builder
                .Get(@"/users/(?<id>\d{1,5})/subscribed/:email", (req, res) =>
                {
                    res.ContentType = "text/plain";
                    res.End("Email " + req.UrlSegments.email + " is subscribed.\r\n");
                });


You'll notice that off the `req` object we can go through the `UrlSegments` property and use _dot-notation_ to access the email address that was submitted. This is pretty sexy if I do say so myself.

# Conclusion

I'll admit that this was quite a long post as the subject of routing _is a complex one_. Hopefully though you've seen that without a lot of code we've made a phenomenally powerful little route engine (really, it's quite a simple bit of code in the end).

While the route that we've been looking at is rather complex our little engine is capable of pretty much anything, we don't _need_ to be putting in regexs, we can get away with routes like `/home` or `/about` as well.

Next time we'll look at how we can make our responses more powerful with simple helper methods.

As always you can check out the full code up on the [GitHub repository](https://github.com/aaronpowell/Owin.HelloWorld).
