+++
title = "GraphQL on Azure: Part 10 - Synthetic GraphQL Custom Responses"
date = 2022-08-17T05:01:21Z
description = "With Synthetic GraphQL we created resolvers to pass-through to REST calls, but what if we want to have resolvers on types other than Query"
draft = false
tags = ["azure", "graphql"]
tracking_area = "javascript"
tracking_id = "48108"
series = "graphql-azure"
series_title = "Synthetic GraphQL Custom Responses"
+++

Continuing on from [the last post]({{<ref "/posts/2022-08-16-graphql-on-azure-part-9-rest-to-graphql.md">}}) in which we used [Azure API Management's](https://docs.microsoft.com/azure/api-management?{{<cda>}}) (APIM) [Synthetic GraphQL](https://azure.microsoft.com/updates/public-preview-synthetic-graphql/?{{<cda>}}) feature to create a GraphQL endpoint for my blog, I wanted to explore how to add a completely new field to our type - Related Posts.

Using the schema editor in APIM I added a new field to the `Post` type of `related(tag: String): [Post!]`, so our type now looks like this:

```graphql
type Post {
  id: ID!
  title: String!
  url: Url!
  date: Date
  tags: [String!]!
  description: String
  content: String!
  related(tag: String): [Post!]
}
```

The way this field resolver will work is that if you provide a `tag` argument to `related` then it'll return posts that also have that tag (while first validating that the tag is a tag of the `Post`), and if you don't provide a `tag` argument, it'll return all posts that have the same tags as the current `Post`.

_Aside: I have updated the `/api/tag` endpoint that if you provide a comma-separated string, it'll split those and return posts that match all those tags as it previously only supported a single tag._

## Building a resolver

As this is an entirely fabricated field, we're going to have to make a custom resolver in APIM using the [`set-graphql-resolver` policy](https://docs.microsoft.com/azure/api-management/graphql-policies?{{<cda>}}#set-graphql-resolver). The resolver is going to need two pieces of data, the `tags` of the current `Post` and the `tag` argument provided. As we learnt in the last post, we can get the arguments off the GraphQL request context as `context.Request.Body.As<JObject>(true)["arguments"]`, but what about the `Post`?

In GraphQL, the resolver that's being executed has access to the _parent_ in the graph, and in our case the parent of `related` is the `Post`, and we can access that by `context.ParentResult`.

With that setup, we can write our resolver like so:

```xml
<set-graphql-resolver parent-type="Post" field="related">
    <http-data-source>
        <http-request>
            <set-method>GET</set-method>
            <set-url>@{
                var postTags = context.ParentResult.AsJObject()["tags"].ToObject<string[]>().ToList();
                var requestedTag = context.Request.Body.As<JObject>(true)["arguments"]["tag"].ToString();

                if (!string.IsNullOrEmpty(requestedTag)) {
                    if (postTags.IndexOf(requestedTag) < 0) {
                        return null;
                    }

                    return $"https://www.aaron-powell.com/api/tag/{requestedTag}";
                }

                return $"https://www.aaron-powell.com/api/tag/{string.Join(",", postTags)}";
            }</set-url>
        </http-request>
    </http-data-source>
</set-graphql-resolver>
```

Notice that this time the `parent-type` is `Post` not `Query`, and we have a slightly more complex bit of C# code that generates the URL we'll call, applying the logic that was stated above.

Let's fire off the request and see what we get back:

```graphql
query {
  post(id: "2022-08-16-graphql-on-azure-part-9-rest-to-graphql") {
    title
    tags
    related {
      title
      tags
    }
  }
}
```

![Response from the GraphQL request for title and tags, then related posts with title and tags](/images/2022-08-17-graphql-on-azure-part-10-synthetic-graphql-custom-responses/01.png)

Great, it's worked as expected... except we ended up with the post that we specified the ID of in the related posts. While that might be _technically_ true that it's related to itself, it's not _really_ what we're expecting.

## Cleaning our results

We're going to want to do something that removes the current post from its related posts, and to do that we're going to need to either make our REST API aware of the current `Post` and filter it out, or make our resolver smarter.

Going and rewriting the backend API doesn't seem like the logical choice, after all, the point of Synthetic GraphQL is that we're exposing non-graph data as a graph, so we probably don't want to rework our API to be more "GraphQL ready". Instead, we can do some post-processing in the data before sending it to the client, using the `http-response` part of our policy and defining a [`set-body`](https://docs.microsoft.com/azure/api-management/api-management-transformation-policies?{{<cda>}}#SetBody) transformation policy.

With `set-body`, we need to provide a template to execute, and this can be a [Liquid template](https://shopify.github.io/liquid/) or C#. Since I'm not familiar with Liquid, but I am with C#, we're going to stick with that. This template is going to need to get the `id` of the current post (which is the parent of the resolver), then iterate through all the posts from the `/tags` call, and remove the current post from the result set.

```xml
<http-response>
    <set-body>@{
        var parentId = context.ParentResult.AsJObject()["id"].ToString();
        var posts = context.Response.Body.As<JArray>();

        var response = new JArray();

        foreach (var post in posts) {
            if (post["id"].ToObject<string>() != parentId) {
                response.Add(post);
            }
        }

        return response.ToString();
    }</set-body>
</http-response>
```

What we see here is that we used the `context.ParentResult` to find the `id`, then parsed the _current_ response as a `JArray` (since we know that the REST call returned a JSON array), then using a `foreach` loop, we check the posts and create a new `JArray` containing the cleaned result set, which we finally return as a string.

This makes our whole resolver look like this:

```xml
<set-graphql-resolver parent-type="Post" field="related">
    <http-data-source>
        <http-request>
            <set-method>GET</set-method>
            <set-url>@{
                var postTags = context.ParentResult.AsJObject()["tags"].ToObject<string[]>().ToList();
                var requestedTag = context.Request.Body.As<JObject>(true)["arguments"]["tag"].ToString();

                if (!string.IsNullOrEmpty(requestedTag)) {
                    if (postTags.IndexOf(requestedTag) < 0) {
                        return null;
                    }

                    return $"https://www.aaron-powell.com/api/tag/{requestedTag}";
                }

                return $"https://www.aaron-powell.com/api/tag/{string.Join(",", postTags)}";
            }</set-url>
        </http-request>
        <http-response>
            <set-body>@{
                var parentId = context.ParentResult.AsJObject()["id"].ToString();
                var posts = context.Response.Body.As<JArray>();

                var response = new JArray();

                foreach (var post in posts) {
                    if (post["id"].ToObject<string>() != parentId) {
                        response.Add(post);
                    }
                }

                return response.ToString();
            }</set-body>
        </http-response>
    </http-data-source>
</set-graphql-resolver>
```

Let's make the GraphQL call again:

![Postman request showing the right results](/images/2022-08-17-graphql-on-azure-part-10-synthetic-graphql-custom-responses/02.png)

Fantastic, we're now only getting the data that we expect.

## Summary

This post builds on the [last one]({{<ref "/posts/2022-08-16-graphql-on-azure-part-9-rest-to-graphql.md">}}) in how to use [Synthetic GraphQL](https://azure.microsoft.com/updates/public-preview-synthetic-graphql/?{{<cda>}}) to create a GraphQL endpoint from a non-GraphQL backend, but we took it one step further and created a field on our GraphQL type that doesn't exist in our original backend model. And this is what makes Synthetic GraphQL really shine, that we can take our backend and model it in the way that makes the most sense for consumers of it in a graph design.

Yes, it might not be as optimised as if you were writing a true GraphQL server, given that with this particular example doesn't optimise the sub-resolver calls, but that's something for a future post. 😉
