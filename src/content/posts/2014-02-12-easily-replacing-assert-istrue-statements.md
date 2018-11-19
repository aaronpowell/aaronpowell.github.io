---
  title: "Easily replacing Assert.IsTrue statements"
  date: "2014-02-12"
  tags: 
    - "unit-testing"
    - "testing"
  description: "It's time to really address that annoying habbit of developers to use `Assert.IsTrue` in their tests."
---

I [blogged/ranted about `Assert.IsTrue`]({{< ref "2013-01-08-the-problem-with-assert-istrue.md" >}}) previously, well today I decided to work out a quick way to do bulk conversions of tests.

Well the easiest way to go about this is using a good old Regular Expression:

    Assert\.IsTrue\((?<Actual>.*)\s*==\s*(?<Expected>.*)\)

That's a regex which is ideal for using from Visual Studio, or any other tool that supports named capture groups. If you don't have something like that you can use numerical capture groups:

    Assert\.IsTrue\((.*)\s*==\s*(.*)\)

Now for the replace regex:

    Assert.AreEqual(${Expected}, ${Actual})

Or for numbered capture groups:

    Assert.AreEqual(${2}, ${1})

Or maybe you're using NUnit and want to use `Assert.That` (which some people argue is more readable), try this out:

    Assert.That(${Actual}, Is.EqualTo(${Actualy}))

## Bonus, adding messages

As a friend of mine, [Jason Stangroome](https://twitter.com/jstangroome) pointed out you might also want to include a message to the assert for additional information when it's failing, so we'd update our regex like so:

    Assert.AreEqual(${Expected}, ${Actual}, "${Actual} was expected to have th evalue of " +  ${Expected})

This will add the name of the variable we are asserting.