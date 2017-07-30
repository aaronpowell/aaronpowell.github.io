---
  title: "Hosting multiple WebAPI servers in a single process"
  date: "2014-12-04"
  tags: 
    - "owin"
    - "katana"
    - "webapi"
    - "testing"
  description: "Have you ever wondered how you would go about hosting multiple WebAPI servers within a single process?"
---

I'm currently working on a project which consists of three different ASP.Net applications that comunication in sequence, Server to Server to Server (to database if you want to get technical).

Because the communication channel is a little tricky we want to include some integration tests in the CI process to verify the them but this obviously means we need to have our servers up and running. This is a bit of a pain, having to either run all our sites in IIS, which means that Visual Studio needs to be run as an administrator. Alternatively we can use IIS Express, sure we're no longer requiring VS as admin but now our tests will fail locally unless we're running IIS Express. That's not a deal breaker but it's a bit of an overhead that'd lead to random test fails.

Well conveniently we're using WebAPI2 controllers to communicate across each server which leaves us with another option - self hosting. Well that could be an interesting option, we could spin up the servers using the OWIN self hosting inside the integration test. Yeah, let's do that!

# Microsoft.Owin.TestServer

My first thought was to use this test helper which Microsoft provides. In fact I've used it [in the past](/posts/2014-01-12-integration-testing-katana-with-auth.html) for integration testing WebAPI but I've never tried to run two of them in the same process.

I fired it up and what do you know **it didn't work**. So I started digging through the source to try and work out what it does and how it does it. As it turns out this helper creates a server which doesn't actually run over the networking stack, everything is done in memory and this is going to be a problem, with no networking stack how are you meant to make a `HttpClient` call from one server to the other? Also this is all in a single process, that could just be a problem...

Alright, let's scratch this as an option.

# Microsoft.Owin.SelfHost

On to our next option, using the normal Self Host framework and we'll sit that on top of HttpListener. This means we can run separate servers on seperate endpoints, making it easier to do things that need networking, like calling on `HttpClient`.

Setting up a Self Host [isn't too hard](http://www.asp.net/web-api/overview/hosting-aspnet-web-api/use-owin-to-self-host-web-api), so I added to the test class constructor a call to startup both servers.

    public class MyTestClass : IDisposable
    {
        private readonly IDisposable serverA;
        private readonly IDisposable serverB;

        public MyTestClass()
        {
            serverA = WebApp.Startup("http://localhost:90", app => {
                var startup = new ServerA.Startup();
                startup.Configuration(app);
            });

            serverB = WebApp.Startup("http://localhost:91", app => {
                var startup = new ServerB.Startup();
                startup.Configuration(app);
            });
        }

        [Fact]
        public void ServerA_can_talk_to_ServerB()
        {
            var client = new HttpClient();
            var result = client.GetAsync("http;//localhost:90/api/echo").Result;
            result.StatusCode.ShouldBe(HttpStatusCode.OK);
        }

        public void Dispose()
        {
            serverA.Dispose();
            serverB.Dispose();
        }
    }

Fantastic, that should do exactly what we want right? We've got two servers, separate ports, etc. Well crap there's a problem, I have `EchoController` in both of my servers and this is resulting in a 500 error saying that WebAPI doesn't know whether to use `ServerA.Controllers.EchoController` or `ServerB.Controllers.EchoController`.

Wait... what? Why is `ServerA` getting access to all of the controllers in `ServerB`? That doesn't seem right now does it? And I didn't setup my configurations to do that. The only logical conclusion is that it's an issue with the AppDomain, so I did some more digging.

## IAssembliesResolver

Chatting to some of the folks in the JabbR OWIN room I was pointed towards this interface, in a WebAPI project it is what does the resolution of the controllers. It's normally running as the `DefaultAssembliesResolver` class and it returns the list of assemblies from the current `AppDomain`. Well then I guess we have our answer, we **are** getting cross-`AppDomain` issues. Well then, what's the solution? Let's create our own implementation of `IAssembliesResolver`:

    public class IntegrationTestAssembliesResolver : IAssembliesResolver
    {
        public ICollection<Assembly> GetAssemblies()
        {
            return new[] { this.GetType().Assembly };
        }
    }

That's easy enough, so how do we use it? Well we have to shoehorn it into our WebAPI pipeline when the test server boots up. I'm doing this by adding it to part of the `Startup` class but I only want it when we're running WebAPI in a self-host, or more importantly when it's running in a test. To do that I'll tell my OWIN apps that it's running in a test:

    public MyTestClass()
    {
        serverA = WebApp.Startup("http://localhost:90", app => {
            app.Properties.Add("TestServer", true);
            var startup = new ServerA.Startup();
            startup.Configuration(app);
        });

        serverB = WebApp.Startup("http://localhost:91", app => {
            app.Properties.Add("TestServer", true);
            var startup = new ServerB.Startup();
            startup.Configuration(app);
        });
    }

Now to update our `Startup`:

    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            var config = new HttpConfiguration();
            if (app.Properties.ContainsKey("TestServer"))
            {
                var ar = new IntegrationTestAssembliesResolver();
                config.Services.Replace(typeof(System.Web.Http.Dispatcher.IAssembliesResolver), ar);
            }
            WebApiConfig.Register(config);
        }
    }

Put that into both of our `Startup` classes and there we go!

# Conclusion

There we have it, it all boils down to setting the `IAssembliesResolver` to only work within its own assembly scope you can run as many OWIN servers in a single process on as many endpoints as you want.
