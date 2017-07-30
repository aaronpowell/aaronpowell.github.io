---
  title: "Issue with Geolocation in IE9 RC"
  metaTitle: "Issue with Geolocation in IE9 RC"
  description: "A (known) issue with the IE9 RC geolocation API."
  revised: "2011-02-13"
  date: "2011-02-11"
  tags: 
    - "ie9"
    - "web"
  migrated: "true"
  urls: 
    - "/ie9-rc-geolocation-issue"
  summary: ""
---
# Update

Looks like the server-side fix has been implemented and it not works just fine. Feel free to read on if you're interested to know why it didn't work for a period of time.


You've probably already heard that [IE9 RC is available][1], and one of the features that has been included is the [HTML5 Geolocation API][2].

I decided to add that to a fun little website that [Tatham Oddie][3] and I built, [isitbeerti.me][4], if you allow your location to be known you'll be able to bring up a map for the route to where it is midday. Hardly useful but fun none the less.

But there's a problem, although geolocation is detected as being a browser feature it fails for me in the IR9 RC.

# Quick Geolocation API primer

At least years REMIX conference Tatham gave a talk about Geolocation ([link][5]) and if you want to get a much more in depth look at this check out his talk. Instead I'll give a quick look at how to work with it in the browser.

The idea behind the new geolocation API to have a JavaScript interface to the browser API which will be able to work out just where you're browsing from.

This is pretty sweet, and very easy to use, with the basic implementation requiring just this:

    navigator.geolocation.getCurrentPosition(function(position) { console.log(position); });

There's a few points to note about this:

* I'm only passing in a callback for the *success* event, I'm not passing in an *error* callback, nor am I passing in any position options (argument #3)
* I'm not checking if `navigator.geolocation` actually exists, so it'll fail with a JavaScript error in older browsers
* Calling `getCurrentPosition` will check if the user has allowed the browser to know where you are for the website, if it's the first time you'll receive a prompt which you can choose to block it anyway (resulting in the error callback being invoked)

# The issue with IE9 RC

As I mentioned there's an issue with the IE9 RC, if you go to a website that requests location information, such as [isitbeerti.me][6], even if I allow it the *error* callback is invoked. If I do the same thing in Chrome or the latest Firefox it works as advertised.

Well as it turns out this is a **known issue of the RC**, and a little birdy has told me that the cause of this is because **the service used by the browser has an issue with DateTime objects which aren't US formatted**. Ironically though it does work just fine in the USA, so it seems like an odd issue to have cropped up, after all geolocation does imply something global ;).

The same little birdy has said that a fix is in the works, and luckily this is a **service level fix** so hopefully they can roll it out without any browser changes.

Fingers crossed and we can make location-based websites for all major browser vendors soon.


  [1]: http://blogs.msdn.com/b/ie/archive/2011/02/10/acting-on-feedback-ie9-release-candidate-available-for-download.aspx
  [2]: http://dev.w3.org/geo/api/spec-source.html
  [3]: http://tath.am
  [4]: http://isitbeerti.me
  [5]: http://blog.tatham.oddie.com.au/2010/06/03/talk-resources-riding-the-geolocation-wave/
  [6]: http://isitbeerti.me