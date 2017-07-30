---
  title: "Integration testing authenticated Katana applications"
  date: "2014-01-12"
  tags: 
    - "owin"
    - "katana"
    - "testing"
  description: "A look at how you can write integration tests with the new ASP.Net Katana project web applications when they are behind an authentication layer."
---

Recently I got to work on a project where we were building an ASP.Net WebAPI project for the client. One of the requirements of this project was that the API which we produced was authenticated, basically everything exposed had to be authenticated, and because it was a brand new project we decided to go down the path of WebAPI 2.0 and use the new Katana/OWIN system along with OAuth for the authentication.

Another hurdle we had when putting the API together was that it was to sit on top of a legacy system which contained a lot of business logic which was written in a way which we couldn't unit test, it was very tightly coupled to the database and as our timeline's didn't afford us to rewrite it all from scratch we instead opted to rely on integration testing.

But that raises an important question, how do you run your WebAPI end-point to be used in the tests? You could:

* Start up IIS Express, like you're _F5-ing_ from Visual Studio (how we were developing)
* Deploy to IIS, but then you're deploying code that hasn't ticked all the boxes

Neither of these were ideal solutions, while IIS Express is _ok_ for development it's not truly IIS so you're integration tests are already one step removed from the real environment, meaning they are less accurate. As for deploying to IIS, we deemed that to be equally as risky; you're either requiring the build server to also have IIS running on it or you're deploying to another server and then you've got to handle the deployments, how do you setup/teardown the IIS instance? Do you do it as part of the test run? Again this was feeling like adding risk that we shouldn't need to have for preconditions.

# OWIN to the rescue

I've blogged and presented about OWIN in the past, it's a really cool concept and this was the first time I was looking to do a production deployment using it, and there's one feature of OWIN that made it really appealing to solve our problems... Self Hosting.

Because OWIN is a separation between your code and the hosting platform your code doesn't care how it's hosted, only that it is, so you can go from hosting in IIS to self hosting inside an assembly with very little effort and this is what we were enticed by, through the self hosting we could spin up our API project **inside of the test project as a HTTP server** and then interact with it via HTTP client requests! AWESOME!

I'm not going to blog on how to do that, [Filip W beat me to it](http://www.strathweb.com/2013/12/owin-memory-integration-testing/) so that solved our first problem, being able to setup an integration test which ran our server.

_Side note: You may be thinking that because we're using Self Host and not IIS (which is the production host) that we've got a similar problem to using IIS Express but I'd disagree. We're still using the full WebAPI stack, we're still using the full OWIN/Katana stack, we're just not using IIS and you're application should be none the wiser. If you're application knows it's running on IIS then I'd argue you have a bigger problem._

# Handling authentication

As I said one of the main bridges we'd have to cross on this project was that all the API calls were to be authenticated, which means that when you're running your tests you need to take that into account. So what do you do? Well you could write something to bypass the authentication for the test run, but then you're integration test is no longer really representative.

But what you need to remember is that because you're running your code through a self hosted WebAPI you've got the full WebAPI stack, so the `[Authorize]` attribute will be in effect so you're going to actually have an authenticated request pipeline.

Ok, let's take the starting point that [Filip W](http://www.strathweb.com) gave us, and start expanding on it, I'm going to extract my server set up into its own base class:

    public abstract class BaseServerTest
    {
        protected TestServer server;

        [TestInitialize]
        public void Setup()
        {
            server = TestServer.Create(app =>
            {
                var startup = new Startup();
                startup.ConfigureAuth(app);

                var config = new HttpConfiguration();
                WebApiConfig.Register(config);

                app.UseWebApi(config);
            });
        }

        [TestCleanup]
        public void Teardown()
        {
            if (server != null)
                server.Dispose();
        }
    }

So what we've got here is a call to create a new in-memory OWIN server, it's using the `Startup` class that my WebAPI app would use, as well as the WebAPI configuration (so routes, filters, etc) are configured. Now I want to make it easier to handle the `GET` and `POST` methods. To do this I'm going to add an `abstract` property to represent the URI that the tests are for, and two method stubs:

    protected abstract string Uri { get; }

    protected virtual async Task<HttpResponseMessage> GetAsync()
    {
        throw new NotImplementedException();
    }

    protected virtual async Task<HttpResponseMessage> PostAsync<TModel>(TModel model)
    {
        throw new NotImplementedException
    }

Now I'm going to quickly jump over to writing some integration tests for my user registration because well I'll need to register a user before I can run and tests:

    [TestClass]
    public class AccountControllerTests : BaseServerTest
    {
        [TestMethod]
        public async Task CanRegisterUser()
        {
        }

        private string uriBase = "/api/account";
        private string uri = string.Empty;

        protected override string Uri
        {
            get { return uri; }
        }
    }

I've split the URI into two parts, there's the URI base, being `/api/account` and the _actual_ URI for the abstract class implementation. The reason for this is that (at least in the default WebAPI project template) the `AccountController` isn't just a REST interface, but instead has multiple methods on it that I'll want to hit (things like change password, login and so on which I **won't** cover in this post). So let's go ahead and implement the test method itself:

    [TestMethod]
    public async Task CanRegisterUser()
    {
        uri = uriBase + "/register";

        var model = new RegisterBindingModel
        {
            UserName = "aaronpowell" + DateTimeOffset.Now.Ticks,
            Password = "password",
            ConfirmPassword = "password"
        };

        var response = await PostAsync(model);

        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
    }

What am I doing here? I'm:

* Saying that this request is going to hit `/api/account/register`
* Using the model which the `AccountContoller.Register` method is taking as an input argument
* Calling my `PostAsync` method
* Asserting that we got a successful response

Additionally you could write an assert that peaks into the database and validates that the user is there, but that's an exercise for the reader.

I really like that you can use the model from WebAPI to do the processing, this gives us the advantage of:

* Type safety, if the class is refactored our test will also be refactored
* We leverage model binding and model validation

_Side note: You'll notice I'm appending `DateTimeOffset.Now.Ticks` to the username, that's because we need a unique username each time. Depending on whether you're creating a new DB for each test run or not you may want to handle this better._

So how does our `PostAsync` work? Well let's implement it:

    protected virtual async Task<HttpResponseMessage> PostAsync<TModel>(TModel model)
    {
        return await server.CreateRequest(Uri)
            .And(request => request.Content = new ObjectContent(typeof(TModel), model, new JsonMediaTypeFormatter()))
            .PostAsync();
    }

Yep it's really quite simple. You'll see here that I'm grabbing the `Uri` property our class implements, which saves it being passed in, and then we're just leveraging the methods available from the `TestServer` class to build up the request and eventually `POST` the content up. But how do we get the content up there? Well we leverage the `And` extension method which we have a lambda that can set properties on the request, in this case we setting the request content, serialized as JSON, but you can use any available `MediaTypeFormatter` so this can be nifty if you're working with your own formatters.

Now if we run our test it should pass with flying colours.

## Making a `GET`

We've got the `POST` sorted, what about `GET`? This time I'm going to go for the `ValuesController` (which comes in the default project template). Now this is an authenticated controller so we can start off with writing a test that if there's no credentials we fail our test:

    [TestClass]
    public class ValuesControllerTests : BaseServerTest
    {
        [TestMethod]
        public async Task ShouldGetUnauthorizedWithoutLogin()
        {
            var response = await GetAsync();

            Assert.AreEqual(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        protected override string Uri
        {
            get { return "/api/values"; }
        }
    }

So this `Assert` should make sense, no credentials, you get a `401` response. But what does the `GetAsync` method look like?

    protected virtual async Task<HttpResponseMessage> GetAsync()
    {
        return await server.CreateRequest(Uri).GetAsync();
    }

Sorry, not very exciting is it! Really all we're doing is nicely wrapping around the `CreateRequest` method call

# Where's the authentication?

Right we've got a bunch of unauthenticated requests out of the way, now it's time to look at how we can do some authenticated requests. For this I'm going to create another base class that extends our `BaseServerTest`:

    public abstract class BaseAuthenticatedTests : BaseServerTest
    {
        protected virtual string Username { get { return "aaronpowell"; } }
        protected virtual string Password { get { return "password"; } }

        private string token;
    }

For the authenticated tests I'm going to do them against a user that is known to exist, you could do it a bunch of different ways, like performing a registration for each test, that really comes down to how complex your registration process is.

Also I don't want the author of authenticated tests to have to worry about the authentication side of things, it should _just work_ for them. So to do this I'm going to extend my `BaseServerTest` class to all me to run something when the server is setup:

    [TestInitialize]
    public void Setup()
    {
        server = TestServer.Create(app =>
        {
            var startup = new Startup();
            startup.ConfigureAuth(app);

            var config = new HttpConfiguration();
            WebApiConfig.Register(config);

            app.UseWebApi(config);
        });

        PostSetup(server);
    }

    protected virtual void PostSetup(TestServer server)
    {
    }

What I've added here is a virtual method `PostSetup` which is called when the server is ready and then we can do additional stuff. Let's implement it in our `BaseAuthenticatedTest`:

    protected override void PostSetup(TestServer server)
    {
        var tokenDetails = new List<KeyValuePair<string, string>>()
            {
                new KeyValuePair<string, string>("grant_type", "password"),
                new KeyValuePair<string, string>("username", Username),
                new KeyValuePair<string, string>("password", Password)
            };

        var tokenPostData = new FormUrlEncodedContent(tokenDetails);
        var tokenResult = server.HttpClient.PostAsync("/Token", tokenPostData).Result;
        Assert.AreEqual(HttpStatusCode.OK, tokenResult.StatusCode);

        var body = JObject.Parse(tokenResult.Content.ReadAsStringAsync().Result);

        token = (string)body["access_token"];
    }

Alright, what we're doing here is:

* Creating the details which are needed to be `POST`ed, this is the standard data you'd provide to an OAuth request
* URL Encode the data
* Hit the `/Token` route with the data
* Assert that it was a successful request
* Extract the token from the response, I'm just reading it out as JSON (which it is) and not worrying about strongly typing it

_Side note - you'll notice that I'm using `PostAsync(...).Result` and not `async` & `await`. The reason for this is a limitation in MSTest (and NUnit), you're setup can't have a return type (ie - `async Task`) so you're stuck with `async void` which gets dodgy quickly. It's easier to just do it synchronously._

With our authentication written now we need to make sure that we are passing it through on the request:

    protected override async Task<HttpResponseMessage> GetAsync()
    {
        return await server.CreateRequest(Uri)
            .AddHeader("Authorization", "Bearer " + token)
            .GetAsync();
    }

Really the only difference is that the `GetAsync` (and `PostAsync`) is that we add the `Authorization` header and properly format it to contain our bearer token.

Easy, we can now write a test like so:

    [TestClass]
    public class ValuesAuthenticatedControllerTests : BaseAuthenticatedTests
    {
        [TestMethod]
        public async Task ShouldGetValuesWhenAuthenticated()
        {
            var response = await GetAsync();

            var values = await response.Content.ReadAsAsync<IEnumerable<string>>();

            Assert.AreEqual(2, values.Count());
        }

        protected override string Uri
        {
            get { return "/api/values"; }
        }
    }

And we're done!

# Conclusion

So through this post we've seen how we can use OWIN/Katana's self-hosting feature to host itself and then make requests against and authenticated API. We've also abstracted away the authentication part of our integration tests so we don't need to think about it for each test which we write.

I've published the code used for this blog [here on GitHub](https://github.com/aaronpowell/Owin.AuthenticatedTests) so feel free to get it and have a play.