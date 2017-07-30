---
  title: "Custom Umbraco Macro Engines"
  metaTitle: "custom-umbraco-macro-engines"
  description: "A quick look at the new abstraction layer on top of the Umbraco Macro Engine in Umbraco Juno"
  revised: "2011-01-13"
  date: "2010-12-27"
  tags: 
    - "umbraco"
  migrated: "true"
  urls: 
    - "/custom-umbraco-macro-engines"
  summary: ""
---
A new feature coming in Umbraco Juno (4.6) is something that is probably a bit surprising for most people that it has come in after so long, an abstracted macro engine.

What this means is that no longer is there just XSLT, .NET controls, IronRuby, IronPython and Razor, but you'll be able to write your own macro engine if you want.

In this article we'll look at how to create a new macro engine.

## Where do you start?

Like with a lot of extensibility points in Umbraco it's actually really quite simple to do what you need, and creating a custom macro engine is no exception, all you have to do is implement a single interface, `IMacroEngine` from within the `cms` assembly.

On this interface there are only three sections that you need to implement for most operations, the name of it, the extensions it supports and its execution method.

Here's a really basic macro engine:

	public class MyAwesomeMacroEngine : IMacroEngine
	{
        public bool Validate(string code, INode currentPage, out string errorMessage)
        {
            throw new NotImplementedException();
        }

		public string Execute(MacroModel macro, INode currentPage)
		{
			return "Go go awesome macro engine!";
		}
		
        public string Name { get { return "This is my awesome Macro Engine"; } }
        public List<string> SupportedExtensions 
		{ 
			get
			{
				return new List<string> {
					"awesome"
				};
			}
		}
        public Dictionary<string, IMacroGuiRendering> SupportedProperties
        {
            get
            {
                throw new NotImplementedException();
            }
        }

	}
	
Now when you go to create a new *Script File* in the Umbraco admin you'll have a new option for your own macro engine.

## Further reading

I've created a supplementary post to this one which looks at [how to create a NHaml based][1] macro engine.

## Conclusion

Seriously, it's *just that easy* to create your own macro engine, obviously you'll want to do more with the `Execute` method so that it will interact with the script file that you've created, but this should give you a bit of a starting point :).


  [1]: /nhaml-umbraco-macroengine