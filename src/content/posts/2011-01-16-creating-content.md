---
  title: "Orchard & Umbraco - Creating Content"
  metaTitle: "Orchard & Umbraco - Creating Content"
  description: "In this article we'll look at the difference between the two systems when it comes to creating content."
  revised: "2011-01-17"
  date: "2011-01-16"
  tags: 
    - "umbraco"
    - "orchard"
  migrated: "true"
  urls: 
    - "/orchard-umbraco/creating-content"
  summary: ""
---
# Overview

In this article we're going to continue our series in looking at the differences between Orchard and Umbraco. Today we're going to be looking at creating content.

This is from a series in Orchard and Umbraco, [the overview can be found here][1].

# Creating content in Orchard

As I mentioned in my last post about [admin systema][2] I pointed out that the first most option in the navigation is for creating content, and here we're going to go through the workflow of creating content. First off we'll create a new page

![Orchard new link][3]

So this will create a new piece of content using the Content Type of Page, which then takes us to the following editing screen:

![Orchard new page][4]

This is a full list of all the properties which I can edit for this page, I can put in a title, I can set the URL (which is auto-generated from the page title by stripping spaces and other special characters). Theres then a nice big text editor which uses TinyMCE as the WYSIWYG editor. Lastly there's an option to set the tags for the page, and finally some options regarding to publish.

I can't really fault it, the only thing that confuses me is the Tags option, I'm not exactly sure why I would want this on just any page, but yes, you can remove.

I'd say that it's because I've spoiled by Umbraco as when you create links (or add media) using the Orchard version of TinyMCE you have to enter the URLs yourself. This is a bit of an annoyance when you don't know the paths of what you want to link to directly. I also am not sure what impact this would have when you modify URLs, I haven't dug into that, but I'd expect that it'd cause links to break.

But that said I actually quite like the ability to full-screen the TinyMCE instance, this is really good if you're working with large content blocks.

Once finished I click save and unsurprisingly my new page 404's:

![Orchard 404][5]

Something I noticed when trying to navigate to this page I noticed that there wasn't any link on the create page, I'm not sure if I'm just blind or it's actually not there. Personally I think this would be really useful, it makes it easy to get to your new page.

Also, I can't see to find any kind of preview function in Orchard pages.

Let's go back and publish a page, you can publish the page right now or set up a scheduled publish of the content. I'm going to publish it now as that's what I want done, and now our page is live!

![Orchard new page][6]

So I chose to have this page added to the navigation, put some basic information in and that is how it looks. Obviously the Tags seems a bit silly, but if you remove them nothing around it will be displayed for it.

And that's it, we've built a page in Orchard!

# Creating content in Umbraco

With Umbraco there is two ways which you can create new content, there's a link in the upper left, or you can do it from the context menu of the tree:

![Umbraco create][7]

I'll admit that I've never used the upper left create button, I've always found it makes a lot more sense to create it in place from the content tree, so what's what I'm doing. Choosing create will then give you a new dialog, allowing you to enter the page title and select the page type:

![Umbraco create part 2][8]

This is a bit more of an involved process than Orchard, but it does have a purpose. In my admin system post I mentioned that Umbraco seems to have more of a concept of hierarchy in the pages, and this dialog is used to place restrictions on what Document Types can be placed where in the site structure. I see this as a really useful feature, it allows you to create very special site layouts by putting restrictions around your content editors without their knowledge.

Once you have a new page you'll see that there's a difference between Orchard and Umbraco again. Unlike Orchards full view of what is going able to be edited Umbraco uses a tabbed UI:

![Umbraco tabs][9]

![Umbraco tabs][10]

I can't decide what I prefer, the Umbraco or the Orchard UI, both have pros and cons, and both make sense in the context of their parent UI. It's up to you to decide which is your preference.

Umbraco also uses the TinyMCE editor, but it's a slightly customized version of it. With Umbraco the media and link dialogs allow you to interact with the CMS and select existing pages or media items which have been uploaded in the system, you don't have to remember the URLs.

Once I've populated all my content I then save the page and then I want to view it, like I did in Orchard. Unlike Orchard Umbraco has a preview feature (and if you've worked with older version of Umbraco there is a limit with the preview engine and XSLT, but that's fully resolved now):

![Preview link][11]

This gives a view of the page, with a not-so-friendly URL (it's the ID of the page), and a nice banner to indicate that it's in preview mode:

![Previewed page][12]

Sweet, I can view my content before going live, and this is a really useful feature, content editors like being able to see what their new page will look like without it going live.

Once you save and publish you'll be able to navigate to the full URL as well. The URL is on the General Properties tab as well, so you can click on it and navigate straight to the page. Again a small feature but it's really handy.

# Conclusion

To wrap up we've looked at what it's like to create a page in each system. Umbraco is a bit more involved a process, and it gives you a lot of flexibility-by-restrictions, where as Orchard is less restricted about what it allows you to do.

There's a few small things about Orchard I didn't like, the lack of easy way to open a page from the edit screen, and the missing preview feature (or at least, I didn't find it!). But keep in mind Orchard is only v1, I expect that preview would come in future versions, so keep an eye out for it.


  [1]: https://www.aaron-powell.com/orchard-umbraco
  [2]: /orchard-umbraco/admin
  [3]: https://www.aaron-powell.com/get/orchard-umbraco/orchard-content/001.png
  [4]: https://www.aaron-powell.com/get/orchard-umbraco/orchard-content/002.png
  [5]: https://www.aaron-powell.com/get/orchard-umbraco/orchard-content/005.png
  [6]: https://www.aaron-powell.com/get/orchard-umbraco/orchard-content/007.png
  [7]: https://www.aaron-powell.com/get/orchard-umbraco/umbraco-content/001.png
  [8]: https://www.aaron-powell.com/get/orchard-umbraco/umbraco-content/002.png
  [9]: https://www.aaron-powell.com/get/orchard-umbraco/umbraco-content/003.png
  [10]: https://www.aaron-powell.com/get/orchard-umbraco/umbraco-content/004.png
  [11]: https://www.aaron-powell.com/get/orchard-umbraco/umbraco-content/005.png
  [12]: https://www.aaron-powell.com/get/orchard-umbraco/umbraco-content/006.png