---
  title: "Accessing the Location header in a CORS-enabled API"
  date: "2013-11-28"
  tags: 
    - "asp-net"
    - "ajax"
    - "cors"
  description: "Dealing with the case of the missing Location header in an ASP.Net WebAPI response."
---

Today I hit a problem, we've got an ASP.Net WebAPI 2 project which is providing a series of REST services for a web app. These services are hosted on a different domain to the app will be hosted on so to perform the requests to them we've gone ahead and [enabled CORS](http://enable-cors.org/).

Up until now most of our work has been doing read-only endpoints in the API, but I just finished off implementing a POST route. Now in a RESTful API a POST should return a `201 Created` response along with the location which which you'll find the newly created resource. So in WebAPI I have something like this:

    var response = Request.CreateResponse(HttpStatusCode.OK, createdItemId);
    response.Headers.Location = new Uri(Url.Link("SomeRoutes", new { id = createdItem }));

Which sees me having a `Location` header in my response.

Next I want to read out the `Location` header and then follow it to get the data and display it on screen. I'm using AngularJS for this but the principle is the same for any way you're performing an AJAX request:

    $http.post(someUrl, someData)
        .then(function (response) {
            var location = response.headers('Location');

            return $http.get(location);
        })
        .then(function (response) {
            console.dir(response.data);
        });

Only there's a problem, `location` is always `undefined`! I'm looking in my network tab in the dev tools and I can clearly see that there is a `Location` header returned but when I try and read it in JavaScript it's never there.

Frustrated I turned to the googles and was not having much luck, everyone just said `response.headers('Location')` and you'll have your header, but I was never seeing it from Angular, or even in the raw `xhr` object. Something must be wrong.

After some more digging I came across [this](http://stackoverflow.com/a/14755417/11388). Little did I know that if you're enabling CORS it will only expose a small number of the available headers by default, if you want more [you have to expose them](http://www.w3.org/TR/cors/#access-control-expose-headers-response-header).

So back to our WebAPI controller action I added the following:

    var corsResult = new CorsResult();
    corsResult.AllowedExposedHeaders.Add("Location");
    response.WriteCorsHeaders(corsResult);

My API is already CORS enabled, all I'm doing is telling it that it's a CORS response and I want some additional headers exposed cross-origin.

And now I'm able to read my `Location` header in JavaScript.