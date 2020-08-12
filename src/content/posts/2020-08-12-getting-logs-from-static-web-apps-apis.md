+++
title = "Getting Logs From Static Web Apps APIs"
date = 2020-08-12T14:35:09+10:00
description = "A quick tip on how to make it easier to diagnose production problems with Static Web Apps"
draft = false
tags = ["serverless"]
+++

I've been doing a lot recently with [Azure Static Web Apps](http://docs.microsoft.com/azure/static-web-apps?{{<cda>}}), mainly because I find it to be a service that really fits me needs. Sometimes though, I write code that has a bug in it, especially in the Functions backend, and that can be difficult to diagnose.

The other day I found myself in such a situation, the API worked locally, but when deployed to Azure it didn't. _sigh_ And as the service is in preview the debugging story is still not great. _sigh again_

Now, we know that the API for the Static Web Apps is [Azure Functions](https://docs.microsoft.com/azure/azure-functions?{{<cda>}}) and Functions integrates with [App Insights](https://docs.microsoft.com/azure/azure-functions/functions-monitoring?{{<cda>}}), so I figured there has to be some way to tap into that.

First up, we need to create an [Application Insights](https://portal.azure.com/?{{<cda>}}#create/Microsoft.AppInsights) resource in Azure:

![Create a new resource](/images/getting-logs-from-swa/001.png)

Once the resource is created, copy the **Instrumentation Key** for it:

![Instrumentation Key location](/images/getting-logs-from-swa/002.png)

Now we can head over to our Static Web App, then navigate to it's **Configuration** and click **Add**:

![Add Configuration](/images/getting-logs-from-swa/003.png)

We need to add a new configuration value named `APPINSIGHTS_INSTRUMENTATIONKEY` which has the value of your **Instrumentation Key**. Once this is saved the Functions are restarted and connected to App Insights. All that's left is to start generating some errors and check out the `exceptions` query.

A bonus tip is that if you want to look at anything you write out to the logs of Azure Functions (`context.log` in JavaScript), they are available in the `traces` table.

## Conclusion

It's not immediately obvious how to connect up a Static Web Apps backend API to App Insights, but as it's Functions under the hood it really only takes a `APPINSIGHTS_INSTRUMENTATIONKEY` being set. And since configuration values are per-environment, you can use a different App Insights for your non-production instance easily.

And a shout-out to [Anthony Chu](https://anthonychu.ca/) who pointed me in this direction.
