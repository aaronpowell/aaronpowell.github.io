---
  title: "Orchard & Umbraco - Managing Content"
  metaTitle: "Orchard & Umbraco - Managing Content"
  description: "An overview of how to manage content in the two different CMSs"
  revised: "2011-01-28"
  date: "2011-01-27"
  tags: 
    - "orchard"
    - "umbraco"
  migrated: "true"
  urls: 
    - "/orchard-umbraco/managing-content"
  summary: ""
---
# Overview

In this article we're going to continue our series in looking at the differences between Orchard and Umbraco. Today we're going to be looking at managing content.

This is from a series in Orchard and Umbraco, [the overview can be found here][1].

# Finding Content in Orchard

With Orchard you need use the navigation and go to the `Content Items` option:

![Content Items][2]

Here you'll be presented with a screen which has all the items which you've created in your site:

[Content Item List][3]

This is the source of all your needs, you can filter the list to the different content types, order them by different criteria or apply bulk actions.

In my article about [Creating Content][4] I pointed out that there wasn't a way to open a page from the admin system, well I stand corrected, you can do it from the `Content Items` page. So I stand corrected, there is a way, but still kind of expected it to be from the editing screen.

I also do quite like the way you can do bulk actions, you can unpublish, publish or delete pages. Very handy when you want to clean up a site instance, or deploy live.

You may also have noticed a green tick icon next to each content item, that indicates that it is published, alternately if you have unpublished content you get a nice red icon:

![Unpublished content][5]

# Finding Content in Umbraco

Unlike Orchard Umbraco uses a tree based structure for its content, and when you're going to edit the content:

![Content Tree][6]

From here you navigate to the particular content item that you want to edit and click on it.

Depending on where the content is located it can actually be a little bit more tedious having to navigate down to the appropriate content item, but Umbraco kind of meets this issue in Juno with the new Dashboard. The new Dashboard has a *Last Edited* option which you can go to and then navigate to a content item:

![Last Edited][7]

It's not quite as powerful as the Orchard content item filtering but it's pretty handy, particularly in a Edit -> Review style workflow.

Some of the options for Umbraco are a little bit more hidden than they are with Orchard, options such as Unpublish are on the *Generic Properties* tab, along with some of the meta data:

![Generic Properties][8]

This is opposite to Orchard which had them up front when over viewing the content items.

Like Orchard Umbraco does have a visual indicator as to whether a content item is published or unpublished. With Umbraco unpublished content has a dimmed out tree icon. Also Umbraco has the notion of saving content, meaning that you can make a change and save it into the CMS without publishing it. This is very handy if your working in the Edit -> Review workflow, or if you want to start editing a page and come back to it later to finish. These saved changes are indicated in the tree by an asterisk on the content item:

![Content icon states][9]

Also with Umbraco most of these options are available off the context menu in the content tree, and this is where you'll find the Delete option, which is a little bit more hidden than with Orchard.

A really nice feature about deleting content in Umbraco is that it has the idea of a recycling bin. So far I haven't come across this feature in Orchard (although I may not have found it yet), but what it means is that when you delete a piece of content it isn't actually removed; instead it is moved into the recycling bin and removed from the published site. This is a **really** useful feature and I've had it save more than one of my clients asses as they "accidentally" remove a piece of content, like say their home page (yes, I've had client delete their home pages, even their entire sites, all by accident, although I've never worked out how you can do that accidentally...).

# Conclusion

Again we've seen two different takes on how  to perform a task with the two CMSs, with Orchard staying with it's minimalistic but direct approach to managing content, and Umbraco being a lot more visual about what you're wanting to achieve.


  [1]: https://www.aaron-powell.com/orchard-umbraco
  [2]: https://www.aaron-powell.com/get/orchard-umbraco/orchard-content/008.png
  [3]: https://www.aaron-powell.com/get/orchard-umbraco/orchard-content/009.png
  [4]: https://www.aaron-powell.com/orchard-umbraco/creating-content
  [5]: https://www.aaron-powell.com/get/orchard-umbraco/orchard-content/010.png
  [6]: https://www.aaron-powell.com/get/orchard-umbraco/umbraco-content/007.png
  [7]: https://www.aaron-powell.com/get/orchard-umbraco/umbraco-content/008.png
  [8]: https://www.aaron-powell.com/get/orchard-umbraco/umbraco-content/009.png
  [9]: https://www.aaron-powell.com/get/orchard-umbraco/umbraco-content/010.png