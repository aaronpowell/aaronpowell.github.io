---
  title: "Walking a JavaScript object"
  description: "Ever had a path to a path to a property on a JavaScript object that you want to walk? Something along the lines of `foo.bar.baz`.\n\nRecently I was trying to solve this problem and came across a nifty little trick"
  tags: 
    - "javascript"
  date: "2013-06-21"
---

Recently I was trying to solve a problem where I had a JSON path to a property on an object, the path was going to be `n` layers deep and the object itself was also `n` layers deep. I needed to solve this problem in a fairly generic manner, as there was a number of different scenarios under which this could would be run.

Basically I had this:

	var path = 'foo.bar.baz';

And an object like this:

	var obj = {
		foo: {
			bar: {
				baz: 42
			}
		}
	};

So from the `path` I want to be able to find out the value in the object that matches it.

# Pass #1

A colleague of mine gave me the code which would do this, from an application they had, implemented using a for loop:

	var value = obj;
	var paths = path.split('.');
	for (var i = 0; i < paths.length; i++) {
		value = value[paths[i]];
	}

	console.log(value);

Well that does exactly what needs to be done, exactly as advertised. Job done right?

# Pass #2

The for loop is so old school, these days it's all functional programming that the kids are into these days so I looked at our method and decided there had to be another way which we could approach this, something a bit more functional.

Since what we're doing it walking through an object I wondered "Could I use something from the `map`/`reduce`/`filter` family for that?". Well it turns out that **yes** there is something ideal for that, `reduce`.

You see the `reduce` method takes a callback like this:

	function (prev, current) {
		//return what is to be the next 'prev' value
	}

So as long as the `prev` is an instance of `obj` then we can walk it, and doing that is fine as we can provide an argument to the `reduce` method that defines what the initial value will be. This means we can rewrite our walker like so:

	var value = path.split('.').reduce(function (prev, curr) { 
		return prev[curr];
	}, obj);

And there we have it, a nice little object walker.