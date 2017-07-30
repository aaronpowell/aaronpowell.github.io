---
  title: "Yes, I LIKE WebForms!"
  metaTitle: "Yes, I LIKE WebForms!"
  description: "I think ASP.Net WebForms is really quite good, and here's some thoughts on the topic"
  revised: "2010-08-08"
  date: "2010-08-07"
  tags: 
    - "webforms-mvp"
    - "webforms"
    - "web"
    - "asp.net"
  migrated: "true"
  urls: 
    - "/yes-i-like-webforms"
  summary: ""
---
At some of my speaking engagements recently I've made the *astonishing* claim that I quite like ASP.Net WebForms. Why do I say this is an astonishing claim? Quite often when I'm talking to other ASP.Net developers and we end up on the topic of WebForms you can see a look of distaste in their eyes, or there'll be a statement like "I'm stuck working with WebForms".

But when you ask someone why they don't like WebForms they generally don't have a really good reason, they come up with a few points like:

* ViewState is bloated
* Controls are heavy
* It's not testable

So I thought I'd share a few of my thoughts on the topic because well, everyone wants to hear my opinion :P.

## ViewState

ViewState is a double-edged sward and if you're not familiar with it and what it's goals are then you're probably going to end up doing it wrong.

First thing everyone should do when starting ASP.Net development is [read this article][1] by [David Reed][2]. The article may be 4 years old but everything still holds true today.

And once you understand ViewState you can understand how to use it to your advantage. Keep in mind that ViewState can be turned on or off for any particular control (with .NET 4.0 the control is even better), and you really should be setting it properly.

### To enable or to disable?

When you turn ViewState on you're adding weight to the response back to the client (well unless you use a different provider), and this is something that you need to be aware of. Take a look at the controls you're using, what's the data they have in them and what's the cost of that data?

Say you have a literal, or a label and you're setting some text on it from a resource file. It's not that expensive to do the text setting, so why have the framework do it for you at the cost to the end user?

This principle can be applied to any kind of control, and once you start looking at what you're putting into your page you'll realise just how often you don't need to have ViewState enabled.

A little bit of planning and you'll not have to look at the giant ViewState slab.

## Controls

Controls are great, they package up some functionality and make it easy to redistribute. But people often say that this is one of the big downsides of WebForms and MVC gives you much better flexibility. But think about some of the trivial (read: boring) tasks which we have to do as developers:

* Create a login form
* Output a collection of data using a template

So with MVC this is something that you end up having to write yourself, sure there are some helpers like `Html.EditorFor` and stuff so you can quickly display something. And it's true there's plenty of good extensions to do things like Repeaters, so this is just taking WebForms concept into MVC right?

One of the other main criticisms of controls is that they generate HTML for you that is hard to style, and often unchangable. But think about what they are trying to generate, a standard design cross-browser. Try having a floating layout which can be dropped anywhere and look the same?

True it makes them less flexible, but it depends what you're trying to achieve.

## Testability

I've done plenty of articles in the past about testibility so I'm not going to dwell too much. All I'm going to say is that you need [WebForms MVP][3], it's fantastic!

## Conclusion

I think that WebForms is a great framework and one that we'll have with us for a long time still. If you understand what you're working with, that it's not MVC and there is a lot of power which it has to give you'll learn that it isn't really that bad :).


  [1]: http://weblogs.asp.net/infinitiesloop/archive/2006/08/03/Truly-Understanding-Viewstate.aspx
  [2]: http://weblogs.asp.net/infinitiesloop/
  [3]: /webforms-mvp