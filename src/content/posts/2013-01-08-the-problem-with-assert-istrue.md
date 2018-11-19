---
  title: "The problem with Assert.IsTrue"
  metaTitle: "The problem with Assert.IsTrue"
  description: "It's time for another rant, this time it's with how some people write their unit tests"
  revised: "2013-01-08"
  date: "2013-01-08"
  tags: 
    - "unit-testing"
    - "opinionated"
    - "ranting"
    - "rant"
    - "testing"
  migrated: "true"
  urls: 
    - "/rant/the-problem-with-assert-istrue"
  summary: ""
---
Have you ever seen a unit test that looks like this:

```csharp
	public void SomeTest()
	{
		var foo = new Bar();

		var result = foo.GetStuff();

		Assert.IsTrue(result.Count() == 1);
	}
```

Do you know what's wrong with this test? I'll give you a clue, the developer use `Assert.IsTrue` and by doing so **they've made a bad test**.

I see a lot of tests which contain `Assert.IsTrue` and 9 times out of 10 I cringe when I see it. Why? Those 9 times they have performed some kind of equality test and by doing so are making it difficult to determine what a failure is when it happens and more importantly you've introduced logic into your assertion so you've stopped asserting against values and started asserting against an operation.

Take the above test and what happens when the equality is false? Well obviously the test has failed but all your test runner will be able to tell you is just that, the equality is false. Is this because the number of results is less than 1? Greater than 1? How many are we out by? What is the actual value?

**All of this information is lost by the equality statement!**

Here's a tip, use `Assert.AreEqual`! Every testing framework I've worked with has this method, or something that is pretty much that. Then you can write this:

```csharp
	public void SomeTest()
	{
		var foo = new Bar();

		var result = foo.GetStuff();

		Assert.AreEqual(1, result.Count());
	}
```

Now when your test fails the runner will tell you something along the lines of `Expected 1 but got 0`. This makes it much easier to work out what's wrong and fix your test.

_That said_ if you're asserting against a Boolean property/result/etc then by all means use `Assert.IsTrue` or `Assert.IsFalse` (don't `Assert.IsTrue(!somethingFalse)`, that's just stupid).

**TL;DR - Don't use `Assert.IsTrue` when there are specialised assertion methods to do it for you, they'll give you better feedback when a test fails.**

&lt;/rant&gt;