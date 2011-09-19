--- cson
title: "Creating a ViewModel from the server"
metaTitle: "Creating a ViewModel from the server"
description: ""
revised: "2011-09-19"
date: "2011-09-18"
tags: ["knockoutjs","javascript"]
migrated: "true"
urls: ["/javascript/creating-vms-from-server"]
summary: """

"""
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




  [1]: http://knockoutjs.com