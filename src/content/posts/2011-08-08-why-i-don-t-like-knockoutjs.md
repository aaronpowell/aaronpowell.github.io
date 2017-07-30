---
  title: "Why I don't like KnockoutJS"
  metaTitle: "Why I don't like KnockoutJS"
  description: ""
  revised: "2011-08-09"
  date: "2011-08-08"
  tags: 
    - "javascript"
    - "knockoutjs"
    - "rant"
  migrated: "true"
  urls: 
    - "/javascript/why-i-don-t-like-knockoutjs"
  summary: ""
---
A few times I've ruffled a few features by making the statement that I am not a fan of [KnockoutJS][1].

Let me start by clarifying a few things:

1. I think the *concept* of KnockoutJS is a good one
1. It's nothing against Steve Sanderson, to have come up with it in the first place is impressive
1. This is my opinion and I will still recommend that others try it and form their own opinions.

Ok so on to backing up my statement and let me start by showing you why I am not a fan:

    <button data-bind="click: registerClick, enable: !hasClickedTooManyTimes()">Click me</button>
 
Can't see it? I'll remove some of the 'guff':

    data-bind="click: registerClick, enable: !hasClickedTooManyTimes()"

Right there, the `data-bind="..."` is what I don't like, the fact that I'm embedding *potentially large amounts of JavaScript in my HTML*.

So ultimately what it comes down to is that I have an issue with the binding syntax that is used with KnockoutJS. Now I (think) understand *why* it is like this, KnockoutJS has a lot of relationships with the WPF/ Sliverlight binding idea (and MVVM obviously) so it *makes sense* to people coming from those backgrounds. Me, I'm **not** a WPF/ Silverlight developer, never have been (I did try my hand at WPF but just didn't get very far...).

## Why does it bother me?

You may be asking yourself that if the problem I have is with the syntax and not concept then where's the real issue, heck it's only a small part of it.

And this is where it gets into the "don't take my word, use it yourself" part of the post. I'm a web purest and I believe there should be a strict separation between your UI and your functionality, even in the client aspect. This means that your HTML file should only contain HTML and your JavaScript file is where the client 'brain' resides.

Having been around ASP.Net for a while (and particularly Web Forms) the idea of obtrusive JavaScript is something that you grow up with. You're use to seeing in-line event handlers, JavaScript tacked at the bottom of the page, etc. This is a smell, your HTML file is no longer responsible for what HTML is, a mark-up language, it's starting to try and become self aware, to intrinsically know that when I click a button some JavaScript has to be fired, that kind of stuff.

This is smarts that I don't want my HTML to have.

In the web we've also seen a shift on this in recent years away from have JavaScript in HTML, and even within Microsoft we've seen them acknowledge this with the jQuery unobtrusive validation plugin which was released with MVC3. 

The shift has seen us using HTML to describe the intention. Using the jQuery unobtrusive validation as an example we use the `data-validate-*` attributes to describe our validation rules, and then we use JavaScript to convey those rules into a functional concept.

This results in a clean separation between HTML and JavaScript with HTML going back to just describing intention and JavaScript taking those intentions and running with it.

## Conclusion

This post has basically outlined my primary grievance with KnockoutJS. As stated, I don't have a problem with the *concept* of it, the idea of two-way binding is quite nice but what's required to achieve that is where the issue lies.


  [1]: http://knockoutjs.com/