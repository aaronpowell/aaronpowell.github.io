+++
title = "Intro to Azure Container Instances"
date = 2019-03-20T09:00:27+11:00
description = "A quick lap around how to use Azure Container Instances"
draft = false
tags = ["azure", "docker"]
+++

[Azure Container Instances (ACI)](https://azure.microsoft.com/en-us/services/container-instances/?{{< cda >}}) is the easiest way to run a container in the cloud. There's no need to worry about orchestrators and you can get per-second billing, so why not get started!

To help you get started I've created a GitHub repository called [ACI from scratch](https://github.com/aaronpowell/aci-from-scratch) that will walk through a number of exercises in using the Azure CLI with ACI. You'll need to setup an Azure account to get started, so grab a [free trial](https://azure.microsoft.com/en-us/free/?{{< cda >}}) if you don't have one.

## Creating your first ACI resource

When using the Azure CLI we'll use the `az container` commands, let's start creating one using the demo image:

```
az container create --resource-group aci-from-scratch-01 --name aci-from-scratch-01-demo --image microsoft/aci-helloworld --dns-name-label aci-from-scratch-01-demo --ports 80
```

_I've made the assumption you already created a Resource Group called `aci-from-scratch-01`, which the git repository covers. Also remember that the names of the resources we're creating will need to be globally unique, so what I'm using in the demo you might want to change yourself to avoid collisions._

This command, `az container create`, is used to create the ACI resource in the resource group you specify. We've given it the name `aci-from-scratch-01-demo`, which is what will appear in the portal, and told it that we'll use an image from the public Docker image repository, `microsoft/aci-helloworld` (the code for the image is [here](https://github.com/Azure-Samples/aci-helloworld)).

Because this image contains a web server we need to make sure that it's publicly available, to do that we need to give it a DNS name using `--dns-name-label` and bind the port(s) that the container will require. Since this is a web server we're binding port 80.

Now our deployment is underway, we'll shortly have it up and running and we can connect to our web server. To find the address of the server we can use the `az container show`:

```
$> az container show --resource-group aci-from-scratch-01 --name aci-from-scratch-01-demo --query "{FQDN:ipAddress.fqdn,ProvisioningState:provisioningState}" --out table

FQDN                                               ProvisioningState
-------------------------------------------------  -------------------
aci-from-scratch-01-demo.westus.azurecontainer.io  Succeeded
```

We're filtering the output to only show the Fully Qualified Domain Name (FQDN) and Provisioning State (is it deploying, deployed, stopped, etc.) using the `--query` parameter. If you grab the FQDN and paste it into a browser you'll see our demo app running!

![App is running](/images/aci-from-scratch/001.png)

Finally, if you want to know what's going on inside your container you can use `az container logs`:

```
az container logs --resource-group aci-from-scratch-01 --name aci-from-scratch-01-demo
```

This is similar to running a `docker logs` command but also shows some of the info from ACI itself. Here's my output:

```
listening on port 80
::ffff:10.240.255.56 - - [19/Mar/2019:04:03:33 +0000] "GET / HTTP/1.1" 200 1663 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/18.17763"
::ffff:10.240.255.56 - - [19/Mar/2019:04:40:21 +0000] "GET / HTTP/1.1" 200 1663 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/601.7.7 (KHTML, like Gecko) Version/9.1.2 Safari/601.7.7"
```

## Working with Azure Container Registry

[Azure Container Registry (ACR)](https://azure.microsoft.com/en-us/services/container-registry/?{{< cda >}}) is a private container registry that you can host your images in. ACR works very nicely with ACI by allowing you to link the two together with minimal effort so you can host containers you built yourself.

We use the `az acr` command to work with ACR and the first thing we'll need to do is create our registry:

```
$> az acr create --resource-group aci-from-scratch-02 --name acifromscratch02 --sku Basic --admin-enabled true

{
  "adminUserEnabled": false,
  "creationDate": "2019-03-19T05:16:02.230750+00:00",
  "id": "/subscriptions/7e2b0a07-47db-4a2e-bfca-03c0d5b75f15/resourceGroups/aci-from-scratch-02/providers/Microsoft.ContainerRegistry/registries/acifromscratch02",
  "location": "westus",
  "loginServer": "acifromscratch02.azurecr.io",
  "name": "acifromscratch02",
  "networkRuleSet": null,
  "provisioningState": "Succeeded",
  "resourceGroup": "aci-from-scratch-02",
  "sku": {
    "name": "Basic",
    "tier": "Basic"
  },
  "status": null,
  "storageAccount": null,
  "tags": {},
  "type": "Microsoft.ContainerRegistry/registries"
}
```

_Be aware that the name you give your registry can only have numbers and letters._

This will create us a registry using the cheapest tier, `Basic`, but you can change the `--sku` to be `Standard` or `Premium` if you need. The different sku's mainly represent increased storage, with Premium also including geo replication. We also set `--admin-enabled true` so that we can use a username/password to push to the registry, alternatively, you can create a Service Principal and use that for authentication.

From the JSON response, the most important piece of information is the `loginServer`, we'll need that when it comes to pushing images up to the registry.

Also, before we push images we'll need to log Docker into ACR, you can do that either via the Docker CLI or using `az acr login --name <registry name>`.

Now it's time to set the repository on the images, we do that by prefixing the `loginServer` from above to the image name to give it a fully qualified name. Let's say we've previously built an image called `aci-from-scratch-02:v1`, we'll add the registry to it like so:

```
$> docker tag aci-from-scratch-02:v1 acifromscratch02.azurecr.io/aci-from-scratch-02:v1
$> docker push acifromscratch02.azurecr.io/aci-from-scratch-02:v1
```

By adding the repository prefix when we do a `docker push` Docker knows whether to push it to the public repository or to a 3rd party repository, which in our case we want.

We can then inspect ACR to see what images are there:

```
$> az acr repository list --name acifromscratch02 --output table
Result
-------------------
aci-from-scratch-02
$> az acr repository show-tags --name acifromscratch02 --repository aci-from-scratch-02 --output table
Result
--------
v1
```

The command `az acr repository list` will show us what's in the repository and then we can the results of that in the `az acr repository show-tags` by setting the name to the `--repository` option to see what tags exist for a particular image.

It's time to create an ACI that uses the registry. Since we've enabled the admin account we need to get the password to login:

```
az acr credential show --name acifromscratch02 --query "passwords[0].value"
```

_Ideally you'd want to assign this to a variable in your shell (bash/PowerShell/etc.) rather than writing it to stdout. That'd avoid it ending up in the shells history and potentially being compromised._

We've provided a `--query "passwords[0].value"` because there are two passwords and we only need one (there are two passwords so that there's a backup should one be compromised and need resetting).

Now we can provide credentials to ACI:

```
az container create --resource-group aci-from-scratch-02 --name aci-from-scratch-02 --image acifromscratch02.azurecr.io/aci-from-scratch-02:v1 --cpu 1 --memory 1 --registry-login-server acifromscratch02.azurecr.io --registry-username acifromscratch02 --registry-password <password> --dns-name-label aci-from-scratch-02 --ports 80
```

Notice here that we're providing the image name with the login server so that when ACI executes a `docker pull` it knows _where_ to pull from. We also provide the `--registry-login-server` as the `loginServer` of our ACR, along with the ACR username and password.

![Running an image from ACR](/images/aci-from-scratch/002.png)

## Accessing Azure Services

Let's say you're building an application to run in ACI that needs to access another Azure Resource, maybe Azure SQL.

ACI allows us to set [environment variables](https://docs.microsoft.com/en-us/azure/container-instances/container-instances-environment-variables?{{< cda >}}). These work just as you'd expect coming from Docker and can be created as either normal environment variables or secure environment variables. The primary difference between the two is that a secure variable won't appear in the ACI log or if you query the info of the container.

Here's how we'd create a SQL connection string for a web application, note that I'm not using a secure environment variable here:

```
az container create --resource-group aci-from-scratch-03 --name aci-from-scratch-03 --image acifromscratch03.azurecr.io/aci-from-scratch-03:v1 --registry-login-server acifromscratch03.azurecr.io --registry-username acifromscratch03 --registry-password <password> --dns-name-label aci-from-scratch-03 --ports 80 --environment-variables 'SQLAZURECONNSTR_DefaultConnection'='Server=tcp:aci-from-scratch-03-sql.database.windows.net,1433;Database=aci-from-scratch;User ID=aci;Password=<sql password>;Encrypt=true;Connection Timeout=30;'
```

The environment variables are `--environment-variables` and you can set multiple by using a space between them. If you were to create a secret one then you'd use the `--secrets` option (but be aware, they will appear in the CLI that executed the command, so you're better using shell variables to insert them).

If you're planning to use secret variables you're better off using a [file deployment](https://docs.microsoft.com/en-us/azure/container-instances/container-instances-environment-variables?{{< cda >}}#yaml-deployment) or [Resource Manager template](https://docs.microsoft.com/en-au/azure/templates/Microsoft.ContainerInstance/2018-10-01/containerGroups?{{< cda >}}) and inject the values into the file at runtime.

## Conclusion

[Azure Container Instances](https://azure.microsoft.com/en-us/services/container-instances/?{{< cda >}}) is the easiest way to run a container, whether it's a web server, a data processing job or as part of an event-driven architecture with Azure Functions/triggered from a Logic App/etc..

Check out the exercises on my GitHub repository, [ACI from scratch](https://github.com/aaronpowell/aci-from-scratch), and walk through creating your first container instances.