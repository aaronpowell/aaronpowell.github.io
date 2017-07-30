---
  title: "JavaScript call and apply"
  date: "2013-07-04"
  tags: 
    - "javascript"
  description: "After having confused one of my colleagues with some code that used the JavaScript `apply` method and giving them an answer that didn't leave them completely bemused I thought I'd share my explanation with the world."
---

A colleague recently came across this line in our codebase that I wrote:

    binding.vehicle.involvements.push.apply(binding.vehicle.involvements, vehicle.involvements);

What the overall result of the code is isn't particularly important, the part that tripped them up (and made them think I'm on drugs I'm not actually on) was this:

    binding.vehicle.involvements.push.apply(binding.vehicle.involvements, vehicle.involvements);

Now the  involvements property is an array in both scenarios which exposes a push method, the confusion was around what the apply method does and why I was even using it.

Both call and apply are methods which are part of the JavaScript language and are exposed on the Function prototype, meaning that they can be accessed from any function, so let's say we have this function:

    function foo (a) {
          console.log(this, a, argument);
    };

And we invoke it like this:

    foo('b');

It is the same as doing this:

    console.log(window, 'b', ['b']);

_Note: In ES3 it'll be window, ES5 strict mode it'll be null, or undefined, I forget which_

Now let's throw the apply method into the mix and invoke it like so:

    foo.apply('a', ['b']);

This time it'll be like we've done this:

    console.log('a', 'b', ['b']);

We could alternatively provide an array of arguments so:

    foo.apply('a', ['b','c']);

Becomes:

    console.log('a', 'b', ['b', 'c']);

So what happened?

The apply method takes two arguments, the first is what controls the this value, the second is an array of objects that will be decomposed to represent the various arguments passed in, meaning that the array item 0 will be the first argument, b in our example, and so on.

The call method is similar but instead of taking an array that represents the arguments it takes a splat, anything after the this context will be used directly as the arguments. So we'd use call like this to achieve the same result:

    foo.call('a', 'b', 'c');

## Relating it to our original code

Let's think about how this related back to our original code, working with arrays and push. Say I have an array and I want to add N number of values to said array. How would you do it?
    
    var arr = [1,2,3];
    var arr2 = [4,5,6];
    //I want arr == [1,2,3,4,5,6]

Well the first obvious candidate is a for loop:

    for (var i = 0; i < arr2.length; i++) {
          arr.push(arr2[i]);
    }

That'll do exactly what we're after, but there's a problem, we're calling push _a lot_, once for every item in the array in fact(!!). This can be a bit of a performance hit, especially if you have large arrays, the JavaScript runtime engine simply can't optimise it because it doesn't know how many there could be so it can't preallocate the memory, meaning it's somewhat inefficient.

Alternatively you could use the `concat` method:

    arr = arr.concat(arr2);

That works just fine but the problem is that you replace arr with a new instance of it. _Generally speaking_ that's not a problem, but if you're relying on the object itself to not change, at a memory level (say it's an observable property from Knockout, or a bound property in WinJS), you'll potentially run into problems.

So we're back to push, we want to append multiple items to an existing array without overriding the original object/property. The nice thing about push is that we can provide it N number of arguments which represent all the items we wish to push. Well since I've got an array I can't exactly pass that in directly, since then argument 1 will be the array, it won't be decomposed. And this is where apply comes in, we can provide the array as the 2nd argument to apply and have N number of items pushed to the array. This brings us to doing this:

    arr.push.apply(arr, arr2);

And there we have it, we've used apply to decompose an array and push all he values into the target array, basically we've done this:

    arr.push(4,5,6);

Since the this context we've set is the `arr` object itself.

Hopefully that does a good enough explanation to confuse everyone ;).
