---
  title: "Watch your OS"
  metaTitle: "Watch your OS"
  description: "Today we got caught out by a recent npm change"
  revised: "2012-03-21"
  date: "2012-03-21"
  tags: 
    - "nodejs"
    - "npm"
  migrated: "true"
  urls: 
    - "/nodejs/watch-your-os"
  summary: ""
---
Today some of my colleagues were trying to integrate [csslint][1] into the build process of a project using the [nodejs package][2] but they kept hitting an issue:

    npm ERR! Unsupported
    npm ERR! Not compatible with your operating system or architecture: csslint@0.9.7
    npm ERR! Valid OS:    darwin,linux
    npm ERR! Valid Arch:  any
    npm ERR! Actual OS:   win32
    npm ERR! Actual Arch: ia32

So I had a crack on my machine and it worked **just fine**. This was rather confusing until we compared versions. I was running version *0.6.11* where as they were running *0.6.13*. This didn't make sense, why could I install it but they couldn't?

I put on my detective hat and went hunting, the first thing I found was that there is an OS restriction in the package.json file:

    "os": ["darwin", "linux"],

This doesn't include `windows` anywhere, but it also doesn't explain why it worked on my Win7 x64 install but not theirs.

Then I went back and checked out what changed between the two versions of Node.js, in particular what changed with npm.

That's when I came across the [release notes for 0.7.6][3]. While true this is for the 0.7.* unstable branch and we're using the 0.6.* stable what's worth noting is the first change for npm version 1.1.8:

> Add support for os/cpu fields in package.json (Adam Blackburn)

I then looked at the 0.6.13 release, it's using npm 1.1.9. Compare that to 0.6.11 which used npm 1.1.1 and I think we've found our issue. In the change between the two Node versions we've got a new npm version which *supports something that wasn't supported before*!

A simple [fork and pull request][4] and the problem is solved and now we have to wait for the next version for csslint to be published.

# Lesson Learnt

npm now supports the OS (and CPU) package.json property from [CommonJS][5] so make sure you check that properly!


  [1]: http://csslint.net/
  [2]: https://github.com/stubbornella/csslint
  [3]: http://blog.nodejs.org/2012/03/13/version-0-7-6-unstable/
  [4]: https://github.com/stubbornella/csslint/pull/252
  [5]: http://wiki.commonjs.org/wiki/Packages/1.1