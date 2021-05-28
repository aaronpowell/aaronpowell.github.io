+++
title = "Leveling Up Static Web Apps With the CLI"
date = 2021-05-25T05:32:36Z
description = "Let's check out the Azure Static Web Apps CLI and how to use it with VS Code"
draft = false
tags = ["javascript", "serverless", "vscode"]
tracking_area = "javascript"
tracking_id = "29580"
cover_image = "/images/2021-05-25-leveling-up-static-web-apps-with-the-cli-banner.png"
+++

With the [Azure Static Web Apps](https://docs.microsoft.com/azure/static-web-apps?{{<cda>}}) GA there was a sneaky little project that my colleague [Wassim Chegham](https://twitter.com/manekinekko) dropped, the [Static Web Apps CLI](https://github.com/azure/static-web-apps-cli).

The SWA CLI is a tool he's been building for a while with the aim to make it easier to do local development, especially if you want to do an authenticated experience. I've been helping out on making sure it works on Windows and for Blazor/.NET apps.

It works by running as a proxy server in front of the web and API components, giving you a single endpoint that you access the site via, much like when it's deployed to Azure. It also will inject a mock auth token if want to create an authenticated experience, and enforce the routing rules that are defined in the [`staticwebapp.config.json`](https://docs.microsoft.com/azure/static-web-apps/configuration?{{<cda>}}) file. By default, it'll want to serve static content from a folder, but my preference is to proxy the dev server from `create-react-app`, so I can get hot reloading and stuff working. Let's take a look at how we can do that.

## Using the cli with VS Code

With [VS Code](https://code.visualstudio.com/?{{<cda>}}) being my editor of choice, I wanted to work out the best way to work with it and the SWA CLI, so I can run a task and have it started. But as I prefer to use it as a proxy, this really requires me to run three tasks, one of the web app, one for the API and one for the CLI.

So, let's start creating a `tasks.json` file:

```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "type": "npm",
            "script": "start",
            "label": "npm: start",
            "detail": "react-scripts start",
            "isBackground": true
        },
        {
            "type": "npm",
            "script": "start",
            "path": "api/",
            "label": "npm: start - api",
            "detail": "npm-run-all --parallel start:host watch",
            "isBackground": true
        },
        {
            "type": "shell",
            "command": "swa start http://localhost:3000 --api http://localhost:7071",
            "dependsOn": ["npm: start", "npm: start - api"],
            "label": "swa start",
            "problemMatcher": [],
            "dependsOrder": "parallel"
        }
    ]
}
```

The first two tasks will run `npm start` against the respective parts of the app, and you can see from the `detail` field what they are running. Both of these will run in the background of the shell (don't need it to pop up to the foreground) but there's a catch, they are running persistent commands, commands that don't end and this has a problem.

When we want to run `swa start`, it'll kick off the two other tasks but using dependent tasks in VS Code means it will wait until the task(s) in the `dependsOn` are completed. Now, this is fine if you run a task that has an end (like `tsc`), but if you've got a watch going (`tsc -w`), well, it's not ending and the parent task can't start.

## Unblocking blocking processes

We need to run two blocking processes but trick VS Code into thinking they are completed so we can run the CLI. It turns out we can do that by customising the `problemMatcher` part of our task with a [`background` section](https://code.visualstudio.com/docs/editor/tasks?{{<cda>}}#_background-watching-tasks). The important part here is defining some `endPattern` regex's. Let's start with the web app, which in this case is going to be using `create-react-app`, and the last message it prints once the server is up and running is:

> To create a production build, use npm run build.

Great, we'll look for that in the output, and if it's found, treat it as the command is _done_.

The API is a little trickier though, as it's running two commands, `func start` and `tsc -w`, and it's doing that in parallel, making our output stream a bit messy. We're mostly interested on when the Azure Functions have started up, and if we look at the output the easiest message to regex is probably:

> For detailed output, run func with --verbose flag.

It's not the last thing that's output, but it's close to and appears after the Functions are running, so that'll do.

Now that we know what to look for, let's configure the problem matcher.

## Updating our problem matchers

To do what we need to do we're going to need to add a `problemMatcher` section to the task and it'll need to implement a full `problemMatcher`. Here's the updated task for the web app:

```json
{
    "type": "npm",
    "script": "start",
    "problemMatcher": {
        "owner": "custom",
        "pattern": {
            "regexp": "^([^\\s].*)\\((\\d+|\\d+,\\d+|\\d+,\\d+,\\d+,\\d+)\\):\\s+(error|warning|info)\\s+(TS\\d+)\\s*:\\s*(.*)$",
            "file": 1,
            "location": 2,
            "severity": 3,
            "code": 4,
            "message": 5
        },
        "fileLocation": "relative",
        "background": {
            "activeOnStart": true,
            "beginsPattern": "^\\.*",
            "endsPattern": "^\\.*To create a production build, use npm run build\\."
        }
    },
    "label": "npm: start",
    "detail": "react-scripts start",
    "isBackground": true
}
```

Since `create-react-app` doesn't have a standard `problemMatcher` in VS Code (as far as I can tell anyway) we're going to set the `owner` as `custom` and then use the TypeScript `pattern` (which I shamelessly stole from the docs 🤣). You might need to tweak the regex to get the VS Code problems list to work properly, but this will do for now. With our basic `problemMatcher` defined, we can add a `background` section to it and specify the `endsPattern` to match the string we're looking for. You'll also have to provide a `beginsPattern`, to which I'm lazy and just matching on _anything_.

Let's do a similar thing for the API task:

```json
{
    "type": "npm",
    "script": "start",
    "path": "api/",
    "problemMatcher": {
        "owner": "typescript",
        "pattern": {
            "regexp": "^([^\\s].*)\\((\\d+|\\d+,\\d+|\\d+,\\d+,\\d+,\\d+)\\):\\s+(error|warning|info)\\s+(TS\\d+)\\s*:\\s*(.*)$",
            "file": 1,
            "location": 2,
            "severity": 3,
            "code": 4,
            "message": 5
        },
        "background": {
            "activeOnStart": true,
            "beginsPattern": "^\\.*",
            "endsPattern": ".*For detailed output, run func with --verbose flag\\..*"
        }
    },
    "label": "npm: start - api",
    "detail": "npm-run-all --parallel start:host watch",
    "isBackground": true
}
```

Now, we can run the `swa start` task and everything will launch for us!

![Running the task in VS Code](/images/2021-05-25-leveling-up-static-web-apps-with-the-cli.gif)

## Conclusion

Azure Static Web Apps just keeps getting better and better. With the CLI, it's super easy to run a local environment and not have to worry about things like CORS, making it closer to how the deployed app operates. And combining it with these VS Code tasks means that with a few key presses you can get it up and running.

I've added these tasks to the GitHub repo of my [Auth0 demo app](https://github.com/aaronpowell/swa-custom-auth-auth0) from the post on using [Auth0 with Static Web Apps]({{<ref "/posts/2021-05-13-using-auth0-with-static-web-apps.md">}})
