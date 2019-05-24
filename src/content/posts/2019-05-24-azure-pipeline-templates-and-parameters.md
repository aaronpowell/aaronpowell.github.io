+++
title = "Azure Pipeline YAML Templates and Parameters"
date = 2019-05-24T11:56:00+10:00
description = "Using parameters with job templates in Azure Pipelines"
draft = false
tags = ["azure-devops"]
+++

I'm currently building a project that uses [Azure Pipelines](https://docs.microsoft.com/en-us/azure/devops/pipelines/?{{< cda >}}), specifically the [YAML Pipeline](https://docs.microsoft.com/en-us/azure/devops/pipelines/yaml-schema?view=azure-devops&tabs=schema&{{< cda >}}) so that I can have it in source control.

But the Pipeline has a number of tasks that I have to execute multiple times with different parameters, so I grouped them into a [job](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/phases?view=azure-devops&tabs=yaml&{{< cda >}}) and just copy/pasted them the 3 times I needed. This was a quick way to get it tested and working, but as I modified the Pipeline I'd have to do the modification multiple times, which was a bit annoying (a few times I forgot to replicate the change and broke the build!).

## Enter Templates

In the past I've used [Task Groups](https://docs.microsoft.com/en-us/azure/devops/pipelines/library/task-groups?view=azure-devops&{{< cda >}}) in the visual Pipeline builder to extract a common set of tasks to run multiple times. With YAML we have [Templates](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/templates?view=azure-devops&{{< cda >}}) which work by allowing you to extract a `job` out into a separate file that you can reference.

Fantastic, it works just as I want it to, the only thing left is to pass in the various parameters. That's easy to do from the main Pipeline:

```yaml
jobs:
- template: templates/npm-with-params.yml  # Template reference
  parameters:
    name: Linux
    vmImage: 'ubuntu-16.04'
```

And then I hit a problem...

## Working with output variables

Not all the variables I need to pass in are static values, some are the result of other tasks (in this case ARM deployments), which means that I am setting some [multi-job output variables](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/variables?view=azure-devops&tabs=yaml%2Cbatch&{{< cda >}}#set-a-multi-job-output-variable).

Prior to the refactor I was accessing the output variable with `$[dependencies.JobName.outputs['taskName.VariableName']]` and it was all good, now I need to pass it in, so we'll update our template call:

```yaml
jobs:
# omitted parent jobs
- template: templates/some-template.yml  # Template reference
  parameters:
    STORAGE_ACCOUNT_NAME: $[dependencies.JobName.outputs['taskName.StorageAccountName']]
    name: SomeName
    azureSubscription: '...'
```

Then in the template I would use it like so:

```yaml
parameters:
  STORAGE_ACCOUNT_NAME: ''
  name: ''

jobs:
- job: ${{ parameters.name }}
  pool: 
    vmImage: 'Ubuntu-16.04'
  steps:
  - task: AzureCLI@1
    inputs:
      azureSubscription: ${{ parameters.azureSubscription }}
      scriptLocation: inlineScript
      arguments: ${{ parameters.STORAGE_ACCOUNT_NAME }}
      inlineScript: |
        account_name=$1
        key=$(az storage account keys list --account-name $account_name | jq '.[0].value')
        # more script here
```

I run this and get an error:

> az storage account keys list: error: Storage account '$[dependencies.JobName.outputs['taskName.StorageAccountName']]' not found.

Umm... what? Yes, you're right Azure, that isn't the name of the storage account, it's the dynamic variable you should've evaluated! Why didn't you evaluate?!

### Evaluation of parameters in templates

So here's the problem, the parameter I'm passing to my template isn't being evaluated, which means that it's being passed in a raw manner to the script when I want to use it. But never fear there's an easy fix, you just need to **assign the parameter to a variable**:

```yaml
parameters:
  STORAGE_ACCOUNT_NAME: ''
  name: ''

jobs:
- job: ${{ parameters.name }}
  pool: 
    vmImage: 'Ubuntu-16.04'
  variables:
    STORAGE_ACCOUNT_NAME: ${{ parameters.STORAGE_ACCOUNT_NAME }}
    
  steps:
  - task: AzureCLI@1
    inputs:
      azureSubscription: ${{ parameters.azureSubscription }}
      scriptLocation: inlineScript
      arguments: $(STORAGE_ACCOUNT_NAME)
      inlineScript: |
        account_name=$1
        key=$(az storage account keys list --account-name $account_name | jq '.[0].value')
        # more script here
```

Now you refer to the _variable_ not the _parameter_ in your tasks.

## Conclusion

Honestly, I racked my brain on this for the better part of a day, and it really isn't obvious that this is the case. I only stumbled on it by accident after trying a lot of other things.

Hopefully this helps someone else out when they are trying to work out why their template parameters aren't evaluated!