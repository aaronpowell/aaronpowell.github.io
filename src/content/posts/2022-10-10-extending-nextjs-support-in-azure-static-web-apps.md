+++
title = "Extending Next.js Support in Azure Static Web Apps"
date = 2022-10-10T06:40:28Z
description = "We're improving the support for Next.js on Azure Static Web Apps, check out what's new!"
draft = false
tags = ["azure", "javascript", "serverless"]
tracking_area = "javascript"
tracking_id = ""
+++

Next.js is one of the most popular JavaScript frameworks for building complex, server-driven React applications, combining the features that make React a useful UI library with server-side rendering, built-in API support and SEO optimizations.

With today’s preview release, we’re improving support for Next.js on Azure Static Web Apps.

## What’s new

In this preview we’re focusing on making zero-config deployments with Next.js even easier than it’s been before by including support for Server-Side Rendering and Incremental Static Regeneration (SSR and ISR respectively), API Routes, advanced image compression, and Next.js Auth. In this post, we want to highlight three features that make building Next.js apps on Azure more powerful.

### Server-Side Rendering

When we first launched Static Web Apps, we ensured we had support for Next.js, but our focus on this was [_Static-Site Generation_](https://nextjs.org/docs/basic-features/pages#static-generation-recommended) or SSG. SSG takes the application and compiles static HTML from it that is then served and while SSG is useful in some scenarios it doesn’t support dynamic updates to the content of the page _per request_.

This is where _Server-Side Rendering_, or SSR, comes in. With SSR you can inject data from a backend data source before the HTML is sent to the client, aka in the _pre-rendering_ phase, allowing for more contextual, real-time updates to the data. Check out [Next.js’s docs for more on SSR](https://nextjs.org/docs/basic-features/pages#server-side-rendering).

For this demo we’ll add a _getServerSideProps_ function to our _index.js_ file that has the current timestamp:

```js
export async function getServerSideProps() {
  const data = JSON.stringify({ time: new Date() });
  return { props: { data } };
}
```

We can then consume this in the component:

```js
export default function Home({ data }) {
  const serverData = JSON.parse(data);
  // snip
```

And then output the date timestamp.

![Server-rendered data](/images/2022-10-10-extending-next.js-support-in-azure-static-web-apps/ssr.gif)

### API routes

API routes allow us to build a backend API for the client-side components of our Next.js app to communicate with and get data from other systems. These are added to a project by creating an _api_ folder within our Next.js app and defining JavaScript (or TypeScript) files with exported functions that Next.js will turn into APIs that can be called to return JSON to the client.

API routes can be as simple as masking an external service, or as complex as [hosting a GraphQL server](https://github.com/vercel/next.js/tree/canary/examples/api-routes-graphql), which we’re doing in the example below.

![GraphQL API route](/images/2022-10-10-extending-next.js-support-in-azure-static-web-apps/api-routes.gif)

Here you’ll see that we called the API route, /graphql, and got back a GraphQL payload response. You’ll find this sample [on GitHub](https://github.com/aaronpowell/hybrid-next-on-swa).

### Image optimisation

When it comes to ensuring your website is optimized for all web clients, [Web Vitals](https://web.dev/vitals/) is a valuable measure. To help with this Next.js has an [Image component and image optimisation](https://nextjs.org/docs/basic-features/image-optimization). This feature of Next.js also makes it easier to create responsive images on your website and optimise the image being sent to the browser based off the dimensions of the view port and whether the image is currently visible or not.

[You can see this in action](https://blue-smoke-08b09b010.1.azurestaticapps.net/image) where we have deployed the [Next.js image example](https://github.com/vercel/next.js/tree/canary/examples/image-component).

## Deploying with the new Next.js support

When it comes to deploying an application to leverage these Next.js features, you need to select **Next.js** from the _Build Presets_ and leave the rest of the options as their default, as SSR Next.js applications are the default for Static Web Apps. If you wish to use Next.js as a Static Site Generator, you’ll need to add the environment variable _is_static_export_ to your deployment pipeline and set it to _true_ and the output location set to _out_.

## Common Questions

### Can I still use SSG?

Yes! Static rendered Next.js applications are still supported on Static Web Apps, and we encourage you to keep using them if they are the right model for your applications.

Existing Next.js SSG sites should be unaffected by the launch today, although it is encouraged that you add the _is_static_export_ environment flag to your deployment pipeline, ensuring that Static Web Apps correctly identifies the SSG.

### Should I use SSR over SSG?

This is very much an _it depends_ answer. The support announced today for SSR is preview support, meaning that it is not recommended for production workloads, for production we still encourage people to using SSG as their preferred model when working with Next.js. Additionally, echoing the recommendations from Next.js themselves, that SSG should be the preferred model when publishing sites.

SSG sites have a performance benefit over SSR, as the HTML files are created at build time rather than runtime, meaning there is less work for the server to do when producing content, thus increasing performance.

But if you’re looking to use features like dynamic routing, have a very large site that have hundreds (or thousands) of pages, or want to fetch data before sending to the client, SSR will be a better fit for you and worth exploring.

If you’re still unsure which approach to use, check out [this excellent guide](https://vercel.com/blog/nextjs-server-side-rendering-vs-static-generation) from Next.js themselves.

### Can I use Azure Functions or BYO Backends as well as API routes?

No, if you’re deploying a hybrid Next.js application then no additional backend will be available for the site as API routes can be used to achieve much of the same functionality.

## Next steps

This is all exciting and if you’re like me and can’t wait to try out the new features, check out the [sample repo](https://github.com/aaronpowell/hybrid-next-on-swa) from this post then head on over to [our documentation](https://aka.ms/swanextjsssr) and get started with your next Next.js application today.
