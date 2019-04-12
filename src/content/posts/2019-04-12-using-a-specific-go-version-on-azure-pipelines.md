+++
title = "Using a Specific Go Version on Azure Pipelines"
date = 2019-04-12T10:03:30+10:00
description = "How to setup an Azure Pipeline agent to use a specific version of Go for a build"
draft = false
tags = ["azure-devops", "golang"]
+++

With [Azure Pipelines](https://azure.microsoft.com/en-au/services/devops/pipelines/?{{< cda >}}) we can build applications with many different languages, one of which is [Go](https://docs.microsoft.com/en-us/azure/devops/pipelines/languages/go?view=azure-devops&{{< cda >}}).

If you're using a [Hosted Agent](https://docs.microsoft.com/en-us/azure/devops/pipelines/agents/hosted?view=azure-devops&{{< cda >}}), which is the recommended way (since you don't need to manage your own machines), you are at the mercy of what software is installed on the agent. But if you're building an application to target a specific runtime, say Go 1.12.3 (the latest at the time of writing), you might be out of luck as the agent doesn't have that installed on it.

So let's take a look at how to setup Go as part of your pipeline.

_Side note: You can also use [Docker for your builds](https://docs.microsoft.com/en-us/azure/devops/pipelines/languages/docker?view=azure-devops&{{< cda >}}), but Docker isn't for everyone, so I'm focusing on non-containerised agents here. Docker can also be a challenge if you need several runtimes, to say, [build a web application with Go + WASM support]({{< ref "/posts/2019-02-12-golang-wasm-6-typescript-react.md" >}})._

We're going to be modifying the standard [Go Azure Pipeline](https://docs.microsoft.com/en-us/azure/devops/pipelines/languages/go?view=azure-devops&{{< cda >}}), so start with that a template.

## Setting up our variables

The first thing we'll want to do is modify the variables that Go will be expecting, specifically `GOPATH` and `GOROOT`. By default, these point to one of the versions of Go on the agent, but we'll modify them to use our version of Go.

```yaml
variables:
  GOPATH: '$(Agent.BuildDirectory)/gopath' # Go workspace path
  GOROOT: '$(Agent.BuildDirectory)/go' # Go installation path
  GOBIN:  '$(GOPATH)/bin' # Go binaries path
  modulePath: '$(GOPATH)/src/github.com/$(build.repository.name)' # Path to the module's code
```

We'll using one of the [Agents pre-defined variables](https://docs.microsoft.com/en-us/azure/devops/pipelines/build/variables?view=azure-devops&tabs=yaml&{{< cda >}}#agent-variables), `Agent.BuildDirectory`, as it's somewhere I know I can write to on the Agent, and it's scoped to my build in particular.

The `GOPATH` is going to be a new folder we'll create and `GOROOT` will be where Go is unpacked to. These will now be environment variables so when Go eventually executes, it'll be the right version of Go.

## Downloading Go

Next, we'll add a new step to download and unpack the version of Go we want to target:

```yaml
steps:
- script: |
    wget "https://storage.googleapis.com/golang/go1.12.3.linux-amd64.tar.gz" --output-document "$(Agent.BuildDirectory)/go1.12.3.tar.gz"
    tar -C '$(Agent.BuildDirectory)' -xzf "$(Agent.BuildDirectory)/go1.12.3.tar.gz"
  displayName: 'Install Go 1.12'
```

Since we know my agent is a Linux agent (from the `pool` defined in the template) we'll use `wget` to download the Linux binaries and drop them into the `Agent.BuildDirectory`. With that done we can unpack it with `tar`, specifying that we want to unpack to `Agent.BuildDirectory`, and given the structure of the `tar.gz` contains a folder named `go` we'll end up with a path that matches `GOROOT` nicely.

Lastly, we need to ensure that the `PATH` of the agent knows about this version of Go, and we do that by [setting output variables](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/variables?view=azure-devops&tabs=yaml%2Cbatch&{{< cda >}}#set-in-script):

```yaml
- script: |
    echo '##vso[task.prependpath]$(GOBIN)'
    echo '##vso[task.prependpath]$(GOROOT)/bin'
```

_This is covered in the [Set up a Go workspace](https://docs.microsoft.com/en-us/azure/devops/pipelines/languages/go?view=azure-devops&{{< cda >}}#set-up-a-go-workspace) step in the docs guide._

Now the rest of the pipeline can follow exactly [as the template describes](https://docs.microsoft.com/en-us/azure/devops/pipelines/languages/go?view=azure-devops&{{< cda >}})!

## Conclusion

Version pinning of dependencies is really important to ensure that we have repeatable builds over time. Since we don't want to end up in a situation where we manually manage our agent pool we want our build definition to prepare the agent to the environment we desire, including setting up the appropriate runtimes.

You can see a full pipeline definition [on my GitHub](https://github.com/aaronpowell/oz-dev-events/blob/dcd3fc3c6c74f1da037d17993380c51ffe996bda/azure-pipelines.yml) that utilises this approach.

You could also use this approach to prepare multiple different versions of Go to create a build matrix against several runtime releases, but I'll leave that as an exercise to you, dear reader 😉.