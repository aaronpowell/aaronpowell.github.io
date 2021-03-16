+++
title = "GraphQL on Azure: Part 4 - Serverless CosmosDB"
date = 2020-09-04T11:04:32+10:00
description = "Let's take a look at how to integrate a data source with GraphQL on Azure"
draft = false
tags = ["azure", "serverless", "azure-functions", "dotnet", "graphql"]
series = "graphql-azure"
series_title = "CosmosDB and GraphQL"
tracking_area = "dotnet"
tracking_id = "7129"
+++

A few months ago [I wrote a post]({{<ref "/posts/2020-04-07-using-graphql-in-azure-functions-to-access-cosmosdb.md">}}) on how to use GraphQL with CosmosDB from Azure Functions, so this post might feel like a bit of a rehash of it, with the main difference being that I want to look at it from the perspective of doing .NET integration between the two.

The reason I wanted to tackle .NET GraphQL with Azure Functions is that it provides a unique opportunity, being able to leverage [Function bindings](https://docs.microsoft.com/azure/azure-functions/functions-triggers-bindings?{{<cda>}}). If you're new to Azure Functions, bindings are a way to have the Functions runtime provide you with a connection to another service in a read, write or read/write mode. This could be useful in the scenario of a function being triggered by a file being uploaded to storage and then writing some metadata to a queue. But for todays scenario, we're going to use a HTTP triggered function, our GraphQL endpoint, and then work with a database, [CosmosDB](https://docs.microsoft.com/azure/cosmos-db/?{{<cda>}}).

_Why CosmosDB? Well I thought it might be timely given they have just launched a [consumption plan](https://docs.microsoft.com/azure/cosmos-db/serverless?{{<cda>}}) which works nicely with the idea of a serverless GraphQL host in Azure Functions._

While we have looked at using [.NET for GraphQL]({{<ref "/posts/2020-07-21-graphql-on-azure-part-2-app-service-with-dotnet.md">}}) previously in the series, for this post we're going to use a different GraphQL .NET framework, [Hot Chocolate](https://hotchocolate.io/), so there's going to be some slightly different types to our previous demo, but it's all in the name of exploring different options.

## Getting Started

At the time of writing, Hot Chocolate doesn't **officially** support Azure Functions as the host, but there is a [proof of concept from a contributor](https://github.com/oneCyrus/GraphQL-AzureFunctions-HotChocolate/) that we'll use as our starting point, so start by creating a new [Functions project](https://docs.microsoft.com/azure/azure-functions/functions-create-first-azure-function-azure-cli?tabs=bash%2Cbrowser&pivots=programming-language-csharp&{{<cda>}}):

```bash
func init dotnet-graphql-cosmosdb --dotnet
```

Next, we'll add the NuGet packages that we're going to require for the project:

```xml
<PackageReference Include="Microsoft.Azure.Functions.Extensions" Version="1.0.0" />
<PackageReference Include="Microsoft.NET.Sdk.Functions" Version="3.0.3" />
<PackageReference Include="HotChocolate" Version="10.5.2" />
<PackageReference Include="HotChocolate.AspNetCore" Version="10.5.2" />
<PackageReference Include="Microsoft.Azure.WebJobs.Extensions.CosmosDB" Version="3.0.7" />
```

_These versions are all the latest at the time of writing, but you may want to check out new versions of the packages if they are available._

And the last bit of getting started work is to bring in the proof of concept, so grab all the files from [the GitHub repo](https://github.com/OneCyrus/GraphQL-AzureFunctions-HotChocolate/tree/master/src/HotChocolate.AzureFunctionsMiddleware) and put them into a new folder under your project called `FunctionsMiddleware`.

## Making a GraphQL Function

With the skeleton ready, it's time to make a GraphQL endpoint in our Functions project, and to do that we'll scaffold up a HTTP Trigger function:

```bash
func new --name GraphQL --template "HTTP trigger"
```

This will create a generic function for us and we'll configure it to use the GraphQL endpoint, again we'll use a snippet from the proof of concept:

```csharp
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using HotChocolate.AspNetCore;

namespace DotNet.GraphQL.CosmosDB
{
    public class GraphQL
    {
        private readonly IGraphQLFunctions _graphQLFunctions;

        public GraphQL(IGraphQLFunctions graphQLFunctions)
        {
            _graphQLFunctions = graphQLFunctions;
        }

        [FunctionName("graphql")]
        public async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = null)] HttpRequest req,
            ILogger log,
            CancellationToken cancellationToken)
        {
            return await _graphQLFunctions.ExecuteFunctionsQueryAsync(
                req.HttpContext,
                cancellationToken);
        }
    }
}
```

Something you might notice about this function is that it's no longer a `static`, it has a constructor, and that constructor has an argument. To make this work we're going to need to configure [dependency injection for Functions](https://docs.microsoft.com/azure/azure-functions/functions-dotnet-dependency-injection?{{<cda>}}).

## Adding Dependency Injection

Let's start by creating a new class to our project called `Startup`:

```csharp
using Microsoft.Azure.Functions.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection;

[assembly: FunctionsStartup(typeof(DotNet.GraphQL.CosmosDB.Startup))]

namespace DotNet.GraphQL.CosmosDB
{
    public class Startup : FunctionsStartup
    {
        public override void Configure(IFunctionsHostBuilder builder)
        {
        }
    }
}
```

There's two things that are important to note about this code, first is that we have the `[assembly: FunctionsStartup(...` assembly level attribute which points to the `Startup` class. This tells the Function runtime that we have a class which will do some stuff when the application starts. Then we have the `Startup` class which inherits from `FunctionsStartup`. This base class comes from the `Microsoft.Azure.Functions.Extensions` NuGet package and works similar to the startup class in an ASP.NET Core application by giving us a method which we can work with the startup pipeline and add items to the dependency injection framework.

We'll come back to this though, as we need to create our GraphQL schema first.

## Creating the GraphQL Schema

Like our previous demos, we'll use the trivia app.

We'll start with the model which exists in our CosmosDB store (I've populated a CosmosDB instance with a dump from [OpenTriviaDB](https://opentdb.com/), you'll find the JSON dump [here](https://github.com/aaronpowell/dotnet-graphql-cosmosdb/blob/main/trivia.json)). Create a new folder called `Models` and then a file called `QuestionModel.cs`:

```csharp
using System.Collections.Generic;
using Newtonsoft.Json;

namespace DotNet.GraphQL.CosmosDB.Models
{
    public class QuestionModel
    {
        public string Id { get; set; }
        public string Question { get; set; }
        [JsonProperty("correct_answer")]
        public string CorrectAnswer { get; set; }
        [JsonProperty("incorrect_answers")]
        public List<string> IncorrectAnswers { get; set; }
        public string Type { get; set; }
        public string Difficulty { get; set; }
        public string Category { get; set; }
    }
}
```

As far as our application is aware, this is a generic data class with no GraphQL or Cosmos specific things in it (it has some attributes for helping with serialization/deserialization), now we need to create our GraphQL schema to expose it. We'll make a new folder called `Types` and a file called `Query.cs`:

```csharp
using DotNet.GraphQL.CosmosDB.Models;
using HotChocolate.Resolvers;
using Microsoft.Azure.Documents.Client;
using Microsoft.Azure.Documents.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DotNet.GraphQL.CosmosDB.Types
{
    public class Query
    {
        public async Task<IEnumerable<QuestionModel>> GetQuestions(IResolverContext context)
        {
            // TODO
        }

        public async Task<QuestionModel> GetQuestion(IResolverContext context, string id)
        {
            // TODO
        }
    }
}
```

This class is again a plain C# class and Hot Chocolate will use it to get the types exposed in our _query_ schema. We've created two methods on the class, one to get all questions and one to get a specific question, and it would be the equivalent GraphQL schema of:

```graphql
type QuestionModel {
    id: String
    question: String
    correctAnswer: String
    incorrectAnswers: [String]
    type: String
    difficulty: String
    category: String
}

schema {
    query: {
        questions: [QuestionModel]
        question(id: String): QuestionModel
    }
}
```

You'll also notice that each method takes an `IResolverContext`, but that's not appearing in the schema, well that's because it's a special Hot Chocolate type that will give us access to the GraphQL context within the resolver function.

But, the schema has a lot of nullable properties in it and we don't want that, so to tackle this we'll create an `ObjectType` for the models we're mapping. Create a class called `QueryType`:

```csharp
using HotChocolate.Types;

namespace DotNet.GraphQL.CosmosDB.Types
{
    public class QueryType : ObjectType<Query>
    {
        protected override void Configure(IObjectTypeDescriptor<Query> descriptor)
        {
            descriptor.Field(q => q.GetQuestions(default!))
                .Description("Get all questions in the system")
                .Type<NonNullType<ListType<NonNullType<QuestionType>>>>();

            descriptor.Field(q => q.GetQuestion(default!, default!))
                .Description("Get a question")
                .Argument("id", d => d.Type<IdType>())
                .Type<NonNullType<QuestionType>>();
        }
    }
}
```

Here we're using an `IObjectTypeDescription` to define some information around the fields on the `Query`, and the way we want the types exposed in the GraphQL schema, using the built in GraphQL type system. We'll also do one for the `QuestionModel` in `QuestionType`:

```csharp
using DotNet.GraphQL.CosmosDB.Models;
using HotChocolate.Types;

namespace DotNet.GraphQL.CosmosDB.Types
{
    public class QuestionType : ObjectType<QuestionModel>
    {
        protected override void Configure(IObjectTypeDescriptor<QuestionModel> descriptor)
        {
            descriptor.Field(q => q.Id)
                .Type<IdType>();
        }
    }
}
```

## Consuming the GraphQL Schema

Before we implement our resolvers, let's wire up the schema into our application, and to do that we'll head back to `Startup.cs`, and register the query, along with Hot Chocolate:

```csharp
public override void Configure(IFunctionsHostBuilder builder)
{
    builder.Services.AddSingleton<Query>();

    builder.Services.AddGraphQL(sp =>
        SchemaBuilder.New()
        .AddServices(sp)
        .AddQueryType<QueryType>()
        .Create()
    );
    builder.Services.AddAzureFunctionsGraphQL();
}
```

First off we're registering the `Query` as a singleton so it can be resolved, and then we're adding GraphQL from Hot Chocolate. With the schema registration, we're using a callback that will actually create the schema using `SchemaBuilder`, registering the available services from the dependency injection container and finally adding our `QueryType`, so GraphQL understands the nuanced type system.

Lastly, we call an extension method provided by the proof of concept code we included early to register GraphQL support for Functions.

## Implementing Resolvers

For the resolvers in the `Query` class, we're going to need access to CosmosDB so that we can pull the data from there. We could go and create a CosmosDB connection and then register it in our dependency injection framework, but this won't take advantage of the input bindings in Functions.

With Azure Functions we can setup an [input binding to CosmosDB](https://docs.microsoft.com/azure/azure-functions/functions-bindings-cosmosdb-v2-input?tabs=csharp&{{<cda>}}), specifically we can get a `DocumentClient` provided to us, which FUnctions will take care of connection client reuse and other performance concerns that we might get when we're working in a serverless environment. And this is where the resolver context, provided by `IResolverContext` will come in handy, but first we're going to modify the proof of concept a little, so we can add to the context.

We'll start by modifying the `IGraphQLFunctions` interface and adding a new argument to `ExecuteFunctionsQueryAsync`:

```csharp
Task<IActionResult> ExecuteFunctionsQueryAsync(
    HttpContext httpContext,
    IDictionary<string, object> context,
    CancellationToken cancellationToken);
```

This `IDictionary<string, object>` will allow us to provide any arbitrary additional context information to the resolvers. Now we need to update the implementation in `GraphQLFunctions.cs`:

```csharp
public async Task<IActionResult> ExecuteFunctionsQueryAsync(
    HttpContext httpContext,
    IDictionary<string, object> context,
    CancellationToken cancellationToken)
{
    using var stream = httpContext.Request.Body;

    var requestQuery = await _requestParser
        .ReadJsonRequestAsync(stream, cancellationToken)
        .ConfigureAwait(false);

    var builder = QueryRequestBuilder.New();

    if (requestQuery.Count > 0)
    {
        var firstQuery = requestQuery[0];

        builder
            .SetQuery(firstQuery.Query)
            .SetOperation(firstQuery.OperationName)
            .SetQueryName(firstQuery.QueryName);

        foreach (var item in context)
        {
            builder.AddProperty(item.Key, item.Value);
        }

        if (firstQuery.Variables != null
            && firstQuery.Variables.Count > 0)
        {
            builder.SetVariableValues(firstQuery.Variables);
        }
    }

    var result = await Executor.ExecuteAsync(builder.Create());
    await _jsonQueryResultSerializer.SerializeAsync((IReadOnlyQueryResult)result, httpContext.Response.Body);

    return new EmptyResult();
}
```

There's two things we've done here, first is adding that new argument so we match the signature of the interface, secondly is when the `QueryRequestBuilder` is being setup we'll loop over the `context` dictionary and add each item as a _property_ of the resolver context.

And lastly, we need to update the Function itself to have an input binding to CosmosDB, and then provide that to the resolvers:

```csharp
[FunctionName("graphql")]
public async Task<IActionResult> Run(
    [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = null)] HttpRequest req,
    ILogger log,
    [CosmosDB(
        databaseName: "trivia",
        collectionName: "questions",
        ConnectionStringSetting = "CosmosDBConnection")] DocumentClient client,
    CancellationToken cancellationToken)
{
    return await _graphQLFunctions.ExecuteFunctionsQueryAsync(
        req.HttpContext,
        new Dictionary<string, object> {
            { "client", client },
            { "log", log }
        },
        cancellationToken);
}
```

With that sorted we can implement our resolvers. Let's start with the `GetQuestions` one to grab all of the questions from CosmosDB:

```csharp
public async Task<IEnumerable<QuestionModel>> GetQuestions(IResolverContext context)
{
    var client = (DocumentClient)context.ContextData["client"];

    var collectionUri = UriFactory.CreateDocumentCollectionUri("trivia", "questions");
    var query = client.CreateDocumentQuery<QuestionModel>(collectionUri)
        .AsDocumentQuery();

    var quizzes = new List<QuestionModel>();

    while (query.HasMoreResults)
    {
        foreach (var result in await query.ExecuteNextAsync<QuestionModel>())
        {
            quizzes.Add(result);
        }
    }

    return quizzes;
}
```

Using the `IResolverContext` we can access the `ContextData` which is a dictionary containing the properties that we've injected, one being the `DocumentClient`. From here we create a query against CosmosDB using `CreateDocumentQuery` and then iterate over the result set, pushing it into a collection that is returned.

To get a single question we can implement the `GetQuestion` resolver:

```csharp
public async Task<QuestionModel> GetQuestion(IResolverContext context, string id)
{
    var client = (DocumentClient)context.ContextData["client"];

    var collectionUri = UriFactory.CreateDocumentCollectionUri("trivia", "questions");
    var sql = new SqlQuerySpec("SELECT * FROM c WHERE c.id = @id");
    sql.Parameters.Add(new SqlParameter("@id", id));
    var query = client.CreateDocumentQuery<QuestionModel>(collectionUri, sql, new FeedOptions { EnableCrossPartitionQuery = true })
        .AsDocumentQuery();

    while (query.HasMoreResults)
    {
        foreach (var result in await query.ExecuteNextAsync<QuestionModel>())
        {
            return result;
        }
    }

    throw new ArgumentException("ID does not match a question in the database");
}
```

This time we are creating a `SqlQuerySpec` to do a parameterised query for the item that matches with the provided ID. One other difference is that I needed to enable `CrossPartitionQueries` in the `FeedOptions`, because the `id` field is not the `partitionKey`, so you may not need that, depending on your CosmosDB schema design. And eventually, once the query completes we look for the first item, and if none exists raise an exception that'll bubble out as an error from GraphQL.

## Conclusion

With all this done, we now have a our GraphQL server running in Azure Functions and connected up to a CosmosDB backend, in which we have no need to do any connection management ourselves, that's taken care of by the input binding.

You'll find the full code of my sample [on GitHub](https://github.com/aaronpowell/dotnet-graphql-cosmosdb).

While this has been a read-only example, you could expand this out to support GraphQL mutations and write data to CosmosDB with a few more resolvers.

Something else that would be worth for you to explore is how you can look at the fields being selected in the query, and only retrieve that data from CosmosDB, because here we're pulling all fields, but if you create a query like:

```graphql
{
    questions {
        id
        question
        correctAnswer
        incorrectAnswers
    }
}
```

It might be optimal to not return fields like `type` or `category` from CosmosDB.
