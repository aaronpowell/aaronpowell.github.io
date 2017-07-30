---
  title: "jQuery validation, JavaScript form submitting and another bad idea"
  metaTitle: "jQuery validation, JavaScript form submitting and another bad idea"
  description: ""
  revised: "2011-05-22"
  date: "2011-05-21"
  tags: 
    - "jquery"
    - "javascript"
  migrated: "true"
  urls: 
    - "/javascript/jquery-validation-and-javascript-posts"
  summary: ""
---
[In my last post][1] I looked at how to use jQuery validation in a dynamic form and some problems you can have with handling rule sets.

Something I mentioned in the posts was that I was also submitting the form using JavaScript rather than a form post or anything. This didn't actually make it into the final post and part of the reason was it would have added a heck of a lot more to the overall post, making it a lot longer than I think anyone would want to read. The other part of the reason was I started writing the post at 11pm on Friday night and finished it on Saturday night so I may have got a bit sidetracked :P (even though I did proof read it I missed that part!).

So as promised here is the conclusion to my last post :P.

# Submitting forms with JavaScript

When submitting a form with JavaScript there's a few ways you can go about it, one of the ways is to use an AJAX request on the form submit, so basically serializing the form fields into a JSON blob which you include in your POST.

This is good because you can do progressive enhancement since you have an actual URL to POST to if JavaScript is disabled.

But no, we're not going down that route, instead we're going to be calling a JavaScript method on our external API. This poses some problems, we don't have URL to submit to. But we still have a `<form>` tag, so we've got an issue, we have to avoid the form submit!

	function postForm(validation, form) {
		var fields = form.find('input'),
			data = {};
		
		for(var i=0, il=fields.length; i<il; i++) {
			var field = fields[i];
			
			data[i] = {
				value: $(field).val(),
				type: $(field).attr('type')
			};
		}
		
		external.submit(data);
	}

Great, that was pretty easy to build up our *submit* schema, so we can hook it up into jQuery Validation:

	function buildForm(form, fields) {
        var fieldset = form.find('fieldset'),
                ol = $('<ol></ol>'),
                templates = {
                        text: $('text-template'),
                        date: $('date-template') //and so on for more templates
                },
                rules = {},
                messages = {}
				settings = {
					rules: rules,
					messages: messages,
					submitHandler: function postForm(validator, form) {
						var fields = form.find('input'),
							data = {};
						
						for(var i=0, il=fields.length; i<il; i++) {
							var field = fields[i];
							
							data[i] = {
								value: $(field).val(),
								type: $(field).attr('type')
							};
						}
						
						external.submit(data);
					}
				};
		//parse form code from the last post
		
		//update this line to use our object not the inline object
		$.extend(validationRules.settings, settings);
	}

So I've updated the code from the last post which now includes the `submitHandler` property on the settings for the validation rules. This is a method that will be called once the form passes all validation rules that have been applied to it.

This is a fine piece of code, it works exactly as we would expect, except there's an issue, **the form will still post**.

jQuery Validation works by tying into the form submit event, and the `submitHandler` method is called as part of that, so if all validation passes it'll allow the browser to finish executing the submit operation. This is a problem, we're not defining an action or a method and according to the W3C spec the [default action][3] is the URL of the forms owner and the [default method][4] is GET. Crap, so even if we don't specify anything it'll still have some default operations.

But it's not *really* a problem, we can just use the `preventDefault` method to stop the event from continuing because if we can stop the event from going on we don't have to worry about the form submitting completely.

Well that's good, but we have a problem, how do we cancel the event? Sadly the `submitHandler` method has no access to the form event object. According to the source though we can pass in `debug: true` as a setting to the validator which will then calls `preventDefault`, but that looks ugly, having `debug: true` in production code...

So the only solution is we modify the source for the validation plugin. Good news is I have modified the jQuery Validation plugin, I have a fork [here][2] which I hope the pull request of gets accepted ;).

Now we update our `submitHandler` method:

	submitHandlers: function postForm(validator, form, event) {
		var fields = form.find('input'),
			data = {};
		
		event.preventDefault();

# Conclusion

So to wrap up the second part of the intended one-part series we've looked at how you can work around using JavaScript to send data and still prevent a browser from submitting the data.


  [1]: /javascript/jquery-validation-and-dynamic-forms
  [2]: https://github.com/aaronpowell/jquery-validation/commit/6a5eadd42661655d80248a825431bf30c56a34af
  [3]: http://dev.w3.org/html5/spec-author-view/spec.html#attr-fs-action
  [4]: http://dev.w3.org/html5/spec-author-view/spec.html#attr-fs-method