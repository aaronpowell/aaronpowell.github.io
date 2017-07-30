---
  title: "Exception thrown when using XSLT extensions"
  metaTitle: "Exception thrown when using XSLT extensions"
  description: "A common problem when writing XSLT extensions"
  revised: "2010-04-25"
  date: "2010-04-25"
  tags: 
    - "umbraco"
    - "xslt"
  migrated: "true"
  urls: 
    - "/exception-thrown-when-using-xslt-extensions"
  summary: ""
---
This is a question I was asked today but it's also something which I have come across myself when creating XSLT extensions.

Have you ever had this exception thrown?

> System.MissingMethodException: No
> parameterless constructor defined for
> this object.
> 
> at
> System.RuntimeTypeHandle.CreateInstance(RuntimeType
> type, Boolean publicOnly, Boolean
> noCheck, Boolean& canBeCached,
> RuntimeMethodHandle& ctor, Boolean&
> bNeedSecurityCheck) at
> System.RuntimeType.CreateInstanceSlow(Boolean
> publicOnly, Boolean fillCache) at
> System.RuntimeType.CreateInstanceImpl(Boolean
> publicOnly, Boolean
> skipVisibilityChecks, Boolean
> fillCache) at
> System.Activator.CreateInstance(Type
> type, Boolean nonPublic) at
> umbraco.macro.GetXsltExtensions() at
> umbraco.macro.AddMacroXsltExtensions()
> at
> umbraco.presentation.webservices.codeEditorSave.SaveXslt(String
> fileName, String oldName, String
> fileContents, Boolean ignoreDebugging)

(The complete stack trace may be different, it's the thrown exception that should be of note) 

So what causes this? Well Umbraco loads its XSLT extensions (from xsltExtensions.config) using Reflection, and it looks for a public default constructor, which is the constructor which takes no arguments.

Basically if you're writing a constructor for your XSLT extensions class you must make sure you have a default one too, so your extensions class must look like this at lease:

    public class MyXsltExtensions { 
      public MyXsltExtensions() { }
      ...
    }

If you're not defining your own constructor though this isn't a problem.

I only came across this bug when I was trying to define the default constructor as private, attempting to do a very tight API design (not exposing constructors where I didn't want them).
Whoops! 