---
  title: "KendoUI Bootstrapper"
  metaTitle: "KendoUI Bootstrapper"
  description: ""
  revised: "2012-02-16"
  date: "2012-02-16"
  tags: 
    - "javascript"
    - "kendoui"
  migrated: "true"
  urls: 
    - "/kendo-ui-bootstrapper"
  summary: ""
---
For my Stats It project I'm using [KendoUI](http://kendoui.com) as my UI widget layer (and charting) as it has several more UI widgets that I'm looking for than jQuery UI offers. But there's one thing I hate having to do, and that's constantly write code like this:

	$('.datePicker').kendoDatePicker();
	
This goes for all libraries I've used, you're constantly having to *bootstrap* the UI widgets so that they appear. Now there's a good reason for this, so you can pass in options, etc to setup your controls for their actual use, but I find that you end up with a lot of boilerplate code around that is doing the same thing each time and when trying to be [DRY](http://en.wikipedia.org/wiki/Don't_repeat_yourself) this is annoying.

# Introducing KendoUI Bootstrapper

In an effort to address the lack of DRYness in my projects I started a new library which is up on github called [KendoUI Bootstrapper](https://github.com/aaronpowell/Kendo-UI-Bootstrapper) with the goal of solving this problem for me.

Basically what this library does is automatically creates your KendoUI widgets for you and then exposes them out in an API so you can interact with them. This means that if you want to do anything "custom" to a widget (say set a min/ max for a date picker) you use the widget API to do it, rather than passing it in as a setting to the constructor.

# Using KendoUI Bootstrapper

Say you've got some date pickers that you want to use, to do so you'd have something like this in your HTML:

	<input id="startDate" />
	<input id="endDate" />
	
Then to get the bootstrapper to work you need to add a `data-*` attribute, in the form of `data-kendo="<widget type>"`, so for the date pickers we now have this in our HTML:

	<input id="startDate" data-kendo="date" />
	<input id="endDate" data-kendo="date" />
	
Next you need to add a reference to the Bootstrapper JavaScript file are tell it to do its this:

	window.kendo.bootstrap();
	
The bootstapper with augment the `window.kendo` object by adding a `datePickers` property which will have two properties of its own, one called `startDate` and one called `endDate`.

This kind of thing I would put in my master JavaScript file for the page so that all my widgets are setup initially for me, but in the page JavaScript that is responsible for my date range picker I would have something like this:

        var start = window.kendo.datePickers.start,
            end = window.kendo.datePickers.end;

        var startChange = function () {
            var startDate = start.value();

            if (startDate) {
                startDate = new Date(startDate);
                startDate.setDate(startDate.getDate() + 1);
                end.min(startDate);
            }
        };

        var endChange = function () {
            var endDate = end.value();

            if (endDate) {
                endDate = new Date(endDate);
                endDate.setDate(endDate.getDate() - 1);
                start.max(endDate);
            }
        };

        start.bind('change', startChange);
        end.bind('change', endChange);

        start.max(end.value());
        end.min(start.value());

        end.max(new Date());
        
Here I've implemented the same code that can be found in the [KendoUI demos](http://demos.kendoui.com/web/datepicker/rangeselection.html) but rather than performing some setup as part of the "construtor" for the date picker and then using the API I'm doing everything through the API. I find this more preferable as it means I have a separation of concerns, I know that in my JavaScript file I have two objects that represent what could be a date picker without having to have any dive into the HTML, it's just a programming API. This means I can stub them out and write some tests against them, testing pure logic rather than testing against the DOM.

## Limitations

At the moment this project is under development and I'm really developing it on an *as needed* basis, ie - if I haven't used the widget it's not going to be there :P. But if you want to add features then send me a pull request!

Obviously this doesn't cater for 100% of scenarios, there will be scenarios which this **wont** work, and if that's the case don't put a `data-kendo` attribute on your element and wire it up yourself.

I've also been told by some of the people at Telerik that there may be some problems with APIs not working *as expected* in KendoUI itself. If that's the case this is a good test bed to have them find these problems and fix them so I see this as more of an opportunity to help the KendoUI team to have as good an API as possible.