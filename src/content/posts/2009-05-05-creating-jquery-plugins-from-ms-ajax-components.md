---
  title: "Creating jQuery plugins for MS AJAX components, dynamically!"
  metaTitle: "Creating jQuery plugins for MS AJAX components, dynamically!"
  description: "Bringing jQuery and MS AJAX together"
  revised: "2009-05-05"
  date: "2009-05-05"
  tags: 
    - "javascript"
    - "ms-ajax"
    - "jquery"
  migrated: "true"
  urls: 
    - "/creating-jquery-plugins-from-ms-ajax-components"
  summary: ""
---
[Bertrand Le Roy][1] had an interesting post entitled [Creating jQuery plug-ins from MicrosoftAjax components][2]. It's not a bad concept, but I miss read it when I first had a read, I thought it was creating all of certain types into a jQuery plug-ins.

But as I said I miss read it, no drama, I decided to create that on my own. So I created a simple function for Microsoft AJAX which will turn all the loaded Sys.UI.Control types into jQuery plug-ins:

	Sys.Application.add_load(function() {
		var types = new Array();
		for (i in Sys.__upperCaseTypes) {
			var t = Sys.__upperCaseTypes[i];
			var ret = (function(type) {
				if (type && type.__class) {
					if (type.__baseType) {
						if (type.__baseType.__typeName === "Sys.UI.Control") {
							return true;
						} else {
							return arguments.callee(type.__baseType);
						}
					} 
				}
			})(t);
			if (ret) types.push(t);
		}

		for (var i = 0; i < types.length; i++) {
			var t = types[i];
			var nameParts = t.__typeName.split(".");
			var name = t.__typeName;
			if (nameParts.length > 1) {
				name = nameParts[nameParts.length - 1];
			}
			jQuery.fn[name] = function(properties) {
				return this.each(function() {
					Sys.Component.create(t.__typeName, properties, {}, {}, this);
				});
			}
		}
	});

It looks at the collection of registered types which are done when you do **MyType.registerClass("MyType");** so it's nice easily does them all.
It'll automatically create a plug-in for any type inheriting from Sys.UI.Control, but it can easily be done to any base type which want. So you could use Sys.Component (although I don't recommend it).

Yeah it's not really that practical, especially if you have a lot of controls, but it's just a POC. If I get some time I'll modify it to check interfaces instead :P

  [1]: http://weblogs.asp.net/bleroy/
  [2]: http://weblogs.asp.net/bleroy/archive/2009/05/04/creating-jquery-plug-ins-from-microsoftajax-components.aspx

