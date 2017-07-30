---
  title: "Talking about front-end development on ANZCoders"
  date: "2015-06-06"
  tags: 
    - "anzcoders"
    - "web-dev"
    - "gulp"
    - "react"
  description: "I did two talks at ANZCoders on front-end development, covering the toolchain and a look at React."
---

Two weeks ago was the first [ANZCoders](http://anzcoders.com) virtual conference and I was lucky enough to present two sessions. Being a virtual conference all the content was recorded an you'll be able to watch them on YouTube if you missed the sessions.

## The wonderful world of front end tools

[Link](https://youtu.be/xQXI4Qc7Tbk)

In recent years there has been a huge change in the way we do front end applications. Back in the day we had tools like [Client Dependency](https://github.com/Shazwazza/ClientDependency) but these days runtime bundling/minification is no longer seen as the way to go, the rise of `npm` the way we manage dependencies and lastly there's the rise of the transpiler, be it a language-to-JavaScript transpiler like React or we're using [Babel](http://babeljs.io) to use ES6 features today.

In this talk I look at what tools we as ASP.Net developers need to start looking at, I cover off:

* Using [Yeoman](http://yeoman.io/) as a generator to create an ASP.Net 5 application
* Getting external modules with [npm](http://npmjs.org) or [bower](http://bower.io), with my preference being to use npm
* Managing your dependencies with [browserify](http://browserify.org/) or [webpack](http://webpack.github.io/)
 * I also talk about consuming dependencies, my recommenation is using [ES2015 modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) and transpile them down
* How to do a 'build' of client assets using [grunt](http://gruntjs.com/) or [gulp](http://gulpjs.com/). I was originally a grunt user but have since moved to gulp and am liking it more and more

If you're building ASP.Net application (or any web applications) today and you're not using these tools in your toolchain then you're really missing out here.

<iframe width="560" height="315" src="https://www.youtube.com/embed/xQXI4Qc7Tbk" frameborder="0" allowfullscreen></iframe>

## React, another JavaScript framework?

[Link](https://youtu.be/4uWzIM1U-VA)

I've recently had the opportunity to work on a greenfields project where we got to make a lot of the technology choices. Because we wanted to build a SPA I made the decision that we'd use [React](http://facebook.github.io/react) for the UI of the application.

With this talk I more looked at what problem space React works in, some common concerns people have about React (aka, JSX) and finished off with an application I built showing common things like:

* Security (although, really basic security)
* Routing, via [react-router](https://github.com/rackt/react-router)
* Real-time communication with SignalR

The code for my sample application can be found [on GitHub](https://github.com/aaronpowell/reply) and also includes a number of the things I talked about in the other talk, using Gulp for building the files from JSX to JavaScript, etc.

<iframe width="560" height="315" src="https://www.youtube.com/embed/4uWzIM1U-VA" frameborder="0" allowfullscreen></iframe>
