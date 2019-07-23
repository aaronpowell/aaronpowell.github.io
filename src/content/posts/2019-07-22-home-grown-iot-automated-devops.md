+++
title = "Home Grown IoT - Automated DevOps"
date = 2019-07-23T10:43:14+10:00
description = "Moving from manual DevOps to automated DevOps"
draft = false
tags = ["fsharp", "iot", "devops"]
series = "home-grown-iot"
series_title = "Automated DevOps"
+++

Having had a look at [some tools for deploying IoT applications]({{< ref "/posts/2019-07-16-home-grown-iot-devops.md" >}}) there was one piece of the puzzle that was missing, _automation_. After all, one of my goals is to be able to deploy updates to my project without really any effort, I want the idea of doing a `git push` and then it just deploying.

And that brings us to this post, a look at how we can do automated deployments of IoT projects using IoT Edge and Azure Pipelines.

Before we dive in, it's worth noting that the IoT Edge team [have guidance on how to do this](https://docs.microsoft.com/en-us/azure/iot-edge/how-to-devops-project?{{<cda>}}) on Microsoft Docs already, but it'll generate you a sample project, which means you'd need to retrofit your project into it. **That** is what we'll cover in this post, so I'd advise you to have a skim of the documentation first.

## Defining Our Process

As we get started we should look at the process that we'll go through to build and deploy the project. I'm going to split this into clearly defined Build and Release phases using the YAML Azure Pipelines component for building and then the GUI-based Release for deploying to the Pi. The primary reason I'm going down this route is, **at the time of writing**, the YAML Releases preview [announced at //Build](https://devblogs.microsoft.com/devops/whats-new-with-azure-pipelines/?{{<cda>}}) doesn't support approvals, which is something I want (I'll explain why later in this post).

### Build Phase

Within the Build phase our pipeline is going to be responsible for compiling the application, generating the IoT Edge deployment templates and creating the Docker images for IoT Edge to use.

I also decided that I wanted to have this phase responsible for preparing some of the Azure infrastructure that I would need using [Resource Manager Templates](https://docs.microsoft.com/en-us/azure/azure-resource-manager/resource-group-authoring-templates?{{<cda>}}). The goal here was to be able to provision everything 100% from scratch using the pipeline, and so that you, dear reader, could see exactly what is being used.

### Release Phase

The Release phase will be triggered by a successful Build phase completion and responsible for creating the IoT Edge deployment and for deploying my Azure Functions to process the data as it comes in.

To do this I created separate "environments" for the Pi and Azure Functions, since I may deploy one and not the other, and also run these in parallel.

## Getting The Build On

Let's take a look at what is required to build the application ready for release. Since I'm using the [YAML schema](https://docs.microsoft.com/en-us/azure/devops/pipelines/yaml-schema?view=azure-devops&tabs=schema&{{<cda>}}) I'll start with the triggers and variables needed:

```yaml
trigger:
- master

pr: none

variables:
  azureSubscription: 'Sunshine Service Connection'
  azureResourceNamePrefix: sunshine
  buildConfiguration: 'Release'
  azureResourceLocation: 'Australia East'

jobs:
```

I only care about the `master` branch, so I'm only triggering code on that branch itself and I'm turning off pull request builds, since I don't want to automatically build and release PR's (hey, this is _my_ house! 😝). There are a few variables we'll need, mainly related to the Azure resources that we'll generate, so let's define them rather than having magic strings around the place.

## Optimising Builds with Jobs

When it comes to running builds in Azure Pipelines it's important to think about how to do this efficiently. Normally we'll create a build definition which is a series of sequential tasks that are executed, we compile, package, prepare environments, etc. but this isn't always the most efficient approach to our build. After all, we want results from our build as fast as we can.

To do this we can use [Jobs](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/phases?view=azure-devops&tabs=yaml&{{<cda>}}) in Azure Pipelines. A Job is a collection of steps to be undertaken to complete part of our pipeline, and the really nice thing about Jobs is that you can run them in parallel ([depending on your licensing](https://docs.microsoft.com/en-us/azure/devops/pipelines/licensing/concurrent-jobs?view=azure-devops&{{<cda>}}), I've made my pipeline public meaning I get 10 parallel jobs) and with a pipeline that generates a lot of Docker images, being able to do them in parallel is a great time saver!

Also, with different Jobs you can specify different agent pools, so you can run some of your pipeline on Linux and some of it on Windows. You can even define dependencies between Jobs so that you don't try and push a Docker image to a container registry before the registry has been created.

With all of this in mind, it's time to start creating our pipeline.

### Building the Application

What's the simplest thing we need to do in our pipeline? Compile our .NET code, so let's start there:

```yaml
- job: Build
  pool:
      vmImage: "Ubuntu-16.04"
  steps:
      - script: dotnet build --configuration $(buildConfiguration)
        displayName: "dotnet build $(buildConfiguration)"

      - task: DotNetCoreCLI@2
        inputs:
            command: "publish"
            arguments: "--configuration $(BuildConfiguration)"
            publishWebProjects: false
            zipAfterPublish: false
        displayName: dotnet publish

      - task: ArchiveFiles@2
        inputs:
            rootFolderOrFile: "$(Build.SourcesDirectory)/src/Sunshine.Downloader/bin/$(BuildConfiguration)/netcoreapp2.2/publish"
            includeRootFolder: false
            archiveFile: "$(Build.ArtifactStagingDirectory)/Sunshine.Downloader-$(Build.BuildId).zip"
        displayName: Archive Downloader

      - task: ArchiveFiles@2
        inputs:
            rootFolderOrFile: "$(Build.SourcesDirectory)/src/Sunshine.Functions/bin/$(BuildConfiguration)/netcoreapp2.1/publish"
            includeRootFolder: false
            archiveFile: "$(Build.ArtifactStagingDirectory)/Sunshine.Functions-$(Build.BuildId).zip"
        displayName: Archive Functions

      - task: ArchiveFiles@2
        inputs:
            rootFolderOrFile: "$(Build.SourcesDirectory)/src/Sunshine.MockApi/bin/$(BuildConfiguration)/netcoreapp2.2/publish"
            includeRootFolder: false
            archiveFile: "$(Build.ArtifactStagingDirectory)/Sunshine.MockApi-$(Build.BuildId).zip"
        displayName: Archive MockApi

      - task: PublishBuildArtifacts@1
        displayName: "Publish Artifact"
        continueOnError: true
        inputs:
            artifactName: Apps
```

The `Build` job is your standard .NET Core pipeline template, we run the `dotnet build` using the configuration we define in the variables (defaulted to `Release`), then do a `dotnet publish` to generate the deployable bundle and then zip each project as artifacts for the pipeline. The reason I publish all the projects as artifacts, even though the IoT component will be Dockerised, is so I can download and inspect the package in the future if I want to.

Onto creating our IoT Edge deployment packages.

### Build IoT Edge Deployment Packages

To create the IoT Edge deployment packages we need to do three things, create the Docker image, push it to a container registry and create our deployment template (which we looked at [in the last post]({{< ref "/posts/2019-07-16-home-grown-iot-devops.md" >}})).

#### Creating a Container Registry

But this means we'll need a container registry to push to. I'm going to use [Azure Container Registry (ACR)](https://azure.microsoft.com/en-us/services/container-registry/?{{<cda>}}) as it integrates easily from a security standpoint across my pipeline and IoT Hub, but you can use any registry you wish. And since I'm using ACR I need it to exist. You could do this by clicking through the portal, but instead, I want this scripted and part of my git repo so I could rebuild if needed, and for that, we'll use a Resource Manager template:

```json
{
    "resources": [
        {
            "type": "Microsoft.ContainerRegistry/registries",
            "sku": {
                "name": "[parameters('registrySku')]"
            },
            "name": "[variables('registryName')]",
            "apiVersion": "2017-10-01",
            "location": "[parameters('location')]",
            "properties": {
                "adminUserEnabled": false
            }
        }
    ],
    "parameters": {
        "name": {
            "type": "string",
            "metadata": {
                "description": "Short name for the resources within this stack"
            }
        },
        "location": {
            "type": "string"
        },
        "registrySku": {
            "defaultValue": "Standard",
            "type": "string",
            "metadata": {
                "description": "The SKU of the container registry."
            }
        }
    },
    "variables": {
        "registryName": "[concat(parameters('name'), 'cr')]"
    },
    "outputs": {
        "acrUrl": {
            "type": "string",
            "value": "[concat(variables('registryName'), '.azurecr.io')]"
        },
        "acrName": {
            "type": "string",
            "value": "[variables('registryName')]"
        },
        "subscriptionId": {
            "type": "string",
            "value": "[subscription().id]"
        }
    },
    "$schema": "http://schema.management.azure.com/schemas/2014-04-01-preview/deploymentTemplate.json#",
    "contentVersion": "1.0.0.0"
}
```

Which we can run from the pipeline with this task:

```yaml
- job: PrepareAzureACR
  displayName: Prepare Azure ACR
  pool:
      vmImage: "Ubuntu-16.04"
  steps:
      - task: AzureResourceGroupDeployment@2
        displayName: "Azure Deployment:Create ACR"
        inputs:
            azureSubscription: "$(azureSubscription)"
            resourceGroupName: "$(azureResourceNamePrefix)-shared"
            location: "$(azureResourceLocation)"
            templateLocation: Linked artifact
            csmFile: "$(Build.SourcesDirectory)/.build/acr.json"
            overrideParameters: '-name $(azureResourceNamePrefix) -registrySku "Basic" -location "$(azureResourceLocation)"'
            deploymentOutputs: ResourceGroupDeploymentOutputs
```

Notice here I'm using the variables defined early on for the `-name` and `-location` parameters. This helps me have consistency naming of resources. I'm also putting this into a resource group called `$(azureResourceNamePrefix)-shared` because if I wanted to have the images used in both production and non-production scenario (which I could be doing if I had more than just my house that I was building against). The last piece to note in the task is that the `templateLocation` is set to `Linked artifact`, which tells the task that the file exists on disk at the location defined in `csmFile`, rather than pulling it from a URL. This caught me out for a while, so remember, if you want to keep your Resource Manager templates in source control and use the version in the clone, set the `templateLocation` to `Linked artifact` and set a `csmFile` path.

When it comes to creating the IoT Edge deployment template I'm going to need some information about the registry that's just been created, I'll need the name of the registry and the URL of it. To get those I've created some output variables from the template:

```json
...
  "outputs": {
    "acrUrl": {
      "type": "string",
      "value": "[concat(variables('registryName'), '.azurecr.io')]"
    },
    "acrName": {
      "type": "string",
      "value": "[variables('registryName')]"
    },
    "subscriptionId": {
      "type": "string",
      "value": "[subscription().id]"
    }
  },
...
```

But how do we use those? Well initially the task will dump them out as a JSON string in a variable, defined using `deploymentOutputs: ResourceGroupDeploymentOutputs`, but now we need to unpack that and set the variables we'll use in other tasks. I do this with a PowerShell script:

```powershell
param (
    [Parameter(Mandatory=$true)]
    [string]
    $ResourceManagerOutput
    )

$json = ConvertFrom-Json $ResourceManagerOutput

Write-Host "##vso[task.setvariable variable=CONTAINER_REGISTRY_SERVER;isOutput=true]$($json.acrUrl.value)"
Write-Host "##vso[task.setvariable variable=CONTAINER_REGISTRY_SERVER_NAME;isOutput=true]$($json.acrName.value)"
Write-Host "##vso[task.setvariable variable=SUBSCRIPTION_ID;isOutput=true]$($json.subscriptionID.value)"
```

Executed with a task:

```yaml
- task: PowerShell@2
    displayName: Convert ARM output to environment variables
    name: armVar
    inputs:
        targetType: filePath
        filePath: '$(Build.SourcesDirectory)/.build/Set-BuildResourceManagerOutput.ps1'
        arguments: -ResourceManagerOutput '$(ResourceGroupDeploymentOutputs)'
```

Now in other tasks I can access `CONTAINER_REGISTRY_SERVER` as a variable.

#### Preparing the IoT Edge Deployment

I want to create three Docker images, the ARM32 image which will be deployed to the Raspberry Pi, but also an x64 image for local testing and an x64 image with the debugger components. And this is where our use of Jobs will be highly beneficial, from my testing each of these takes at least 7 minutes to run, so running them in parallel drastically reduces our build time.

To generate the three images I need to execute the same set of tasks three times, so to simplify that process we can use [Step Templates](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/templates?view=azure-devops&{{<cda>}}) (side note, this is where I came across the issue [I described here]({{< ref "/posts/2019-05-24-azure-pipeline-templates-and-parameters.md" >}}) on templates and parameters).

```yaml
parameters:
    name: ""
    ARTIFACT_STORAGE_NAME: ""
    CONTAINER_REGISTRY_SERVER: ""
    SUBSCRIPTION_ID: ""
    CONTAINER_REGISTRY_SERVER_NAME: ""
    defaultPlatform: ""
    azureResourceNamePrefix: ""
    azureSubscription: ""
```

We'll need a number of bits of information for the tasks within our template, so we'll start by defining a bunch of parameters. Next, let's define the Job:

```yaml
jobs:
- job: ${{ parameters.name }}
  displayName: Build Images for IoT Edge (${{ parameters.defaultPlatform }})
  dependsOn:
    - PrepareArtifactStorage
    - PrepareAzureACR
    - Build
  pool:
    vmImage: 'Ubuntu-16.04'
  variables:
    CONTAINER_REGISTRY_SERVER: ${{ parameters.CONTAINER_REGISTRY_SERVER }}
    SUBSCRIPTION_ID: ${{ parameters.SUBSCRIPTION_ID }}
    CONTAINER_REGISTRY_SERVER_NAME: ${{ parameters.CONTAINER_REGISTRY_SERVER_NAME }}
    ARTIFACT_STORAGE_NAME: ${{ parameters.ARTIFACT_STORAGE_NAME }}
  steps:
```

To access a template parameter you need to use `${{ parameters.<parameter name> }}`. I'm providing the template with a unique name in the `name` parameter and then creating a display name using the architecture (AMD64, ARM32, etc.).

Next, the Job defines a few dependencies, the `Build` and `PrepareAzureACR` Jobs we've seen above and I'll touch on the `PrepareArtifactStorage` shortly. Finally, this sets the pool as a Linux VM and converts some parameters to environment variables in the Job.

Let's start looking at the tasks:

```yaml
- task: DownloadBuildArtifacts@0
  displayName: "Download Build Artifacts"
  inputs:
      artifactName: Apps
      downloadPath: $(System.DefaultWorkingDirectory)

- task: ExtractFiles@1
  displayName: Unpack Build Artifact
  inputs:
      destinationFolder: "$(Build.SourcesDirectory)/src/Sunshine.Downloader/bin/$(BuildConfiguration)/netcoreapp2.2/publish"
      archiveFilePatterns: $(System.DefaultWorkingDirectory)/Apps/Sunshine.Downloader-$(Build.BuildId).zip
```

Since the Job that's running here isn't on the same agent that did the original build of our .NET application we need to get the files, thankfully we published them as an artifact so it's just a matter of downloading it and unpacking it into the right location. I'm unpacking it back to where the publish originally happened, because the Job does do a `git clone` initially (I need that to get the `module.json` and `deployment.template.json` for IoT Edge) I may as well pretend as I am using the normal structure.

Code? ✔. Deployment JSON? ✔. Time to use the IoT Edge tools to create some deployment files. Thankfully, there's an [IoT Edge task](https://docs.microsoft.com/en-us/azure/devops/pipelines/tasks/build/azure-iot-edge?view=azure-devops&{{<cda>}}) for Azure Pipelines, and that will do nicely.

```yaml
- task: AzureIoTEdge@2
  displayName: Azure IoT Edge - Build module images (${{ parameters.defaultPlatform }})
  inputs:
      templateFilePath: "$(Build.SourcesDirectory)/.build/deployment.template.json"
      defaultPlatform: ${{ parameters.defaultPlatform }}

- task: AzureIoTEdge@2
  displayName: Azure IoT Edge - Push module images (${{ parameters.defaultPlatform }})
  inputs:
      action: "Push module images"
      templateFilePath: "$(Build.SourcesDirectory)/.build/deployment.template.json"
      azureSubscriptionEndpoint: ${{ parameters.azureSubscription }}
      azureContainerRegistry: '{"loginServer":"$(CONTAINER_REGISTRY_SERVER)", "id" : "$(SUBSCRIPTION_ID)/resourceGroups/${{ parameters.azureResourceNamePrefix }}-shared/providers/Microsoft.ContainerRegistry/registries/$(CONTAINER_REGISTRY_SERVER_NAME)"}'
      defaultPlatform: ${{ parameters.defaultPlatform }}
```

The first task will use the `deployment.template.json` file to build the Docker image for the platform that we've specified. As I noted in the last post if you'll need to have the `CONTAINER_REGISTRY_USERNAME`, `CONTAINER_REGISTRY_PASSWORD` and `CONTAINER_REGISTRY_SERVER` environment variables set so they can be substituted into the template. We get `CONTAINER_REGISTRY_SERVER` from the parameters passed in (unpacked as a variable) but what about the other two? They are provided by the integration between Azure and Azure Pipelines, so you don't need to set them explicitly.

Once the image is built we execute the `Push module images` command on the task which will push the image to our container registry. Since I'm using ACR I need to provide a JSON object which contains the URL for the ACR and the `id` for it. The `id` is a little tricky, you need to generate the full resource identifier which means you need to join each segment together, resulting in this `$(SUBSCRIPTION_ID)/resourceGroups/${{ parameters.azureResourceNamePrefix }}-shared/providers/Microsoft.ContainerRegistry/registries/$(CONTAINER_REGISTRY_SERVER_NAME)` which would become `<some guid>/resourceGroups/sunshine-shared/providers/Microsoft.ContainerRegistry/registries/sunshinecr`.

Finally, we need to publish our `deployment.platform.json` file that the Release phase will execute to deploy a release to a device, but there's something to be careful about here. When the deployment is generated the container registry information is replaced with the credentials needed to talk to the registry. This is so the deployment, when pulled to the device, is able to log into your registry. But there's a downside to this, you have your credentials stored in a file that needs to be attached to the build. The standard template generated [in the docs](https://docs.microsoft.com/en-us/azure/iot-edge/how-to-devops-project?{{<cda>}}) will attach this as a build artifact, just like our compiled application, and this works really well for most scenarios. There is a downside to this though, anyone who has access to your build artifacts will have access to your container registry credentials, which is something that you may not want. This bit me when I realised that, because my pipeline is public, **everyone** had access to my container registry credentials! I then quickly deleted that ACR as the credentials were now compromised! 🤦‍♂️

#### Securing Deployments

We want to secure the deployment so that our build server isn't a vector into our infrastructure and that means that we can't attach the deployment files as build artifacts.

This is where the other dependency on this Job, `PrepareArtifactStorage`, comes in. Instead of pushing the deployment file as an artifact I push it to an Azure storage account:

```yaml
- job: PrepareArtifactStorage
  displayName: Setup Artifact Storage Azure Resources
  pool:
      vmImage: "Ubuntu-16.04"
  steps:
      - task: AzureResourceGroupDeployment@2
        displayName: "Azure Deployment: Artifact Storage"
        inputs:
            azureSubscription: "$(azureSubscription)"
            resourceGroupName: "$(azureResourceNamePrefix)-shared"
            location: "$(azureResourceLocation)"
            templateLocation: Linked artifact
            csmFile: "$(Build.SourcesDirectory)/.build/artifact-storage.json"
            overrideParameters: '-name $(azureResourceNamePrefix) -location "$(azureResourceLocation)"'
            deploymentOutputs: ResourceGroupDeploymentOutputs

      - task: PowerShell@2
        displayName: Convert ARM output to environment variables
        name: artifactVars
        inputs:
            targetType: filePath
            filePath: "$(Build.SourcesDirectory)/.build/Set-ArtifactStorageResourceManagerOutput.ps1"
            arguments: -ResourceManagerOutput '$(ResourceGroupDeploymentOutputs)'
```

This uses a Resource Manager template that just creates the storage account:

```json
{
    "resources": [
        {
            "apiVersion": "2015-06-15",
            "type": "Microsoft.Storage/storageAccounts",
            "name": "[variables('artifactStorageName')]",
            "location": "[parameters('location')]",
            "properties": {
                "accountType": "Standard_LRS"
            }
        }
    ],
    "parameters": {
        "name": {
            "type": "string",
            "metadata": {
                "description": "Name prefix for the resources to be created"
            }
        },
        "location": {
            "type": "string",
            "metadata": {
                "description": "Azure Region for each resource to be created in"
            }
        }
    },
    "variables": {
        "artifactStorageName": "[replace(concat(parameters('name'), 'artifacts'), '-', '')]"
    },
    "outputs": {
        "artifactStorageName": {
            "type": "string",
            "value": "[variables('artifactStorageName')]"
        }
    },
    "$schema": "http://schema.management.azure.com/schemas/2014-04-01-preview/deploymentTemplate.json#",
    "contentVersion": "1.0.0.0"
}
```

And a PowerShell script to get the outputs into variables:

```powershell
param (
    [Parameter(Mandatory=$true)]
    [string]
    $ResourceManagerOutput
    )

$json = ConvertFrom-Json $ResourceManagerOutput

Write-Host "##vso[task.setvariable variable=ARTIFACT_STORAGE_NAME;isOutput=true]$($json.artifactStorageName.value)"
```

#### Pushing Artifacts to Storage

Now we can complete our IoT Job by using the storage account as the destination for the artifact:

```yaml
- task: AzureCLI@1
  displayName: Upload deployment artifact
  inputs:
      azureSubscription: ${{ parameters.azureSubscription }}
      scriptLocation: inlineScript
      arguments: $(ARTIFACT_STORAGE_NAME) $(Build.ArtifactStagingDirectory) ${{ parameters.defaultPlatform }} $(Build.BuildId)
      inlineScript: |
          account_name=$1
          key=$(az storage account keys list --account-name $account_name | jq '.[0].value')
          exists=$(az storage container exists --account-name $account_name --name artifacts --account-key $key | jq '.exists')
          if [ "$exists" == false ]; then
                  az storage container create --name artifacts --account-name $account_name --account-key $key
          fi
          az storage blob upload --container-name artifacts --file $2/deployment.$3.json --name $4/deployment.$3.json --account-name $account_name --account-key $key
```

I'm using the [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/?view=azure-cli-latest&{{<cda>}}) rather than [AzCopy](https://docs.microsoft.com/en-us/azure/storage/common/storage-use-azcopy-v10?{{<cda>}}) because I'm running on a Linux agent. It executes a script that will get the account key from the storage account (so I can write to it), checks if there is a container (script everything, don't assume!) and then uploads the file into a folder in the storage container that prefixes with the `Build.BuildId` so I know which artifact to use in the release phase.

#### Using The Template

The template that I've defined for the IoT Job is in a separate file called `template.iot-edge.yml`, and we'll need to execute that from our main `azure-pipelines.yml` file:

```yaml
- template: .build/template.iot-edge.yml
  parameters:
      name: BuildImages_arm32v7
      CONTAINER_REGISTRY_SERVER: $[dependencies.PrepareAzureACR.outputs['armVar.CONTAINER_REGISTRY_SERVER']]
      SUBSCRIPTION_ID: $[dependencies.PrepareAzureACR.outputs['armVar.SUBSCRIPTION_ID']]
      CONTAINER_REGISTRY_SERVER_NAME: $[dependencies.PrepareAzureACR.outputs['armVar.CONTAINER_REGISTRY_SERVER_NAME']]
      ARTIFACT_STORAGE_NAME: $[dependencies.PrepareArtifactStorage.outputs['artifactVars.ARTIFACT_STORAGE_NAME']]
      defaultPlatform: arm32v7
      azureResourceNamePrefix: $(azureResourceNamePrefix)
      azureSubscription: $(azureSubscription)
```

We're relying on the outputs from a few other Jobs, and to access those we use `$[dependencies.JobName.outputs['taskName.VARIABLE_NAME']]`, and then they are passed into the template for usage (remember to assign them to template variables or they [won't unpack]({{< ref "/posts/2019-05-24-azure-pipeline-templates-and-parameters.md" >}})).

### Creating Our Azure Environment

There's only one thing left to do in the build phase, prepare the Azure environment that we'll need. Again we'll use a Resource Manager template to do that, but I won't embed it in the blog post as it's over 400 lines, instead, you can [find it here](https://github.com/aaronpowell/sunshine/blob/1a8a2ba6921915bcc82ac0be477330d5e5b4ea95/.build/azure-environment.json).

When creating the IoT Hub resource with the template you can provision the routing like so:

```json
...
"routing": {
    "endpoints": {
        "serviceBusQueues": [],
        "serviceBusTopics": [],
        "eventHubs": [{
                "connectionString": "[listKeys(resourceId('Microsoft.EventHub/namespaces/eventhubs/authorizationRules', variables('EventHubsName'), 'live-list', variables('IotHubName')), '2017-04-01').primaryConnectionString]",
                "name": "sunshine-live-list-eh",
                "subscriptionId": "[subscription().subscriptionId]",
                "resourceGroup": "[resourceGroup().name]"
            },
            ...
        ],
        "storageContainers": []
    },
    "routes": [{
            "name": "live-list",
            "source": "DeviceMessages",
            "condition": "__messageType='liveList'",
            "endpointNames": [
                "sunshine-live-list-eh"
            ],
            "isEnabled": true
        },
...
```

We can even build up the connection string to Event Hub authorization rules using the [`listKeys`](https://docs.microsoft.com/en-us/rest/api/eventhub/namespaces/listkeys?{{<cda>}}) function combined with [`resourceId`](https://docs.microsoft.com/en-us/azure/azure-resource-manager/resource-group-template-functions-resource?{{<cda>}}#resourceid). A note with using `resourceId`, when you're joining the segments together you don't need the `/` separator _except for the resource type_, which is a bit confusing when you create a resource name like `"name": "[concat(variables('EventHubsName'), '/live-list/', variables('IotHubName'))]"`, which **does** contain the `/`.

A new Job is created for this template:

```yaml
- job: PrepareAzureIoTEnvrionment
  displayName: Prepare Azure IoT Environment
  pool:
      vmImage: "Ubuntu-16.04"
  variables:
      resourceGroupName: sunshine-prod
  steps:
      - task: AzureResourceGroupDeployment@2
        displayName: "Azure Deployment:Create Or Update Resource Group action on sunshine-prod"
        inputs:
            azureSubscription: "$(azureSubscription)"
            resourceGroupName: "$(azureResourceNamePrefix)-prod"
            location: "$(azureResourceLocation)"
            templateLocation: Linked artifact
            csmFile: "$(System.DefaultWorkingDirectory)/.build/azure-environment.json"
            overrideParameters: '-name $(azureResourceNamePrefix) -location "$(azureResourceLocation)"'
            deploymentOutputs: ResourceGroupDeploymentOutputs
```

And now you might be wondering "Why is the step to create the _production_ environment in Azure done in a Build phase, not Release phase?", which is a pretty valid question to ask, after all, if I _did_ have multiple environments, why wouldn't I do the Azure setup as part of the release to that environment?

Well, the primary reason I took this approach is that I wanted to avoid having to push the Resource Manager template from the Build to Release phase. Since the Build phase does the `git clone` and the Release phase does not I would have had to attach the template as an artifact. Additionally, I want to use some of the variables in both phases, but you can't share variables between Build and Release, which does still pose a problem with the environment setup, I need the name of the Azure Functions and IoT Hub resources.

To get those I write the output of the Resource Manager deployment to a file that is attached as an artifact:

```yaml
- task: PowerShell@2
  displayName: Publish ARM outputs for asset
  inputs:
      targetType: filePath
      filePath: "$(Build.SourcesDirectory)/.build/Set-ReleaseResourceManagerOutput.ps1"
      arguments: -ResourceManagerOutput '$(ResourceGroupDeploymentOutputs)'
- task: PublishBuildArtifacts@1
  displayName: "Publish Artifact"
  continueOnError: true
  inputs:
      artifactName: arm
```

Using this PowerShell script:

```powershell
param (
    [Parameter(Mandatory=$true)]
    [string]
    $ResourceManagerOutput
    )

Set-Content -Path $env:BUILD_ARTIFACTSTAGINGDIRECTORY/release-output.json -Value $ResourceManagerOutput
```

**🎉 Build phase completed!** You can find the complete Azure Pipeline YAML file [in GitHub](https://github.com/aaronpowell/sunshine/blob/1a8a2ba6921915bcc82ac0be477330d5e5b4ea95/azure-pipelines.yml).

![A successful Build execution](/images/home-grown-iot/08-001.png)

## Deploying Releases

Here's the design of our Release process that we're going to go ahead and create using the Azure Pipelines UI:

![Our Release process](/images/home-grown-iot/08-002.png)

On the left is the artifacts that will be available to the Release, it's linked to the Build pipeline we just created and it's set to automatically run when a build completes successfully.

I've defined three Stages, which represent groups of tasks I will run. I like to think of Stages like environments, so I have an environment for my Raspberry Pi and an environment for my Azure Functions (I do have a 2nd Raspberry Pi environment, but that's my test device that lives in the office, and I just use to smoke test IoT Edge, generally it's not even turned on).

### Pi Stage

Let's have a look at the stage for deploying to a Raspberry Pi, or really, any IoT device supported by IoT Edge:

![Tasks for deploying to an IoT Device](/images/home-grown-iot/08-003.png)

The first task is to get our deployment template. Because I'm using an Azure storage account to store this I use the Azure CLI to download the file, but if you're using it as an artifact from the build output, you'd probably skip that step (since artifacts are automatically downloaded).

With the deployment downloaded it's time to talk to Azure IoT Hub!

#### Provisioning the Device

Continuing on our approach to assume nothing exists we'll run a task that checks for the [device identity in IoT Hub](https://docs.microsoft.com/en-us/azure/iot-hub/iot-hub-devguide-identity-registry?{{<cda>}}) and if it doesn't exist, create it.

```bash
#! /bin/sh

IoTHubName=$(cat $SYSTEM_DEFAULTWORKINGDIRECTORY/_aaronpowell.sunshine/arm/release-output.json | jq '.iotHubName.value' | sed s/\"// | sed s/\"//)

# install iot hub extension
az extension add --name azure-cli-iot-ext

# check if device exists
# note: redirect to /dev/null so the keys aren't printed to logs, and we don't need the output anyway
az iot hub device-identity show \
--device-id $DEVICE_ID \
--hub-name $IoTHubName >> /dev/null

if [ $? -ne 0 ]; then
    az iot hub device-identity create --hub-name $IoTHubName --device-id $DEVICE_ID --edge-enabled
    TMP_OUTPUT="$(az iot hub device-identity show-connection-string --device-id $DEVICE_ID --hub-name $IoTHubName)"
    RE="\"cs\":\s?\"(.*)\""
    if [[ $TMP_OUTPUT =~ $RE ]]; then
        CS_OUTPUT=${BASH_REMATCH[1]};
    fi
    echo "##vso[task.setvariable variable=CS_OUTPUT]${CS_OUTPUT}"
fi
```

_It's a little bit hacked my shell script skills are not that great!_ 🤣

We'll need the name of the IoT Hub that was created using Resource Manager in the build phase, which we can pull using [`jq`](https://stedolan.github.io/jq/). After that install the [IoT Hub CLI extension](https://docs.microsoft.com/en-us/cli/azure/ext/azure-cli-iot-ext/?view=azure-cli-latest&{{<cda>}}), since the commands we'll need don't ship in the box.

The command that's of interest to us is [`az iot hub device-identity show`](https://docs.microsoft.com/en-us/cli/azure/ext/azure-cli-iot-ext/iot/hub/device-identity?view=azure-cli-latest&{{<cda>}}#ext-azure-cli-iot-ext-az-iot-hub-device-identity-show) which will get the device identity information _or_ return a non-zero exit code if the device doesn't exist. Since the default of the command is to write to standard out and the output contains the device keys, we'll redirect that to `/dev/null` as I don't actually need the output, I just need the exit code. If you **do** need the output then I'd assign it to a variable instead.

If the device doesn't exist (non-zero exit code, tested with `if [ $? -ne 0 ]`) you can use [`az iot hub device-identity create`](https://docs.microsoft.com/en-us/cli/azure/ext/azure-cli-iot-ext/iot/hub/device-identity?view=azure-cli-latest&{{<cda>}}#ext-azure-cli-iot-ext-az-iot-hub-device-identity-create). Be sure to pass `--edge-enabled` so that the device can be connected with IoT Edge!

The last thing the script will do is export the connection string if the connection string can be retrieved (not 100% sure on the need for this, it was just in the template!).

#### Preparing the Module Twin

In my post about [the data downloader]({{< ref "/posts/2019-06-12-home-grown-iot-data-downloader.md" >}}) I mentioned that I would use [module twins](https://docs.microsoft.com/en-us/azure/iot-hub/iot-hub-devguide-module-twins?{{<cda>}}) to get the credentials for my solar inverter API, rather than embedding them.

To get those into the module twin we'll use the Azure CLI again:

```bash
#! /bin/sh

az extension add --name azure-cli-iot-ex

IoTHubName=$(cat $SYSTEM_DEFAULTWORKINGDIRECTORY/_aaronpowell.sunshine/arm/release-output.json | jq '.iotHubName.value' | sed s/\"//g)

az iot hub module-twin update \
--device-id $DEVICE_ID \
--hub-name $IoTHubName \
--module-id SunshineDownloader \
--set properties.desired="{ \"inverter\": { \"username\": \"$SUNSHINEUSER\", \"password\": \"$SUNSHINEPWD\", \"url\": \"$SUNSHINEURL\" } }" >> /dev/null
```

Using the [`az iot hub module-twin update`](https://docs.microsoft.com/en-us/cli/azure/ext/azure-cli-iot-ext/iot/hub/module-twin?view=azure-cli-latest&{{<cda>}}#ext-azure-cli-iot-ext-az-iot-hub-module-twin-update) command we can set the `properties.desired` section of the twin (this just happens to be where I put them, but you can create your own nodes in the twin properties). Like the last task the output is redirected to `/dev/null` so that the updated twin definition, which is returned, doesn't get written to our log file. After all, our secrets wouldn't be secret if they are dumped to logs!

#### It's Time to Deploy

**Finally** it's time to send our deployment to IoT Edge! We'll use the [IoT Edge task](https://docs.microsoft.com/en-us/azure/devops/pipelines/tasks/build/azure-iot-edge?view=azure-devops&{{<cda>}}) again, but this time the action will be `Deploy to IoT Edge devices`:

![Deploy task](/images/home-grown-iot/08-004.png)

We specify the deployment template that we'll execute (the one we got from storage) and it's going to be a **Single Device** deployment (if you were deploying to a fleet of devices then you'd change that and specify some way to find the group of devices to target). Under the hood, this task will execute the `iotedgedev` tool with the right commands and will result in our deployment going to IoT Edge and eventually our device! 🎉

### Deploying Functions

With our stage defined for IoT devices it's time for the Azure Functions. As it turns out, Azure Pipelines is really good at doing this kind of deployment, there's a [task that we can use](https://docs.microsoft.com/en-us/azure/devops/pipelines/tasks/deploy/azure-rm-web-app-deployment?view=azure-devops&{{<cda>}}) and all we need to do is provide it with the ZIP that contains the functions (which comes from our artifacts).

There's no need to provide the connection strings, [that was set up in the Resource Manager template](https://github.com/aaronpowell/sunshine/blob/1a8a2ba6921915bcc82ac0be477330d5e5b4ea95/.build/azure-environment.json#L7-L22)!

**🎉 Release phase complete!**

![Deployment is green](/images/home-grown-iot/08-005.png)

## Conclusion

Phew, that was a long post, but we've covered a lot! Our deployment has run end-to-end, from a `git push` that triggers the build to creating an Azure environment, compiling our application to building Docker images, setting up devices in IoT Hub and eventually deploying to them.

I've made the Azure Pipeline I use public so you can have a look at what it does, you'll find the [Build phase here](https://dev.azure.com/aaronpowell/Sunshine/_build?definitionId=25&_a=summary) and the [Release phase here](https://dev.azure.com/aaronpowell/Sunshine/_release?definitionId=1&view=mine&_a=releases).

As I said at the start, I'd encourage you to have a read of the information on [Microsoft Docs](https://docs.microsoft.com/en-us/azure/iot-edge/how-to-devops-project?{{<cda>}}) to get an overview of what the process would be and then use this article as a way to supplement how everything works.

Happy DevOps'ing!
