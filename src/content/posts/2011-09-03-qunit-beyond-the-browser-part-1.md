---
  title: "Going beyond the browser with QUnit - Part 1"
  metaTitle: "Going beyond the browser with QUnit - Part 1"
  description: "Taking your QUnit tests out of the browser to use your tests with Node.js"
  revised: "2011-09-04"
  date: "2011-09-03"
  tags: 
    - "javascript"
    - "nodejs"
    - "qunit"
  migrated: "true"
  urls: 
    - "/javascript/qunit-beyond-the-browser-part-1"
  summary: ""
---
When it comes to unit testing my JavaScript my preferred framework is [QUnit][1]. If you're not familiar with QUnit it's the test framework for [jQuery][2] so I think it's reasonably well up to the task of testing JavaScript.

Recently I wrote an article on a [preparser I've written for Knockout][3]. Interestingly enough at the same time Brendan Satrom had [the same idea][4]. I quite like the approach that Brendan has taken so I decided to have a poke around in the code and see if we could even merge the two projects.

The first thing I noticed when looking into the code was that it was written using [CoffeeScript][5]. The second thing I noticed was that the tests were all written using QUnit and were to be run in the browser. But there was a bit of a nuisance, the tests were against the compiles JavaScript, not the raw CoffeeScript (it was running against the generated file), to do any modifications, and test them, you have to copy the CoffeeScript to the online compiler, the back to the compiled file and then run the tests.

I'm sure you can see where the problems can come into this solution.

Well I've done a few small projects using CoffeeScript in the past and I've also included some tests into it so I decided at having a crack at getting this to work.

# Getting your tools together

So to get started I'm using Windows and I'm going to be using Node.js to do the browser-less coding. Although I'm aware there is a version of Node.js for Windows I'm still using a self-compiled version with cygwin because [npm][6] works fine under cygwin but not with the Windows compiled version.

Additionally I'm going to be using a few npm packages:

- [CoffeeScript][7]
- [QUnit][8]
- [Colors][9]

# Getting started by watching cake

If you've done much work with CoffeeScript you'll probably have come across the concept of a [Cakefile][11], if you haven't, a Cakefile is a CoffeeScript version of a [Rakefile][12] (or MSBuild is a similar concept if you're coming from .NET just a lot more horrible), so I'm going to start off by using Cake to create a file system watcher.

The basic idea if I want to have a Cake task which will monitor for changes on the file system (specifically our CoffeeScript file) and when a change happens we'll compile it to JavaScript and run our tests.

First off I'll define some constants in our Cakefile:

    fs = require 'fs'
    path = require 'path'
    CoffeeScript = require 'coffee-script'
    file = 'knockout.unobtrusive'
    source = 'coffee'
    output = 'js'

Next it's time to setup our `watch` task:

    task 'watch', 'Watch prod source files and build changes', ->
        msg = "Watching for changes in #{source}"
        console.log msg
        
        fs.watchFile "#{source}/#{file}.coffee", (curr, prev) ->
            if +curr.mtime isnt +prev.mtime
                console.log "Saw change in #{source}/#{file}.coffee"
                try
                  invoke 'build'
                  console.log 'build complete'
                  invoke 'tests'
                catch e
                  msg = 'Error with CoffeeScript build'
                  console.log msg
                  console.log e

We're using the standard `watchFile` method in Node and in the callback we'll ensure that the change times aren't equal (double-checking for false positives) and if there's a valid change we want to execute the following two tasks:

- `build`
- `tests`

Additionally we're wrapping this in a `try/ catch` so that if it fails we can provide a useful message but have the watcher keep running (say if you save while you're half-way through a change you wont get a major failure or anything).

Now let's have a look at the `build` task. This task will allow us to compile our coffee file into JavaScript. This is just going to be a standard Cake task as well so you can use it elsewhere if you want:

    task 'build', "builds #{file}", ->
        console.log "building #{file} from coffeescript"
        code = fs.readFileSync "#{source}/#{file}.coffee", 'utf8'
        fs.writeFile "#{output}/#{file}.js", CoffeeScript.compile code

Since Node (well JavaScript) is a callback-based programming model generally speaking you'll be doing asynchronous operations, even with the file system. Node has provided some changes though to allow for *synchronous* programming. In this case I'm going to be using the synchronous read operation. The main reason for this is so that I don't have to pass around a callback which will then do the tests (this could get messy in the Cakefile).

Once the read operation is completed we pipe the output into the CofeeScript compiler API (which we can call from CoffeeScript/ JavaScript) and write the output of that into a JavaScript file.

When the `build` task is done the next step in our watcher is to call out to our test runner. As mentioned above I wanted to reuse the QUnit tests that already shipped in source of Knockout.Unobtrusive I plan to use the Node.js implementation of QUnit. It's rather simple and again we'll create a Cake task:

    task 'tests', "run tests for #{file}", ->
        console.log 'Time for some tests! '
        runner = require 'qunit'
        sys = require 'sys'
        colors = require 'colors'
        test = 
          code: "./#{output}/#{file}.js",
          tests: "./tests/#{file}.tests.js"

        runner.options.summary = false
          
        report = (r) ->
          if r.errors
            msg = "Uh oh, there were errors"
            sys.puts msg.bold.red
          else
            msg = 'All test pass'
            sys.puts msg.green
            
        runner.run test, report

So a few things of note:

- We're using the runner which comes with QUnit for Node.js
- We're creating an object with our tests info which includes:
  - The file under test
  - The tests to execute
- I'm suppressing the summary (we execute the tests a lot so there's no need to see it)
- Lastly there's a callback for when the runner finishes which will either dump a message on success or failure (with a pretty colour!)

From the point of view of the Cakefile that's really all we have a need for, we've got our watcher up and running and we can just kick it off:

    cake watch

Now whenever we edit our CoffeeScript file it'll go nicely.

# Wrapping up

So this wraps up the first part of migrating our tests out of the browser to make a more automated series of JavaScript tests.

Next time we'll look at how to deal with some of the limitations of working in a DOM-less environment.


  [1]: http://docs.jquery.com/Qunit
  [2]: http://jquery.com
  [3]: https://www.aaron-powell.com/javascript/knockoutjs-preparser
  [4]: http://bsatrom.github.com/Knockout.Unobtrusive/
  [5]: http://jashkenas.github.com/coffee-script/
  [6]: http://npmjs.org
  [7]: http://search.npmjs.org/#/coffee-script
  [8]: http://search.npmjs.org/#/qunit
  [9]: http://search.npmjs.org/#/colors
  [10]: http://search.npmjs.org/#/jsdom
  [11]: http://jashkenas.github.com/coffee-script/#cake
  [12]: http://rake.rubyforge.org/files/doc/rakefile_rdoc.html