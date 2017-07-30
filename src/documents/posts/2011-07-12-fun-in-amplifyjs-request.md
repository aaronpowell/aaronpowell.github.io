---
  title: "Having fun and digging deep into amplifyjs and the request API"
  metaTitle: "Having fun and digging deep into amplifyjs and the request API"
  description: "Let's have a bit of a fun doing something that's probably a bad idea with the AmplifyJS Request API."
  revised: "2011-07-13"
  date: "2011-07-12"
  tags: 
    - "javascript"
    - "amplifyjs"
    - "doing-it-wrong"
  migrated: "true"
  urls: 
    - "/javascript/fun-in-amplifyjs-request"
  summary: "Let's have a bit of a fun doing something that's probably a bad idea with the AmplifyJS Request API."
---
Have you played with [amplifyjs][1] yet? Played with it's cool way of handling requests?

I really like the way you can do this:

    //in our JavaScript bootstrapper
    amplify.request.define("searchTwitter", "ajax", {
        url: "http://search.twitter.com/search.json?callback=?",
        dataType: "jsonp",
        cache: 30000
    });

    //in some other file
    amplify.request('searchTwitter', { q: 'amplifyjs' }, function (data) {
        //handle returned data
    });
    
It's nice and clean a way to setup request pointers which you can then mock out for testing purposes.

But you know, it's not as clean as I'd really like and if you know me you'll know that I like to try and do something with an API that you're **not meant to do**. So while playing with amplify I decided to dive into the code and work at how it was mapping my defined requests to the method call and doing so I found something interesting (and well... fun!):

    amplify.request.resources.searchTwitter({
      data: { q: 'amplifyjs' },
      success: function(data) {
        //handle returned data
      }
    }, {});
    
Yep that's right, the `request` function has a **public** property called `resources`, which has properties added to it that represent the requests which have been defined.

If you're using an `ajax` request (as I defined at the start) you have two arguments to pass in:

1. The settings object, most of which are passed to [`$.ajax`][2]. In this case I'm passing in the data object and a success callback, a bit more explicitly obviously
1. I haven't quite worked out what the 2nd parameter is for other than passing in an `abort` handler in (but it does seem to be overridden at the end of the function anyway...)

Whether or not the knowledge that you can do this is kind of any use I don't know, I just think it's kind of cool :P.

### Some points of note

The arguments of your method hanging off resources will depend on the *type of request*. Amplifyjs has [build in request types][3] and supports custom types, so the arguments may be different, eg:

    amplify.request.types.foo = function() {
        return function(callback) {
          console.log('aww you want to foo!');
          if(callback) {
            callback.call(this);
          }
        };
    };
    
    amplify.request.define('bar', 'foo', {});
    
    amplify.request.resources.bar(function() { //just a function as an argument
        console.log('hey, it works!');
    });

* This isn't a documented feature so it **works on my machine** and may not work ever again
* I offer no warranty on this code
* Custom request types must return a function (in fact any request types have to return a function)
* It's your choice as to whether a `TypeError` is better than the built in error handling
* This was really just a thought experiment to push an API to its limit

Happy Hacking!
    
    
  [1]: http://amplifyjs.com
  [2]: http://api.jquery.com/jQuery.ajax/
  [3]: http://amplifyjs.com/api/request/#built-in_types