---
  title: "Using Source Maps with TypeScript"
  metaTitle: "Using Source Maps with TypeScript"
  description: "Another quick look at what you can do with TypeScript"
  revised: "2012-10-03"
  date: "2012-10-03"
  tags: 
    - "typescript"
    - "debugging"
    - "web"
  migrated: "true"
  urls: 
    - "/web/typescript-source-maps"
  summary: ""
---
Have you heard of [Source Maps](http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/)? Source Maps are an idea that has come out of Mozilla for addressing the debugging issues that are raised by *-to-JavaScript compilers and JavaScript minifiers, the problem is that when you use these you ultimately aren't debugging what you wrote.

Take TypeScript for example and the [improved version][1] ([original][2]) of the [PubSub from yesterday][3], we've got a problem, the code is quite different to what we'd be running in the browser. This is a big problem as if you're not familiar with JavaScript, or at least not comfortable with the language nuances, you'll quickly get lost and make a royal mess of what you're writing.

# Source Maps for TypeScript

Intelligently the TypeScript team have already done the hard work for us, there's a [Source Map generator in the compiler](http://typescript.codeplex.com/SourceControl/changeset/view/d397c54a55db#src%2fcompiler%2fsourceMapping.ts) (thanks [Ryan](https://twitter.com/ryanseddon) for pointing it out)!

So how do you use it? If you do a help dump of `tsc` (the TypeScript compiler) there's nothing in it:

    D:\Code> tsc -h    
    Syntax:   tsc [options] [file ..]
    
    Examples: tsc hello.ts
              tsc --out foo.js foo.ts
              tsc @args.txt
    
    Options:
      -c, --comments  Emit comments to output
      --declarations  Generates corresponding .d.ts file
      -e, --exec      Execute the script after compilation
      -h, --help      Print this message
      --module KIND   Specify module code generation: "commonjs" (default) or "amd"
      --nolib         Do not include a default lib.d.ts with global declarations
      --out FILE      Concatenate and emit output to single file
      --target VER    Specify ECMAScript target version: "ES3" (default), or "ES5"
      @<file>         Insert command line options and files from a file.

Well good news everybody, that's not listing all the compiler switches ;). Check out the `batchCompile` method for a bunch of gems, but most importantly there is a `sourcemap` switch, so if I take my little project:

    D:\Code\typescript-pubsub> tsc -sourcemap pubsub.ts

Now you'll have two files, `pubsub.js` and `pubsub.js.map` and the output JavaScript file will also contain the source map pointer:

    //@ sourceMappingURL=pubsub.js.map

Sweet! Let's open the HTML file in Chrome Canary (of which I've already enabled Source Maps) and we get some cool new debugging stuff:

![TypeScript files listed in the debugger][4]

You can find your .ts file in the sources list.

![Break point in a TypeScript file][5]

I've break pointed inside of TypeScript!

![And inspections][6]

Inspecting variables in TypeScript

# Conclusion

The fact that there was enough forward planning from the TypeScript team to include support for Source Maps in the initial release is a really great thing. Through the magic of Chrome we can debug code written in it as through it was our original code. If you want have a play [here's the code][7].

Hopefully either the Visual Studio or IE (or both) team also pick up Source Maps and add support for them too.

Happy cross-compiling.


  [1]: https://gist.github.com/3825576
  [2]: https://gist.github.com/3817035
  [3]: https://www.aaron-powell.com/web/pubsub-in-typescript
  [4]: https://www.aaron-powell.com/get/typescript/typescript-sourcemap-01.PNG
  [5]: https://www.aaron-powell.com/get/typescript/typescript-sourcemap-02.PNG
  [6]: https://www.aaron-powell.com/get/typescript/typescript-sourcemap-03.PNG
  [7]: https://github.com/aaronpowell/typescript-pubsub