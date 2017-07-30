---
  title: "jQuery validation, dynamic forms and a really bad idea"
  metaTitle: "jQuery validation, dynamic forms and a really bad idea"
  description: ""
  revised: "2011-05-21"
  date: "2011-05-20"
  tags: 
    - "jquery"
    - "javascript"
  migrated: "true"
  urls: 
    - "/javascript/jquery-validation-and-dynamic-forms"
  summary: ""
---
Currently at work I'm part of a team that's developing a really JavaScript heavy application and in doing so we're finding problems, challenges and solutions. One such that I was working on recently I thought I'd share with you as it was a majour source of frustration, but ultimately I succeeded in it and that made it all the worth while!

The section of the application I've been working on deals with an external data source which manages some systems that the user interacts with. We don't have *any* C# code that supports this section of the application, everything is provided by a third party and a JavaScript API which they have provided us with for interaction. This means that whenever we need display something to the user they are providing us with the data. Generally speaking this is fairly straight forward, they are providing lists of data, messages, etc, but there's one step that is quite tricky, and that is developing a form.

So to set up the scenario what we are running through a multi-part form. On the first step of the form we give the user an option of what they want to add and then on the second step we display a form with a number of fields. The thing is that these fields are defined **by the option chosen on step 1**, meaning that we have to generate the form *on the fly*. Breaking it down what we're getting back from the external API is a JSON object which represents a form schema. It dictates the fields we're including, the order they appear in and the types of inputs. To then throw another spanner in the works the fields all need to be validated. Each field is mandatory and we have some special fields such as date fields.

Essentially I have to take this:

	{
		fields: [{
			type: 'text',
			label: 'First Name'
		}, {
			type: 'text',
			label: 'Last Name'
		}, {
			type: 'date',
			label: 'DOB'
		}]
	}
	
And turn it into the following:

	<form>
		<fieldset>
			<ol>
				<li>
					<label for="field-0">First Name</label>
					<input id="field-0" name="field-0" type="text" />
				</li>
				<li>
					<label for="field-1">Last Name</label>
					<input id="field-1" name="field-1" type="text" />
				</li>
				<li>
					<label for="field-2">DOB</label>
					<input id="field-2" name="field-2" type="date" />
				</li>
			</ol>
		</fieldset>
		<button type="submit">Submit</button>
	</form>
	
Now let's have a look at how you generate a form from a JSON schema, display it to the user and ultimately configure some validation.

Oh, and to cap it all off we don't actually have a .NET method which we're posting the form to, there's no ASMX, no Controller Action, no PostBack. Instead we're submitting the form back into a JavaScipt API call which our external service is providing to us!

# Getting started

When getting started with these we already had a lot of design patterns in place and JavaScript libraries to play with. For the purpose of this blog post I'm going to look at the tools which are relivent to what I'm doing and which will (hopefully) save you some time if/ when you have to do something similar.

These tools are:

* [jQuery][1] (duh!)
* [jQuery Validate][2]
* [jQuery Templating][3]

# Building your form

So I'm going to be building out my form based on a JSON schema, but I want to do it in such a way as that I don't have any "magic strings" which are responsible for DOM element creation. I'm trying really hard to keep a good clean separation between the HTML and the JavaScript so littering my parser with HTML snippets kind of throws off my concept a bit.

Instead though I've decided to take a different route, I'm going to use the fantastic jQuery template enging to create the form fields to begin with. If you're not familiar with the jQuery Templating enging then I suggest reading their docs before going much further and getting confused.

Now my schema will only support a sub-set of form fields, so I don't need to worry about having a solution for every different scneario, instead I'm catering for the following:

* Regular text fields
* Password fields
* Date fields
* Checkbox fields

So for this I'm going to create separate templates for each of the form field types that are supported:

	<script type="text/x-jquery-tmpl" id="text-template">
		<li>
			<label for="field-${index}">${label}</label>
			<input id="field-${index}" name="field-${index}" type="text" />
		</li>
	</script>
	
	<script type="text/x-jquery-tmpl" id="text-template">
		<li>
			<label for="field-${index}">${label}</label>
			<input id="field-${index}" name="field-${index}" type="password" />
		</li>
	</script>

(And so on, I wont put out all the templates here, it'll get a bit repetative)

You could go about this a slightly different way and put conditional statements in your template. Personally I'm against that for a few reasons:

0. You end up with larger and potentially more complex templates
0. Template parsing has an overhead. The more logic you put into a template the more slower it'll become to parse as the regexs have to work that bit harder
0. You're loosing your separation of concerns but bringing JavaScript into your templating engine

Since we're only templating our form fields we've got t ohave a starting HTML snippet that we'll be appending to:

	<form>
		<fieldset></fieldset>
		<button type="submit">Submit</button>
	</form>

# Parsing our schema

So now we know how we're going to go about building our HTML we now have to parse our schema. It's a fairly simple concept, we need to:

* Itterate through each field in the response
* Determine the type
* Parse the template with the field info

Let's assume that we've made it to the wizard step that we've called out to our external service to provide the JSON schema, now we've got to deal with it.

	(function($) {
		$(function() {
			//call out to our external API
			external.getForm('form-identifier', function(result) {
				//this callback will handle the parsing
				buildForm($('form'), result.fields);
			});
		});
	})(jQuery);
	
This is a fairly simple little code snippet, we're expecting to call our external API which will in turn send us our JSON schema. Now let's implement the `buildForm` method.

	function buildForm(form, fields) {
		var fieldset = form.find('fieldset'),
			ol = $('<ol></ol>'),
			templates = {
				text: $('text-template'),
				date: $('date-template') //and so on for more templates
			};
			
		for(var i=0, il = fields.length; i < il; i++) {
			var field = fields[i],
				field.index = i, //so we've got a unique ID for the field
				html = {};
				
			switch(field.type) {
				case 'text':
					html = templates.text
							.tmpl(field)
							.appendTo(ol);
					break;
				
				case 'date':
					html = templates.date
							.tmpl(field)
							.appendTo(ol);
					break;
					
				default:
					throw new Error('The field type "' + field.type + '" is not supported.\r\n" + JSON.stringify(field);
			}
		}
		ol.appendTo(fieldset);
	}
	
Now this is really simple code, we're defining some variables up front which will be needed, and also some pointers to our templates (because caching jQuery selectors is a very good idea people!). Next we go through each item in the fields collection, find the right template and then apply the field to it.

**Pro tip - templates aren't just for dealing with collections, you can apply a single JavaScript object to it.**

Once we've build up a full form it wil then be added to the DOM, this is just for athetics, rather than appending each one to the DOM as you loop through it does it in a single go. This means you can have some fun animations if you want to make the form appear, rather than a staggered approach if you were adding to the DOM as you go.

Essentially we are done, the JSON schema has been parsed and we've now got a form which the users will see and be able to work with. It's also surprisingly easy to do.

# Adding validation

As I mentioned in the introduction to the article the fields need to be validated as well. Depending on how you're getting your JSON schema you may receive the validation down the pipe as part of the schema, but in this example I'm going to have all fields validated.

One thing to note, I'm assuming that this code is in run in an ASP.NET MVC3 application, so I've got the unobtrusive jQuery validation also included which has an interesting side effect, it parses all forms and tries to set up the validation rules. But sadly we don't have the form built so the validation rules can't get created!

Because we've got unobtrusive validation included and it's already parsed our form it poses a bit of a problem, when you pass your rules into the `validate` method it wont do anything. When the plugin runs it adds a data attribute to the form which contains all the rules (`$('form').data('validator')` is where it is). This is problematic, we can't **revalidate** the form if we put unobtrusive rules on it.

## Building validation rules

Although we may not be able to go with the unobtrusive validation it's not a *big* issue IMO, we're already being unobtrusive by running out JavaScript to build the form in a separate file (you *are* doing that right...), so we can just build up the rules as we're parsing our schema:

	function buildForm(form, fields) {
		var fieldset = form.find('fieldset'),
			ol = $('<ol></ol>'),
			templates = {
				text: $('text-template'),
				date: $('date-template') //and so on for more templates
			},
			rules = {},
			messages = {};
			
		for(var i=0, il = fields.length; i < il; i++) {
			var field = fields[i],
				field.index = i,
				html = {},
				id = 'field-' + i;
				
			rules[id] = {
				required: true; //setup the rule for this field, we're just putting required as true
			};
			messages[id] = {
				required: 'The field is required' //create a message for when the field is invalid
			};
				
			switch(field.type) {
				case 'text':
					html = templates.text
							.tmpl(field)
							.appendTo(ol);
					break;
				
				case 'date':
					html = templates.date
							.tmpl(field)
							.appendTo(ol);
					
					rules[id].date = true;
					messages[id].date = 'That\'s not a valid date';
					
					break;
					
				default:
					throw new Error('The field type "' + field.type + '" is not supported.\r\n" + JSON.stringify(field);
			}
		}
		ol.appendTo(fieldset);
		//wait, how do we add the rules?
	}

In the above we've added a few new variables, one which will hold our ruleset and one which will hold the messages. Each rule is based off the name (or ID, I forget which) of the form field, so I've created a variable in the loop that's the ID. You could then add this to the `field` object and have the template parse it rather than having duplicate code (but I'm lazy and it's not overly exciting so I'll skip it :P).

Now though we have all our rules made how do we go about adding them? As I mentioned the form has already been parsed thanks to the unobtrusive validation plugin, so when we do this:

	form.validate({ rules: rules, messages: message });
	
Nothing happens...

Well actually something useful happens, when you do call `validate` it'll return the validation rules.

Rules which we can modify ;).

That's right, we don't *need* to "parse the form" again, we can just modify the ruleset that's already there, so we'll update our code:

	function buildForm(form, fields) {
		var fieldset = form.find('fieldset'),
			ol = $('<ol></ol>'),
			templates = {
				text: $('text-template'),
				date: $('date-template') //and so on for more templates
			},
			validationRules = form.validate(),
			rules = {},
			messages = {};
			
		for(var i=0, il = fields.length; i < il; i++) {
			var field = fields[i],
				field.index = i,
				html = {},
				id = 'field-' + i;
				
			rules[id] = {
				required: true; //setup the rule for this field, we're just putting required as true
			};
			messages[id] = {
				required: 'The field is required' //create a message for when the field is invalid
			};
				
			switch(field.type) {
				case 'text':
					html = templates.text
							.tmpl(field)
							.appendTo(ol);
					break;
				
				case 'date':
					html = templates.date
							.tmpl(field)
							.appendTo(ol);
					
					rules[id].date = true;
					messages[id].date = 'That\'s not a valid date';
					
					break;
					
				default:
					throw new Error('The field type "' + field.type + '" is not supported.\r\n" + JSON.stringify(field);
			}
		}
		ol.appendTo(fieldset);
		
		$.extend(validationRules.settings, { rules: rules, messages: messages });
	}
	
Up front we've defined another variable which will hold our existing validation information and then at the tail of the method we're using the `$.extend` method to add our new rules to the existing rules. Well the be specific we're passing the `validationRules.settings` property, as that's actually where the rules (and messages) reside, not on the root object.

## Alternate way to build up rules

Part of the jQuery Validate plugin is it adds a `rules` method onto the jQuery objects, this means you can add rules that way. The problem I've found with this though is if the input field isn't in the DOM you can't use the `rules` method since internally it'll look back up the DOM for the form they are attached to, but there's no DOM to walk yet so it'll throw an error.

# Conclusion

This has been a fairly full-on article, we've looked at:

* How to use jQuery templates to build a HTML snippet
* How we can parse a JSON schema for a form
* How to extend the existing validation rules to support new rules from the schema

Hopefully this has given a bit of an insight into how to do some crazy, way out problems, but also how to do some more real-world scenarios such as updating an existing from with JavaScript and then augmenting the validation rules.


  [1]: http://jquery.com
  [2]: http://docs.jquery.com/Plugins/validation
  [3]: http://api.jquery.com/jquery.tmpl/