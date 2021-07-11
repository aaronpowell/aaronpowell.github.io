+++
title = "GraphQL on Azure: Part 7 - Server-side Authentication"
date = 2021-07-05T01:51:57Z
description = "It's time to talk authentication, and how we can do that with GraphQL on Azure"
draft = false
tags = ["azure", "javascript", "graphql"]
tracking_area = "javascript"
tracking_id = "12581"
series = "graphql-azure"
series_title = "Server-Side Authentication"
+++

In our journey into GraphQL on Azure we've only created endpoints that can be accessed by anyone. In this post we'll look at how we can add authentication to our GraphQL server.

For the post, we'll use the [Apollo Server](https://www.apollographql.com/docs/apollo-server/) and [Azure Static Web Apps](https://docs.microsoft.com/azure/static-web-apps/?{{<cda>}}) for hosting the API, mainly because SWA [provides security](https://docs.microsoft.com/azure/static-web-apps/authentication-authorization?{{<cda>}}) (and if you're wondering, this is how I came across the need to write [this last post]({{<ref "/posts/2021-07-02-calling-static-web-apps-authenticated-endpoints.md">}})).

If you're new to GraphQL on Azure, I'd encourage you to check out [part 3]({{<ref "/posts/2020-08-07-graphql-on-azure-part-3-serverless-with-javascript.md">}}) in which I go over how we can create a GraphQL server using Apollo and deploy that to an Azure Function, which is the process we'll be using for this post.

## Creating an application

The application we're going to use today is a basic blog application, in which someone can authenticate against, create a new post with markdown and before saving it (it'll just use an in-memory store). People can then comment on a post, but only if they are logged in.

Let's start by defining set of types for our schema:

```graphql
type Comment {
    id: ID!
    comment: String!
    author: Author!
}

type Post {
    id: ID!
    title: String!
    body: String!
    author: Author!
    comments: [Comment!]!
    comment(id: ID!): Comment
}

type Author {
    id: ID!
    userId: String!
    name: String!
    email: String
}
```

We'll add some queries and mutations, along with the appropriate input types:

```graphql
type Query {
    getPost(id: ID!): Post
    getAllPosts(count: Int! = 5): [Post!]!
    getAuthor(userId: String!): Author
}

input CreatePostInput {
    title: String!
    body: String!
    authorId: ID!
}

input CreateAuthorInput {
    name: String!
    email: String
    userId: String!
}

input CreateCommentInput {
    postId: ID!
    authorId: ID!
    comment: String!
}

type Mutations {
    createPost(input: CreatePostInput!): Post!
    createAuthor(input: CreateAuthorInput!): Author!
    createComment(input: CreateCommentInput!): Post!
}

schema {
    query: Query
    mutation: Mutations
}
```

And now we have our schema ready to use. So let's talk about authentication.

## Authentication in GraphQL

Authentication in GraphQL is an interesting problem, as the language doesn't provide anything for it, but instead relies on the server to provide the authentication and for you to work out how that is applied to the queries and mutations that schema defines.

Apollo provides [some guidance on authentication](https://www.apollographql.com/docs/apollo-server/security/authentication), through the use of a `context` function, that has access to the incoming request. We can use this function to unpack the SWA authentication information and add it to the `context` object. To get some help here, we'll use the [`@aaronpowell/static-web-apps-api-auth`](https://github.com/aaronpowell/azure-static-web-apps-api-auth) library, as it can tell us if someone is logged in and unpack the client principal from the header.

Let's implement a `context` function to add the authentication information from the request (for this post, I'm going to skip over some of the building blocks and implementation details, such as how resolvers work, but you can find them in the complete sample at the end):

```typescript
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ request }: { request: HttpRequest }) => {
        return {
            isAuthenticated: isAuthenticated(request),
            user: getUserInfo(request)
        };
    }
});
```

Here we're using the npm package to set the `isAuthenticated` and `user` properties of the context, which works by unpacking the [SWA authentication information from the header](https://docs.microsoft.com/azure/static-web-apps/user-information?tabs=javascript&{{<cda>}}#api-functions) (you don't _need_ my npm package, it's just helpful).

## Applying Authentication with custom directives

This `context` object will be available in all resolvers, so we can check if someone is authenticated and the user info, if required. So now that that's available, how do we apply the authentication rules to our schema? It would make sense to have something at a schema level to handle this, rather than a set of inline checks within the resolvers, as then it's clear to someone reading our schema what the rules are.

GraphQL Directives are the answer. Directives are a way to add custom behaviour to GraphQL queries and mutations. They're defined in the schema, and can be applied to a type, field, argument or query/mutation.

Let's start by defining a directive that, when applied somewhere, requires a user to be authenticated:

```graphql
directive @isAuthenticated on OBJECT | FIELD_DEFINITION
```

This directive will be applied to any type, field or argument, and will only be applied if the `isAuthenticated` property of the context is `true`. So, where shall we use it? The logical first place is on all mutations that happen, so let's update the mutation section of the schema:

```graphql
type Mutations @isAuthenticated {
    createPost(input: CreatePostInput!): Post!
    createAuthor(input: CreateAuthorInput!): Author!
    createComment(input: CreateCommentInput!): Post!
}
```

We've now added `@isAuthenticated` to the `Mutations` _Object Type_ in the schema. We could have added it to each of the _Field Definitions_, but it's easier to just add it to the `Mutations` _Object Type_, want it on all mutations. Right now, we don't have any query that would require authentication, so let's just stuck with the mutation.

## Implementing a custom directive

Defining the Directive in the schema only tells GraphQL that this is a _thing_ that the server can do, but it doesn't actually do anything. We need to implement it somehow, and we do that in Apollo by creating a class that inherits from `SchemaDirectiveVisitor`.

```typescript
import { SchemaDirectiveVisitor } from "apollo-server-azure-functions";

export class IsAuthenticatedDirective extends SchemaDirectiveVisitor {}
```

As this directive can support either Object Types or Field Definitions we've got two methods that we need to implement:

```typescript
import { SchemaDirectiveVisitor } from "apollo-server-azure-functions";

export class IsAuthenticatedDirective extends SchemaDirectiveVisitor {
    visitObject(type: GraphQLObjectType) {}

    visitFieldDefinition(
        field: GraphQLField<any, any>,
        details: {
            objectType: GraphQLObjectType;
        }
    ) {}
}
```

To implement these methods, we're going to need to override the `resolve` function of the fields, whether it's all fields of the Object Type, or a single field. To do this we'll create a common function that will be called:

```typescript
import { SchemaDirectiveVisitor } from "apollo-server-azure-functions";

export class IsAuthenticatedDirective extends SchemaDirectiveVisitor {
    visitObject(type: GraphQLObjectType) {
        this.ensureFieldsWrapped(type);
        type._authRequired = true;
    }

    visitFieldDefinition(
        field: GraphQLField<any, any>,
        details: {
            objectType: GraphQLObjectType;
        }
    ) {
        this.ensureFieldsWrapped(details.objectType);
        field._authRequired = true;
    }

    ensureFieldsWrapped(objectType: GraphQLObjectType) {}
}
```

You'll notice that we always pass in a `GraphQLObjectType` (either the argument or unpacking it from the field details), and that's so we can normalise the wrapper function for all the things we need to handle. We're also adding a `_authRequired` property to the field definition or object type, so we can check if authentication is required.

_Note: If you're using TypeScript, as I am in this codebase, you'll need to extend the type definitions to have the new fields as follows:_

```typescript
import { GraphQLObjectType, GraphQLField } from "graphql";

declare module "graphql" {
    class GraphQLObjectType {
        _authRequired: boolean;
        _authRequiredWrapped: boolean;
    }

    class GraphQLField<TSource, TContext, TArgs = { [key: string]: any }> {
        _authRequired: boolean;
    }
}
```

It's time to implement `ensureFieldsWrapped`:

```typescript
  ensureFieldsWrapped(objectType: GraphQLObjectType) {
    if (objectType._authRequiredWrapped) {
      return;
    }
    objectType._authRequiredWrapped = true;

    const fields = objectType.getFields();

    for (const fieldName of Object.keys(fields)) {
      const field = fields[fieldName];
      const { resolve = defaultFieldResolver } = field;
      field.resolve = isAuthenticatedResolver(field, objectType, resolve);
    }
  }
```

We're going to first check if the directive has been applied to this object already or not, since the directive might be applied multiple times, we don't need to wrap what's already wrapped.

Next, we'll get all the fields off the Object Type, loop over them, grab their `resolve` function (if defined, otherwise we'll use the default GraphQL field resolver) and then wrap that function with our `isAuthenticatedResolver` function.

```typescript
const isAuthenticatedResolver = (
    field: GraphQLField<any, any>,
    objectType: GraphQLObjectType,
    resolve: typeof defaultFieldResolver
): typeof defaultFieldResolver => (...args) => {
    const authRequired = field._authRequired || objectType._authRequired;

    if (!authRequired) {
        return resolve.apply(this, args);
    }

    const context = args[2];

    if (!context.isAuthenticated) {
        throw new AuthenticationError(
            "Operation requires an authenticated user"
        );
    }
    return resolve.apply(this, args);
};
```

This is kind of like partial application, but in JavaScript, we're creating a function that takes some arguments and in turn returns a new function that will be used at runtime. We're going to pass in the field definition, the object type, and the original `resolve` function, as we'll need those at runtime, so this captures them in the closure scope for us.

For the resolver, it is going to look to see if the field or object type required authentication, if not, return the result of the original resolver.

If it did, we'll grab the `context` (which is the 3rd argument to an Apollo resolver), check if the user is authenticated, and if not, throw an `AuthenticationError`, which is provided by Apollo, and if they are authenticated, we'll return the original resolvers result.

## Using the directive

We've added the directive to our schema, created an implementation of what to do with that directive, all that's left is to tell Apollo to use it.

For this, we'll update the `ApolloServer` in our `index.ts` file:

```typescript
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ request }: { request: HttpRequest }) => {
        return {
            isAuthenticated: isAuthenticated(request),
            user: getUserInfo(request)
        };
    },
    schemaDirectives: {
        isAuthenticated: IsAuthenticatedDirective
    }
});
```

The `schemaDirectives` property is where we'll tell Apollo to use our directive. It's a key/value pair, where the key is the directive name, and the value is the implementation.

## Conclusion

And we're done! This is a pretty simple example of how we can add authentication to a GraphQL server using a custom directive that uses the authentication model of Static Web Apps.

We saw that using a custom directive allows us to mark up the schema, indicating, at a schema level, which fields and types require authentication, and then have the directive take care of the heavy lifting for us.

You can find the full sample application, including a React UI [on my GitHub](https://github.com/aaronpowell/graphql-auth), and the deployed app [is here](https://icy-moss-07b0f1e0f.azurestaticapps.net/), but remember, it's an in-memory store so the data is highly transient.

## Bonus - restricting data to the current user

If we look at the `Author` type, there's some fields available that we might want to restrict to just the current user, such as their email or ID. Let's create an `isSelf` directive that can handle this for us.

```graphql
directive @isSelf on OBJECT | FIELD_DEFINITION

type Author {
    id: ID! @isSelf
    userId: String! @isSelf
    name: String!
    email: String @isSelf
}
```

With this we're saying that the `Author.name` field is available to anyone, but everything else about their profile is restricted to just them. Now we can implement that directive:

```typescript
import { UserInfo } from "@aaronpowell/static-web-apps-api-auth";
import {
    AuthenticationError,
    SchemaDirectiveVisitor
} from "apollo-server-azure-functions";
import { GraphQLObjectType, defaultFieldResolver, GraphQLField } from "graphql";
import { Author } from "../generated";
import "./typeExtensions";

const isSelfResolver = (
    field: GraphQLField<any, any>,
    objectType: GraphQLObjectType,
    resolve: typeof defaultFieldResolver
): typeof defaultFieldResolver => (...args) => {
    const selfRequired = field._isSelfRequired || objectType._isSelfRequired;

    if (!selfRequired) {
        return resolve.apply(this, args);
    }

    const context = args[2];

    if (!context.isAuthenticated || !context.user) {
        throw new AuthenticationError(
            "Operation requires an authenticated user"
        );
    }

    const author = args[0] as Author;
    const user: UserInfo = context.user;

    if (author.userId !== user.userId) {
        throw new AuthenticationError(
            "Cannot access data across user boundaries"
        );
    }

    return resolve.apply(this, args);
};

export class IsSelfDirective extends SchemaDirectiveVisitor {
    visitObject(type: GraphQLObjectType) {
        this.ensureFieldsWrapped(type);
        type._isSelfRequired = true;
    }

    visitFieldDefinition(
        field: GraphQLField<any, any>,
        details: {
            objectType: GraphQLObjectType;
        }
    ) {
        this.ensureFieldsWrapped(details.objectType);
        field._isSelfRequired = true;
    }

    ensureFieldsWrapped(objectType: GraphQLObjectType) {
        if (objectType._isSelfRequiredWrapped) {
            return;
        }

        objectType._isSelfRequiredWrapped = true;

        const fields = objectType.getFields();

        for (const fieldName of Object.keys(fields)) {
            const field = fields[fieldName];
            const { resolve = defaultFieldResolver } = field;
            field.resolve = isSelfResolver(field, objectType, resolve);
        }
    }
}
```

This directive does take an assumption on how it's being used, as it assumes that the first argument to the `resolve` function is an `Author` type, meaning it's trying to resolve the Author through a query or mutation return, but otherwise it works very similar to the `isAuthenticated` directive, it ensures someone is logged in, and if they are, it ensures that the current user is the Author requested, if not, it'll raise an error.
