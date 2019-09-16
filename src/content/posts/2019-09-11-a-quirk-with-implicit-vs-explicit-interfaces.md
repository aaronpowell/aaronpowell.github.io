+++
title = "A Quirk With Implicit vs Explicit Interfaces"
date = 2019-09-11T13:08:28+10:00
description = "Here's something I learnt about interfaces in .NET while exploring IL"
draft = false
tags = ["dotnet", "csharp", "fsharp", "serverless"]
series = "learning-il"
series_title = "A Quirk With Implicit vs Explicit Interfaces"
+++

The other day I got to work and the first thing I did was open an [IL](https://docs.microsoft.com/en-us/dotnet/standard/glossary?{{<cda>}}#il) [disassembler](https://docs.microsoft.com/en-us/dotnet/framework/tools/ildasm-exe-il-disassembler?{{<cda>}}) and got to town reading the IL of some code I was having a problem with.

That's a pretty normal start to most .NET developers day right? Right...?

[<img src="/images/nope.gif" alt="Nope" height="200" />](https://giphy.com/gifs/Adpodcast-peterson-conner-connersmodernlife-cZ6FrYaMhnITWZZCzy)

It all came about as I'm doing some exploration of [Durable Entities](https://docs.microsoft.com/en-gb/azure/azure-functions/durable/durable-functions-preview?{{<cda>}}#entity-functions) which is part of the [Durable Functions v2 preview](https://azure.microsoft.com/en-us/blog/advancing-the-developer-experience-for-serverless-apps-with-azure-functions/?{{<cda>}}) that was announced at Build. I was using the new strongly-typed support that appeared in the beta-2 release, and allows you to write entities like this:

```csharp
public interface ICounter
{
    void Add(int count);
    void Clear();
}

[JsonObject(MemberSerialization = MemberSerialization.OptIn)]
public class Counter : ICounter
{
    [JsonProperty]
    public int Count { get; set; }

    public void Add(int count) => Count += count;
    public void Clear() => Entity.Current.DestructOnExit();

    [FunctionName(nameof(Counter))]
    public Task Run([EntityTrigger] IDurableEntityContext ctx) => ctx.DispatchAsync<Counter>();
}
```

And then we can invoke it in a strongly-typed manner, rather than using magic strings:

```csharp
// ctx is IDurableEntityContext
await ctx.SignalEntityAsync<ICounter>(id, proxy => proxy.Add(1));
```

This gives some nice type-safety to the way that you work with your entities.

Naturally though, I wasn't writing this in C#, I was using F#, which means the code looks more like this:

```fsharp
type ICounter =
    abstract member Add: int -> unit
    abstract member Clear: unit -> unit

[<JsonObject(MemberSerialization = MemberSerialization.OptIn)>]
type Counter() =
    [<JsonProperty>]
    member val Count = 0 with get, set

    interface ICounter with
        member this.Add count =
            this.Count <- this.Count + count

        member this.Clear() =
            this.Count <- 0

    [<FunctionName("Counter")>]
    member __.Run([<EntityTrigger>] ctx : IDurableEntityContext) =
        ctx.DispatchAsync<Counter>()
```

And the invocation is:

```fsharp
do! ctx.SignalEntityAsync<ICounter>(id, (proxy : ICounter) => proxy.Add(1)) |> Async.AwaitTask
```

But it kept throwing a highly cryptic error within the Durable Functions framework that the call to the method `Add` failed, but it wouldn't tell me why. After a bunch of debugging into the source of Durable Functions I found the cause of the failure, the `Add` method wasn't being found on the `Counter` instance. But the C# code worked just fine, so what gives?

Well it turns out that in F# when you implement an interface it's [implemented **explicitly**](https://docs.microsoft.com/en-us/dotnet/fsharp/language-reference/interfaces?{{<cda>}}#calling-interface-methods), whereas in C# you can implement an interface [implicitly](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/interfaces/?{{<cda>}}) _or_ [explicitly](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/interfaces/explicit-interface-implementation?{{<cda>}}).

## Interface Implementations, Implicit vs Explicit

Before really understanding the problem we need to understand a bit about how interface implementations work. Let's do it in C# since it supports both types and we'll start with an **implicit** implementation. This is what you're most likely using when you're working with interfaces, and it looks like this:

```csharp
interface IFoo {
    void Bar();
}

class Foo : IFoo {
    public void Bar() { }
}
```

When you do an implicit interface implementation you are adding `public` non-static methods to the class, and they **have** to be `public` non-static (see [here](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/interfaces/?{{<cda>}})). What this means is that the class can be thought of as itself (`Foo`) or its interface(s) (`IFoo`) and the members provided by that interface are part of the class, they are implicitly there.

Ok, so what's an explicit interface implementation look like?

```csharp
interface IFoo {
    void Bar();
}

class Foo : IFoo {
    void IFoo.Bar() { }
}
```

The difference this time is that in our `class` we have a non-`public` `Bar` function that is prefixed with the interface name (`IFoo`). Since the member is non-`public` we have to be **explicit** that the type is the interface if we want to access the members that are provided by the interface. In the [docs](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/interfaces/explicit-interface-implementation?{{<cda>}}) there are a few scenarios of why you'd want to use explicit interface implementations over implicit, and it mainly comes down to how to handle multiple interfaces on a single type.

Since F# _only_ supports explicit interface implementations you only think of types as their interface, which is how I tend to think of types-implementing-interfaces in C# anyway, so what's the big deal?

## Not All IL is Generated the Same

Back to the problem that I'd discovered, it was telling me that the type I was providing, `Counter`, didn't have a member `Add` that could be accessed, and now that we understand how the members of an explicit interface are defined, that actually makes sense, there is no member `Add` on `Counter`, its name is actually `ICounter.Add`, because it's only part of the interface implementation.

Here's the IL generated:

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
}
```

Compare that to the implicit interface implementation:

```
.method public final hidebysig newslot virtual
    instance void Add (
        int32 count
    ) cil managed
{
    .maxstack 8

    IL_0000: ldarg.0
    IL_0001: ldarg.0
    IL_0002: call instance int32 UserQuery/Counter2::get_Count()
    IL_0007: ldarg.1
    IL_0008: add
    IL_0009: call instance void UserQuery/Counter2::set_Count(int32)
    IL_000e: nop
    IL_000f: ret
}
```

Notice the difference between `.method` definitions, our explicit is `private` while implicit is `public` and the name of the explicit is `UserQuery.ICounter.Add` (`Namespace.InterfaceName.MemberName`) compared to `Add` for implicit.

## Why Does It Matter?

Ok, it's all very interesting learning about the differences in the IL generated by the compiler, but why is this important to know?

Well, it turns out that you need to understand this difference if you're doing [Reflection](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/reflection?{{<cda>}}). Let's say you have a type and you want to get a method of that type by its name. To do that you'd write code like this:

```csharp
var method = typeof(T).GetMethod(
    methodName,
    BindingFlags.IgnoreCase |
    BindingFlags.Public |
    BindingFlags.NonPublic |
    BindingFlags.Instance
);
```

But this will fail if the method name you're looking for is provided by an explicitly implemented interface!

Try out this code on [try.dot.net](https://try.dot.net):

```csharp
using System;
using System.Linq;
using System.Reflection;

public class Program
{
  public static void Main()
  {
    Console.WriteLine(string.Join(", ", typeof(FooE).GetMethods(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance).Select(m => m.Name)));
    Console.WriteLine(string.Join(", ", typeof(FooI).GetMethods(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance).Select(m => m.Name)));
  }
}

interface IFoo
{
    void Bar();
}

class FooE : IFoo
{
    void IFoo.Bar() => Console.WriteLine("Explicit Bar");
}

class FooI : IFoo
{
    public void Bar() => Console.WriteLine("Implicit Bar");
}
```

The output will be:

```plaintext
IFoo.Bar, Equals, Finalize, GetHashCode, GetType, MemberwiseClone, ToString
Bar, Equals, Finalize, GetHashCode, GetType, MemberwiseClone, ToString
```

Meaning that our call to `GetMethod` and just providing `Bar` will return `null` since this is no method on that type with that name!

## Conclusion

This was a really fun problem to try and solve, it's been a long time since I dived deep into .NET internals and it's quite interesting to learn the difference in the way interface implementations are handled.

There's [an open bug](https://github.com/Azure/azure-functions-durable-extension/issues/928) on Durable Functions to work out a way to resolve this and it turned out that I caught a few people with this one!
