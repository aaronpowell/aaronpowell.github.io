---
  title: "WhatKey.net, a simple way to find JavaScript keycodes"
  metaTitle: "WhatKey.net, a simple way to find JavaScript keycodes"
  description: "An overview of a simple site which helps JavaScript developers working with keyboard events"
  revised: "2010-12-21"
  date: "2010-12-07"
  tags: 
    - "whatkey"
    - "javascript"
    - "web"
    - "project"
  migrated: "true"
  urls: 
    - "/whatkey-net-for-your-javascript-keycode-glory"
  summary: ""
---
Today while preparing a set of slides for an upcoming talk I decided that I wanted to do the slides as a series of web pages, the problem is that I still wanted to be able to use my [Logitech clicker][1]. Since it 'just works' when I plug it in I figured it was firing some simple keyboard events, but the question is, what keyboard events is it firing?

I fired up Chrome, opened the JavaScript console and added a body `keypress` event to capture the keycode. Sweet, got what I needed, but it was a bit of a pain in the ass to do, I just wished there was a simpler way to find it, and what if I need to get them again, I've gotta write little handler again.

It's just one of those things that you don't need all that often, but it's just a tedious task to get done.

As they say, the necessity is the mother of all invention, so I decided to whip up a simple website which anyone can use, available at [http://whatkey.net][2].

All you need to do is fire up [http://whatkey.net][3] and press the key that you want, this give you the keycode for the `keydown` event in big letters. If you want to check different keyboard events, like `keypress` or `keyup` then you can access them by going to [http://whatkey.net/keypress][4] or [http://whatkey.net/keyup][5].

Best of all this whole application is done in about 20 lines of code ([source code is on GitHub][6]), it runs Ruby, using [Sinatra][7] and hosted on [Heroku][8].

Hopefully this tool becomes useful to other web developers out there.


  [1]: http://www.logitech.com/en-au/mice-pointers/presentation-remote/devices/5993
  [2]: http://whatkey.net
  [3]: http://whatkey.net
  [4]: http://whatkey.net/keypress
  [5]: http://whatkey.net/keyup
  [6]: https://github.com/aaronpowell/whatkey
  [7]: http://sinatrarb.com
  [8]: http://heroku.com