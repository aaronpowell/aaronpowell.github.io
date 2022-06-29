+++
title = "Deploy Azure Static Web Apps With Bicep"
date = 2022-06-29T00:41:50Z
description = "I'm trying to get better at using Infrastructure as Code, so first up - deployments with SWA!"
draft = true
tags = ["azure", "devops"]
tracking_area = "javascript"
tracking_id = "70241"
+++

In an effort to constantly tinker with things that _probably_ don't need to be tinkered with, I've decided that it's time to do an upgrade to my CI/CD pipeline so that I can use Bicep to deploy Azure Static Web Apps (I'm also using this as a way to learn more about Bicep as well).

Because I'm using [VS Code](https://code.visualstudio.com/?{{<cda>}}) I've gone ahead and installed the [Bicep Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode.bicep&{{<cda>}}) so that I get some nice syntax highlighting in the editor.

## Writing Bicep

With the editor ready, let's write some Bicep! Create a new file named `swa.bicep` and paste the following code into it:

```bicep
param name string
@allowed([ 'centralus', 'eastus2', 'eastasia', 'westeurope', 'westus2' ])
param location string
@allowed([ 'Free', 'Standard' ])
param sku string = 'Standard'

resource swa_resource 'Microsoft.Web/staticSites@2021-01-15' = {
    name: name
    location: location
    tags: null
    properties: {}
    sku: {
        name: sku
        size: sku
    }
}
```

This is about as simple as you can get when it comes to deploying SWA with Bicep, as it's not deploying a backend service, but rather a static website.

First up, there's three parameters defined, the `name` of the SWA instance, the `location` and what `sku` to use (and the `sku` is defaulted to `Standard`). There's also an allow-list of values for `location` and `sku`, since they have some restrictions on them and this will reduce the possibility of invalid values.

Then we define the `resource` that we're deploying with the symbolic-name `swa_resource` (that we could use elsewhere if required) and the resource name plus the version.

This is the minimum fields that you need to provide to Bicep for defining the resource, with `tags` and `properties` essentially ignores in ours, but you need to include them or the deployment will fail with a rather obscure error message. The `tags` property is pretty straight forward, but let's talk about `properties` for a bit.

### Understanding `properties` in our Bicep file

For my use-case, I've got a _highly_ customised deployment pipeline, and as such, I'm essentially just uploading a pre-built application to SWA, but that's not the most common approach, instead, you're more likely wanting to get the resource configured for deployment as part of the Bicep template, and we control that with the `properties` section.

Here's a more expanded definition, adapted from [the Bicep docs](https://docs.microsoft.com/azure/templates/microsoft.web/staticsites?tabs=bicep&{{<cda>}}):

```bicep
  properties: {
    branch: 'string'
    buildProperties: {
      apiBuildCommand: 'string'
      apiLocation: 'string'
      appArtifactLocation: 'string'
      appBuildCommand: 'string'
      appLocation: 'string'
      githubActionSecretNameOverride: 'string'
      outputLocation: 'string'
      skipGithubActionWorkflowGeneration: bool
    }
    provider: 'string'
    repositoryToken: 'string'
    repositoryUrl: 'string'
  }
```

Including values for this will instruct Azure to provision the GitHub Actions workflow for you, and you can use the `branch` and `repositoryUrl` to specify what to build, and the other options will configure _how_ it's built (where the app and API are in the repo, etc.), so I could have set it like this:

```bicep
resource swa_resource 'Microsoft.Web/staticSites@2021-01-15' = {
    name: name
    location: location
    tags: null
    properties: {
        branch: 'main',
        repositoryToken: tokenParam,
        repositoryUrl: 'https://github.com/aaronpowell/aaronpowell.github.io',
        buildProperties: {
            appLocation: './',
            apiLocation: './api',
            outputLocation: './output'
        }
    }
    sku: {
        name: sku
        size: sku
    }
}
```

(That's not _entirely_ reflective of my repo setup as it's highly customised, but it gives an overview.)

## Modularlising the Bicep file

The `swa.bicep` file is really all we need, but let's put some good practices in place and modularise it so that if we want to add other services in the future, we can do that without too much hassle. For this, create another file, `main.bicep`, which will be our entrypoint:

```bicep
param location string = resourceGroup().location

param swaName string
@allowed([ 'Free', 'Standard' ])
param swaSku string = 'Free'

module staticWebApp 'swa.bicep' = {
    name: '${deployment().name}--swa'
    params: {
        location: location
        sku: swaSku
        name: swaName
    }
}
```

We've got the same set of `param`s defined as the other file, with the only difference being the `location` is being derived from the resource group that we're deploying to using the `resourceGroup()` function.

To call the `swa.bicep` file, we're defining it as a `module` and passing in the `param` values that it needs, and giving it a dynamically generated name.

With the files setup, it's time to use them from GitHub Actions.

## Deploying with GitHub Actions

Since Bicep is a DSL over ARM (Azure Resource Manager), we can use the [`azure/arm-deploy` GitHub Action](https://github.com/azure/arm-deploy) to deploy it as well, since the Action will determine if we're deploying a Bicep or ARM file.

But before we can deploy that, we're going to need to log into Azure, which we can do with the [`azure/login` Action](https://github.com/azure/login):

```yaml
- name: Azure Login
  uses: azure/login@v1
  with:
      client-id: ${{ secrets.AZURE_CLIENT_ID }}
      tenant-id: ${{ secrets.AZURE_TENANT_ID }}
      subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
```

There's different ways that you can provide credentials to Azure for the Action to authenticate with, my preference is to use the [OIDC Connect](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-azure?{{<cda>}}) method as its setup is the most straight forward to me.

Follow [the guide](https://docs.microsoft.com/azure/developer/github/connect-from-azure?tabs=azure-portal%2Clinux&{{<cda>}}) on setting up via Portal, CLI or PowerShell, I prefer Azure CLI myself:

```bash
app=$(az ad app create --display-name blog-deployer -o json)
appId=$(echo $app | jq -r '.appId')
objectId=$(echo $app | jq -r '.id')

sp=$(az ad sp create --id $appId -o json)
assigneeObjectId=$(echo $sp | jq -r '.id')

subscriptionId=...
resourceGroupName=...
az role assignment create --role contributor --subscription $subscriptionId --assignee-object-id  $assigneeObjectId --assignee-principal-type ServicePrincipal --scope /subscriptions/$subscriptionId/resourceGroups/$resourceGroupName

credentialName=github-deploy
subject=repo:aaronpowell/aaronpowell.github.io:environment:production
az rest --method POST --uri "https://graph.microsoft.com/beta/applications/$objectId/federatedIdentityCredentials" --body "{\"name\":\"$credentialName\",\"issuer\":\"https://token.actions.githubusercontent.com\",\"subject\":\"repo:organization/repository:environment:production\",\"description\":\"Deploy from GitHub Actions\",\"audiences\":[\"api://AzureADTokenExchange\"]}"

echo Values for GitHub secrets:
echo Client ID: $appId
echo Tenant ID: $(echo $sp | jq -r '.appOwnerOrganizationId')
echo Subscription ID: $subscriptionId
```

This script will go through the steps to create the app in Azure AD, setup a Service Principal and then provision the identity to talk to GitHub, before dumping out the three bits of information you'll need to authenticate the Action with.

You'll need to provide the right `subscriptionId` and `resourceGroupName`, and the only other value you may wish to change is `subject`. For this pipeline, we'll use GitHub Environments to deploy, which is denoted by `environment:<environment name>`, where `environment name` is `production`. Give that a name and then call the `az rest` comand to create the credential (this feature is still in preview, in the future there may be a direct Azure CLI command to use).

Now, plug the three values it outputs into GitHub secrets, so the Action can use them.

### Running Bicep from GitHub Actions

With a step for `azure/login` setup, the next step needs to run the Bicep template with the `azure/arm-deploy` Action.

```yaml
- name: Ensure resource group exists
  uses: azure/CLI@v1
  with:
      inlineScript: |
          az group create -g ${{ secrets.RESOURCE_GROUP }} -l ${{ secrets.RESOURCE_GROUP_LOCATION }}
- name: Deploy Bicep
  uses: azure/arm-deploy@v1
  with:
      resourceGroupName: ${{ secrets.RESOURCE_GROUP }}
      subscriptionId: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      template: ./deploy/main.bicep
      parameters: swaName=${{ secrets.SWA_NAME }}
      failOnStdErr: false
```

Well, first we're using `azure/CLI` to ensure that the resource group exists, and then we're using `azure/arm-deploy` to deploy the Bicep template.

The path to the `main.bicep` template is set as an argument to the Action, along with the parameters that it needs. Since we're using default values for `location` and `sku`, we don't need to pass those in.

With this added to your workflow before the action `azure/static-web-apps-deploy`, you now have Infrastructure as Code for deploying your static web apps.

## Conclusion

Throughout this post we looked at how to create a simple Bicep template that will deploy a Static Web App, and how to use it from GitHub Actions. We also saw the process for setting up the authentication from GitHub Actions to Azure, using the OIDC connect method.

Now that this is added, we have a completely reproducable pipeline that can be used to deploy your static web apps, from resource provisioning to deployment, in the case we ever need to start from scratch again.

You can check this out in action by looking at the [GitHub Actions for my blog](https://github.com/aaronpowell/aaronpowell.github.io/actions) which I have refactored to use Bicep (and it only took half a dozen deployments!).
