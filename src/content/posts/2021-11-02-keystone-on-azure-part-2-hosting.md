+++
title = "Keystone on Azure: Part 2 - Hosting"
date = 2021-11-02T01:28:25Z
description = "We've got local dev with Keystone working, now we'll look at what we need for hosting"
draft = false
tags = ["azure", "graphql", "javascript"]
tracking_area = "javascript"
tracking_id = "38807"
series = "keystone-on-azure"
series_title = "Hosting"
+++

In today's article, we're going to look at what resources in Azure we're going to need to host Keystone.

At its core Keystone is an Express.js application so we're going to need some way to host this. Alas, that means that my standard hosting model in Azure, [Azure Functions](https://docs.microsoft.com/azure/azure-functions/functions-overview?{{<cda>}}), is off the table. It's not setup for hosting a full web server like we have with Express.js, so we need something else.

## Databases

For data storage, Keystone uses [Prisma](https://www.prisma.io/) to do data access normalisation, no need for separate providers for the different SQL databases or MongoDB, etc. but they are restricting support of the database to SQLite and PostgreSQL for the time being.

SQLite shouldn't be used for production, so instead, we'll use [Azure Database for PostgreSQL](https://docs.microsoft.com/azure/postgresql/?{{<cda>}}), which gives us a managed PostgreSQL instance (or cluster, depending on the scale needs). No need to worry about backup management, patching, etc. just leverage the hosted service in Azure and simplify it all.

## Azure AppService

The service in Azure that we're going to want is [AppService](https://docs.microsoft.com/azure/app-service/overview?{{<cda>}}) (it's also called WebApps in some places, but for simplicities sake, I'll use the official service name). AppService gives you a a Platform as a Service (PaaS) hosting model, meaning we're not going to need to worry about underlying hosting infrastructure (OS management, disk management, etc.), we just select the scale that we need and Azure takes care of it.

My preference for Node.js apps is to host on a Linux AppService, rather than a Windows host, and that's mainly because my experience has suggested that it's a better fit, but at the end of the day, the OS doesn't make any difference, as in a PaaS model, you don't have to care about the host.

_Side note - when you're running on a Linux AppService, it's actually running within a Container, not directly on the host. This is different to [AppService Containers](https://azure.microsoft.com/services/app-service/containers/?{{<cda>}}) which is for BYO Containers. Either way, for doing diagnostics, you may be directed to Docker output logging._

## Storing images and files

Since we're using PaaS hosting, we need some way to store images and files that the content editor uploads in a way that doesn't use the local disk. After all, the local disk isn't persistent in PaaS, as you scale, redeploy, or Azure needs to reallocate resources, the local disk of your host is lost.

This is where [Azure Storage](https://azure.microsoft.com/services/storage/blobs/?{{<cda>}}) is needed. Files are pushed into it as blobs and then accessed on demand. There is several security modes in which you can store blobs, but the one that's most appropriate for a tool like Keystone is to use Anonymous Blob Access, which means that anyone can access the Blob in a read-only manner, but they are unable to enumerate over the container and find other blobs that are in there.

To work with Azure Storage in Keystone, you need to use a custom field that I've created for the [k6-contrib](https://github.com/keystonejs-contrib/k6-contrib) project [`@k6-contrib/fields-azure`](https://npm.im/@k6-contrib/fields-azure). The fields can be used either with the [Azurite emulator](https://docs.microsoft.com/azure/storage/common/storage-use-azurite?tabs=visual-studio-code&{{<cda>}}) or an Azure Storage account, allowing for disconnected local development if you'd prefer.

## Conclusion

Today we've started exploring the resources that we'll need when it comes time to deploy Keystone to Azure. While it's true you can use different resources, Virtual Machines, Container orchestration, etc., I find that using a PaaS model with AppService, and a managed PostgreSQL the best option as it simplifies the infrastructure management that is needing to be undertaken by the team, and instead they can focus on the application at hand.
