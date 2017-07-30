---
  title: "Functions that yield multiple times"
  date: "2014-01-13"
  tags: 
    - "javascript"
    - "es6"
  description: "Generator functions in ES6 don't have to just do a single `yield`, they can `yield` multiple times, but when doing so how do you execute those functions?"
---

I [recently introduced you to JavaScript generators](/posts/2013-12-31-linq-in-javascript-for-real.html) which I think are a really interesting feature that we should look at for the future of JavaScript. In that blog post I was talking about [LINQ in JavaScript](https://github.com/aaronpowell/linq-in-javascript) and kind of glanced over an important part of generators, and that's how you use them _if you're not using a `for-of` loop_. While generators make a lot of sense in the scope of managing datasets that isn't their only usage, in reality generators are quite useful if you want to lazily execute *any* function.

# Eager functions

Before we dive into lazy functions let's talk about eager functions. What do I mean when I say something is an eager function? Let's take the following function:

    var ticTacToe = function (size) {
        console.log('Shall we begin?');
        var blank = '-';
        var board = [
        ];
        for (var width = 0; width < size; width++) {
            board[width] = [
            ];
            for (var height = 0; height < size; height++) {
                board[width][height] = blank;
            }
        }
        var area = size * size;
        var findMove = function () {
            var base = Math.trunc(area / 10);
            var move = Math.trunc(Math.random() * (base + 1) * 10);
            return move;
        };
        var playMove = function (player) {
            var move = findMove();
            while (move > area - 1) {
                move = findMove();
            }
            var row = Math.trunc(move / size);
            var segment = board[row];
            move = move - (row * size);
            if (segment[move] === blank) {
                segment[move] = player;
            } else {
                return playMove(player);
            }
        };
        var printBoard = function () {
            var boardLayout = board.reduce(function (str, segment) {
                return str + segment.join(' ') + '\n';
            }, '\n');
            console.log(boardLayout);
        };
        var players = 'XO';
        for (var i = 0; i < area; i++) {
            playMove(players[i % players.length]);
        }
        console.log('Game over');
        printBoard();
        var rowWinner = board.filter(function (row) {
            var first = row[0];
            for (var i = 1; i < row.length; i++) {
                if (row[i] !== first) {
                    return false;
                }
            }
            return true;
        });
        if (rowWinner.length) {
            console.log('The row winner was...', rowWinner[0][0]);
        }
    };

Ok so what we've got here is a very crappy automated tic-tac-toe game, it just randomly places the `X` and `O` on the board (of what ever size you want) and occasionally someone wins (but generally not). While how this code works is not particularly interesting (and to be honest I've just whipped it up quickly while on an international flight, so it's not my **best** code!) what it represents **is** interesting, it represents something happening that _could_ be time consuming, but more importantly it's something that you kind of want to watch unfold. If you run this code the game is immediately completed because this is an eager function, it executes, you wait for it do be done and only then can you see what's happened; there's no way to _pause_ the game at a particular point and see it in action. Alternatively if we took the code a bit further and added a simple AI to it each move would take subsequently longer than the last one to play as the program works out where would be the best place to play its move.

Now that'd be less than ideal, it might seem like our game has frozen, and as soon as a user believes that we've really shot ourselves in the foot.

This is the problem of eager functions, we start them and we have to wait for them to finish, even if we are concerned they are taking too long. There are JavaScript design patterns you can leverage to get around this, splitting a function up over `setTimeout` or `requestAnimationFrame`, but these can be hard to implement as your function has to know what is/isn't acceptable for its execution duration.

# Lazy functions

So hopefully you've got a bit of an idea what an eager function is, if you run the above code you'll see it can take a while, especially when you make the board size large (so far no game as been won at 20x20, and it kept having recursion errors above that). What'd be nice is if we could pause the game at any point and see what the board looks like, but the function doesn't know to stop, it just keeps executing line after line until there's no more lines of code to execute.

Well this is where a generator function comes in. Let's start really simple:

    var fn = function* () {
        console.log('start');
        yield console.log('doing');
        console.log('done');
    };

So what do you think would happen when you run that function?

    fn();

Well nothing happened, we got no console messages logged out. Ok, that's not true something **did**, we created a new iterator instance from our function because [generators are iterators](http://wiki.ecmascript.org/doku.php?id=harmony:generators). So to actually do something we need to capture the iterator:

    let iterator = fn();

Right so still nothing _observable_ has happened and that's because we haven't moved through our iterator. To do that we call the `next` method on it:

    iterator.next();

Now we'll see this in our output:

    "start"
    "doing"

Notice that we've output `start` and `doing` but not `done`. Here's were we have gotten to making a lazy function and our function has run as far as we've told it to run. There might be more to the function, we've just put it on hold. If we were to call `next` again we'd have the final `console.log` statement executed and the function would complete as there's no more yielding to be done.

## Knowing your iterator is done

It's all well and good in our example up there to know that we need to call `next()` twice because we know the make-up of the function, but what if we didn't? How would you know when you stop calling `next()`?

Conveniently the `next()` method will tell you that, it returns an object like so:

    {
        value: value|undefined,
        done: true|false
    }

By looking at the `done` property of this object we can work out whether there are any more _steps_ to be executed. In fact this is what the `for-of` loop does, in fact `for-of` can be decomposed to look like this:

    var x;
    while (!(x = it.next()).done) {
    }

You might be thinking "well wouldn't you just use the `for-of` loop then?" and that's a good question, the `for-of` loop nicely takes care of stepping over each `yield` and executing them.

## Controlling yielded values

Not every instance of using `yield` will be for the purpose of yielding statements, sometimes you might want to yield a value. Here's a slightly updated version of our function from above:

    var fn = function* () {
        console.log('start');
        yield console.log('doing');
        let x = yield 1;
        console.log('done', x);
    };

Alright, so a `for-of` loop can walk that for us right:

    for (var x of fn()) {
        //do nothing
    }

Outputs:

    "start"
    "doing"
    "done" undefined

Oh, that's not right, why is the value of `x` `undefined`? Well to understand that you need to understand how we yield values, this is part of the returned object from calling `next()`, so let's do this:

    console.log(it.next());
    console.log(it.next());
    console.log(it.next());

Now our output looks like:

    "start"
    "doing"
    {value: undefined, done: false}
    {value: 1, done: false}
    "done" undefined
    {value: undefined, done: true}

Ahh, notice the `value: 1` in there, you probably want to do something with that.

What you want to do with it is pass it as the first argument to the `next()` method call for you see `next` takes an argument with is the result of the `yield`.

Let's do this:

    it.next();
    it.next();
    it.next(42);

We now get:

    "start"
    "doing"
    "done" 42

Wait... but we said `let x = yield 1` not `let x = yield 42`, so why did it use the `42` we passed as an argument rather than the value we actually yielded? Well it turns out that yield doesn't work that way, what yield does is:

* Provides the yielded value to the iterator
* Takes the argument provided to `next` and passes that through to the assignment (or in the case of no assignment it'll just ignore it)

So this gives us the power to manipulate the iterator at any yielded point from the outside, we can set up new values at yielded points, or stop processing the iterator if a particular value is yielded. This is also why `for-of` doesn't work, it will call `next` but not provide any arguments so you can't yield values for assignment inside of a `for-of` loop.

# Making our game lazy

So what points during our game do you think we'd want to pause? Maybe when the board has been created (hey, you could make that something to manipulate!) and after each move, that all seems reasonable. Here's our updated game:

    var ticTacToe = function* (size) {
        console.log('Shall we begin?');
        var blank = '-';
        var board = [
        ];
        for (var width = 0; width < size; width++) {
            board[width] = [
            ];
            for (var height = 0; height < size; height++) {
                board[width][height] = blank;
            }
        }
        yield board;
        var area = size * size;
        var findMove = function () {
            var base = Math.trunc(area / 10);
            var move = Math.trunc(Math.random() * (base + 1) * 10);
            return move;
        };
        var playMove = function (player) {
            var move = findMove();
            while (move > area - 1) {
                move = findMove();
            }
            var row = Math.trunc(move / size);
            var segment = board[row];
            move = move - (row * size);
            if (segment[move] === blank) {
                segment[move] = player;
            } else {
                return playMove(player);
            }
            return [board, move, move + (row * size), segment];
        };
        var printBoard = function () {
            var boardLayout = board.reduce(function (str, segment) {
                return str + segment.join(' ') + '\n';
            }, '\n');
            console.log(boardLayout);
        };
        var players = 'XO';
        for (var i = 0; i < area; i++) {
            yield playMove(players[i % players.length]);
        }
        console.log('Game over');
        printBoard();
        var rowWinner = board.filter(function (row) {
            var first = row[0];
            for (var i = 1; i < row.length; i++) {
                if (row[i] !== first) {
                    return false;
                }
            }
            return true;
        });
        if (rowWinner.length) {
            console.log('The row winner was...', rowWinner[0][0]);
        }
    };

I'm not doing any assignment from the yielded values, you can play with that yourself, but we can now look at the state of the board after each move:

    var game  = ticTacToe(3);
    game.next();
    let [board] = game.next().value;
    console.log(board);

And there we go, we can see the state of the board as we are going along. _I'm also using [destructuring](http://wiki.ecmascript.org/doku.php?id=harmony:destructuring) to get the board out of the value, which is an array._

Now we can start placing bets on who is likely to win, with the odds getting smaller as the board fills up, by us calling `next()`. Although it'd be crappy odds to start with since the whole thing is based off a random number generator!

    var game  = ticTacToe(3);
    game.next();
    var done = false;

    setTimeout(function step() {
        let obj = game.next();
        done = obj.done;
        if (done) {
            return;
        }
        printBoard(obj.value[0]);
        console.info('place your bets');
        setTimeout(step, 5000);
    });

# Conclusion

Throughout this post we've seen how standard JavaScript functions can have some limitations when their logic is complex and time consuming (or dumb but time consuming). We then took a look at how to use generator functions to make a function lazy so we can step through it at a desired pace. We've then seen how to determine when an interator has completed and how we can manipulate the values which we are yielding. Finally we rewrote our initial function to be a generator function and we ran through it in a delayed fashion.