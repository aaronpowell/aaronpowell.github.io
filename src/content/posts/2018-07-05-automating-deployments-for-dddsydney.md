+++
title = "Automating Deployments for DDD Sydney"
date = 2018-07-05T10:43:52+02:00
description = "How we automate deployments of DDD Sydney's static websites"
draft = false
tags = ["azure", "dddsydney"]
+++

In my last post about [Cutting Azure Costs for DDD Sydney]({{< ref "2018-06-21-cutting-azure-costs.md" >}}) I talked about how we now use static websites for the main DDD Sydney assets.

Today I want to talk about how we deploy those, and importantly, how we work with Azure CDN for it. I'm not going to talk about how we do the _build_ phase of the websites, because that's going to be different depending on what you're using to generate your static website (for example, we use [next.js](https://nextjs.org/) for the main website and [hugo](http://gohugo.io/) for the blog), instead I'll focus on what you do with that pile of HTML, CSS, JavaScript and other web assets.

## Deploying to Blob Storage

The first thing you'll need to do is get your assets into Blob Storage, since that's where they are served from. We're using VSTS for this as it links to our O365 so it's all federated auth (minimal accounts ftw!) and we just use the [Azure File Copy task (v1)](https://github.com/Microsoft/vsts-tasks/blob/master/Tasks/AzureFileCopyV1/README.md) and well... that's all really, job done, all go home!

Well, not quite.

## Don't forget to set the content type

When you copy a file into Blob Storage it will automatically be assigned a generic mime type, and when served to the browser it'll be served wrong and won't render.

This is easily fixed by adding `/SetContentType` to the `Additional Arguments` property on the VSTS task (well, to azcopy under the hood).

## Clean deployments or overriding deployments?

We're essentially using Blob Storage as a place to dump a bunch of files and then in Azure CDN we put a pretty URL in front of it. So when we do a deployment of changes, new posts to the blog, new/changed content of the website, etc. we needed to decide if we're put them into the same folder as all other deployments or whether we'd dump them into a new container.

I decided to go for the later, to do a clean deployment every single time into a new location each time, using the `Blob Prefix` property of the VSTS task being set to `$(Release.ReleaseId)`.

This means that each release we do is kept separate from all previous releases and if something is broken we can always roll back a release!

## Updating the CDN

Great, your files are up in Blob Storage, they are in a new folder to the previous ones, so now it's time make the CDN respect that. After all, the point of a CDN is that you rarely hit the underlying site, you serve it from cache.

For this I need to update the `Origin Path` of the CDN endpoint.

The what?

When you're using Azure CDN you create an Endpoint that provides the content to the CDN. Because we're using Storage as our Origin type we can specify an `Origin Path`, which is the place within Storage that our files live. Now each release we change this path by appending a new release number, so we need to update that in Azure.

For this we use the [Azure CLI VSTS task (v1)](https://github.com/Microsoft/vsts-tasks/blob/master/Tasks/AzureCLIV1/Readme.md) and run this command:

```sh
az cdn endpoint update -n <name of your endpoint> --origin-path /<container name>/$(Release.ReleaseId) --profile-name <azure cdn name> -g <resource group name>
```

The actual one we use for DDD Sydney's blog is:

```sh
az cdn endpoint update -n blog-dddsydney --origin-path /website/$(Release.ReleaseId) --profile-name dddsydney-blog-cdn -g blog
```

## Removing the old content

The last piece of the puzzle is that we need to tell Azure CDN to refresh, just because we've changed the underlying origin doesn't mean that we're serving new content, it's still cached after all!

This is done by running a purge on the CDN and again is done via the Azure CLI:

```sh
az cdn endpoint purge --profile-name <azure cdn name> --name <endpoint name> -g blog --content-paths <path(s) to purge>
```

Or for our blog:

```sh
az cdn endpoint purge --profile-name dddsydney-blog-cdn --name blog-dddsydney -g blog --content-paths "/*"
```

Now I'm a little lazy and just purging the whole CDN (setting the `content-paths` to `"/*"`) rather than just the paths to updated content (eg: the home page), but it's fine for the small site footprints that we run.

### Purging sometimes fails

Something that I've learnt along the way is that the purge doesn't always work. I'm not sure why this is, by my belief is that sometimes it times out in VSTS. This is manifested by the release passing but no new content appearing (blogs not published, website changes not appearing, etc.).

So far the only solution to this I've found is to log into the Azure portal and run the purge again, sometimes a few times :stuck_out_tongue:. It's annoying, especially when I want to go to bed, but I've not had time to try and diagnose the problem in more details.

## Conclusion

And that's how we deploy the we assets for DDD Sydney into Blob Storage, in a way that provides us with easy roll-back of changes, and update the CDN to reflect the new content.

Now I'm away that Microsoft released support for [static websites in Azure](https://azure.microsoft.com/en-us/blog/azure-storage-static-web-hosting-public-preview/?{{< cda >}}) as a feature, but at the time of writing it doesn't support using an `Origin Path` so we can't quite switch over yet. Hopefully in the future, but we'll wait and see.