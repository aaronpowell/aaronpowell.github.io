---
  title: "Revisiting using ASP.NET MVC in Umbraco 4"
  metaTitle: "Revisiting using ASP.NET MVC in Umbraco 4"
  description: "An update on using ASP.NET MVC with Umbraco 4."
  revised: "2012-07-11"
  date: "2012-07-11"
  tags: 
    - "umbraco"
    - "asp.net-mvc"
  migrated: "true"
  urls: 
    - "/umbraco/using-mvc-in-umbraco-4-revisited"
  summary: ""
---
A month on I wanted to revisit my post on [using MVC with Umbraco 4][1]. I write the code and draft while driving back from the retreat so it wasn't very *deeply* investigated.

Basically it was done as a proof of concept.

Well today I was chatting with someone who was wanting to take the PoC and try it in production and through chatting we learnt a few things about what I initially write about that are important to know if you're wanting to try it as well.

### Watch your routes

There was a problem with the site whenever you hit the root of the site, the `/` route, the controller action was being executed. Luckily this is an easy fix. The MVC route registration looked like this:

    routes.MapRoute(
        "Default",
        "{controller}/{action}/{id}",
        new { controller = "Home", action = "Index", id = "" },
    );

Now if you know you're MVC you'll know that that matches the `/` route as well in MVC since we've given a default controller and action (it's also why `/home` matches the Index action on Home). So what's interesting here is that MVC's routing engine takes priority over the Umbraco one.

To fix it you need to add some kind of static prefix to the route, what's probably the easiest is to hard code the controller name, like so:

    routes.MapRoute(
        "Default",
        "home/{action}/{id}",
        new { controller = "Home", action = "Index", id = "" },
    );

This tells MVC that anything `/home` will go to the Home controller, it can't go anywhere else.

### Umbraco reserved paths

The above point leads onto this point, as I said it turns out that the MVC routes took over the Umbraco ones, this means that you **don't** have to add an ignore route for Umbraco.

In the last post I said you needed to add `~/home` like this:

    <add key="umbracoReservedPaths" value="~/umbraco,~/install/,~/home" />

Well seems I was wrong about that, sorry!

# Conclusion

What I've blogged is still very much a proof of concept but it seems that some people are thinking that it is actually a valid concept. This is a few lessons learnt from a project actually trying it out, I hope the guys blog about it once they are done but we'll see.

If you learn any more yourself let me know!

  [1]: https://www.aaron-powell.com/umbraco/using-mvc-in-umbraco-4