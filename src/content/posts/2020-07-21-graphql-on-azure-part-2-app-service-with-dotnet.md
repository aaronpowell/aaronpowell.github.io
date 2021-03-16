+++
title = "GraphQL on Azure: Part 2 - dotnet and App Service"
date = 2020-07-21T08:16:33+10:00
description = "Let's look at how we can create a dotnet GraphQL server and deploy it to an AppService"
draft = false
tags = ["azure", "serverless", "azure-functions", "dotnet", "graphql"]
series = "graphql-azure"
series_title = "App Service with dotnet"
tracking_area = "dotnet"
tracking_id = "7129"
+++

In my [introductory post]({{<ref "/posts/2020-07-13-graphql-on-azure-part-1-getting-started.md">}}) we saw that there are many different ways in which you can host a GraphQL service on Azure and today we'll take a deeper look at one such option, [Azure App Service](https://docs.microsoft.com/azure/app-service/?{{<cda>}}), by building a GraphQL server using dotnet. If you're only interested in the Azure deployment, you can jump forward to [that section]({{<relref "#deploying-to-app-service">}}). Also, you'll find the complete sample [on my GitHub](https://github.com/aaronpowell/appservice-graphql-dotnet/).

## Getting Started

For our server, we'll use the [graphql-dotnet](https://github.com/graphql-dotnet/graphql-dotnet) project, which is one of the most common GraphQL server implementations for dotnet.

First up, we'll need an ASP.NET Core web application, which we can create with the `dotnet` cli:

```dotnetcli
dotnet new web
```

Next, open the project in an editor and add the NuGet packages we'll need:

```xml
<PackageReference Include="GraphQL.Server.Core" Version="3.5.0-alpha0046" />
<PackageReference Include="GraphQL.Server.Transports.AspNetCore" Version="3.5.0-alpha0046" />
<PackageReference Include="GraphQL.Server.Transports.AspNetCore.SystemTextJson" Version="3.5.0-alpha0046" />
```

_At the time of writing graphql-dotnet v3 is in preview, we're going to use that for our server but be aware there may be changes when it is released._

These packages will provide us a GraphQL server, along with the middleware needed to wire it up with ASP.NET Core and use [System.Text.Json](https://docs.microsoft.com/dotnet/standard/serialization/system-text-json-overview?{{<cda>}}) as the JSON seralizer/deserializer (you can use Newtonsoft.Json if you prefer with [this package](https://www.nuget.org/packages/GraphQL.Server.Transports.AspNetCore.NewtonsoftJson)).

We'll also add a package for GraphiQL, the GraphQL UI playground, but it's not needed or recommended when deploying into production.

```xml
<PackageReference Include="GraphQL.Server.Ui.Playground" Version="3.5.0-alpha0046" />
```

With the packages installed, it's time to setup the server.

## Implementing a Server

There are a few things that we need when it comes to implementing the server, we're going to need a GraphQL schema, some types that implement that schema and to configure our route engine to support GraphQL's endpoints. We'll start by defining the schema that's going to support our server and for the schema we'll use a basic trivia app (which I've used for a number of GraphQL demos in the past). For the data, we'll use [Open Trivia DB](https://opentdb.com/).

### .NET Types

First up, we're going to need some generic .NET types that will represent the underlying data structure for our application. These would be the DTOs (Data Transfer Objects) that we might use in Entity Framework, but we're just going to run in memory.

```csharp
public class Quiz
{
    public string Id
    {
        get
        {
            return Question.ToLower().Replace(" ", "-");
        }
    }
    public string Question { get; set; }
    [JsonPropertyName("correct_answer")]
    public string CorrectAnswer { get; set; }
    [JsonPropertyName("incorrect_answers")]
    public List<string> IncorrectAnswers { get; set; }
}
```

As you can see, it's a fairly generic C# class. We've added a few serialization attributes to help converting the JSON to .NET, but otherwise it's nothing special. It's also not usable with GraphQL yet and for that, we need to expose the type to a GraphQL schema, and to do that we'll create a new class that inherits from `ObjectGraphType<Quiz>` which comes from the `GraphQL.Types` namespace:

```csharp
public class QuizType : ObjectGraphType<Quiz>
{
    public QuizType()
    {
        Name = "Quiz";
        Description = "A representation of a single quiz.";
        Field(q => q.Id, nullable: false);
        Field(q => q.Question, nullable: false);
        Field(q => q.CorrectAnswer, nullable: false);
        Field<NonNullGraphType<ListGraphType<NonNullGraphType<StringGraphType>>>>("incorrectAnswers");
    }
}
```

The `Name` and `Description` properties are used provide the documentation for the type, next we use `Field` to define what we want exposed in the schema and how we want that marked up for the GraphQL type system. We do this for each field of the DTO that we want to expose using a lambda like `q => q.Id`, or by giving an explicit field name (`incorrectAnswers`). Here's also where you control the schema validation information as well, defining the nullability of the fields to match the way GraphQL expects it to be represented. This class would make a GraphQL type representation of:

```graphql
type Quiz {
    id: String!
    question: String!
    correctAnswer: String!
    incorrectAnswers: [String!]!
}
```

Finally, we want to expose a way to query our the types in our schema, and for that we'll need a Query that inherits `ObjectGraphType`:

```csharp
public class TriviaQuery : ObjectGraphType
{
    public TriviaQuery()
    {
        Field<NonNullGraphType<ListGraphType<NonNullGraphType<QuizType>>>>("quizzes", resolve: context =>
        {
            throw new NotImplementedException();
        });

        Field<NonNullGraphType<QuizType>>("quiz", arguments: new QueryArguments() {
            new QueryArgument<NonNullGraphType<StringGraphType>> { Name = "id", Description = "id of the quiz" }
        },
        resolve: (context) => {
            throw new NotImplementedException();
        });
    }
}
```

Right now there is only a single type in our schema, but if you had multiple then the `TriviaQuery` would have more fields with resolvers to represent them. We've also not implemented the resolver, which is how GraphQL gets the data to return, we'll come back to that a bit later. This class produces the equivalent of the following GraphQL:

```graphql
type TriviaQuery {
    quizzes: [Quiz!]!
    quiz(id: String!): Quiz!
}
```

### Creating a GraphQL Schema

With the DTO type, GraphQL type and Query type defined, we can now implement a schema to be used on the server:

```csharp
public class TriviaSchema : Schema
{
    public TriviaSchema(TriviaQuery query)
    {
        Query = query;
    }
}
```

Here we would also have mutations and subscriptions, but we're not using them for this demo.

## Wiring up the Server

For the Server we integrate with the ASP.NET Core pipeline, meaning that we need to setup some services for the Dependency Injection framework. Open up `Startup.cs` and add update the `ConfigureServices`:

```csharp
public void ConfigureServices(IServiceCollection services)
{
    services.AddTransient<HttpClient>();
    services.AddSingleton<QuizData>();
    services.AddSingleton<TriviaQuery>();
    services.AddSingleton<ISchema, TriviaSchema>();

    services.AddGraphQL(options =>
    {
        options.EnableMetrics = true;
        options.ExposeExceptions = true;
    })
    .AddSystemTextJson();
}
```

The most important part of the configuration is lines 8 - 13, where the GraphQL server is setup and we're defining the JSON seralizer, `System.Text.Json`. All the lines above are defining dependencies that will be injected to other types, but there's a new type we've not seen before, `QuizData`. This type is just used to provide access to the data store that we're using (we're just doing in-memory storage using data queried from Open Trivia DB), so I'll skip its implementation (you can see it [on GitHub](https://github.com/aaronpowell/appservice-graphql-dotnet/blob/master/QuizData.cs)).

With the data store available, we can update `TriviaQuery` to consume the data store and use it in the resolvers:

```csharp
public class TriviaQuery : ObjectGraphType
{
    public TriviaQuery(QuizData data)
    {
        Field<NonNullGraphType<ListGraphType<NonNullGraphType<QuizType>>>>("quizzes", resolve: context => data.Quizzes);

        Field<NonNullGraphType<QuizType>>("quiz", arguments: new QueryArguments() {
            new QueryArgument<NonNullGraphType<StringGraphType>> { Name = "id", Description = "id of the quiz" }
        },
        resolve: (context) => data.FindById(context.GetArgument<string>("id")));
    }
}
```

Once the services are defined we can add the routing in:

```csharp
public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
{
    if (env.IsDevelopment())
    {
        app.UseDeveloperExceptionPage();
        app.UseGraphQLPlayground();
    }

    app.UseRouting();

    app.UseGraphQL<ISchema>();
}
```

_I've put the inclusion GraphiQL. within the development environment check as that'd be how you'd want to do it for a real app, but in the demo on GitHub I include it every time._

Now, if we can launch our application, navigate to [`https://localhost:5001/ui/playground`](https://localhost:5001/ui/playground) and run the queries to get some data back.

## Deploying to App Service

With all the code complete, let's look at deploying it to Azure. For this, we'll use a standard [Azure App Service](https://docs.microsoft.com/azure/app-service/?{{<cda>}}) running the latest .NET Core (3.1 at time of writing) on Windows. We don't need to do anything special for the App Service, it's already optimised to run an ASP.NET Core application, which is all this really is. If we were using a different runtime, like Node.js, we'd follow the standard setup for a [Node.js App Service](https://docs.microsoft.com/azure/app-service/app-service-web-get-started-nodejs?{{<cda>}}).

To deploy, we'll use [GitHub Actions](https://help.github.com/en/articles/about-github-actions?{{<cda>}}), and you'll find docs on how to do that [already written](https://docs.microsoft.com/azure/app-service/deploy-github-actions?{{<cda>}}). You'll find the workflow file I've used [in the GitHub repo](https://github.com/aaronpowell/appservice-graphql-dotnet/blob/master/.github/workflows/workflow.yml).

With a workflow committed and pushed to GitHub and our App Service waiting, the Action will run and our application will be deployed. The demo I created [is here](https://graphql-on-azure-appservice.azurewebsites.net/ui/playground).

## Conclusion

Throughout this post we've taken a look at how we can create a GraphQL server running on ASP.NET Core using `graphql-dotnet` and deploy it to an Azure App Service.

When it comes to the Azure side of things, there's nothing different we have to do to run the GraphQL server in an App Service than any other ASP.NET Core application, as `graphql-dotnet` is implemented to leverage all the features of ASP.NET Core seamlessly.

Again, you'll find the complete sample [on my GitHub](https://github.com/aaronpowell/appservice-graphql-dotnet/) for you to play around with yourself.
