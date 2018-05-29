---
  title: "Rebuilding JavaScript Quiz in Nodejs"
  metaTitle: "Rebuilding JavaScript Quiz in Nodejs"
  description: ""
  revised: "2011-10-13"
  date: "2011-10-12"
  tags: 
    - "nodejs"
    - "javascript"
  migrated: "true"
  urls: 
    - "/javascript/rebuilding-javascript-quiz-in-nodejs"
  summary: ""
---
A few months back I [announced a new site][1] I was running called [JavaScript Quiz][2]. When I started to site it was to be done quickly so I chose an out-of-the-box blogging platform, that being [Posterous][3].

Since then I've come to realise that it *isn't* the platform I want wanting to go with. One of my main problems with it is its comment management system. Anyone who has submitted an answer to me will know what I'm talking about, the excessive spam which you end up with when I do publish all the answers.

Well because of this I decided to move away from Posterous and go with a new platform. As my new platform I decided that I wanted to use [Node.js][4] because well this is a JavaScript quiz so why not use JavaScript!

# The software

When looking at what I wanted to do with the new site I decided I wanted something that was easy to create a site in and also easy to update content it. A lot of people are raving about [Jekyll][5] of recent, which is a Ruby *CMS* which runs a flat file system website and Markdown as an editing language.

This seemed ideal, JavaScript Quiz isn't a big site nor is it a dynamic site so something that runs off flat files is very ideal. I'm also quite a fan of Markdown ([which we use in FunnelWeb][6]) so being able to write my posts in that is very nice an idea.

So I started looking for a Node.js alternative as I'd prefer to use something than write it myself ([I'm a bit over developing a CMS at the moment][7]) and I came across a project called [Docpad][8].

## Intro to Docpad

Docpad is a Node.js CMS in a similar style to Jekyll written by a guy from Sydney named [Benjamin Lupton][9] (and I like supporting home-grown software so that was a big plus). It's got a good set of templating engines to pick from so you don't have to use raw HTML if you want something a bit more cool for your templates (more shortly) and best of all it's shit simple to use.

You need to install the following [npm][10] packages and you're off and running:

* coffee-script
* express
* docpad

You're better off installing both `coffee-script` and `docpad` globally since they both have executables but you don't have to.

*Note: I had problems using Node.js with cygwin on Windows, I couldn't get `docpad` to install but that seemed to be a cygwin issue as it worked fine on both my Linux and OSX machines, just something to watch out for :).*

This isn't a Docpad tutorial, go check out the [docs][11] if you want to learn more.

## Templates

As I mentioned Docpad has a number of different HTML templating engines available, you can use [Eco][12], [Jade][13], [Haml][14] or the one I chose, [CoffeeKup][15]!

CoffeeKup is a way of using [CoffeeScript][16] as a HTML template engine. It's pretty cool and it means that you're able to do some really powerful things with the templates and interacting with the document you're rendering. Plus it means that we're using JavaScript/ CofeeScript for most of our site (one language to rule them all!).

## CSS

I'm not using any of the CSS templating engines (despite submitting a request for [CCSS][17] to be included :P) mainly because I'm using [HTML5 Boiler Plate][18]'s css and I don't want to have to convert it every time I upgrade.

The rest of the CSS is really basic and I've just cobbled together so I can get the site live, expect it to be improved as I get more time.

# Fixing commenting

As I mentioned commenting is something that was really a pain to anyone who was entering the quiz each week as you'd get spammed up with emails (don't worry, I got them all as well so it was **very** annoying). Good news is that the new site wont have this problem, I've gone with [Disqus][19] for comments (still moderated) which means that it should be much nicer an experience.

From an admin point of view it's much nicer as well :).

# Hosting

One advantage of Posterous was that it was a hosted solution so it wasn't costing me any more and this is something that I wanted to ensure didn't change. I decided that I'd go with [Heroku][20] for my hosting since they have [offered Node.js hosting for a while now][21].

This means that I am also using Git to store the site and I have it hosted on GitHub at the moment (sorry it's not a public repo :P).

Because of this I have a nice workflow of being able to edit my content, run it through the Docpad 'compiler' and commit in the generated HTML. This then goes up to Heroku and just runs off the flat files.

Ideally I'd not be committing the generated files and have part of the app startup code generate the files but so far I've had nothing but trouble getting it working that way. Heroku's cedar stack (which is where node.js runs) **is** a writable file system but something still seems to be going amiss (and it's not exactly easy to dig into...).

# Wrap up

So this is how I've gone about the relaunch of JavaScript Quiz. The new site should be active soon (awaiting the DNS to change over :P). I wont be porting the old comments so the old site will stay active. Hopefully I've got the redirects all sorted out (yes the 404 page is pretty shit so far :P). Hopefully this provides a nice new home for the site.


  [1]: https://www.aaron-powell.com/javascript/javascript-quiz
  [2]: http://javascriptquiz.com
  [3]: http://posterous.com/
  [4]: http://nodejs.org
  [5]: http://jekyllrb.com/
  [6]: http://funnelweblog.com/what-is-markdown
  [7]: https://www.aaron-powell.com/umbraco/so-long-and-thanks-for-all-the-fish
  [8]: https://github.com/balupton/docpad
  [9]: http://twitter.com/balupton
  [10]: http://npmjs.org
  [11]: https://github.com/balupton/docpad/wiki
  [12]: https://github.com/sstephenson/eco
  [13]: https://github.com/visionmedia/jade
  [14]: http://haml-lang.com/
  [15]: http://coffeekup.org/
  [16]: http://coffeescript.org
  [17]: https://github.com/aeosynth/ccss
  [18]: http://h5bp.com
  [19]: http://disqus.com
  [20]: http://heroku.com
  [21]: http://blog.heroku.com/archives/2011/6/22/the_new_heroku_2_node_js_new_http_routing_capabilities/