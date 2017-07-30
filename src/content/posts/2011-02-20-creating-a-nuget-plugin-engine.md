---
  title: "Creating a NuGet-based plugin engine"
  metaTitle: "Creating a NuGet-based plugin engine"
  description: "How to create a plugin engine using NuGet as the distribution format"
  revised: "2011-02-21"
  date: "2011-02-20"
  tags: 
    - "nuget"
    - "umbraco"
    - "funnelweb"
  migrated: "true"
  urls: 
    - "/creating-a-nuget-plugin-engine"
  summary: ""
---
Two of the main Open Source projects I work on have extensibility aspects to them, [Umbraco][1] and [FunnelWeb][2].

We're a bit early in the development cycle for Umbraco 5 to be diving into the packaging, but FunnelWeb is more at a point where we can dive into this. So it got me thinking about how we'd go about creating a simple way that developers can share plugins or themes they've created?

Umbraco 4.x runs a decent package engine, but it's custom developed, running a custom server, and a bunch of other stuff. For a smallish Open Source project like FunnelWeb this is a large investment which we're rather avoid. Also with Umbraco 5 we're looking at whether the custom developed way is the best was to go or not, as again there is time and money that needs to be invested for it too.

My next thought was [NuGet][3], it's all the rage at the moment (rightly so), so I was wondering if we can't just used it as our source?

Unsurprisingly I'm not the first person to look at this, it's powering Orchard's gallery, but I couldn't find any decent documentation on how to use it. So after cracking open the Orchard source, doing some investigation it seems to be working. In the rest of this article I'll cover a very basic way to do it.

# What you'll need

There's two things you need:

* A server
* A consumer

There's a server available as part of the NuGet source code, or alternatively you can install the [NuGet package for NuGet.Server][4] ;).

Once you've installed the NuGet.Server package (I'm going to assume that you've done that) drop in your own NuGet packages into the `/Packages` folder and you're ready to go. If you want to test this add it to Visual Studio and you can test it via `http://<your url>/nuget/Packages`. Woot, one part down, now for the tricky part.

# Consuming a NuGet feed yourself

Let's build a little console app which will view our packages, first off you need to add a reference to [NuGet.Core][5] and then we can start coding. 

The first thing you need is a repository which you're going to work against:

        var repo =
            PackageRepositoryFactory.Default.CreateRepository(
                new PackageSource("http://nuget.local/nuget/Packages", "Default"));

It's easiest to just use the default repository, unless you're doing something *truely* scary, and for the `PackageSource` we're providing a source which is the URL of the OData feed which our packages sit behind (you can give a file system path if you're using that and it still works).

From the repository you can:

* List the packages
* Add a new package
* Remove a package

(The last two I'm assuming are for the feature that's being toted for NuGet 1.2 which allows you to [push new packages from the NuGet console][6])

There's a number of Extension Methods that are also available which make it easier find packages, so you can do something like this:

    var package = repo.FindPackage("My-Awesome-Package");

Next thing we want to do is install a package, and for this you need a `PackageManager`:

	var packageManager = new PackageManager(
		repo,
		new DefaultPackagePathResolver("http://nuget.local/nuget/Packages"),
		new PhysicalFileSystem(Environment.CurrentDirectory + @"\Packages")
	);

For this we need to provide the following:

* The repository to install from
* A package path resolver
  * This takes the same path as the repository
* A folder to install the packages into
  * This could be your `/bin` if it's a web app, or anything else you want

The `PackageManager` is what we use to integrate with our local application, and it's responsible for the install and uninstall process:

    packageManager.Install(package, false);

For this we're providing:

* The package to install (you can also provide the ID of the package)
* Whether or not you want dependencies resolved (`false` tells it to ignore dependencies)

It's just that simple. And to uninstall it's equally as simple:

    packageManager.Uninstall(package);

Again for this you just need to provide the package instance (or ID) of the package to uninstall.

# Conclusion

As you can see from only a few lines of code you can create your own consumer of NuGet feeds:

    class Program
    {
        static void Main(string[] args)
        {
            var repo =
                PackageRepositoryFactory.Default.CreateRepository(
                    new PackageSource("http://nuget.local/nuget/Packages", "Default"));

            var packageManager = new PackageManager(
                repo,
                new DefaultPackagePathResolver("http://nuget.local/nuget/Packages"),
                new PhysicalFileSystem(Environment.CurrentDirectory + @"\Packages")
                );

            var package = repo.FindPackage("My-Awesome-Package");

            packageManager.InstallPackage(package, false);

            Console.WriteLine("Installed!");
            Console.Read();

            packageManager.UninstallPackage(package);

            Console.WriteLine("Uninstalled!");
            Console.Read();
        }
    }

So keep an eye on FunnelWeb as we work on using this to produce a theme and plugin engine.

And who knows, this may also be the way we do the packager which will ship in Umbraco 5.


  [1]: http://umbraco.codeplex.com
  [2]: http://www.funnelweblog.com
  [3]: http://nuget.codeplex.com
  [4]: http://nuget.org/Packages/Packages/Details/NuGet-Server-1-2-2210-35
  [5]: http://nuget.org/Packages/Packages/Details/NuGet-Core-1-1-229-159
  [6]: http://www.youtube.com/user/davidebbo2#p/a/u/0/RxdUqw_PXII