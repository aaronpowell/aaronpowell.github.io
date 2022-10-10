+++
title = "GraphQL on Azure: Part 11 - Avoiding DoS Queries"
date = 2022-10-10T00:42:25Z
description = "Graphs are great for DoS queries, so how can we prevent them?"
draft = false
tags = ["azure", "graphql"]
tracking_area = "javascript"
tracking_id = "7129"
series = "graphql-azure"
series_title = "Avoiding DoS in queries"
+++

In the previous post in this series we added a new "virtual" field to our GraphQL schema for `Post`, `related`:

```graphql {hl_lines=[9]}
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

But in doing so, we added a problem, let's take this query as an example:

```graphql
query {
  posts {
    related {
      related {
        related {
          related {
            related {
              related {
                related {
                  related {
                    title
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

Oh dear... What's going to happen here? Exactly what you think, a series of recursive queries against my API and I've just created a Denial of Service, DoS, attack vector against my server (it's no a DDoS attack since it's not distributed).

But this is perfectly valid from a GraphQL standpoint, it's just walking the graph which we told it to expose, but I didn't want it to bring down my server! And while this is a single type GraphQL schema, it would be realistic that in a more complex schema that you'll have types that can recurse through other types back to the original.

## Azure API Management GraphQL policies

Good news, we can solve this ourselves by leveraging APIM policies, this time we'll use the [`<validate-graphql-request>` policy](https://learn.microsoft.com/azure/api-management/graphql-policies?{{<cda>}}#validate-graphql-request).

This policy is an _inbound_ policy, which means that it'll be applied before the request is passed to our backend, or in this case, the GraphQL resolver policies, allowing us to intercept and, well, validate it against rules we predefined.

We're going to focus on the two top-level attributes of the policy, `max-size` and `max-depth`.

The `max-size` policy is used to enforce an inbound request size limit, say, reject any requested over 100kb, so that you are limiting the amount of data that can be retried in a single request as an excessive query size may result in an excessive database operation being performed.

We'll add this to the `<inbound>` section of our APIM policy:

```xml
<policies>
    <inbound>
        <base />
        <validate-graphql-request error-variable-name="size" max-size="10240" />
    </inbound>
    <!-- snip -->
</policies>
```

This is a useful policy to have in place, especially if you have a large GraphQL schema that exposes a lot of different types and fields, but it's not really going to solve in our problem, it'll take quite a lot of nesting to hit the size cap. Instead, we want to use the `max-depth` part of the policy.

With `max-depth`, we can specify how many levels of nesting a request is allowed to do before we reject the query, let's update the policy:

```xml
<policies>
    <inbound>
        <base />
        <validate-graphql-request error-variable-name="size" max-size="10240" max-depth="3" />
    </inbound>
    <!-- snip -->
</policies>
```

One thing to be away of with `max-depth` is that it's using a 1-based index, starting with the GraphQL operation type (`query` or `mutation`), meaning that a depth of 3 would allow this:

```graphql
query {
  postsByTag(tag: "graphql") {
    title
    related {
      title
    }
  }
}
```

But this query is invalid:

```graphql
query {
  postsByTag(tag: "graphql") {
    title
    related {
      title
      related {
        title
      }
    }
  }
}
```

And if you execute the query above it'll give you a `400 Bad Request` status, with the following body:

```json
{
  "statusCode": 400,
  "message": "The query is too nested to execute, its depth is more than 3 "
}
```

Success! We've created a block at the gateway level, meaning that we won't even worry about the downstream servers being hit by rogue queries.

## Conclusion

One of the easy to overlook aspects of GraphQL is that you're working with a graph and you can make recursive references in the graph that can be walked, and exploited, resulting in a DoS attack vector against your backend.

But it's something that we can easily handle with the GraphQL policies in Azure API Management.

Using the `max-depth` part of the `<validate-graphql-request>` policy will allow us to prevent excessive nesting in the operation performed by a client, and we can combine that with the `max-size` attribute to avoid large, flat requests.

There are other rules that we can set on the policy, such as restricting access to certain resolver fields or paths, but I'll leave that as an exercise to the reader. 😉
