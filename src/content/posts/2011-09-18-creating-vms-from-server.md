---
  title: "Creating a ViewModel from the server"
  metaTitle: "Creating a ViewModel from the server"
  description: ""
  revised: "2011-09-22"
  date: "2011-09-18"
  tags: 
    - "knockoutjs"
    - "javascript"
  migrated: "true"
  urls: 
    - "/javascript/creating-vms-from-server"
  summary: ""
---
If you've been doing much work with [KnockoutJS][1] you'll probably see examples where the code looks like this:

    var todoViewModel = function() {
        this.items = new ko.observableArray(['Item 1', 'Item 2', 'Item 3']);
        this.selectedItem = new ko.observable('Item 1');
    };

What I'm trying to point out here is that the `viewModel` is being defined in JavaScript and that the items within it are coded into your JavaScript.

While you can argue that this is demo code and it should only be treated as such something I've noticed is *there isn't any other examples*. I haven't seen any example where they are talking about getting the data initially from the server for their viewModel.

So how do you approach this? In this article I'm going to look at how to create a viewModel from the server using ASP.Net MVC.

*Note: I'm talking about doing a viewModel as part of the initial page load since generally speaking you'll have been doing data layer interaction as part of the request. Building a viewModel using an AJAX request is a different story and I wont be covering.*

# From the server to the client

Let's get started with an example of our controller:

    public class TaskController : Controller
    {
        public ActionResult Index()
        {
            var vm = new TaskViewModel
                         {
                             Tasks = new[] { new Task("Write Blog Post"), new Task("Publish Blog Post") }
                         };

            return View(vm);
        }
    }

I'm just going to have a reasonably simple ViewModel that just has a collection of tasks that I want to display as part of my KnockoutJS-built UI but the tasks are to be pulled in from my data layer (obviously this is demo code and it's hard coded so you'll have to use your imagination for that part :P).

For the view I'm just creating something that is very simple for the task list:

    <form data-bind="submit:addTask">
        Add task: <input type="text" data-bind='value:taskToAdd, valueUpdate: "afterkeydown"' />
        <button type="submit" data-bind="enable: taskToAdd().length > 0">Add</button>
    </form>
 
    <p>Your values:</p>
    <select multiple="multiple" height="5" data-bind="options:tasks"> </select>
 
    <div>
        <button data-bind="click: removeSelected, enable: hasTasks">Remove</button>
        <button data-bind="click: sortTasks, enable: hasTasks">Sort</button>
    </div>

Now we have a conundrum, how do I as part of my response create a KnockoutJS ViewModel that I can then use in my UI?

# It's all about the serialization

When I was prototyping this for my current project I remembers that [Shannon][2] has mentioned that he'd done something similar himself and I've shamelessly taken his approach and am using it :P.

His approach was to use a serializer to create a JSON object from the model (there was some other stuff in the skype message he sent me but I'll confess to having not read that :P). For the serialization you can use the [JavaScriptSerializer][3], the [DataContractJsonSerializer][4] or [Json.NET][5]. Personally I prefer Json.NET and it's what I'll be using in this demo.

So let's make a little HTML helper to do this for us:

    public static class HtmlHelperExtensions
    {
        public static IHtmlString KnockoutFrom<T>(this HtmlHelper<T> html, T obj)
        {
            var serializer = new JsonSerializer
                                 {
                                     ContractResolver = new CamelCasePropertyNamesContractResolver()
                                 };

            return new HtmlString(JObject.FromObject(obj, serializer).ToString());
        }
    }

All we're doing here is creating an instance of the `JsonSerializer` from Json.NET and telling it to use the `CamelCasePropertyNamesContractResolver`. This is why I like Json.NET, it allows me to convert my .NET naming conventions into JavaScript conventions without a lot of effort. Lastly we just return the serialized object. Not really anything special happening in here.

Now in my View I can do this:

    @Html.KnockoutFrom(Model)

Hmm but this isn't really helpful, we're just getting out JSON blob in our view, I still would have to do a bunch of work to actually make it usable and especially if I am doing this on a lot of pages it's a lot of code that I'd prefer not to do every time. So let's see if we can improve our extension method.

# Setting up the viewModel

So what do we want from our improved version? Well I'd like the observables to be set up for me and I'd like it to avoid global variables.

To do this what I'm going to do is update my extension method to use the [Knockout Mapping plugin][6]. This plugin is really sweet as it allows me to map a JSON object into a KnockoutJS object and is great when you're working with AJAX data, you can easily pull down some data from the server and then use the plugin to extend it into your ViewModel.

In this case though I'm going to use it to map the JSON version of our server ViewModel into our KnockoutJS one:

        public static IHtmlString KnockoutFrom<T>(this HtmlHelper<T> html, T obj)
        {
            var serializer = new JsonSerializer
                                 {
                                     ContractResolver = new CamelCasePropertyNamesContractResolver()
                                 };

            var sb = new StringBuilder();
            sb.Append("(function() {");

            var json = JObject.FromObject(obj, serializer);

            sb.Append("var vm = ko.mapping.fromJS(" + json + ");");

            sb.Append("ko.applyBindings(vm);");

            sb.Append("})();");

            return new HtmlString(sb.ToString());
        }

The main updates here are:

* I'm using a `StringBuilder` to build up some JavaScript (normally I hate server-generated JavaScript but here it serves a good purpose)
* I'm creating an [immediately-invoked function expression][7] to prevent leakage
* I'm doing my binding straight away, hiding the need for that too

Excellent, this works, at least it works to an extent as we still have a few problems:

* What if I want to restrict where the binding happens?
* What about adding methods to my KnockoutJS viewModel?

# Improving interactivity

While the above will work fine for simple scenarios it's not great if you have a complex UI that you want to work with, and realistically it's not likely you'll have a viewModel you don't want  to extend with dependantObservables or anything, so let's do some refactoring.

I'm going to change the end of my extension method to look like this:

            sb.Append("var vm = ko.mapping.fromJS(" + json + ");");

            var type = obj.GetType();

            var ns = JavaScriptify(type.Namespace);
            sb.Append("namespace('" + ns + "');");
            sb.Append(ns + "." + JavaScriptify(type.Name) + " = vm;");

            sb.Append("})();");

            return new HtmlString(sb.ToString());

What I've done here is instead of doing the bindings I'm just going to create a global object which the viewModel will be assigned to (but I am [namespacing][8] it so it's a bit better). This object I can then interact with in my JavaScript and add methods/ properties/ etc to myself.

I'm also using a helper method to make the .NET namespace & type names friendlier for JavaScript:

        private static string JavaScriptify(string s)
        {
            return string.Join(".", s.Split('.').Select(x => x[0].ToString().ToLower() + x.Substring(1, x.Length - 1)));
        }


With this new extension method I can update my View to play around with the viewModel before binding:

    <script>
        @Html.KnockoutFrom(Model)

        $(function() {
            var model = knockout.serverViewModels.models.taskViewModel;

            model.addTask = function() {};
            model.taskToAdd = new ko.observable('');
            model.removeSelected = function() {};
            model.hasTasks = function() {};
            model.sortTasks = function() {};

            ko.applyBindings(model);
        });
    </script>

# Conclusion

This wraps up my post on how to convert your server ViewModel into something that can be used in your KnockoutJS, allowing you to push all data down in the initial request rather than subsequent ones.

Thanks to Shannon for the initial idea, hopefully this little extension will make it even easier.

If you want to grab the code it is [available here][9].

One final note, the Json.NET serializer **does** support the `DataMember` attributes, so you can also selectively include properties from your server ViewModel by attributing them too.


  [1]: http://knockoutjs.com
  [2]: http://twitter.com/#!/shazwazza
  [3]: http://msdn.microsoft.com/en-us/library/system.web.script.serialization.javascriptserializer.aspx
  [4]: http://msdn.microsoft.com/en-us/library/system.runtime.serialization.json.datacontractjsonserializer.aspx
  [5]: http://json.codeplex.com/
  [6]: http://knockoutjs.com/documentation/plugins-mapping.html
  [7]: http://benalman.com/news/2010/11/immediately-invoked-function-expression/
  [8]: https://www.aaron-powell.com/slace-core-javascript-library
  [9]: http://hg.apwll.me/knockoutjs-server-viewmodels