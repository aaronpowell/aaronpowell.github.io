---
  title: "AJAX without jQuery"
  date: "2013-08-02"
  tags: 
    - "javascript"
    - "ajax"
    - "jquery"
  description: "When was the last time you wrote an AJAX request?\n\nWhen was the last time you did it without relying on jQuery?\n\nIn this article we'll look at how do do just that, how do make an AJAX request without jQuery to better understand what's going on."
---

I'm very much of the opinion that the better you know your tools the better you can make intelligent choices about the layers you put over them. One such layer I see constantly used that people tend to use but not really understand is jQuery. Don't get me wrong I'm not anti-jQuery or anything, but like I said I believe you should understand your tools before you try and abstract them away.

So today I want to look at a really critical part of jQuery, AJAX.

You've probably written something like this:

    $.ajax({
        type: 'get',
        url: '/foo',
        success: function (data) {
            //something with data
        }
    });

But what's that doing under the hood?

# Hello XMLHttpRequest

If you're doing an AJAX request you're going to need the _X_ part of that and that's handled through the [`XMLHttpRequest`](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) object. This object is the descendant of the `ActiveX` object which Microsoft added to early Internet Explorer which kick started the AJAX revolution.

So this is the backbone of doing the request and obviously the backbone of what jQuery does under its API, but how do we use it?

# Creating a GET with XMLHttpRequest

Let's look back to our example above, how does that work? Well first things first we need to create an instance of the `XMLHttpRequest`:

    var xhr = new XMLHttpRequest();

Now we need to open our request telling it what kind method we want to use and where to go:

    xhr.open('get', '/foo');

_Note: There's a few other arguments which we can pass through, whether you want it to be handled as an async request as well as credentials if you're doing an authenticated request._

Since we've opened our request we're probably going to want to do something when it completes right? To do that we rely on the DOM event standard, using the `addEventListener` method (you can assign event listeners using the `on...` style but that's so IE6). Probably the most important event to be listening for is the `load` event, this is the one that is executed when a successful response is completed:

    xhr.addEventListener('load', function (e) {
        //handle success
    }, false);

There are other events you can listen for, `progress`, `error` and `abort` which do pretty much what their names state. The `progress` event is really useful if you're expecting a request to take a long time to complete, say you're uploading a file, or expecting a large response, you can listen for this and inform the user of the status, you know, awesome progress bar style.

But we're not done yet, our request is still in a _holding pattern_, the request hasn't been issued, that doesn't happen unless we explicitly make it so, we have to explicitly send the request:

    xhr.send();

You can see it in action [here](http://jsbin.com/inikir/1).

# Handling responses

So you're probably going to want to do something when the response comes in right? And even more logical is to do something with the response data that comes back. Depending what kind of data you're getting back you have different ways to work with it. Let's start with the one you're most like going to want from an AJAX request, JSON.

Well the XMLHttpRequest doesn't really have the concept of JSON, as far as it is concerned this is just text, so we get at it from the `responseText` property of _either_ the first argument of the event handler **or** the `xhr` object itself. With this you would then convert it to a JavaScript object using the JSON API:

    xhr.addEventListener('load', function (e) {
        var o = JSON.parse(xhr.responseText); //or e.responseText
        //work with our object
    }, false);

What if you are expecting HTML? Say you're loading a template or doing another kind of partial page load. For this you're _likely_ to want the `responseXML` property. Modern browsers support this, which turns your response content into a DOM snippet you can work with. If you've got an older browser [there are other options available](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest#Analyzing_and_manipulating_the_responseXML_property).

# POST-ing data

We've seen how to `GET` data, but what about if we want to `POST` data?

Obviously we'd need to change the `open` call:

    xhr.open('POST', '/foo');

But we're probably going to want to submit some data too right? That's the whole point of a POST isn't it? Most likely you're going to be POST-ing data from a form, and to do that you can use the [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) API. In this scenario you need to pass the FormData instance through the `send` method:

    var data = new FormData();
    data.append('name', 'Aaron');
    xhr.send(data);

This will send up request body with `name=Aaron` in it, where `name` is the key of a form value and `Aaron` is the value. This can be read out of the middleware of whatever HTTP framework you're working with. ASP.Net this would be the `HttpRequest.Form` object, Express.js it'll be `request.form`.

If you're not posting FormData but instead want to POST JSON then you'll need to do make sure your server knows it's like that, and doing so means setting the headers appropriately. First off you'll want to set the `Content-Type` header:

    xhr.setRequestHeader('Content-Type', 'application/json');

This is especially important if you're using ASP.Net MVC as your end point, it will detect the `Content-Type` and be able to parse it into your model. Next you'll want to make sure that you set the `Content-Length` so your server knows how much data to expect:

    xhr.setRequestHeader('Content-Length', JSON.stringify(data).length);

And finally when you call `send` you'll need to send up a JSON string, not the object:

    xhr.send(JSON.stringify(data));

# Conclusion

So there we have it, we've seen the building blocks of making an AJAX request, the `XMLHttpRequest` object. We've seen how to make `GET` and `POST` requests, pass up data, manipulate headers and get data back in a response.

From these building blocks you can start understanding what is actually happening in your libraries and even avoid them if you don't want the overhead (say a mobile app).