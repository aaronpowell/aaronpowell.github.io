---
  title: "Versioning Xamarin Android apps"
  date: "2014-09-26"
  tags: 
    - "xamarin"
  description: "When creating Xamarin apps from a CI process like TeamCity it can be useful to generate the version accordingly."
---

I'm currently working on a Xamarin application with an Android target. We have setup a CI environment using [TeamCity as Xamarin describes](http://developer.xamarin.com/guides/cross-platform/ci/teamcity/) but what we wanted to do was create an app version accordingly so when we push a CI build you know there's an update and which build it is from.

So I decided to do some investigation into how Android applications are versioned and what I found is:

* There is an AndroidManifest.xml
* This has a `versionName` attribute in the XML which represents the application version
* There is a `versionCode` attribute in the XML which represents an interal application code

Sweet, XML is pretty easy to modify, now how can we modify it so that when we run MSBuild over the Android csproj file?

Conveniently [Jason Stangroome](https://twitter.com/jstangroome) had previously given me a MSBuild task for updating the `AssemblyInfo` with a version number that you provide. Well I'm not needing to update the `AssemblyInfo`, instead I want to update the `AndroidManifest`, so I just modified the code to instead of writing a `*.cs` file to manipulate XML, using C#.

Next challenge - I didn't want to override the `AndroidManifest.xml` as that has a problem of file locking (I'm opening it to read the XML so it's locked) and anyway I don't want to update it as it'd be useful to see the new file if/when I need in the build output. So that begs the question, how do I get the Xamarin _transpiler_ to understand that there is a different `AndroidManifest.xml` I want it to use?

Well, if you poke into the Android project's csproj file you'll come across this:

    <AndroidManifest>Properties\AndroidManifest.xml</AndroidManifest>

Right, so now I have two choices, I can either update that file path or provide a replacement `AndroidManifest` property in MSBuild. It turns out that the latter was just as easy as the Xamarin Android engine really only cares about the last `AndroidManifest` that it finds.

Finally there's the question of "when the do I run my MSBuild task?" and that was a bit tricky to work out. For that I needed to have a look when the `AndroidManifest` is loaded up so I can run before that target runs. A bit of MSBuild verbose logging later I narrowed it down to `_ValidateAndroidPackageProperties`, which loads up the manifest, parses it for validity and continues on. With this knowledge we can add a `BeforeTargets="_ValidateAndroidPackageProperties"` to our target and we're done.

# Conclusion

With a bit of XML manipulation it's pretty easy to customise the application version of a Xamarin Android application. I've created a [NuGet package](https://www.nuget.org/packages/Readify.Xamarin.MSBuild.Android/) if anyone would like to use it, just:

    PM> Install-Package Readify.Xamarin.MSBuild.Android

And pass in the argument:

    msbuild MyAndroidApp.csproj /t:SignAndroidPackage /p:AppVersion=1.0.0.1