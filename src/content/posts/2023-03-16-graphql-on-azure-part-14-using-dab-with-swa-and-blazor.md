+++
title = "GraphQL on Azure: Part 14 - Using Data API builder with SWA and Blazor"
date = 2023-03-15T16:02:47Z
description = "We've seen how we can use DAB with SWA and React, now let's look at how we can use it with SWA and Blazor"
draft = false
tags = ["azure", "graphql", "dotnet"]
tracking_area = "dotnet"
tracking_id = "7129"
series = "graphql-azure"
series_title = "Using Blazor with DAB and SWA"
+++

This is the last in the three part sub-series looking at the newly launched Data API builder for Azure Databases (DAB) and while last time we looked at creating a React application, this time I wanted to look at how to do the same thing but in .NET using Blazor. So let's jump in and learn about how to use [SWA Data Connections](https://aka.ms/swa/db/announcement) with Blazor.

Oh, and for something different, let's try also use a SQL backend rather than Cosmos DB.

## Setting up DAB

When we've looked at DAB so far, we've had to create two files, a config for DAB and a GraphQL schema containing the types. Well since we're using SQL this time we can drop the GraphQL schema file, as DAB will use the SQL schema to generate the types, something it couldn't do from Cosmos DB, as it doesn't have a schema.

We'll use the same data structure, which we have a JSON file like so:

```json
[
  {
    "id": "0",
    "category": "Science: Computers",
    "type": "multiple",
    "difficulty": "easy",
    "question": "What does CPU stand for?",
    "correct_answer": "Central Processing Unit",
    "incorrect_answers": [
      "Central Process Unit",
      "Computer Personal Unit",
      "Central Processor Unit"
    ],
    "modelType": "Question"
  }
]
```

Let's create a SQL table for that:

```sql
USE trivia;
CREATE TABLE question(
    id int IDENTITY(5001, 1) PRIMARY KEY,
    question varchar(max) NOT NULL,
    correct_answer varchar(max) NOT NULL,
    incorrect_answers varchar(max) NOT NULL CHECK ( isjson(incorrect_answers) = 1 )
);
```

For the `incorrect_answers` column, we're specifying that it's a [JSON column](https://learn.microsoft.com/sql/relational-databases/json/json-data-sql-server?view=sql-server-ver16&{{<cda>}}), since it'd make the most sense to store it that way rather than creating another table to relate to or similar.

_Note: At the time of writing there is a bug in DAB and how it handles JSON columns - we're going to have to deserialize it ourself: https://github.com/Azure/data-api-builder/issues/444_

The only other things we need to change for our config file is the `data-sources`, so it knows we're using `mssql` as the backend over Cosmos DB ()

```json
"data-source": {
    "connection-string": "<put something here>",
    "database-type": "mssql"
  }
```

_Note: The sample repo contains a [VSCode devcontainer](https://code.visualstudio.com/docs/remote/containers?{{<cda>}}) which will setup a MSSQL environment. You can connect with the local connection string: `Server=sql,1433;Database=trivia;User Id=sa;Password=YourStrongPassword!;Persist Security Info=False;MultipleActiveResultSets=False;Connection Timeout=5;TrustServerCertificate=true;`_

We also need to update the `source` property of the `Question` entity to have the `schema.table` format that SQL uses:

```json
"source": "dbo.question",
```

With our backend ready it's time to focus on the frontend.

## Blazor and GraphQL

When it comes to creating a GraphQL client in .NET there's really no other choice of library to use than [Strawberry Shake from Chilli Cream](https://chillicream.com/docs/strawberryshake/v13/get-started).

Let's start by creating a new Blazor WebAssembly project:

```bash
dotnet new blazorwasm --name BlazorGraphQLTrivia --output frontend
```

We'll also need to add the Strawberry Shake NuGet package:

```bash
dotnet new tool-manifest
dotnet tool install StrawberryShake.Tools
dotnet add frontend package StrawberryShake.Blazor
```

The next step is going to be to generate the .NET types and associated files from our GraphQL service, but since that service is part of the local environment, we'll need to set it up. To do that we'll run the `swa init` command and generate a SWA CLI config like so:

```json
{
  "$schema": "https://aka.ms/azure/static-web-apps-cli/schema",
  "configurations": {
    "frontend": {
      "appLocation": "frontend",
      "outputLocation": "build",
      "appBuildCommand": "dotnet build",
      "run": "dotnet watch",
      "appDevserverUrl": "http://localhost:5116",
      "dataApiLocation": "data"
    }
  }
}
```

Then we can run the server with `swa start`. Now our GraphQL endpoint (and Blazor application) are up and running. You can check out the schema with [Banana Cake Pop](https://chillicream.com/products/bananacakepop) by having it navigate to http://localhost:4280/data-api/graphql. Something worth noticing is the type for `Question` that was generated:

```graphql
type Question {
  id: Int!
  question: String!
  correct_answer: String!
  incorrect_answers: String!
}
```

The `id` field is an `Int!`, since that matches the underlying data type in the SQL schema, and `incorrect_answers` is a `String!` since it doesn't know the structure of the JSON column to map a GraphQL object type.

With the server now running, we can get Strawberry Shake to generate the .NET stuff it needs:

```bash
dotnet graphql init http://localhost:4280/data-api/graphql -n TriviaClient -p ./frontend
```

This command will add three new files to your project, a `.graphqlrc.json` file that contains the information for Strawberry Shake on how to connect to your GraphQL endpoint and generate types, the GraphQL schema as `schema.graphql` and a `schema.extensions.graphql` file which Strawberry Shake uses to do things such as [working with custom scalars](https://chillicream.com/docs/strawberryshake/v13/scalars/#custom-scalars).

Now that we have the GraphQL client generated, we can add a GraphQL operation to our application. We'll start by adding a new page to our application, file called `GetQuestions.graphql`:

```graphql
query getQuestions {
  questions(first: 10) {
    items {
      id
      question
      correct_answer
      incorrect_answers
    }
  }
}
```

With a `dotnet build` run and passing, we can go and add the `TriviaClient` to the `Pages/Index.razor` file and query our GraphQL server. Let's start with an `@code` block:

```csharp
@code {
    record QuestionModel(int Id, string Question, IEnumerable<string> Answers, string CorrectAnswer);

    private IEnumerable<QuestionModel> questions = new List<QuestionModel>();
    private Dictionary<int, string> playerAnswers = new();
    private string message = string.Empty;

    protected override async Task OnInitializedAsync()
    {
        var result = await TriviaClient.GetQuestions.ExecuteAsync();

        if (result is null || result.Data is null) {
            return;
        }

        questions = result.Data.Questions.Items.Select(q => {
            var incorrectAnswers = JsonSerializer.Deserialize<List<string>>(q.Incorrect_answers);
            return new QuestionModel(q.Id, q.Question, Randomise(incorrectAnswers.Append(q.Correct_answer)), q.Correct_answer);
        }).ToList();
    }

    public static IEnumerable<string> Randomise(IEnumerable<string> list)
    {
        var random = new Random();
        return list.OrderBy(x => random.Next()).ToList();
    }

    public void CheckAnswers() {
        var correctCount = 0;
        foreach ((int questionId, string answer) in playerAnswers) {
            var question = questions.First(q => q.Id == questionId);
            if (question.CorrectAnswer == answer) {
                correctCount++;
            }
        }

        message = $"You got {correctCount} of {questions.Count()} correct!";
    }
}
```

That's a lot of code, so let's break it down. First we define a `record` type that we'll "properly" deserialize the type into (basically unpack the JSON array for `incorrect_answers`) and declare some private fields to store data we need for the page. The read bulk of our integration starts in the `OnInitializedAsync` method:

```csharp
protected override async Task OnInitializedAsync()
{
    var result = await TriviaClient.GetQuestions.ExecuteAsync();

    if (result is null || result.Data is null) {
        return;
    }

    questions = result.Data.Questions.Items.Select(q => {
        var incorrectAnswers = JsonSerializer.Deserialize<List<string>>(q.Incorrect_answers);
        return new QuestionModel(q.Id, q.Question, Randomise(incorrectAnswers.Append(q.Correct_answer)), q.Correct_answer);
    }).ToList();
}
```

Here we use the `TriviaClient` (which we can inject to the component with `@inject TriviaClient TriviaClient` at the top of the file) to call the `GetQuestions` method, which uses the operation we defined above to query the GraphQL server.

Once we get a result back it's unpacked and turned into the `QuestionModel` that can be bound to the UI.

And I'll leave the rest of the exercise up to you to fill out displaying the questions and answers, but here's how it looks in [the sample application](https://github.com/aaronpowell/dab-blazor-trivia-demo).

![Sample application](/images/2023-03-16-graphql-on-azure-part-14-using-dab-with-swa-and-blazor/001.png).

## Conclusion

In this post we've looked at how to use Database Connections with SWA and Blazor to create a trivia game. We've seen how to use Database Connections to create a GraphQL client from our SQL server and how to use it in a Blazor application via the Strawberry Shake NuGet package.

You'll find the [sample application on my GitHub](https://github.com/aaronpowell/dab-blazor-trivia-demo) and you can learn more about how to use Database Connections on SWA [through our docs](https://aka.ms/swa/db/docs).
