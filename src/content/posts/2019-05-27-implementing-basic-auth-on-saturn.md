+++
title = "Extending Saturn to support Basic Authentication"
date = 2019-05-27T15:44:22+10:00
description = "A guide on extending Saturn, an F# web framework, by creating a Basic Authentication provider"
draft = false
tags = ["fsharp"]
+++

Recently I needed to create a mock API for local development on a project and I decided to use [Saturn](https://saturnframework.org/), which describes itself thusly:

> A modern web framework that focuses on developer productivity, performance, and maintainability

Saturn is written in F#, and given this whole project is F# it seemed like a logical fit. There’s a [getting started](https://saturnframework.org/docs/guides/how-to-start/) guide, so I won’t go over that, instead I’ll focus on something I needed specifically for this projet, Basic Authentication, because the API I was mocking uses that under the hood and I wanted to simulate that.

## Extending Saturn Applications

Conceptually, Saturn uses [Computation Expressions](https://docs.microsoft.com/en-us/dotnet/fsharp/language-reference/computation-expressions?{{< cda >}}) for abstracting away the ASP.NET pipeline and giving you a very clean F# syntax for defining your application.

I wanted to make the application definition work like this:

```fsharp
let app = application {
    use_basic_auth
    // the rest of our app setup
    url (sprintf "http://0.0.0.0:%d/" port) }

```

And to do this we’ll need to create a [custom operation](https://docs.microsoft.com/en-us/dotnet/fsharp/language-reference/computation-expressions?{{< cda >}}#custom-operations) on Saturns `ApplicationBuilder`. Thankfully, F# makes it very easy to extend types you don’t own, so let’s get started:

```fsharp
type ApplicationBuilder with
    [<CustomOperationAttribute("use_basic_auth")>]
    member __.UseBasicAuth(state : ApplicationState) =
        state

```

We’ll define our new attribute on the `application` computation expression and call it `use_basic_auth` and it will execute the defined function, which has a signature of `ApplicationState -> ApplicationState`.

### Adding middleware

The first thing we’re going to need to do is to edit the middleware that Saturn uses to include authentication, and since it’s ASP.NET Core under the hood we need to [add it’s middleware for Identity](https://docs.microsoft.com/en-us/aspnet/core/security/authentication/identity?view=aspnetcore-2.2&tabs=visual-studio&WT.mc_id=devto-blog-aapowell). Let’s update our `UserBasicAuth` function:

```fsharp
type ApplicationBuilder with
    [<CustomOperationAttribute("use_basic_auth")>]
    member __.UseBasicAuth state =
        let middleware (app : IApplicationBuilder) =
            app.UseAuthentication()

        { state with
            AppConfigs = middleware::state.AppConfigs }

```

That was easy! We’ve added a new function called `middleware` that added the authentication middleware to the pipeline. Then we’ll use the `::` List function to append our middleware to the `head` of the middleware collection and create a new record type using the current `ApplicationState`, just updating the `AppConfigs` property.

### Implementing Basic Authentication

With Authentication enabled in our pipeline, we next need to tell it what kind of authentication we’re wanting to use and how to actually handle it!

```fsharp
type ApplicationBuilder with
    [<CustomOperationAttribute("use_basic_auth")>]
    member __.UseBasicAuth state =
        let middleware (app : IApplicationBuilder) =
            app.UseAuthentication()

        let service (s : IServiceCollection) =
            s.AddAuthentication("BasicAuthentication")
                .AddScheme<AuthenticationSchemeOptions, BasicAuthHandler>("BasicAuthentication", null)
                |> ignore

            s.AddTransient<IUserService, UserService>() |> ignore
            s

        { state with
            ServicesConfig = service::state.ServicesConfig
            AppConfigs = middleware::state.AppConfigs }

```

Now we have a `service` function that takes the `IServiceCollection`, adds the Authentication service as `BasicAuthentication` (so the pipeline knows it’s that type), adds the handler (a type called `BasicAuthHandler`) and also registers a type in the Dependency Injection framework for accessing our users. We then modify our record type on return with this new function and it’s good to go!

#### Implementing the Basic Authentication Handler

Ok, we’re not _quite_ done yet, we should have a look at how we actually implement the Basic Authentication handler in the `BasicAuthHandler` type, and our user store.

Let’s start with the user store, since I’ve done it quite simply, after all, it’s for a mock:

```fsharp
type IUserService =
    abstract member AuthenticateAsync : string -> string -> Async<bool>

type UserService() =
    let users = [("aaron", "password")] |> Map.ofList

    interface IUserService with
        member __.AuthenticateAsync username password =
            async {
                return match users.TryGetValue username with
                       | (true, user) when user = password -> true
                       | _ -> false }

```

Yep, nothing glamerous here, I’ve just created a type that tests for a user and password in memory. In a non-mock system you might want to implement it more securely, but it does what I need for now. 😉 I’ve also created this as an interface so that I can inject it downcast, or I could mock it if I was to write tests (_Narator: He didn’t write tests_).

Now that we have a way to validate that credentials are valid for a user it’s time to implement the class that will handle authentication, `BasicAuthHander`:

```fsharp
type BasicAuthHandler(options, logger, encoder, clock, userService : IUserService) =
    inherit AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder, clock)

```

This type inherits from `AuthenticationHandler` within the ASP.NET Core framework and will require us to implement the `HandleAuthenticateAsync` function to be useful, so let’s start there:

```fsharp
type BasicAuthHandler(options, logger, encoder, clock, userService : IUserService) =
    inherit AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder, clock)

    override this.HandleAuthenticateAsync() =
        task { return AuthenticateResult.Fail "Not Implemented" }

```

_Side note: I’m using the TaskBuilder.fs package to create a `Task<T>` response using the `task` computation expression._

This function is executed on every request as part of the middleware pipeline and I’m going to need to ensure that the `Authorization` header is provided and it has a valid Basic Auth token in it. Let’s start by ensuring the header exists with a `match` expression:

```fsharp
override this.HandleAuthenticateAsync() =
    let request = this.Request
    match request.Headers.TryGetValue "Authorization" with
    | (true, headerValue) ->
        task { return AuthenticateResult.Fail("Not implemented") }
    | (false, _) ->
        task { return AuthenticateResult.Fail("Missing Authorization Header") }

```

The pattern matching will just check that we have the header and break into the appropriate block if the header exists, if it doesn’t we’ll just fail the challenge and result in a `401` response.

To validate the token I’m going to start with a quick function to unpack it like so:

```fsharp
type Credentials =
     { Username: string
       Password: string }

let getCreds headerValue =
    let value = AuthenticationHeaderValue.Parse headerValue
    let bytes = Convert.FromBase64String value.Parameter
    let creds = (Encoding.UTF8.GetString bytes).Split([|':'|])

    { Username = creds.[0]
      Password = creds.[1] }

```

This will just decode the encoded string into a `username:password` pair that I return as a record (you could use an anonymous record type or a tuple, entirely up to you). Now we can validate it with our `IUserService`:

```fsharp
override this.HandleAuthenticateAsync() =
    let request = this.Request
    match request.Headers.TryGetValue "Authorization" with
    | (true, headerValue) ->
        async {
        let creds = getCreds headerValue.[0]

        let! userFound = userService.AuthenticateAsync creds.Username creds.Password

        return match userFound with
                | true ->
                    let claims = [| Claim(ClaimTypes.NameIdentifier, creds.Username); Claim(ClaimTypes.Name, creds.Username) |]
                    let identity = ClaimsIdentity(claims, this.Scheme.Name)
                    let principal = ClaimsPrincipal identity
                    let ticket = AuthenticationTicket(principal, this.Scheme.Name)
                    AuthenticateResult.Success ticket
                | false ->
                    AuthenticateResult.Fail("Invalid Username or Password") }
        |> Async.StartAsTask
    | (false, _) ->
        task { return AuthenticateResult.Fail("Missing Authorization Header") }

```

We’ll use another `match` against this the result of our `IUserService.AuthenticateAsync` (which uses F# `async`), and if the user is valid we’ll create a claim ticket and return that to the pipeline successfully for the request the continue.

## Wiring it up with our `router`

It’s now time to add authentication over the route(s) that we want to have authentication on, and we do that with the `router` computation expression. We’ll start with a pipeline:

```fsharp
let matchUpUsers : HttpHandler = fun next ctx -> next ctx

let authPipeline = pipeline {
    requires_authentication (Giraffe.Auth.challenge "BasicAuthentication")
    plug matchUpUsers }

```

Setting on the `pipeline` the `requires_authentication` attribute to a `BasicAuthentication` challenge from [Giraffe](https://github.com/giraffe-fsharp/Giraffe) (the web framework Saturn builds on top of).

Finally, it’s time for our `router`:

```fsharp
let webApp = router {
    pipe_through authPipeline
    // define routes
}

```

## Conclusion

The computation expression design of Saturn is really neat, the fact you can just extend the type that represents the part of Saturn that you want to extend. Through this we can add a custom authentication provider quite easily.

Hopefully this helps others looking to extend Saturn. 😊