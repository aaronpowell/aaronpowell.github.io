+++
title = "GraphQL on Azure: Part 9 - REST to GraphQL"
date = 2022-08-16T00:52:22Z
description = "It can be a lot of work to rewrite your APIs to GraphQL, but what if we could do that on the fly"
draft = false
tags = ["graphql", "azure"]
tracking_area = "javascript"
tracking_id = "48108"
series = "graphql-azure"
series_title = "REST to GraphQL"
+++

Throughout this series we've been exploring many different aspects of using GraphQL in Azure, but it's always been from the perspective of creating a new API. While there are a certain class of problems which support you starting from scratch, it's not uncommon to have an existing API that you're bound to, and in that case, GraphQL might not be as easy to tackle.

Here's a scenario that I want to put forth, you've got an existing API, maybe it's REST, maybe it's a bespoke HTTP API, none the less you're building a new client in which you want to consume the endpoint as GraphQL. We could go down the path of creating an Apollo Server and using the [`RESTDataSource`](https://www.apollographql.com/docs/apollo-server/data/data-sources/#restdatasource-reference), or using HotChocolate's [REST support](https://chillicream.com/docs/hotchocolate/fetching-data/fetching-from-rest), but for both of these approaches we're having to write our own server and deploy some new infrastructure to run it.

What if we could do it without code?

## Introducing Synthetic GraphQL

At Build 2022 [Azure API Management](https://docs.microsoft.com/azure/api-management?{{<cda>}}) (APIM) released a preview of a new feature called [Synthetic GraphQL](https://azure.microsoft.com/updates/public-preview-synthetic-graphql/?{{<cda>}}). Synthetic GraphQL allows you to use APIM as the broker between your GraphQL schema and the HTTP endpoints that provide the data for it, meaning you to convert a backend to GraphQL without having to implement a custom server, instead you use APIM policies.

Let's take a look at how to do this, and for that, I'm going to add an API to my blog.

## Building a REST API for my blog

I've created a really basic REST API for my blog, that takes the JSON file generated [for my search feature]({{<ref "/posts/2019-12-11-optimising-our-blazor-search-app.md">}}) and exposes it using Azure Functions as `/post` for all posts, `/post/:id` for a specific post, and `/tag/:tag` for posts under a certain tag. You can see the implementations [on my GitHub](https://github.com/aaronpowell/aaronpowell.github.io/tree/efa54fbc3cc09472a6dec2c674b4721eef53fc14/api), but they're reasonably simple, here's the `/tag/:tag` one:

```typescript
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { loadPosts } from "../postLoader";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const tag = req.params.tag;

  const posts = await loadPosts();

  const postsByTag = posts.filter((p) => p.tags.some((t) => t === tag));

  if (!postsByTag.length) {
    context.res = {
      status: 404,
    };
  } else {
    context.res = {
      body: postsByTag,
    };
  }
};

export default httpTrigger;
```

Simple, effective, and if you go to [`/api/tag/graphql`](/api/tag/graphql) you'll see a JSON response containing all my blog posts that are tagged with `graphql`.

## Creating a GraphQL schema

Let's go ahead and define a GraphQL schema that we want to expose the REST endpoints via:

```graphql
scalar Url
scalar Date

type Post {
  id: ID!
  title: String!
  url: Url!
  date: Date
  tags: [String!]!
  description: String
  content: String!
}

type Query {
  post(id: ID!): Post
  postsByTag(tag: String!): [Post!]!
}

schema {
  query: Query
}
```

That looks like it'll do, we have a single Object Type, `Post`, that has the relevant fields on it, we have some queries, `post(id: ID!)` and `postsByTag(tag: String!)` that cover the main REST endpoints, and we've even got some custom scalar types in there for fun.

Now let's go and create an APIM endpoint that we can use for this.

## Setting up Synthetic GraphQL

> Note: At the time of writing, Synthetic GraphQL is in public preview, so the approach I'm showing is subject to change as the preview moves towards General Availability (GA). Also, it may not be in all regions or all SKUs, so for this post I'm using **West US** as the region and the **Developer** SKU.

First off, you'll need to create an APIM resource, [here's how to do it via the Azure Portal](https://docs.microsoft.com/azure/api-management/get-started-create-service-instance?{{<cda>}}) (the APIM docs will cover other approaches (CLI, Bicep, VS Code, etc.)). Once the resource has been provisioned, it's time to setup our Synthetic GraphQL API.

On the APIM resource, navigate to the **APIs** section, click _Add API_ and you'll see the different options, including **Synthetic GraphQL**.

![New API options](/images/2022-08-16-graphql-on-azure-part-9-rest-to-graphql/01.png)

Select **Synthetic GraphQL**, provide a name and upload your GraphQL schema then click _Create_ (you don't need to provide the other information if you don't want, but I have provided an **API URL suffix**, so I could run other APIs in this resource if so desired).

![Options to set when creating API](/images/2022-08-16-graphql-on-azure-part-9-rest-to-graphql/02.png)

You'll now find a new API listed with the name provided (**Blog** in my case) and if you click on it you'll find your GraphQL schema parsed as the API frontend.

![API according to APIM](/images/2022-08-16-graphql-on-azure-part-9-rest-to-graphql/03.png)

Congratulations, you've setup a GraphQL endpoint in APIM!

## Defining Resolvers

While we may have told APIM that we want to create an endpoint that you can query with GraphQL, we're missing a critical piece of the puzzle, _resolvers_! APIM knows that we are trying to get GraphQL but it doesn't know how to get the data to send back in your HTTP responses, and for that, we'll use the [`set-graphql-resolver` APIM policy](https://docs.microsoft.com/azure/api-management/graphql-policies?{{<cda>}}#set-graphql-resolver) to, well, set a GraphQL resolver for parts of our schema.

The `set-graphql-resolver` policies are added to the `<backend>` section of our APIM policy list and it will require a `parent-type` and the `field` that the resolver is for. Let's start by defining the `post(id: ID!)` field of the `Query`, and we'll do that by opening the **Policy Editor** for our API:

![Policy Editor](/images/2022-08-16-graphql-on-azure-part-9-rest-to-graphql/04.png)

From here, find the `<backend>` node and start creating our policy:

```xml
<backend>
  <set-graphql-resolver parent-type="Query" field="post">
  </set-graphql-resolver>
  <base />
</backend>
```

_Note: We'll leave the `<base />` policy in as well, as that will ensure any global policies on our API are also executed._

With the policy linked to the GraphQL schema, we need to "implement" the resolver and tell it to call our HTTP endpoint, and for that we'll use the `http-data-source`:

```xml
<backend>
  <set-graphql-resolver parent-type="Query" field="post">
    <http-data-source>
      <http-request>
        <set-method>GET</set-method>
        <set-url>@{
            var id = context.Request.Body.As<JObject>(true)["arguments"]["id"];
            return $"https://www.aaron-powell.com/api/post/{id}";
        }</set-url>
        <set-header name="Content-Type" exists-action="override">
          <value>application/json</value>
        </set-header>
      </http-request>
    </http-data-source>
  </set-graphql-resolver>
  <base />
</backend>
```

For our `http-data-source`, we'll define the `http-request` information, in this case we're setting the HTTP method as GET and that we're expecting JSON as the Content-Type header, but the most interesting bit is the `set-url` node, in which we define the URL that our HTTP call will make.

Since the `posts` field takes an argument of `id`, and that's needed in our API call, we run a code snippet that will parse the request body, find the `arguments` property and get the `id` member of it, which we assign to a variable and then generate the URL that APIM will need to call. While this is a simple case of passing something across as a URL parameter, you could do something more dynamic like conditionally choosing a URL based on the arguments, or if it was a HTTP POST you could use [`set-body`](https://docs.microsoft.com/azure/api-management/api-management-transformation-policies?{{<cda>}}#SetBody) to build up a request body to POST to the API (which might be more applicable in a mutation than a query).

Let's repeat the same thing for our `postsByTag` field:

```xml
<backend>
  <set-graphql-resolver parent-type="Query" field="post">
    <http-data-source>
      <http-request>
        <set-method>GET</set-method>
        <set-url>@{
            var id = context.Request.Body.As<JObject>(true)["arguments"]["id"];
            return $"https://www.aaron-powell.com/api/post/{id}";
        }</set-url>
        <set-header name="Content-Type" exists-action="override">
          <value>application/json</value>
        </set-header>
      </http-request>
    </http-data-source>
  </set-graphql-resolver>
  <set-graphql-resolver parent-type="Query" field="postsByTag">
    <http-data-source>
      <http-request>
        <set-method>GET</set-method>
        <set-url>@{
            var tag = context.Request.Body.As<JObject>(true)["arguments"]["tag"];
            return $"https://www.aaron-powell.com/api/tag/{tag}";
        }</set-url>
        <set-header name="Content-Type" exists-action="override">
          <value>application/json</value>
        </set-header>
      </http-request>
    </http-data-source>
  </set-graphql-resolver>
  <base />
</backend>
```

Once you're done, hit **Save** and navigate to the **Test** console for the API and we'll be able to execute our queries:

![Executing a test query, with the tag as a variable and results shown](/images/2022-08-16-graphql-on-azure-part-9-rest-to-graphql/05.png)

And there we have it, we've created a GraphQL API that is really just fronting our existing REST API.

## Making our GraphQL endpoint callable

The only thing left to do is to make our GraphQL endpoint callable by clients. There's an [easy to follow tutorial](https://docs.microsoft.com/azure/api-management/api-management-howto-add-products?tabs=azure-portal&{{<cda>}}) on the APIM docs (which I followed myself!) and I setup a _Product_ like so:

![My APIM product to call the GraphQL endpoint](/images/2022-08-16-graphql-on-azure-part-9-rest-to-graphql/06.png)

Once the product was setup, I added a subscription for myself, copied the subscription key, opened up Postman and executed a query.

![Calling from Postman](/images/2022-08-16-graphql-on-azure-part-9-rest-to-graphql/07.png)

## Conclusion

Throughout this post, we've looked at how to create a Synthetic GraphQL API using Azure APIM Management, aka APIM, that is a wrapper around a REST API that I already had existing on my website.

We defined a `set-graphql-resolver` policy on the API backend that told APIM how to convert the GraphQL query into a REST call, and sent it to the API.

Since the way we defined our schema doesn't require us to do any transformation of the returned data, our REST and GraphQL types are matching, we didn't need to do any additional processing with the `http-response` part of the `set-graphql-resolver`, but if you need to change the returned data structure, add additional headers, or any other response manipulations, you can use that to do it.

Hopefully this has shown you just how easy it is to provide a GraphQL interface over a HTTP backend, without having to write a full GraphQL server to do it.

If you do have a go with this, I'd love to hear how you find it.
