+++
title = "What is an OpCode?"
date = 2019-09-17T09:17:10+10:00
description = "IL is full of these things call OpCodes, but what are they?"
draft = false
tags = ["dotnet"]
series = "learning-il"
series_title = "What is an OpCode?"
+++

In [my last post]({{< ref "/posts/2019-09-11-a-quirk-with-implicit-vs-explicit-interfaces.md" >}}) we say the differences between interface implementations in the IL that is generated, but as a refresher, it looks like this:

```
.method private final hidebysig newslot virtual
    instance void UserQuery.ICounter.Add (
        int32 count
    ) cil managed
{
    .override method instance void UserQuery/ICounter::Add(int32)
    .maxstack 8

    IL_0000: ldarg.0
    IL_0001: ldarg.0
    IL_0002: call instance int32 UserQuery/Counter::get_Count()
    IL_0007: ldarg.1
    IL_0008: add
    IL_0009: call instance void UserQuery/Counter::set_Count(int32)
    IL_000e: nop
    IL_000f: ret
```

And the code that created it looked like this:

```csharp
interface ICounter {
    void Add(int count);
}

class Counter : ICounter {
    public int Count { get; set }

    public void Add(int count) => Count += count;
}
```

Today, I want to talk about what the heck that all means, specifically, what makes up the method body, and to do that I want to introduce you to the `System.Reflection.Emit` namespace and specifically the [`OpCodes`](https://docs.microsoft.com/en-us/dotnet/api/system.reflection.emit.opcodes?view=netframework-4.8&{{<cda>}}) class.

## Before We Dive In

There's a bit of important background information to understand before we dive too deep into what we're going to look at today, and that's how .NET works. .NET languages like C#, F# and VB.NET (as well as others) all output the Common Intermediate Language (CIL) (sometimes referred to as Microsoft Intermediate Language/MSIL) that is then executed by a runtime such as the Common Language Runtime (CLR) using a Just-In-Time (JIT) compiler to create the native code that is executed.

So, regardless of whether you're writing C# or F# it's all the same at the end of the day and you can convert F# code to C# by reversing the CIL, but it's probably going to be rather funky. This is how tools like [ilspy](https://ilspy.net/) work.

The CIL is defined as part of the Common Language Infrastructure (CLI) which is standardised as [ECMA-335](http://www.ecma-international.org/publications/standards/Ecma-335.htm) with the primary implementation being the one Microsoft has done for .NET, but there's nothing stopping someone else making their own implementation (except time...). Before anyone asks, no, I haven't read ECMA-335. I did use to have it on my kindle but I never did read it. [ECMA-262](https://www.ecma-international.org/publications/standards/Ecma-262.htm) on the other hand... 😉

CIL is a stack-based bytecode, making it quite low-level and reminds me a lot of the x86 assembly programming I did at university, so if that's your jam, then we're in for some fun! If you've never had the, err, _pleasure_ of working with assembly, or stack-based machines, the most important thing to know is that you push things onto a stack so that you can read them off again, and you have to read things off in the reverse order that you pushed them on, last-on-last-off style.

Now, onto the fun part!

## OpCodes

An OpCode represents an _operation_ in CIL that can be executed by the CLR. These are mostly about working with the stack, but thankfully it's not all `PUSH` and `POP`, we get some higher-level operations to work with, and even basic indexers that we can leverage too (so it's not quite as sequential as 8086 that I learnt).

## Our First OpCode

Let's start with this line:

```
IL_0000: ldarg.0
```

First things first, we can remove the stuff before the `:`, as that is representing the label of the line, which we could use as a jump point, but we don't need the labels at the moment so we'll focus on the instruction:

```
ldarg.0
```

In .NET this is represented as [`OpCodes.Ldarg_0`](https://docs.microsoft.com/en-us/dotnet/api/system.reflection.emit.opcodes.ldarg_0?view=netcore-2.2&{{<cda>}}) and its role is to push the first argument (of the current method) onto the stack. There's also `ldarg.1`, `ldarg.2` and `ldarg.3` to access the first 4 arguments to a method, with `ldarg.s <int>` being used to access all the rest. In the future, we'll see how to use `ldarg.s`, it's not for today.

So if we're calling our code like this:

```csharp
counter.Add(1);
```

Inside the `Add` CIL we're pushing `1` into the first position on the stack.

## Calling Functions in CIL

The next important piece of CIL to look at is this:

```
call instance int32 UserQuery/Counter::get_Count()
```

This is a method call using the [`Call`](https://docs.microsoft.com/en-us/dotnet/api/system.reflection.emit.opcodes.call?view=netcore-2.2&{{<cda>}}) OpCode. To use this OpCode we need to provide some more information, the location of the method we're calling, the return type and finally the method reference.

But wait, what method are we calling? We're calling `Counter.get_Count()`, but we never wrote that in our C# code, it was generated for us as the property accessor. This method just wraps the backing field (which was also generated for us as we used an [auto-property](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/auto-implemented-properties?{{<cda>}})).

Since the method is part of the type we're also part of we use the `instance` location and it'll return an `int32`. And since this is a non-`void` method call we need to push the return value onto the stack, which is done using [`ldarg.1`, or in .NET `Ldarg_1`](https://docs.microsoft.com/en-us/dotnet/api/system.reflection.emit.opcodes.ldarg_1?view=netcore-2.2&{{<cda>}}).

## Adding Numbers

With `ldarg.1` done we now have two values on the stack, the argument to `Add` is at index 0 and the current value of `Count` is at index 1. This means we can add those numbers together, which is what the `+` operator does, resulting in the following IL:

```
add
```

Bet you didn't pick that's what the [`Add`](https://docs.microsoft.com/en-us/dotnet/api/system.reflection.emit.opcodes.add?view=netcore-2.2&{{<cda>}}) OpCode did!

This CIL instruction will also put the resulting value onto the stack, so there's no need to use an `ldarg` OpCode after it.

## Updating Our Property

It's time to update the `Count` property of our object and again we'll use the `Call` OpCode to do it:

```
call instance void UserQuery/Counter::set_Count(int32)
```

As we need to pass an argument to `set_Count` (the auto-generated assignment function) you might wonder how it gets that, well it gets it off the stack. When a function takes arguments it'll pop off as many as it requires from the stack to execute, so you need to make sure that when you're pushing data onto the stack it's pushed on in the right order, otherwise you can end up with type mismatch, or the wrong value being in the wrong argument.

Finally, `Add` will exit using the [`Ret`](https://docs.microsoft.com/en-us/dotnet/api/system.reflection.emit.opcodes.ret?view=netcore-2.2&{{<cda>}}) OpCode:

```
nop
ret
```

I'm not sure why the [`nop`](https://docs.microsoft.com/en-us/dotnet/api/system.reflection.emit.opcodes.nop?view=netcore-2.2&{{<cda>}}) OpCode is included by the compiler, it doesn't do anything and thus can be omitted.

## Conclusion

Hopefully you're still with me and have enjoyed dipping your toe into understanding what an OpCode is in CIL. We've broken down the 8 lines of CIL that were generated for this one line of C#:

```csharp
Count += count;
```

With our method implementation we used the [expression body syntax](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/methods?{{<cda>}}#expression-body-definitions) rather than a traditional [method signature](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/methods?{{<cda>}}#method-signatures).

What you may be interested to know is that there is no difference in the IL generated for these two method types, since they are functionally equivalent.

The same goes for the use of `Count += count` vs `Count = Count + count`, both generate the same CIL as there's no difference with the [addition assignment operator](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/operators/addition-operator?{{<cda>}}#addition-assignment-operator-) (in our example, there are scenarios when that doesn't always hold true).

It's important to be able to understand these differences or lack-there-of, so we don't make arbitrary code style decisions based on preconceived beliefs about how the code is executed.

We'll keep exploring CIL as we go on, so if there's anything specific you'd like to look into, let me know and we can do some digging!
