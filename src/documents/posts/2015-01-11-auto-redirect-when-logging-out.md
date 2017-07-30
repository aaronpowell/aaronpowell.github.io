---
  title: "Authomatic redirection when logging out of a Thinktecture Identity Server"
  date: "2015-01-11"
  tags: 
    - "thinktecture"
  description: "When using the Thinktecture Identity Server you might want to do an automatic redirect upon logout, which doesn't happen OOTB, so here's how to do it."
---

I've been working with the [Thinktecture Identity Server v3](https://github.com/thinktecture/Thinktecture.IdentityServer.v3) recently on a project. If you haven't come across Thinktecture Identity Server before it's an OpenID/OAuth2 server which you can run stand alone or embed in your own application to then do OAuth2 login against any credential store. It's generic enough that you can plug in whatever underlying store you want and really powerful as to what it gives you. If you're wanting to have your own auth server I can't recommend this highly enough.

Recently on the project we added something that you kind of want from an authenticated site, the ability to log out. Unsurprisingly Identity Server gives you the ability to log out, you redirect the user to the appropriate end point, the authorisation server performs the logout and then you are presented with a screen that says "Thanks for logging out, click here to go back to your site".

This is less that ideal for my scenario, I don't want the double-step, I want people to be returned to where they came from (actually I return them to another page which clears the client state in our SPA, but really I just don't want them to see a "Thanks for logging out" screen).

# Customising the Login/Logout process

With this requirement in mind it was time to dig into the Thinktecture API and work out where that page come from. What is interesting to note is that the whole login/logout process is served without any on-disk files and looking into the API I found that this is not entirely true, there are some on-disk files that get compiled as embedded resources and then served out by the [`DefaultViewService`](https://github.com/thinktecture/Thinktecture.IdentityServer.v3/blob/master/source/Core/Services/DefaultViewService/DefaultViewService.cs) which is a class that has a method for each step of the login and logout process. The implementation then reads the files from the embedded resources and sends the stream back (which is then passed to the response stream).

This is where we need to hook in to do our different logout process and you can either implement the `IViewService` interface yourself or override the particular methods you need to override on the `DefaultViewService`. The latter is what I've chosen to do as I only want a different logout flow.

# Enforcing redirect

The one problem I noticed with the way which this all works is that because I don't *want* anything served, I just want to do a redirect, I have a bit of a problem, I only have a `Stream` which I can return from the method (and digging further you'll find that the `Stream` is passed as straight to the response which has a `ContentType` of `text/html`), not an actual response.

So how do we enforce the redirect? Well it's time to get back to basics with HTML and play with the [Meta Refresh](http://en.wikipedia.org/wiki/Meta_refresh) in HTML. If you haven't used the `<meta http-equiv="refresh">` tag before it can be a nifty trick if you want to either reload a page after a period of time or redirect a browser after a time period. And that sounds exactly like what I want to do.

# Generating the appropriate response

Right let's recap:

* We need to override the `Logout` method of the `IViewService`
* Generate a chunk of HTML with the appropriate meta tag

And all that is pretty simple, in fact it's less that 20 lines of code:

    public override Task<Stream> LoggedOut(LoggedOutViewModel model)
    {
        var content = @"<!DOCTYPE html>
        <html>
            <head>
                <meta http-equiv='refresh' content='0;{0}'>
            </head>
            <body></body>
        </html>";

        var formattedContent = string.Format(content, model.RedirectUrl);

        return Task.FromResult(formattedContent.ToStream());
    }

*Note: the `ToStream` method is an extension method which you'll find in the `Thinktecture.IdentityServer.Core.Extensions` namespace, but feel free to write your own string-to-Stream method if you must.*

Told you it was simple code. Because we want an immediate redirect I've set the meta-redirect to be `0` seconds, resulting in immediate redirection and really, that's all that is important.

# Conclusion

Wrapping up this post:

* Thinktecture Identity Server is awesome. If you want your own Identity Server I'd use this over anything else
* There's a great amount of abstraction built in, swapping parts is so easy
* Doing an immediate redirect is a matter over overriding one method, returning 7 lines of HTML
