---
  title: "ASP.NET MVC Model binding with implicit operators"
  metaTitle: "ASP.NET MVC Model binding with implicit operators"
  description: "Using implicit operators in model binding with ASP.NET MVC"
  revised: "2010-06-14"
  date: "2010-06-14"
  tags: 
    - "asp.net"
    - "asp.net-mvc"
    - "c#"
    - "model-binding"
  migrated: "true"
  urls: 
    - "/aspnet-mvc-model-binding-with-implicit-operators"
  summary: ""
---
In the past I've had a bit of a play around with operators, I looked at [explicit and implicit operators][1] and it's really quite powerful.

When I upgraded my website to be powered by PaulPad, and upgraded PaulPad to ASP.NET MVC2 I ran into a problem, Paul uses implicit model binding to handle the URLs. The problem was that the `ModelBindingContext` changed between MVC1 and MVC2, resulting in the implicit operator binding implementation failing to compile!

## A quick look at Model Binding

Without going too in-depth into what Model Binding is all about, essentially it's how to map the posted data from a form to a .NET object. It's great if you want to handle custom objects from UI to back-end. It's not as required in MVC2 as it was in MVC1, but if you want to do something like implicit operators, well that's where we're going to need it.

If you want to learn more on Model Binding you can just [Google][2] it with [Bing][3].

## Implementing implicit Model Binding

To get started we need to make a class that inherits from [`IModelBinder`][4]:

    public class ImplicitAssignmentBinder : IModelBinder
    {
        public object BindModel(ControllerContext controllerContext, ModelBindingContext bindingContext)
        {
            throw new NotImplementedException();
        }
    }

So now that we've got our stub type we need to start implementing it. The first thing we need to do is see if we've got an implicit operator between our CLR types. We can do this with a few simple LINQ statements:

	var implicitAssignment = bindingContext.ModelType.GetMethods(BindingFlags.Public | BindingFlags.DeclaredOnly | BindingFlags.Static)
		.Where(x => x.Name == "op_Implicit")
		.Where(x => bindingContext.ModelType.IsAssignableFrom(x.ReturnType))
		.FirstOrDefault();

Here we're using reflection to look for an implicit operator. If you're using reflection to locate an operator they are always prefixed with **op_**, and if you're looking for an implicit operator, then it's named **Implicit** (explicit operators are op_Explicit).

Next we need to find one which is an implicit cast to the type we actually wanting to return. This is provided to us from the `bindingContext` information which we are provided with.

Then we just grab the first (or default), as there will only ever be zero or one match (we could use SingleOrDefault, but FirstOrDefault is slightly faster).

All that's left is to get the data into the right type to be returned:

	var value = bindingContext.ValueProvider.GetValue(bindingContext.ModelName).RawValue;
	result = implicitAssignment.Invoke(null, new object[] { value });

So we're just dynamically invoking the implicit operator we found before, pass in the data we were provided and then return.

And here's the completed class:

    public class ImplicitAssignmentBinder : IModelBinder
    {
        public object BindModel(ControllerContext controllerContext, ModelBindingContext bindingContext)
        {
            var implicitAssignment = bindingContext.ModelType.GetMethods(BindingFlags.Public | BindingFlags.DeclaredOnly | BindingFlags.Static)
                .Where(x => x.Name == "op_Implicit")
                .Where(x => bindingContext.ModelType.IsAssignableFrom(x.ReturnType))
                .FirstOrDefault();

            if (implicitAssignment == null)
                throw new ArgumentException(string.Format("The Implicit Assignment Binder was being applied to this request, but the target type was '{0}', which does not provide an implicit assignment operator.", bindingContext.ModelType));

            var result = null as object;

            try
            {
                var value = bindingContext.ValueProvider.GetValue(bindingContext.ModelName).RawValue;
                result = implicitAssignment.Invoke(null, new object[] { value });
            }
            catch (Exception ex)
            {
                var message = string.Format("An exception occurred when trying to convert the paramater named '{0}' to type '{1}'. {2}", 
                    bindingContext.ModelName, 
                    bindingContext.ModelType.Name,
                    ex.Message
                    );
                throw new ArgumentException(message, ex);
            }

            return result;
        }
    }

As you can see here I've got the error handling also included ;).


  [1]: /why-does-this-code-work
  [2]: http://google.com
  [3]: http://bing.com
  [4]: http://msdn.microsoft.com/en-us/library/system.web.mvc.imodelbinder.aspx
