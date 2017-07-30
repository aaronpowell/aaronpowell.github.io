---
  title: "NHaml Umbraco MacroEngine"
  metaTitle: "NHaml Umbraco MacroEngine"
  description: "How to implement a fully functional custom Umbraco MacroEngine using NHaml language"
  revised: "2010-12-29"
  date: "2010-12-28"
  tags: 
    - "umbraco"
  migrated: "true"
  urls: 
    - "/nhaml-umbraco-macroengine"
  summary: ""
---
In a [previous post][1] I introduced the new `IMacroEngine` interface coming as part of Umbraco Juno (4.6) which will make it possible to create your own Macro Engines. In this article I'll look at what is required to create a custom Macro Engine which is actually useful.

## Implementing a Haml-based macro engine

I'm quite a fan of [Haml][2], it's a good abstraction on top of HTML (well, XML really) and it's quite popular if you're doing Ruby work (it's really popular in the Ruby community). 

A Haml file would look something like this:

	.content
		this is the text content of a page
		a{:href => "http://aaron-powell.com"} My Website
		
And generates a snippet like this:
	
	<div class="content">
		this is the text content of a page <a href="http://aaron-powell.com">My Website</a>
	</div>

There's a .NET port of Haml, [NHaml][3], so let's have a look at how we can implement a macro engine which allows us to use Haml as an Umbraco macro engine.

I've started by grabbing the latest version of NHaml from their website, a copy of Umbraco Juno and fired up Visual Studio. I created a new .NET class library and added the following references:

 * NHaml
 * cms
 * interfaces
 * businesslogic
 
Next I created my Macro Engine:

    public class NHamlMacroEngine : IMacroEngine
    {
        public NHamlMacroEngine()
        {
            SupportedExtensions = new List<string>
                                      {
                                          "nhaml",
                                          "haml"
                                      };
        }
        public bool Validate(string code, INode currentPage, out string errorMessage)
        {
            throw new NotImplementedException();
        }

        public string Execute(MacroModel macro, INode currentPage)
        {
            throw new NotImplemented Exception
        }

        public string Name { get { return "Haml Macro Engine"; } }
        public List<string> SupportedExtensions { get; private set; }
        public Dictionary<string, IMacroGuiRendering> SupportedProperties
        {
            get
            {
                throw new NotImplementedException();
            }
        }
	}
	
With my macro engine I'm going to support files with a **haml** and **nhaml** extension (so existing templates can be used) and it's specified in the constructor (you can set this as the return of the property but I don't see the need to create the List each time the property is accessed ;)).

### Implementing macro execution

The crux of what we have to build for a Macro Engine is in the `Execute` method. This method is nicely providing us with the macro itself and the current page (which all current macro engines provide to users), so how do we go about it?

Now we're going to delve into NHaml and what is actually required to execute our file.

The heavy lifting for most of our work will be done via the `TemplateEngine` class from NHaml, but I'm going to have a bit of a wrapper:

    public class NHamlTemplateEngine : ITemplateContentProvider
	{
        public IList<string> PathSources { get; set; }
        public IViewSource GetViewSource(string templateName)
		{
			throw new NotImplementedException();
		}
        public IViewSource GetViewSource(string templatePath, IList<IViewSource> parentViewSourceList)
		{
			throw new NotImplementedException();
		}
        public void AddPathSource(string pathSource)
		{
			throw new NotImplementedException();
		}
	}
	
I'm going to ignore a lot of what this class does (partially cuz I couldn't be bothered working out what it does :P), instead I'll just be implementing the `GetViewSource` method:

	public IViewSource GetViewSource(string templateName)
	{
		return new FileViewSource(new FileInfo(templateName));
	}

What we're doing here is returning the standard OOTB IViewSource implementation, it'll read the Haml file in from the file system and perform its black magic.

There's currently no way which we can get the single string result back from the template to be used with the macro, so let's work on that.

First I'm going to be adding a new method to the `NHamlTemplateEngine` which will return a string from our template to give back to the macro engine:

	public string Render(MacroModel macro, INode node)
	{
		var templateEngine = new TemplateEngine();
		templateEngine.Options.TemplateContentProvider = this;
		CompiledTemplate res = templateEngine.Compile(IOHelper.MapPath(SystemDirectories.Python + "/" + macro.ScriptName));
		
		using (var output = new StringWriter())
		{
			var instance = res.CreateInstance();
			instance.Render(output);
			return output.ToString();
		}
	}

Now we'll finish off our `IMacroEngine` implementation by implementing the `Execute` method:

	public string Execute(MacroModel macro, INode currentPage)
	{
		var engine = new NHamlTemplateEngine();
		var output = engine.Render(macro, currentPage);
		return output;
	}

Compile, drop the assembling into a Juno install and create a sample little Macro:

	%p
	  some content here
	  
Add the macro to a page and booyeah, we are running our own template engine. You can now write Haml and output it within Umbraco.

## Extending our implementation

Ok, so we've done our implementation, but it's a bit limited, there's two things which we aren't really handling:

 * How do I access the currentPage in the macro?
 * Can I use the new inline macro feature?
 
### Supporting inline macros

This is a rather easy feature to support, the `MacroModel` which has been passed in has a property which we can access that, this comes through the `ScriptCode` property of the macro.

But wait, we're passing in the phyisical template to NHaml, what are we going to do about that? Well I decided to do it a funky little way, we'll actually generate the file(s) as needed for our inline macros:

	public string Render(MacroModel macro, INode node)
	{
		var templateEngine = new TemplateEngine();
		templateEngine.Options.TemplateContentProvider = this;
		CompiledTemplate res;
		if (string.IsNullOrEmpty(macro.ScriptCode))
		{
			res = templateEngine.Compile(IOHelper.MapPath(SystemDirectories.Python + "/" + macro.ScriptName));
		}
		else
		{
			var hash = GetMd5Hash(macro.ScriptCode);
			var path = IOHelper.MapPath(SystemDirectories.Data + "/" + hash + ".haml");
			if (!File.Exists(path))
			{
				using (var writer = new StreamWriter(path))
				{
					writer.Write(macro.ScriptCode);
				}
			}
			res = templateEngine.Compile(path);
		}
		using (var output = new StringWriter())
		{
			var instance = res.CreateInstance();
			instance.Render(output);
			return output.ToString();
		}
	}

This is adding basic caching into the templates, so it generates a MD5 hash from the code to use as a filename, if it exists in the 'data' folder (ie - App_Data) it'll be used, otherwise a new file is created from it. Now we've got a real file which we can pass into the NHaml engine.

That's it, now we've got support for:

	<umbraco:Macro runat="server" Language="haml">
	.class
	  woo, content!
	</umbraco:Macro>

### Supporting currentPage

Next on the check list of what our NHaml macro engine requires is the ability to access the `currentPage` object, and this is a bit trickier. Because Haml is just a markup layer it doesn't know anything about Umbraco, nor does it know anything about the data that exists. For this we've got to create our own `Template` class which NHaml will use when executing the Haml file.

First off I'm going to do some refactoring to move the NHaml template engine creation into the constructor of our engine:

	private readonly TemplateEngine _templateEngine;

	internal NHamlTemplateEngine()
	{
		_templateEngine = new TemplateEngine();
		_templateEngine.Options.TemplateContentProvider = this;
		_templateEngine.Options.TemplateBaseType = typeof(NHamlTemplate);
	}

This is more of a .NET preference of mine to have stuff such as this to be done in the constructor of the object, what you'll notice is the new line:

	_templateEngine.Options.TemplateBaseType = typeof(NHamlTemplate);

This is for our new template class which will have the currentPage object on it:

	public class NHamlTemplate : Template
	{
		public INode currentPage { get; set; }
	}

It's a pretty simple class which we've implemented, and we've got a single property on there which we have to set, easy, we just have to update the `Render` method:

	using (var output = new StringWriter())
	{
		var instance = (NHamlTemplate)res.CreateInstance();
		instance.currentPage = node;
		instance.Render(output);

		return output.ToString();
	}

When we create an instance of our template from the file we can cast it to the custom template class and then assign the property to the actual node for the current page.

Now we can create a template like this:

	.content
	  #{currentPage.GetProperty("bodyText").Value}
	
But if you run this we've got an error, NHaml doesn't know what the `INode` object is! We need to pass in the assembly to the NHaml engine, so let's update the constructor:

	internal NHamlTemplateEngine()
	{
		_templateEngine = new TemplateEngine();
		_templateEngine.Options.AddReference(typeof(INode).Assembly);
		_templateEngine.Options.TemplateContentProvider = this;
		_templateEngine.Options.TemplateBaseType = typeof(NHamlTemplate);
	}

## Conclusion

So there we go, we've got a custom macro engine which runs NHaml and allow you to work against Umbraco data. 

I've also [pushed the code up to bitbucket][4] too so you can grab a copy of it if you want to see it working.


  [1]: /custom-umbraco-macro-engines
  [2]: http://haml-lang.com
  [3]: http://code.google.com/p/nhaml/
  [4]: http://hg.slace.biz/nhaml-umbraco-macroengine