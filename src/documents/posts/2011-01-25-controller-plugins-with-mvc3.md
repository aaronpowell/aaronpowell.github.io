---
  title: "Creating Controllers-as-plugins using MVC3"
  metaTitle: "Creating Controllers-as-plugins using MVC3"
  description: "A look at how to make pluggable Controllers using MVC3"
  revised: "2011-01-26"
  date: "2011-01-25"
  tags: 
    - "mvc3"
    - "autofac"
    - "funnelweb"
  migrated: "true"
  urls: 
    - "/controller-plugins-with-mvc3"
  summary: ""
---
# Overview

While working on the plugin engine for [FunnelWeb][1] we decided that we wanted to add the ability for people to create their own extnesions which are Controllers and routes. Seems like a pretty simple idea, and it makes it really easy to add external functionality into FunnelWeb at a Controller level without rolling your own instace.

But there's a catch...

# Some background

We're using MVC3 for FunnelWeb, and part of MVC3 is this lovely new way to do [Dependency Injection][2], the [IDependencyResolver][3] interface. We're using [Autofac][4] in FunnelWeb and it's latest release (2.4) has MVC3 and IDependencyResolver support.

The main role of the IDependencyResolver is so that you can do Dependency Injection without having to reimplement a lot of the MVC core. Previously you had to create custom Controller Factories, and a bunch of other stuff (depending what you wanted to DI), but not any more!

# Implementing Dependency Resolver

So this is actually really simple to use, all you need to do to use your own custom resolver is this:

    var builder = new ContainerBulder();
	builder.RegisterControllers(Assembly.GetExecutingAssembly());
	// do other registrations
	var container = builder.Build();
	DependencyResolver.SetResolver(new AutofacDependencyResolver(container));
	
That's all you have to do, and now any Controller which you've registered will be resolved via Autofac, not `Activator.CreateInstance`, meaning you don't have to have a default constructor.

But there's a problem, how do you add the Controllers which are not in the current assembly, to Autofac and to be resolved?

# Extending the plugin framework

Well to add the new Controller-based extension point I set about expanding how our plugins worked. Previously we had a `IFunnelWebExtension` interface which you implemented, and it has a single method that initialized it.

That was fine for what we originally wanted, but how were we going to register new routes?

**Enter the RoutableFunnelWebExtension.**

To do this I've created a new `abstract` class, `RoutableFunnelWebExtension` and it has some additional information on it, first off it has the `RouteCollection` so you can register routes, but it also has a method which will resolve Controllers for you. But don't worry, we've done the heavy lifting and you don't need to register them yourself, we handle it for you :).

So we have this method:

	protected internal virtual void RegisterControllers(ContainerBuilder builder)
	{
		builder.RegisterControllers(GetType().Assembly)
			;
	}

Cool, that'll handle our registrations, let's assume we have a route setup up, our extension is in `/bin/Extensions`, and we're good to go right... right?

**Wrong.**

This is the point I got to where I started pulling out my hair, when I'd hit the route I configured it resulted in a 404. This is quite strange, FunnelWeb has a *catch all* route, so that you can create any page URL you want, so a 404 really isn't possible.

After some digging it turns out that the route **was** being hit, and this was why the 404 was happening, the route was matching, but no Controller was being resolved. But hang on though, our plugin has registered the Controller right? If I inspect the container then yeah, I can see it, so why was it not found?

## Understanding how Controllers are found

So as it turns out the `IDependencyResolver` isn't actually the silver bullet which I was expecting it to be, it turns out that the pesky [BuildManager][5] is back to spoil my fun.

*Side note, [Shannon Deminick][6] has also [blogged about][7] [plugin engines][8] and the problems which the BuildManager can produce.*

When a route is found MVC goes to the `IControllerFactory` and asks it to create the Controller instance. Out of the box this heads over to the `DefaultControllerFactory` class, and it eventually goes out to your `IDependencyResolver` to find it. The catch is, MVC first finds the type of the Controller whihc matches the route. This is handled by the `GetControllerType` method, and this is where we're hitting a problem.

In the default instance this will look into the `BuildManager` and find out what the type is. Now that's *generally* fine, **provided your Controller is in the `/bin` folder**, but the Controller isn't in there, our extensions are in `/bin/Extensions`, and the `BuildManager` isn't smart enough to look there. This means that when the Controller type tries to be found it returns null, and in turn MVC assumes that *these are not the Controllers you are looking for*.

**Crap.**

As it turns out the default Controller Factory isn't smart enough to look into the DI container (and well that's expected, it's kind of a rough requirement to force on the DI container), so it looks like we have to implement our own anyway.

Luckily we don't need to do a full Controller Factory, we can just extend the default one. What you want to do is extend the `GetControllerType` method to also go to the DI container.

To be able to efficiently locate our Controller type I first want to make it better described in Autofac, so I'll augment our `RegisterControllers` method in the plugin framework:

	protected internal virtual void RegisterControllers(ContainerBuilder builder)
	{
		builder.RegisterControllers(GetType().Assembly)
			.Named<IController>(t => t.Name.Replace("Controller", string.Empty))
			;
	}

Now our Controllers are [Named registrations][9], and we can find them by their Controller name:

    public class FunnelWebControllerFactory : DefaultControllerFactory
    {
        private readonly IContainer _container;

        public FunnelWebControllerFactory(IContainer container)
        {
            _container = container;
        }
        protected override Type GetControllerType(RequestContext requestContext, string ControllerName)
        {
            var Controller = base.GetControllerType(requestContext, ControllerName);
            if (Controller == null)
            {
                object x;
                if (_container.TryResolveNamed(ControllerName, typeof(IController), out x))
                    Controller = x.GetType();
            }

            return Controller;
        }
    }

As you can see here we're overriding the `GetControllerType` method. If the base implementation doesn't return a Controller, which it wont if a) the Controller isn't in the `BuildManager` or b) if you're not routing to a Controller, we'll see if Autofac knows about it.

If Autofac did know about it then we can return the type of it and we're going to be right now... right?

**Sigh.**

So my Controller plugin has a constructor argument which I need to be injected, but I'm seeing a lovely YSOD saying that `Activator.CreateInstance` is unable to create the Controller as there is no default constructor (a constructor with no arguments). Wait, what? Isn't the `IDependencyResolver` meant to be resolving it?

Well yes, but there's still a problem, once `GetControllerType` is called the returned type is passed into our `IDependencyResolver.GetService` method, and Autofac will resolve it, or return null if it can't find it, and when `null` is returned the Controller Factory will fall back to `Activator.CreateInstance`.

The reason that the type isn't found is because the Controller isn't registered using the type of the Controller, so it can't be found in Autofac. Well that's a very easy one to fix, we'll just ensure that the registration is registered by it's type too:

	protected internal virtual void RegisterControllers(ContainerBuilder builder)
	{
		builder.RegisterControllers(GetType().Assembly)
			.Named<IController>(t => t.Name.Replace("Controller", string.Empty))
			.AsSelf()
			;
	}

Now we're registering the types as their actual type, and now we can resolve it from Autofac using that. And you know what, hitting the route now calls the Controller action correctly.

# Conclusion

Which MVC3 is yet aother good step towards simple extensibility there's a few pain points when you're wanting to do stuff that is *edge case*. And yet again the major pain point which we're coming across is the BuildManager.

But with a few code tweaks and a custom Controller Factory you too can load a Controller from a folder that isn't `/bin/`.

I hope in future versions of ASP.Net the BuildManager can be made a bit smarter, and work better with types outside `/bin`.

If you're looking for an alternate way to do plugins I suggest you check out Shannon's posts.
	


  [1]: http://funnelweblog.com
  [2]: http://en.wikipedia.org/wiki/Dependency_injection
  [3]: http://msdn.microsoft.com/en-us/library/system.web.mvc.idependencyresolver.aspx
  [4]: http://code.google.com/p/autofac
  [5]: http://msdn.microsoft.com/en-us/library/system.web.compilation.buildmanager.aspx
  [6]: http://shazwazza.com
  [7]: http://shazwazza.com/post/MVC-Controllers-as-plugins-with-MEF-and-Autofac.aspx
  [8]: http://shazwazza.com/post/Developing-a-plugin-framework-in-ASPNET-with-medium-trust.aspx
  [9]: http://code.google.com/p/autofac/wiki/TypedNamedAndKeyedServices