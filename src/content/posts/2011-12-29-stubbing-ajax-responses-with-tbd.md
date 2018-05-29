---
  title: "Stubbing AJAX responses with tbd and AmpliyJS"
  metaTitle: "Stubbing AJAX responses with tbd and AmpliyJS"
  description: "Working with tbd to build your requests without backend services"
  revised: "2011-12-29"
  date: "2011-12-29"
  tags: 
    - "javascript"
    - "amplifyjs"
  migrated: "true"
  urls: 
    - "/javascript/stubbing-ajax-responses-with-tbd"
  summary: ""
---
A project which I'm working on at the moment I'm using [AmplifyJS][1] to simplify my front-end routing through to my underlying data service calls. The problem is that I haven't got the backend services ready yet (there's some outstanding blockers in the API I'm working against) so I'm focusing my work on the front end.

But there's the obvious problem, I want to push data to the UI but I don't have any way to get the data.

Luckily I wrote [tbd recently][2] which can solve one of the problems, it can generate data to pump into my new UI and this is where AmplifyJS really comes to shine.

# Introduction to faking data with amplify.request

To simplify my front-end routing I'm going to be using the [Request API][3] from AmplifyJS and if you're not familiar with it check out the [docs][4] before going further as I only plan to cover the testing side of it.

Let's say I have a route defined like so:

	amplify.request.define('get-data', 'ajax', {
		url: '/data-service',
		dataType: 'json',
		type: 'GET'
	});

And later in my app I'm accessing it:

	amplify.request('get-data', function (data) {
		//using templating pump out the UI from the data
	});

So where does the faking data come in? Well the cool thing about how Amplify is designed means that you can *replace a defined request*!

Say what?!

First thing we need to understand is the [request types][5]. When you define your request in AmplifyJS the 2nd argument you pass in is the `request type`, generally speaking this will be `ajax` as that is the provided request type in the API. You can define your own types so if you were wanting to pull in from an OData service you can setup that, add a new key to the `request types` and then it's all sweet (sorry how to do that is beyond this articles scope).

Where it gets really interesting is that if your provide only two arguments to the `define` method, a key and a **function** this works as well. In this case **your function is executed when you invoke the request**. Now let's add this code:

	amplify.request.define('my-data', function (settings) {
		settings.success({
			status: 'success',
			items: { }
		});
	});

This will make it so that whenever I call my request I will get a successful response with no data. There are properties which you need to set, first is the `status` to `success` so that AmplifyJS knows the response was successful, second is the `items` property which will contain any data you want returned to the method.

## Setting up your project

Now you've got the basics down I thought I'd just give a bit of an insight into how I go about including this into a project. As mentioned you can override a defined request as many times as you want:

    amplify.request.define('my-data', 'ajax', { ... });
    amplify.request.define('my-data', 'odata', { ... });
    amplify.request.define('my-data', function (settings) { ... });

Here I've setup the request three times but the last one to be executed is the one included.

The way I setup my project is that I have a file which I define my requests in, all of them together (or at least logically broken down into groups of common requests). For when I'm wanting to stub out my requests I create a secondary file and include the stubbed out requests in there and then include it *directly after the main file*. This means that once the real request is created it's immediately replaced with fake out.

With the fake requests in a separate file I can include or exclude them as I please, as my services come online or even use them in unit tests.

# Building your data

The idea of doing this all with AmplifyJS was shown to me by [Elijah Manor][6]. He sent me this [jsfiddle][7] which shows it all setup.

The problem with examples like this is that they are using fixed data, every reload of that page will show you exactly the same thing and clicking the refresh button on the UI will reload the data with exactly the same data. Now in this demo it's not really that bit a deal, the data doesn't really need to look different each time it's not going to make much difference. But what if you are doing something that will look different based on the data, say you're doing some charting?

I've created a [jsfiddle][8] to demonstrate this, when you click the button the chart will be rebuilt with different data.

Now here's my mock request:

	amplify.request.define('get-data', function (settings) {
	    var data = tbd.from({})
	                .prop('category').use(tbd.utils.random('a', 'b', 'c', 'd', 'e')).done()
	                .prop('value').use(tbd.utils.range(10, 100)).done()
	                .make(tbd.utils.range(3, 8)());

	    settings.success({
	        status: 'success',
	        items: data
	    });
	});

With `tbd` I'm scaffolding out a data series for my charting API, using the alphabet as the *label* and then a randomly chosen number between 10 and 100 for the value. This means that as I generate new data my UI will change (I'm leveraging one of `tbd`'s util methods to generate a random number of results as well (I might clean up the API to make that simpler in the future).

# Conclusion

And there we have it an example of how we can combine a couple of helpful JavaScript libraries to make it easier to:

* Simplify out UI request layer
* Make sure our development isn't halted while data services are under development
* Have less hard coded data responses


  [1]: http://amplifyjs.com/
  [2]: https://www.aaron-powell.com/javascript/building-data-with-tbd
  [3]: http://amplifyjs.com/api/request/
  [4]: http://amplifyjs.com/api/request/
  [5]: http://amplifyjs.com/api/request/#request_types
  [6]: http://twitter.com/elijahmanor
  [7]: http://jsfiddle.net/slace/ubeeK/
  [8]: http://jsfiddle.net/slace/8tBYt/