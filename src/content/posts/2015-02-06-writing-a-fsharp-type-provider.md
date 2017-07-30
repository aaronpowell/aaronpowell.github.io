---
  title: "Writing a F# Type Provider"
  date: "2015-02-06"
  tags: 
    - "f#"
    - "fsharp"
  description: "A walkthrough of how to create a F# Type Provider."
---

I was recently asked to give a talk at the [Sydney F# User Group](http://www.meetup.com/fsharpsydney/) about [how to write a Type Provider](https://www.youtube.com/watch?v=sNmKKTq7UCc) (and other things).

Now I'm fairly new to writing F# and even newer to writing Type Providers but having done code generation in the past using various .NET APIs (DSL's, CodeDom, T4) I'm well versed in the pain that is to be expected when doing code generation.

# What's a Type Provider?

If you haven't come across Type Providers before what they are is something that hooks into the F# compiler to generate types based on some pre-conditions. The most common usage is to generate data source information, such as [a SQL data context](http://fsprojects.github.io/SQLProvider/), [strongly typed CSV's](http://fsharp.github.io/FSharp.Data/library/CsvProvider.html) or [classes from JSON](http://fsharp.github.io/FSharp.Data/library/JsonProvider.html).

The primary advantage here is that it's done at the compiler level, types are generated then and those types are used in your codebase. If something changes in your data schema, say the properties of a JSON object change, you hit a compiler error rather than a runtime error, and that's pretty neat.

# Sounds cool, how do I get started?

When writing a Type Provider you can probably generate something without any external dependencies. Unfortunately that is a hell of a lot of code to write to build some of the stuff out, code that you're likely to get wrong or is just painful to write. If you look at any of the samples out there or existing Type Providers you'll see two files named something like `ProvidedTypes.fsi` and `ProvidedTypes.fs`. What these contains is some nice base classes for starting your implementations.

~~*Note: Presently I don't know exactly where you get them from, there seems to be no NuGet package or anything, instead what I will be doing for this walkthrough is copying them from the [F# Samples](http://fsharp3sample.codeplex.com/) project. If someone knows where you get the "master" copy from or a NuGet package to reference I'm all ears!*~~

*Edit: As has been pointed out in the comments there is a NuGet package which will include the appropriate base classes, [FSharp TypeProviders Starter Pack](http://www.nuget.org/packages/FSharp.TypeProviders.StarterPack/). I haven't updated the code below to work with it so there may be some minor differences.*

We'll start be creating a new F# library project then copy in our `ProvidedTypes.fs/fsi` files and deleting `Library1.fs`.

# File -> New -> Type Provider

For this walkthrough I'm going to create the super-simple Type Provider I demoed at the F# User Group. It's called `StringTypeProvider` so create a new F# file named that.

Let's also open a few namespaces so it looks like so:

```fsharp
namespace Samples.FSharp.StringTypeProvider

open System
open System.Reflection
open Samples.FSharp.ProvidedTypes
open Microsoft.FSharp.Core.CompilerServices
open Microsoft.FSharp.Quotations
```

*Note: `Samples.FSharp.ProvidedTypes` is the namespace for the stuff I got imported.*

Next we'll create our Type Provider type:

```fsharp
[<TypeProvider>]
type StringTypeProvider(config: TypeProviderConfig) as this =
    inherit TypeProviderForNamespaces()
```

*This is a compiler error for the moment but we'll get to that.*

We've done three things here:

1. Created a type that has an attribute of `TypeProvider`. This tells the F# compiler that this type is a Type Provider and to use it as such
2. Created a type that has a constructor argument of `TypeProviderConfig` which we then alias to `this` for us to use internally
3. Inherited from a type called `TypeProviderForNamespace` which takes the complexity of our type construction (which we'll get to later)

The final thing we need to do before we go about implementing our Type Provider is tell the F# compiler that this assembly has Type Providers in it, we do that with an assembly attribute, so put this in the `AssemblyInfo.cs` (or somewhere else):

```fsharp
[<assembly:TypeProviderAssembly>]
do()
```

So far our file looks like this:

```fsharp
namespace Samples.FSharp.StringTypeProvider

open System
open System.Reflection
open Samples.FSharp.ProvidedTypes
open Microsoft.FSharp.Core.CompilerServices
open Microsoft.FSharp.Quotations

[<TypeProvider>]
type StringTypeProvider(config: TypeProviderConfig) as this =
    inherit TypeProviderForNamespaces()

[<assembly:TypeProviderAssembly>]
do()
```

# Building the basics

There's a few basic things that you'll need to do for every Type Provider that you create, you need to:

* Create a namespace
* Create a type
* Add members to the type
* Add type to the namespace
* Add type to the assembly

For the namespace you can generate anything you want, you can get the namespace from the current assembly (ie - your project) but adding types to someone else's namespace is a bad idea, you might generate a type that clashes with something they too have created. Because of this you're better off creating your own namespace. Also we're going to need a reference to the assembly, let's set that up:

```fsharp
[<TypeProvider>]
type StringTypeProvider(config: TypeProviderConfig) as this =
    inherit TypeProviderForNamespaces()

    let namespace = "Samples.StringTypeProvider"
    let thisAssembly = Assembly.GetExecutingAssembly()
```

Now we'll create our type to "export" from the Type Provider and export it:

```fsharp
[<TypeProvider>]
type StringTypeProvider(config: TypeProviderConfig) as this =
    inherit TypeProviderForNamespaces()

    let namespace = "Samples.StringTypeProvider"
    let thisAssembly = Assembly.GetExecutingAssembly()

    let t = ProvidedTypeDefinition(thisAssembly, namespaceName, "StringTyped", Some typeof<obj>)

    do this.AddNamespace(namespace, [t])
```

The `let t = ...` line creates us a new type that will be exported by the namespace. I've named it `StringTyped` so when using the Type Provider we'd access it via `Samples.StringTypeProvider.StringTyped`. When creating a new Type Definition you need to specify the base type to inherit from, it's an Option type of `type` and can have anything as the base type. Generally speaking you'll want to use `obj` as the base type but really you could use anything you wanted as your base type. If you really want to generate a slimmed down type you can set the `HideObjectMethods` property to `false` to suppress the intellisense for members exposed off `System.Object`, members such as `ToString`.

Lastly we add the type and namespace to the type provider using the `AddNamespace` method.

# Passing arguments to our Type Provider

The way I want to use my Type Provider is like so:

```fsharp
type helloWorld = Samples.StringTypeProvider.StringTyped< @"Hello World!" >
```

For this to happen I need to specify that it will receive an argument. This is done by defining a static parameter:

```fsharp
let staticParams = [ProvidedStaticParameter("value", typeof<string>)]
```

I'm creating it as an array as I'll need an array later, but essentially what I'm doing is saying that there will be a static parameter provided, it will be a string and I want you to call it `value`.

Next up I need to handle what will happen when the Type Provider is invoked, I do this by defining static parameters on my `Type Definition` created above:

```fsharp
do t.DefineStaticParameters(
    parameters = staticParams,
    instantiationFunction = ...
)
```

There's two things we're providing here, the list of static parameters and an instantiation function. This instantiation function is what will be called by the Type Provider when the compiler comes across it, so it's where we want to generate our logic for actually building something up and it takes an F# function that receives the name of the type (ie - `StringTyped`) and then and `obj[]` of the parameters which were provided. This array will match to the parameters we define with the `parameters` property so in our case we expect a single parameter that is a `string`. I'm going to use a `match` to validate this:

```fsharp
do t.DefineStaticParameters(
    parameters = staticParams,
    instantiationFunction = (fun typeName paramValues ->
        match paramValues with
        | [| :? string as value |] ->
            ...

        | _ -> failwith "That wasn't supported!"
    )
)
```

So our primary match condition checks:

1) Is this an array
2) It has a single value
3) That value can be cast as a string, which I'll do and call `value` (this is important later on)

Finally from this `fun` we need to return a Type Definition so let's create that:

```fsharp
do t.DefineStaticParameters(
    parameters = staticParams,
    instantiationFunction = (fun typeName paramValues ->
        match paramValues with
        | [| :? string as value |] ->
            let ty = ProvidedTypeDefinition(
                            thisAssembly,
                            namespaceName,
                            typeName,
                            Some typeof<obj>
                        )
            ty

        | _ -> failwith "That wasn't supported!"
    )
)
```

This is basically the same as we used originally with the only difference being that I'm using the name passed in rather than a hard-coded name.

# Adding constructors

Now that I have created my Type to be instantiated it's time that I make it do something useful. To do that I'm going to create a constructor to it.

Thanks to our base class creating a constructor:

```fsharp
let ctor = ProvidedConstructor(
                parameters = [],
                InvokeCode = fun args -> <@@ value :> obj @@>
            )
```

Well that was easy wasn't it! I use the `ProvidedConstructor` method, define any parameters I want and finally give it the code that I want to run. The code is in the form of an [F# Quotation](https://msdn.microsoft.com/en-us/library/dd233212.aspx) which is that the `<@@ @@>` syntax is all about and I am saying that the available `value` (captured earlier) will be downcast to `obj`.

If you're curious this code, when used, compiles down to the following C#:

```csharp
var something = (object)"Hello World";
```

Where `something` was the name of our instance and `Hello World` the value we passed to it. Pretty cool huh!

# Generating intellisense

We're generating a type on the fly here so it stands to reason that documentation is going to be sparse. If your users are using Visual Studio it might be nice to give them some intellisense help to guide them onto your usage. Conveniently the API we're working with to build our Type Provider gives us such a facility:

```fsharp
ctor.AddXmlDoc "Initialise the awesomes"
```

And there you go, intellisense done! Now there are actually two others ways to generate intellisense, it can either be dalyed

```fsharp
ctor.AddXmlDocDelayed (fun () -> "Initializes a the awesomes")
```

Meaning that until the intellisense is requested the function won't be evaluated. This can be useful if you're generating your documentation based off some intensive process. Remember that a Type Provider is evaluated at compile time so if it's something expensive that you don't _have_ to do consider delaying it.

Your other option is to use a computed doc:

```fsharp
ctor.AddXmlDocComputed (fun () -> "Initializes a the awesomes")
```

While this looks similar to delayed the difference is that delayed docs are generated then cached while computed docs are generated evey single time.

Once you've setup your documentation the final step is to add your constructor to the type:

```fsharp
ty.AddMember ctor
```

# Properties

Now that we have a constructor let's add some properties to the type you're going to get.

```fsharp
let lengthProp = ProvidedProperty(
                    "Length",
                    typeof<int>,
                    GetterCode = fun args -> <@@ value.Length @@>
                )
ty.AddMember lengthProp
```

There we go, that's pretty easy isn't it! We have a few things that we're doing like giving the property a name, `Length`, giving it a type, `int` and then we can provide getters and setters using F# Quotations again. These functions can be as simple or as complex as you like. I'm doing something simple here but you could say, generate a setter that does validation by adding a more complex body.

I could even do something like bulk generate properties:

```fsharp
let charProps = value
                    |> Seq.map(fun c ->
                            let p = ProvidedProperty(
                                        c.ToString(),
                                        typeof<char>,
                                        GetterCode = fun args -> <@@ c @@>
                                    )
                            let doc = sprintf "The char %s" (c.ToString())
                            p.AddXmlDoc doc

                            p
                        )
                    |> Seq.toList
ty.AddMembersDelayed (fun () -> charProps)
```

You'll see here that you can add properties (well, any members) in a delayed fashion, again useful when you're generating them from a data source, like a SQL schema or REST end point.

There's a bunch of other properties on your properties that you can set, if you're after a static then set the `IsStatic` to `true` (default is `false`). Check out what you get from intellisense (or is defined in the fsi) for the full details of what you can do to a property.

# Methods

When generating a method it's similar to all the other members but with the difference, we get to create a method body. Here's a method we could make:

```fsharp
let reverser = ProvidedMethod(
                methodName = "Reverse",
                parameters = [],
                returnType = typeof<string>,
                InvokeCode = (fun args ->
                                <@@
                                value
                                    |> Seq.map (fun x -> x.ToString())
                                    |> Seq.toList
                                    |> List.rev
                                    |> List.reduce (fun acc el -> acc + el)
                                @@>))

ty.AddMember reverser
```

This takes our string and reverses it through a few pipeline steps. You can though make something as complex as you want, doing whatever you need it to do.

# Ready for consumption

There we have it, our Type Provider is ready for us to use. If you want to see the completed Type Provider [it can be found here](https://gist.github.com/aaronpowell/74c4bc0315c2e1b42b48).

Now it's worth talking about some gotchas and things to be mindful of.

## Member Names

Remember that F#'s member naming is a lot more relaxed than C#, you can use a lot more characters provided you escape them. That means the following code is valid:

```fsharp
type snowman = Samples.StringTypeProvider.StringTyped< @"☃" >

let doYouWantToBuildASnowman = snowman()

doYouWantToBuildASnowman.``☃``
```

Yep, that's a snowman property. Isn't unicode fun!

## Visual Studio locks the assembly

This is something that hits me all the time when I'm mucking with Type Providers, when you reference a Type Provider, either from a project or within the F# interactive. The problem here is that when you write some code, compile and then use it you've got your assembly locked. Now you can't change it until you restart Visual Studio. Yay...

## You're impacting compile time

Remember that a Type Provider is something that is evaluated at compile time by the F# compiler. The more complex the processing you do with your Type Provider the greater an impact you have on compile time. If you're worried about doing something too intense don't be afraid to leverage the delayed features, be it for documentation or member creation.

# Conclusion

There you have it folks, a walkthrough on how to create an F# Type Provider. Remember that there is a [video from F# Sydney](https://www.youtube.com/watch?v=sNmKKTq7UCc) that also covers this (and some other rambling on my part) and you can find the full code [as a gist](https://gist.github.com/aaronpowell/74c4bc0315c2e1b42b48).
