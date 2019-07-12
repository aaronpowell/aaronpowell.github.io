+++
title = "Creating Slack Commands With Azure Functions"
date = 2019-07-12T09:44:37+10:00
description = "A guide to creating a Slack 'slash command' using Azure Functions as the handler."
draft = false
tags = ["fsharp", "azure-functions", "serverless"]
+++

I've recently been doing some upgrades to the infrastructure of [DDD Sydney](https://next.dddsydney.com.au), primarily around migrating the API from the Azure Functions v1 stack to v2 (it's actually picking up a change from last year that I put on hold due to a bug in the v2 preview).

Once I got the core functionality completed I decided it was time to tackle something that I'd always wanted, a way that we could view the session information and perform some tasks in our Slack channel.

## Extending Slack

There are a few different ways that you can extend Slack, and since my needs are simple I decided to use the [Slash Command](https://api.slack.com/slash-commands) so that we can type `/sessions 2019` and get a list of all the sessions that are submitted for a particular year.

The first step is to create a new application in Slack against the workspace you want:

![Creating a Slack App](/images/slack-azure-functions/001.png)

Our app is ready for us to start creating commands for, but before we create the command we're going to need a URL for it to call when invoked, and for that we'll use [Azure Functions](https://azure.microsoft.com/en-us/services/functions/?{{< cda >}}).

## Creating our Function

I use [VS Code to create the Function](https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-first-function-vs-code?{{< cda >}}) (but choose whichever editor you want) and I then modified the generated project so I can use F# (see [this post]({{< ref "/posts/2019-03-05-azure-functions-with-fsharp.md" >}}) for what you need to do).

With that all done it's time to create a Function, let's create the Function that lists the approved sessions! _Quick note: we sync the sessions from Sessionize but mark them as "unapproved", meaning that we do a quick review of them to ensure they don't violate our Code of Conduct, before approving them. Only approved sessions can be voted on._

When a slash command is executed it sends a HTTP POST to the endpoint you provide, so we'll need to use the [HTTP binding](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-http-webhook?{{< cda >}}).

```fsharp
module SlackCommands

open Microsoft.Azure.WebJobs
open Microsoft.Azure.WebJobs.Extensions.Http
open Microsoft.AspNetCore.Http

[<FunctionName("Slack_Approved_Sessions")>]
let approvedSessionsCommand ([<HttpTrigger(AuthorizationLevel.Function, "post", Route = "v2/Slack-ApprovedSession")>] req: HttpRequest)
                            ([<Table("Session", Connection = "EventStorage")>] sessionsTable)
                            ([<Table("Presenter", Connection = "EventStorage")>] presentersTable) =
    ignore()
```

Let's break it down, we start off creating the F# function that will be our Azure Function, named `approvedSessionsCommand`. It's decorated with the `FunctionName` attribute so that the Functions Host knows about it. Finally, we provide it with some argument with bindings, for this one we'll need three bindings, the first is the `HttpTrigger` attribute and then the two `Table` bindings for us to access Table Storage where the data is kept. For the `HttpTrigger` it's access level is defined as `AuthorizationLevel.Function`, meaning that there's a key needing to be provided to access it (basic security), it's listening for `"post"` requests only and the route is `v2/Slack-ApprovedSessions` (`v2` because this is the second generation of the API for DDD Sydney).

### Handling the Incoming Message

When a slash command is typed you can provide a message to it and this message is passed to the Function being called. I was to use this in our purpose to get the year out, so the command can be used every year without change, invoking it like `/sessions 2019`.

To get this text we need to grab it out of the incoming message body, unfortunately, this isn't a JSON payload it's a [standard form post](https://api.slack.com/slash-commands#app_command_handling), so no nice clean object for us. 🙁

Instead we'll need to get it out of the body of the `HttpRequest`:

```fsharp
[<FunctionName("Slack_Approved_Sessions")>]
let approvedSessionsCommand ([<HttpTrigger(AuthorizationLevel.Function, "post", Route = "v2/Slack-ApprovedSession")>] req: HttpRequest)
                            ([<Table("Session", Connection = "EventStorage")>] sessionsTable)
                            ([<Table("Presenter", Connection = "EventStorage")>] presentersTable) =
    let year = req.Form.["text"].[0]

    ignore()
```

The `text` property of the form contains what was entered by the user (minus the slash command) so it's a good idea to do some validation against it to make sure it conforms to the structure you want and reject it if it doesn't.

### Getting Data

I'll only quickly go over how this particular function gets the data as it's specific to _my_ scenario and yours may be different. What's important to note is that this is **just an Azure Function** so you can do whatever you need to do.

The data for our sessions is stored in Table Storage across two tables, the `Session` table, which contains the session metadata and the `Presenter` table which contains the presenters for the session since a session may have multiple presenters (also we don't de-dup the presenter table so if you submit multiple talks we have multiple records for you). These two tables are "linked" using the ID of the session.

For accessing data I use the [FSharp.Azure.Storage](https://github.com/fsprojects/FSharp.Azure.Storage) NuGet package, which gives a nicer F# API for working with Table Storage.

```fsharp
[<FunctionName("Slack_Approved_Sessions")>]
let approvedSessionsCommand ([<HttpTrigger(AuthorizationLevel.Function, "post", Route = "v2/Slack-ApprovedSession")>] req: HttpRequest)
                            ([<Table("Session", Connection = "EventStorage")>] sessionsTable)
                            ([<Table("Presenter", Connection = "EventStorage")>] presentersTable) =
     async {
         let year = req.Form.["text"].[0]

         let! sessions = Query.all<SessionV2>
                         |> Query.where <@ fun s _ -> s.EventYear = year && s.Status = "Approved" @>
                         |> fromTableToClientAsync sessionsTable

         let! presenters = Query.all<Presenter>
                           |> Query.where<@ fun p _ -> p.EventYear = year @>
                           |> fromTableToClientAsync presentersTable
        return ignore()
    } |> Async.StartAsTask
```

We use `Query.all<T>` to get the data back and then `Query.where` to filter on the year provided and (in the case of Sessions) the status of `Approved`. It's not super optimised since we get back all presenters, even if they aren't related to an approved session, but we're talking ~100 records so the performance isn't really a worry.

### Preparing Our Response

With our data in hand it's time to send a response back to Slack. Slack supports [a lot of ways to create messages](https://api.slack.com/messaging/composing) but when you are using [Layout Blocks](https://api.slack.com/reference/messaging/blocks) you're limited to 50 blocks, and we'll have more talks than that so it's not ideal.

Instead, we'll keep it simple and just use a plain text response with embedded `mrkdwn`. _Note: Slack doesn't use Markdown, it uses its own variant called `mrkdwn`. There are some subtle differences and limitations on what formatting you can apply._

```fsharp
let sessionToViewMessage session presenters =
    presenters
    |> Seq.map (fun p -> p.FullName)
    |> String.concat ", "
    |> sprintf "(%s) _%s_ by *%s*" session.SessionizeId session.Title

[<FunctionName("Slack_Approved_Sessions")>]
let approvedSessionsCommand ([<HttpTrigger(AuthorizationLevel.Function, "post", Route = "v2/Slack-ApprovedSession")>] req: HttpRequest)
                            ([<Table("Session", Connection = "EventStorage")>] sessionsTable)
                            ([<Table("Presenter", Connection = "EventStorage")>] presentersTable) =
     async {
         let year = req.Form.["text"].[0]

         let! sessions = Query.all<SessionV2>
                         |> Query.where <@ fun s _ -> s.EventYear = year && s.Status = "Approved" @>
                         |> fromTableToClientAsync sessionsTable

         let! presenters = Query.all<Presenter>
                           |> Query.where<@ fun p _ -> p.EventYear = year @>
                           |> fromTableToClientAsync presentersTable

         let resultSessions = sessions
                              |> Seq.map(fun (s, _) ->
                                  presenters
                                  |> Seq.filter (fun (p, _) -> p.TalkId = s.SessionizeId)
                                  |> Seq.map (fun (p, _) -> p)
                                  |> sessionToViewMessage s)

         match Seq.length resultSessions with
         | 0 -> return OkObjectResult(":boom: There are no approved sessions") :> IActionResult
         | _ -> return OkObjectResult(resultSessions |> String.concat "\r\n") :> IActionResult
     } |> Async.StartAsTask
```

I've introduced a function call `sessionToViewMessage` which takes a session and its presenters and generates a line string like this:

```
(12345) _My Awesome Session_ by *Aaron Powell*
```

The result of this is an `seq<string>` which is concatted together with `\r\n` for a new line and returned as an `OkObjectResult`, to represent a `HTTP 200 OK` response to Slack.

Now that your Function is complete, deploy it to Azure (use a Pipeline, use the [VS Code Tooling](https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-first-function-vs-code?{{< cda >}}#publish-the-project-to-azure), etc.) and we're ready to plug it into Slack.

## Wiring Up Our Slash Command

With our Function deployed it's time to plug it into our slash command. Before getting started, ensure you have the URL of your Azure Function (you can get it via the portal) as we'll need it to set up the slash command.

Now that you have your URL head over to Slack App we created earlier and navigate to `Features -> Slash Commands -> Create New Command` and fill out the form.

![Create New Command screen](/images/slack-azure-functions/002.png)

When it's done hit `Save`.

Finally, navigate back to `Basic Information` and ensure that your application has been installed into your workspace:

![Install Application to Slack Workspace](/images/slack-azure-functions/003.png)

Now your slash command will appear for everyone to use!

![Slash Command in action](/images/slack-azure-functions/004.png)

🎉 You now have a slash command powered by Azure Functions!

## Conclusion

Slash Commands in Slack is a really easy way for you to integrate some custom functionality in your business into your standard tooling. For us at DDD Sydney it means that we can quickly do the admin tasks that we need to do for the conference without having to dig into the Azure portal.

And Azure Functions made this really straight forward, from a simple HTTP Trigger binding to accept the incoming `POST`, to the pre-parsed form body as a key/value pair and having Functions provide auto-wiring of the other Azure services we need to integrate with. You can check out all the slash command we have in the API on our [GitHub API project](https://github.com/dddsydney/dddapi/blob/master/DDDApi.Functions/v2/SlackCommands.fs).

Hopefully this has given you some insights into how to do your own ChatOps with Slack and Azure Functions.
