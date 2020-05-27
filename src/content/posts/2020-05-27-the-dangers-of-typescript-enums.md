+++
title = "The Dangers of TypeScript Enums"
date = 2020-05-27T16:45:20+10:00
description = "A few tips on how to use enums in TypeScript, and some gotcha's to watch out for"
draft = false
tags = ["javascript", "typescript", "web-dev"]
+++

TypeScript introduces a lot of new language features that are common in statically type languages, such as [classes](https://www.typescriptlang.org/docs/handbook/classes.html) (which are now part of the JavaScript language), [interfaces](https://www.typescriptlang.org/docs/handbook/interfaces.html), [generics](https://www.typescriptlang.org/docs/handbook/generics.html) and [union types](https://www.typescriptlang.org/docs/handbook/advanced-types.html#union-types) to name a few.

But there’s one special type that we want to discuss today and that is [enums](https://www.typescriptlang.org/docs/handbook/enums.html). Enum, short for Enumerated Type, is a common language feature of many statically types languages such as C, C#, Java, Swift any many others, is a group of named constant values that you can use within your code.

Let’s create an enum in TypeScript to represent the days of the week:

```typescript
enum DayOfWeek {
    Sunday,
    Monday,
    Tuesday,
    Wednesday,
    Thursday,
    Friday,
    Saturday
}
```

The enum is denoted using the enum keyword followed by the name of the enum (DayOfWeek) and then we define the constant values that we want to make available for the enum.

We could then create a function to determine if it’s the weekend and have the argument that enum:

```typescript
function isItTheWeekend(day: DayOfWeek) {
    switch (day) {
        case DayOfWeek.Sunday:
        case DayOfWeek.Saturday:
            return true;

        default:
            return false;
    }
}
```

And finally call it like so:

```js
console.log(isItTheWeekend(DayOfWeek.Monday)); // logs 'false'
```

This is a nice way to remove the use of magic values within a codebase since we have a type-safe representation options that are all related together.
But things may not always be as they seem, what do you think you get if you pass this through the TypeScript compiler?

```js
console.log(isItTheWeekend(2)); // is this valid?
```

It might surprise you to know that this is **valid TypeScript** and the compiler will happily take it for you.

## Why Did This Happen

Writing this code may make you think that you’ve uncovered a bug in the TypeScript type system but it turns out that this is intended behaviour for _this type of enum_. What we’ve done here is created a **numeric enum**, and if we look at the generated JavaScript it might be a bit clearer:

```typescript
var DayOfWeek;
(function(DayOfWeek) {
    DayOfWeek[(DayOfWeek["Sunday"] = 0)] = "Sunday";
    DayOfWeek[(DayOfWeek["Monday"] = 1)] = "Monday";
    DayOfWeek[(DayOfWeek["Tuesday"] = 2)] = "Tuesday";
    DayOfWeek[(DayOfWeek["Wednesday"] = 3)] = "Wednesday";
    DayOfWeek[(DayOfWeek["Thursday"] = 4)] = "Thursday";
    DayOfWeek[(DayOfWeek["Friday"] = 5)] = "Friday";
    DayOfWeek[(DayOfWeek["Saturday"] = 6)] = "Saturday";
})(DayOfWeek || (DayOfWeek = {}));
```

And if we output it to the console:

![Console output in JavaScript](/images/typescript-enums/001.png)

We’ll notice that the enum is really just a JavaScript object with properties under the hood, it has the named properties we defined and they are assigned a number representing the position in the enum that they exist (Sunday being 0, Saturday being 6), but the object also has number keys with a string value representing the named constant.

So, therefore we can pass in numbers to a function that expects an enum, the enum itself is both a number and a defined constant.

## When This Is Useful

You might be thinking to yourself that this doesn’t seem particularly useful as it really breaks the whole type safe aspect of TypeScript if you can pass in an arbitrary number to a function expecting an enum, so why is it useful?

Let’s say you have a service which returns a JSON payload when called and you want to model a property of that service as an enum value. In your database you may have this value stored as a number but by defining it as a TypeScript enum we can cast it properly:

```typescript
const day: DayOfWeek = 3;
```

This explicit cast that’s being done during assignment will turn the day variable from a number to our enum, meaning that we can get a bit more of an understanding of what it represents when it’s being passed around our codebase.

## Controlling an Enums Number

Since an enum’s member’s number is defined based on the order in which they appear in the enum definition it can be a little opaque as to what the value will be until you inspect the generated code, but that’s something we can control:

```typescript
enum FileState {
    Read = 1,
    Write = 2
}
```

Here’s a new enum that models the state a file could be in, it could be in read or write mode and we’ve explicitly defined the value that corresponds with that mode (I’ve just made up these values, but it could be something coming from our file system).

Now it is clear what values are valid for this enum as we’ve done that explicitly.

## Bit Flags

But there’s another reason that this can be useful, and that’s using enums for bit flags. Let’s take our `FileState` enum from above and add a new state for the file, `ReadWrite`:

```typescript
enum FileState {
    Read = 1,
    Write = 2,
    ReadWrite = 3
}
```

Then assuming we have a function that takes the enum we can write code such as this:

```typescript
const file = await getFile("/path/to/file", FileState.Read | FileState.Write);
```

Notice how we’re using the `|` operator on the `FileState` enum and this allows us to perform a bitwise operation on them to create a new enum value, in this case it’ll create 3, which is the value of the ReadWrite state. In fact, we can write this in a clearer way:

```typescript
enum FileState {
    Read = 1,
    Write = 2,
    ReadWrite = Read | Write
}
```

Now the ReadWrite member isn’t a hand-coded constant, it’s clear that it’s made up as a bitwise operation of other members of the enum.

We do have to be careful with using enums this way though, take the following enum:

```typescript
enum Foo {
    A = 1,
    B = 2,
    C = 3,
    D = 4,
    E = 5
}
```

If we were to receive the enum value `E` (or 5), is that the result of a bitwise operation of `Foo.A | Foo.D or Foo.B | Foo.C?` So, if there’s an expectation that we are using bitwise enums like this we want to ensure that it will be really obvious how we arrived at that value.

## Controlling Indexes

We’ve seen that an enum will have a numeric value assigned to it by default or we can explicitly do it on all of them, but we can also do it on a subset of them:

```typescript
enum DayOfWeek {
    Sunday,
    Monday,
    Tuesday,
    Wednesday = 10,
    Thursday,
    Friday,
    Saturday
}
```

Here we’ve specified that the value of 10 will represent Wednesday, but everything else will be left “as is”, so what does that generate in JavaScript?

```typescript
var DayOfWeek;
(function(DayOfWeek) {
    DayOfWeek[(DayOfWeek["Sunday"] = 0)] = "Sunday";
    DayOfWeek[(DayOfWeek["Monday"] = 1)] = "Monday";
    DayOfWeek[(DayOfWeek["Tuesday"] = 2)] = "Tuesday";
    DayOfWeek[(DayOfWeek["Wednesday"] = 10)] = "Wednesday";
    DayOfWeek[(DayOfWeek["Thursday"] = 11)] = "Thursday";
    DayOfWeek[(DayOfWeek["Friday"] = 12)] = "Friday";
    DayOfWeek[(DayOfWeek["Saturday"] = 13)] = "Saturday";
})(DayOfWeek || (DayOfWeek = {}));
```

Initially, the values are defined using their position in the index with Sunday through Tuesday being 0 to 2, then when we “reset” the order at Wednesday everything after that is incremented from the new starting position.

This can become problematic if we were to do something like this:

```typescript
enum DayOfWeek {
    Sunday,
    Monday,
    Tuesday,
    Wednesday = 10,
    Thursday = 2,
    Friday,
    Saturday
}
```

We’ve made Thursday 2, so what does our generated JavaScript look like?

```typescript
var DayOfWeek;
(function(DayOfWeek) {
    DayOfWeek[(DayOfWeek["Sunday"] = 0)] = "Sunday";
    DayOfWeek[(DayOfWeek["Monday"] = 1)] = "Monday";
    DayOfWeek[(DayOfWeek["Tuesday"] = 2)] = "Tuesday";
    DayOfWeek[(DayOfWeek["Wednesday"] = 10)] = "Wednesday";
    DayOfWeek[(DayOfWeek["Thursday"] = 2)] = "Thursday";
    DayOfWeek[(DayOfWeek["Friday"] = 3)] = "Friday";
    DayOfWeek[(DayOfWeek["Saturday"] = 4)] = "Saturday";
})(DayOfWeek || (DayOfWeek = {}));
```

Uh oh, looks like there might be an issue, 2 is both **Tuesday** and **Thursday**! If this was a value coming from a data source of some sort, we have some ambiguity in our application. So, if we are going to be setting value it’s better to set all of the values so that it is obvious what they are.

## Non-Numeric Enums

So far, we’ve only discussed enums that are numeric or explicitly assigning numbers to enum values, but an enum doesn’t have to be a number value, it can be anything constant or computed value:

```typescript
enum DayOfWeek {
    Sunday = "Sun",
    Monday = "Mon",
    Tuesday = "Tues",
    Wednesday = "Wed",
    Thursday = "Thurs",
    Friday = "Fri",
    Saturday = "Sat"
}
```

Here we’ve made a string enum, and the generated code is a lot different:

```typescript
var DayOfWeek;
(function(DayOfWeek) {
    DayOfWeek["Sunday"] = "Sun";
    DayOfWeek["Monday"] = "Mon";
    DayOfWeek["Tuesday"] = "Tues";
    DayOfWeek["Wednesday"] = "Wed";
    DayOfWeek["Thursday"] = "Thurs";
    DayOfWeek["Friday"] = "Fri";
    DayOfWeek["Saturday"] = "Sat";
})(DayOfWeek || (DayOfWeek = {}));
```

Now we’ll no longer be able to pass in a number to the `isItTheWeekend` function, since the enum is not numeric, but we also can’t pass in an arbitrary string, since the enum knows what string values are valid.

This does introduce another issue though; we can no longer do this:

```typescript
const day: DayOfWeek = "Mon";
```

The string isn't directly assignable to the enum type, instead we have to do an explicit cast:

```typescript
const day = "Mon" as DayOfWeek;
```

And this can have an impact on how we consume values that are to be used as an enum.

But why stop at strings? In fact, we can mix and match the values of enums within an enum itself:

```typescript
enum Confusing {
    A,
    B = 1,
    C = 1 << 8,
    D = 1 + 2,
    E = "Hello World".length
}
```

Provided that all assignable values are of the same type (numeric in this case) we can generate those numbers in a bunch of different ways, including computed values, but if they are all constants, we can mix types to make a heterogeneous enum:

```typescript
enum MoreConfusion {
    A,
    B = 2,
    C = "C"
}
```

This is quite confusing and can make it difficult to understand how the data works behind the enum, so it’s recommended that you don’t use heterogeneous enums unless you’re really sure it’s what you need.

## Conclusion

Enums in TypeScript are a very useful addition to the JavaScript language when used properly. They can help make it clear the intent of normally “magic values” (strings or numbers) that may exist in an application and give a type safe view of them. But like any tool in one’s toolbox if they are used incorrectly it can become unclear what they represent and how they are to be used.

_Disclaimer: this blog post was originally written for [LogRocket](https://blog.logrocket.com/why-typescript-enums-suck/)._
