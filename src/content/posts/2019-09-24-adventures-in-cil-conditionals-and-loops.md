+++
title = "Adventures in IL: Conditionals and Loops"
date = 2019-09-24T09:33:46+10:00
description = "It's time to take another look at CIL, how do conditionals and loops work?"
draft = false
tags = ["dotnet", "csharp", "fsharp"]
series = "learning-il"
series_title = "Conditionals and Loops"
+++

Last time we explored IL (well, CIL, but most people know it as just IL) we were introduced to [OpCodes and their meaning]({{<ref "/posts/2019-09-17-what-is-an-opcode.md">}}) by going through a really simple method. Today, I want to look at two common statements we use in programming, conditional statements (`if` and `switch`) and loops (`for`, `foreach`, etc.). We'll also look at something that we skipped from the last post, the difference between `Debug` and `Release` builds (well, building with or without compiler optimisations).

## If Statements

Let's take the following F# function:

```fsharp
let ifStatement a =
    if a = 1 then
        Console.WriteLine "one"
    else
        Console.WriteLine "not one"
```

_I'm using `Console.WriteLine` rather than the [F# `Core.Printf` module](https://msdn.microsoft.com/visualfsharpdocs/conceptual/core.printf-module-%5bfsharp%5d?{{<cda>}}) and `printfn` as it makes less verbose code. Normally in F# I'd use `printfn` though._

This will generate the following IL:

```plaintext
IL_0000: ldarg.0
IL_0001: ldc.i4.1
IL_0002: bne.un.s IL_0006

IL_0004: br.s IL_0008

IL_0006: br.s IL_0013

IL_0008: ldstr "one"
IL_000d: call void [mscorlib]System.Console::WriteLine(string)
IL_0012: ret

IL_0013: ldstr "not one"
IL_0018: call void [mscorlib]System.Console::WriteLine(string)
IL_001d: ret
```

There are a few OpCodes which are familiar but we're also meeting a some new ones. The first two in our output are responsible for loading the value of the argument (`a` in our code) onto the stack and then pushing the `int32` value `1` onto the stack. Now we're getting to a new OpCode and we're also going to need to understand a bit more about the piece that is to the _left_ of the `:` (that we ignored last time), which is called the **instruction prefix**.

An instruction in IL can be made up of two pieces of information in the format of `prefix: instruction`. Let's take the following line:

```plaintext
IL_0002: bne.un.s IL_0006
```

Here we have a prefix of `IL_0002` and the instruction for that line is `bne.un.s IL_0006` which is define [here](https://docs.microsoft.com/en-us/dotnet/api/system.reflection.emit.opcodes.bne_un_s?view=netcore-2.2&{{<cda>}}). To quote the documentation for the instruction for `bne.un.s`:

> Transfers control to a target instruction (short form) when two unsigned integer values or unordered float values are not equal.

That's interesting, it's a _not equal_ operation whereas our code was `if a = 1 then`, so the IL represents the _inverse_ of what our code represented. To understand why we need to look at the rest of the instruction, and the rest of the IL, since there's another bit of information passed to `bne.un.s`, `IL_0006`, which represents the target instruction to transfer control to. Effectively what this says is "if the two values don't match the next line to execute is `IL_0006`".

Here's where that sits in the IL:

```plaintext
IL_0004: br.s IL_0008

IL_0006: br.s IL_0013
```

You'll notice that `IL_0006` is _after_ `IL_0004`, so we're skipping `IL_0004`, essentially using a [`goto` statement](https://en.wikipedia.org/wiki/Goto)!

_Just an aside, F# doesn't have a `goto` statement, [C# does](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/goto?{{<cda>}})!_

Both `IL_0004` and `IL_0006` use [`br.s`](https://docs.microsoft.com/en-us/dotnet/api/system.reflection.emit.opcodes.br_s?view=netcore-2.2&{{<cda>}}) which **again** transfers control to another instruction:

```plaintext
IL_0008: ldstr "one"
IL_000d: call void [mscorlib]System.Console::WriteLine(string)
IL_0012: ret

IL_0013: ldstr "not one"
IL_0018: call void [mscorlib]System.Console::WriteLine(string)
IL_001d: ret
```

Both of these blocks are pretty similar, `IL_0008` is the start of the _truthy_ branch of our `if` statement, loading a string onto the stack then calling `Console.WriteLine` before issuing a `ret` to end the method. `IL_0013` is the _falsey_ branch and using the control transfer we skip over the truthy block.

So if we break it down, an `if` statement is a series of GOTO calls to jump over blocks we don't want to execute.

### If Statements in `C#`

Out of curiosity, I decided to create the same example in C#:

```csharp
public void IfStatements(int a)
{
    if (a == 1)
    {
        Console.WriteLine("One");
    }
    else
    {
        Console.WriteLine("Not One");
    }
}
```

And what I found is that it generates different IL!

```plaintext
IL_0000: nop
IL_0001: ldarg.1
IL_0002: ldc.i4.1
IL_0003: ceq
IL_0005: stloc.0
IL_0006: ldloc.0
IL_0007: brfalse.s IL_0018

IL_0009: nop
IL_000a: ldstr "One"
IL_000f: call void [mscorlib]System.Console::WriteLine(string)
IL_0014: nop
IL_0015: nop
IL_0016: br.s IL_0025

IL_0018: nop
IL_0019: ldstr "Not One"
IL_001e: call void [mscorlib]System.Console::WriteLine(string)
IL_0023: nop
IL_0024: nop

IL_0025: ret
```

What's interesting here is that in the C# version it uses [`ceq`](https://docs.microsoft.com/en-us/dotnet/api/system.reflection.emit.opcodes.ceq?view=netcore-2.2&{{<cda>}}) and combines it with [`brfalse.s`](https://docs.microsoft.com/en-us/dotnet/api/system.reflection.emit.opcodes.brfalse_s?view=netcore-2.2&{{<cda>}}). `ceq` does an equality test on two values and if they are equal it pushes `1` onto the stack, otherwise `0`, and then `brfalse.s` transfers control to an instruction, `IL_0018` in our case, if the value on the stack is false, `null` or 0.

You'll also notice the use of [`br.s`](https://docs.microsoft.com/en-us/dotnet/api/system.reflection.emit.opcodes.br_s?view=netcore-2.2&{{<cda>}}) when the _truthy_ block finishes skipping over the _falsey_ block and land on `ret`, whereas F# just inlined the `ret`.

This makes the C# version a little more verbose than the F# version when achieving the same thing.

### Debug vs Release

Both of the above examples are compiled using "Debug mode", so there are no compiler optimisations enabled. But that's not what you're going to deploy to production (right? RIGHT!) so again I was interested to see the differences there. Here's the F# one compiled with optimisations:

```plaintext
IL_0000: ldarg.0
IL_0001: ldc.i4.1
IL_0002: bne.un.s IL_000f

IL_0004: ldstr "one"
IL_0009: call void [mscorlib]System.Console::WriteLine(string)
IL_000e: ret

IL_000f: ldstr "not one"
IL_0014: call void [mscorlib]System.Console::WriteLine(string)
IL_0019: ret
```

And here's C#:

```plaintext
IL_0000: ldarg.1
IL_0001: ldc.i4.1
IL_0002: bne.un.s IL_000f

IL_0004: ldstr "One"
IL_0009: call void [mscorlib]System.Console::WriteLine(string)
IL_000e: ret

IL_000f: ldstr "Not One"
IL_0014: call void [mscorlib]System.Console::WriteLine(string)
IL_0019: ret
```

Well, they look very similar don't they, in fact, they are identical (I had to check a few times that yes, I was copying different ones!). They both resemble the unoptimised F# output, but with the minor difference of a few less `br.s` instructions around the place.

## For Loops

When it comes to loops I tend to use the `for` loop most commonly, so we'll use that for our exploration today. Starting with a simple F# function:

```fsharp
let forLoop() =
    for i in 0 .. 99 do
        Console.WriteLine i
```

Which results in the following IL:

```plaintext
IL_0000: ldc.i4.0
IL_0001: stloc.0
IL_0002: br.s IL_000e
// loop start (head: IL_000e)
    IL_0004: ldloc.0
    IL_0005: call void [mscorlib]System.Console::WriteLine(int32)
    IL_000a: ldloc.0
    IL_000b: ldc.i4.1
    IL_000c: add
    IL_000d: stloc.0

    IL_000e: ldloc.0
    IL_000f: ldc.i4.1
    IL_0010: ldc.i4.s 99
    IL_0012: add
    IL_0013: blt.s IL_0004
// end loop

IL_0015: ret
```

I've left some indentations and comments that IL Spy generated for me to help visualise the IL a bit better.

We start by pushing the initial value of `i` onto the stack with `ldc.i4.0` and then ensure the stack is at the right location with `stloc.0` before using `br.s` to move down to `IL_000e`. This is the start of our equality test to ensure that we're still in the loop range:

```plaintext
    IL_000e: ldloc.0
    IL_000f: ldc.i4.1
    IL_0010: ldc.i4.s 99
    IL_0012: add
    IL_0013: blt.s IL_0004
```

Location 0 is loaded on the stack (which is our `i` value) then the values of `1` and `99` are pushed onto the stack with `ldc.i4.1` and `ldc.i4.s` respectively (`ldc.i4.1` is shorthand for `ldc.i4.s 1`, and likely optimised by your runtime) before `add` is called which pushes the value of `100` onto the stack. Finally [`blt.s`](https://docs.microsoft.com/en-us/dotnet/api/system.reflection.emit.opcodes.blt_s?view=netcore-2.2&{{<cda>}}) is called and if the value in stack position `0` is less than the result of `add` we'll transfer control higher up in the instruction list, specifically to `IL_0004`. Now we've ended up with this block:

```plaintext
    IL_0004: ldloc.0
    IL_0005: call void [mscorlib]System.Console::WriteLine(int32)
    IL_000a: ldloc.0
    IL_000b: ldc.i4.1
    IL_000c: add
    IL_000d: stloc.0
```

We grab the value from stack position `0`, hand it to `Console.WriteLine`, get it again, add `1` to it and fall through to `IL_000e` since there's no control transfer.

I find this order quite interesting, the output IL is in reverse order to what I expected it to be, the conditional test is at the **end** of the instruction list, but upon dissection it makes a lot of sense. If the conditional test was at the top you'd always have to use a `br.s` to transfer control back up to the top when the loop body finishes and then have a control transfer test (a `brtrue.s`) if the range was exceeded. This would be inefficient as you'd always execute a control transfer and then have a second _potental_ control transfer, whereas having it in reverse you only have 1 control transfer and it's conditional.

### For Loops in `C#`

Again we'll look at a C# implementation:

```csharp
public void ForLoop()
{
    for (var i = 0; i < 100; i++)
    {
        Console.WriteLine(i);
    }
}
```

Resulting in the following IL:

```plaintext
IL_0000: nop
IL_0001: ldc.i4.0
IL_0002: stloc.0
IL_0003: br.s IL_0012
// loop start (head: IL_0012)
    IL_0005: nop
    IL_0006: ldloc.0
    IL_0007: call void [mscorlib]System.Console::WriteLine(int32)
    IL_000c: nop
    IL_000d: nop
    IL_000e: ldloc.0
    IL_000f: ldc.i4.1
    IL_0010: add
    IL_0011: stloc.0

    IL_0012: ldloc.0
    IL_0013: ldc.i4.s 100
    IL_0015: clt
    IL_0017: stloc.1
    IL_0018: ldloc.1
    IL_0019: brtrue.s IL_0005
// end loop

IL_001b: ret
```

It's pretty similar to the F# version (ignoring the `nop` instructions) except how the equality test is done. In our F# version, like with the `if` statement, the equality test was combined with the control transfer using `blt.s` whereas C# uses [`clt`](https://docs.microsoft.com/en-us/dotnet/api/system.reflection.emit.opcodes.clt?view=netcore-2.2&{{<cda>}}) and `brtrue.s` to compare the values and then transfer control.

The other major difference is that the C# version loads 100 onto the stack for the `clt` test but F# pushes 1 and 99, then adds them together, meaning it's equality test is more akin to `i < 1 + 99` rather than C#'s `i < 100`.

### Debug vs Release

It's time to compare what happens when we enable compiler optimisations, starting with F#:

```plaintext
IL_0000: ldc.i4.0
IL_0001: stloc.0
IL_0002: br.s IL_000e
// loop start (head: IL_000e)
    IL_0004: ldloc.0
    IL_0005: call void [mscorlib]System.Console::WriteLine(int32)
    IL_000a: ldloc.0
    IL_000b: ldc.i4.1
    IL_000c: add
    IL_000d: stloc.0

    IL_000e: ldloc.0
    IL_000f: ldc.i4.s 100
    IL_0011: blt.s IL_0004
// end loop

IL_0013: ret
```

And now C#:

```plaintext
IL_0000: ldc.i4.0
IL_0001: stloc.0
IL_0002: br.s IL_000e
// loop start (head: IL_000e)
    IL_0004: ldloc.0
    IL_0005: call void [mscorlib]System.Console::WriteLine(int32)
    IL_000a: ldloc.0
    IL_000b: ldc.i4.1
    IL_000c: add
    IL_000d: stloc.0

    IL_000e: ldloc.0
    IL_000f: ldc.i4.s 100
    IL_0011: blt.s IL_0004
// end loop

IL_0013: ret
```

This time we've got identical IL (F# even uses 100 rather than doing an addition!), good to know, but also interesting to see just how different the output can be when you enable compiler optimisations.

## Conclusion

Now we've seen some of the nity gritty parts of IL and that everything is just a GOTO statement at the end of the day! 🤣

Understanding how control is transfered around within our IL helps us understand how the compiler makes optimisations and why we should write code in a particular way.

I'll leave you with the output of a `switch` statement, see if you can work out the C# that it was generated from:

```plaintext
IL_0000: ldarg.1
IL_0001: ldc.i4.1
IL_0002: beq.s IL_000a

IL_0004: ldarg.1
IL_0005: ldc.i4.2
IL_0006: beq.s IL_0015

IL_0008: br.s IL_0021

IL_000a: ldstr "One"
IL_000f: call void [mscorlib]System.Console::WriteLine(string)
IL_0014: ret

IL_0015: ldstr "Two"
IL_001a: call void [mscorlib]System.Console::WriteLine(string)
IL_001f: br.s IL_000a

IL_0021: ldstr "Default"
IL_0026: call void [mscorlib]System.Console::WriteLine(string)
IL_002b: ret
```

Good luck!
