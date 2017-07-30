---
  title: "Solving DocPad's excessive memory usage"
  date: "2013-06-18"
  description: "After moving my site to DocPad I found a problem, DocPad is a massive memory hog! The result of this is that I can't even run it on a single Heroku web dyno, a static HTML site can't run on a single web dyno!\n\nSo let's have a look at how I went and solved the problem"
  tags: 
    - "docpad"
---

Since I decide to [move my site from FunnelWeb to DocPad](/posts/2013-06-10-new-blog-less-funnelweb.html) I also decided to deploy to [Heroku](http://www.heroku.com) since I like them as a host. So I [built my site](https://github.com/aaronpowell/aaronpowell.github.io), [got everything into Git](/posts/2013-06-11-funnelweb-to-git.html) and then I did a `git push heroku master`.

**And then it fell over.**

As soon as the push completed Heroku kicked off and started to spin up the dyno, but when I hit the site it said it'd crashed.

Crashed, seriously? It's a bunch of HTML files, how on earth can that crash?

So I crack out the Heroku toolbox and inspect the log files and find the crash, it crashed because _it exceeded the allocated memory_.

**Exceeded the allocated memory?!** IT'S A STATIC SITE!

Ok, fine, let's have a look at what could be wrong, how a static site could be blowing out the memory allowance (512mb it's allocated). I fire up the `docpad run` command which is what is done on Heroku and this is what I get:

![DocPad memory usage](/get/docpad-memory-usage.PNG)

That's nearly 700mb memory usage for a static site! I've seen it peak at over 900mb, run idle around 850mb, all kinds of wacky memory usage.

# The not so static static site

So it would seem that I made a false assumption about DocPad, it's not quite as static as I thought it was. While yes, it generates all these flat HTML files on disk it also keeps all the content in memory:

<blockquote class="twitter-tweet"><p><a href="https://twitter.com/slace">@slace</a> <a href="https://twitter.com/shiftkey">@shiftkey</a> we put all the files in memory for generation and keep them there for quick access, so not a bad thing</p>&mdash; DocPad (@DocPad) <a href="https://twitter.com/DocPad/statuses/341171857317314562">June 2, 2013</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

Well that's kind of crap, I mean, I've got ~400 files in my generated output so it's a lot of files that need to be stored in memory when really the requests can just be routed to a location on disk.

# Solving the memory problem

I've already made my choice to go with DocPad but since it's having some whacky memory consumption issues meaning that it's not really going to be a viable deployment option so how can I go about it?

Well why not use DocPad to generate the HTML and then just write my own routing layer using [Express.js](http://expressjs.com)? After all DocPad is just sitting on top of Express.js to do a lot of its heavy lifting. In fact it's really simple to make a routing engine on top of Express.js:

	var express = require('express');
	var app = express();

	app.use(express.static(__dirname + '/out'));

	app.listen(process.env.PORT || 3000);

Yep that's it, we've got our site going and now I can deploy it.

_Note: There's still a bit of a limitation here, DocPad's memory will blow out mostly during its generation phase so this now means that I have to check the `/out` folder into my git repository, which makes it larger, but it's not that big a problem really._

## Maintaining old routes

As I said in my last post I needed to ensure that I didn't break my SEO between my old routes and my new ones. When using DocPad's engine it'll look at the `urls` meta-data which it'll then 301 the response. Now you can see why DocPad does have some of its heavy memory usage, it actually does some on-the-fly mapping of routes. Still, I'm pretty sure I can do this without the memory explosion.

My idea is that we can use the DocPad [plugin model](http://docpad.org/docs/plugins) and from that generate a JSON object that represents all the alternate routes for our posts, then we can load that JSON into our Express.js app and map the routes.

My plugin can be found [here](https://github.com/aaronpowell/aaronpowell.github.io/tree/master/plugins/docpad-plugin-staticroutes) and what it does is:

* Hook into the `writeAfter` event
* Grab all `document` objects
* Create an object that contains the URL we want and all the alternate URLs that we want to 301
* Strip out any that don't have alternate URLs
* Write this to the output folder

Here's the code that'll create our route map:

    var docs = this.docpad.getCollection('documents').toJSON();

    var routes = docs.map(function (doc) {
        return {
            url: doc.url,
            redirects: doc.urls.filter(function (x) { return x !== doc.url; })
        };
    }).filter(function (route) {
        return !!route.redirects.length;
    });

So from that we can now update our Express.js file to look like so:

	var express = require('express');
	var app = express();

	app.get('/routes.json', function (req, res) {
	    res.status(403).send('403 Forbidden');
	})

	app.use(express.static(__dirname + '/out'));
	app.use('/get', express.static(__dirname + '/src/files/get'));

	var routes = require('./out/routes.json').routes;

	var redirector = function (dest) {
	    return function (req, res) {
	        res.redirect(301, dest);
	    };
	};

	routes.map(function (route) {
	    if (route.redirects) {
	        return route.redirects.map(function (redirect) {
	            return app.get(redirect, redirector(route.url));
	        });
	    }
	    return;
	});

	app.listen(process.env.PORT || 3000);

I've also put a few other special routes, I'm putting a 403 on the `routes.json` file since it sits in the root of my `out` folder and I don't really want it served out to the world (I'm also serving my assets from a special folder to avoid duplicating them in the repo and making it huge).

# Conclusion

DocPad appears to be a bit of a memory hog which can introduce some problems when you are looking at your hosting options, so make sure you look at that before signing any hosting agreement.

But that said if you want to invest a little bit of effort and not rely on DocPad as your routing engine then you can rely on just the HTML that is generated and use a middleware like Express.js to handle the routing with a minimal memory footprint.

_For the record, my site now run around the 20mb memory footprint._