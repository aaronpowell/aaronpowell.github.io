---
  title: "Using bluesky in Azure Mobile Services"
  date: "2013-09-11"
  tags: 
    - "azure-mobile-services"
  description: "A quick tip on how to use `bluesky` from Azure Mobile Services."
---

I've been doing some work with [Azure Mobile Services](http://www.windowsazure.com/en-us/solutions/mobile/) where I'm storing data in tables and blobs. For a task I need to have a custom API which will remove some data from a table and then the blobs associated with it.

For this I'm creating a new [custom API](http://www.windowsazure.com/en-us/develop/mobile/tutorials/call-custom-api-dotnet/#define-custom-api) and because it's just a Node.js app I'd be using the [Node SDK](https://github.com/WindowsAzure/azure-sdk-for-node). When I was getting started I got pointed towards [bluesky](https://github.com/pofallon/node-bluesky) which is a nice little wrapper around the Azure SDK to make it a bit easier to work with.

So I `npm install`'ed it into the git repo for my mobile service, used the API and pushed it up to Azure.

And then...

    remote: One or more errors occurred.
    remote: Error - Changes committed to remote repository but deployment to website failed, please check log for further details.

Well I spun up the CLI and check my logs but _nothing_, there wasn't anything in there that indicated the problem. In fact my server was still running but it wasn't running the scripts that I'd just pushed. This is annoying, I've got no logs, a failing server and no indication as to why. Deleting the module and pushing the server started up again, but then obviously then I can't use the module.

I put the question to my friend [Glenn Block](http://twitter.com/gblock) as he pointed me to the library to see if he knew what the problem might be, or at least how to find the logs. He suggested that the problem might be due to the path length, Windows has limitations on the length of the file paths, and when you start looking at the dependency graph for the module it gets crazy, in particular because it takes a dependency on the Azure SDK (which in turn has its own dependency chain each with dependencies, and so on).

After some investigation it turned out that if you don't include the Azure SDK dependency then it deploys fine, bluesky doesn't work, but at least the deployment works... Baby steps ;).

So how do we work around that? It struck me that when you've got these scripts deployed to your AMS instance the Azure SDK is already available, you don't need to include it in your repository, you just do:

    var azure = require('azure');

And you have the SDK at your finger tips.

Now, conveniently bluesky takes this into account already! Rather than passing your credentials in like so:

    var storage = require('bluesky').storage({ account: '...', key: '...' });

You can provide it with Azure services:

    var azure = require('azure');
    var storage = require('bluesky').storage({
        blobService: azure.createBlobService('account', 'key').withFilter(new azure.LinearRetryPolicyFilter()),
        tableService: azure.createTableService('account', 'key').withFilter(new azure.LinearRetryPolicyFilter()),
        queueService = azure.createQueueService('account', 'key').withFilter(new azure.LinearRetryPolicyFilter())
    });

And there we have it, we can use the Azure SDK that's already on the server and avoid the path depth problem.