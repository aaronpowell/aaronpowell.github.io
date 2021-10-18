+++
title = "Host Strapi 3 on Azure"
date = 2021-10-14T23:15:02Z
description = "Curious on how to run Strapi 3 on Azure without learning about VM's, check this out then!"
draft = false
tags = ["javascript", "azure"]
tracking_area = "javascript"
tracking_id = "37811"
+++

_I originally contributed the following as a guide for the official Strapi docs, but as they are working on v4 of Strapi at the moment, I figured it would still be good to include somewhere, so here it is on my blog! As a result, the layout of the content won't be my normal blog style, it's more documtation-esq, but it should still do the job._

If you're new to [Strapi](https://strapi.io), Strapi is a headless CMS that you would host somewhere and use their API to pull the content into an application, be it a SPA in your favourite JavaScript framework, a mobile app, or something else.

These guides are tested against the v3 release of Strapi, as v4 is in beta at the time of writing. It's likely that much of the content covered here will be applicable for v4, the only thing I expect to change is how to use the file upload provider, I'm unsure if the existing plugin will work with v4.

## Azure Install Requirements

-   You must have an [Azure account](https://azure.microsoft.com/free/?{{<cda>}}) before doing these steps.

## Table of Contents

-   [Create resources using the portal](#creating-resources-via-the-azure-portal)
-   [Create using the Azure CLI](#creating-resources-via-the-azure-cli)
-   [Create Azure Resource Manager template](#deploy-with-an-azure-resource-manager-template)
-   [Storing files and images with Azure Storage](#storing-files-and-images)

### Required Resources

There are three resources in Azure that are required to run Strapi in a PaaS model, [AppService](https://azure.microsoft.com/services/app-service/?{{<cda>}}) to host the Strapi web application, [Storage](https://azure.microsoft.com/product-categories/storage/?{{<cda>}}) to store images/uploaded assets, and a database, Azure has managed MySQL and Postgres to choose from (for this tutorial, we'll use MySQL, but the steps are the same for MySQL).

## Creating Resources via the Azure Portal

In this section we'll use the Azure Portal to create the required resources to host Strapi.

1. Navigate to the [Azure Portal](https://portal.azure.com/?{{<cda>}})

1. Click **Create a resource** and search for _Resource group_ from the provided search box

1. Provide a name for your Resource Group, `my-strapi-app`, and select a region

1. Click **Review + create** then **Create**

1. Navigate to the Resource Group once it's created, click **Create resources**
   and search for _Web App_

1. Ensure the _Subscription_ and _Resource Group_ are correct, then provide the following configuration for the app:

    - _Name_ - `my-strapi-app`
    - _Publish_ - `Code`
    - _Runtime stack_ - `Node 14 LTS`
    - _Operating System_ - `Linux`
    - _Region_ - Select an appropriate region

1. Use the _App Service Plan_ to select the appropriate Sku and size for the level of scale your app will need (refer to [the Azure docs](https://azure.microsoft.com/pricing/details/app-service/windows/?{{<cda>}}) for more information on the various Sku and sizes)

1. Click **Review + create** then **Create**

1. Navigate back to the Resource Group and click **Create** then search for _Storage account_ and click **Create**

1. Ensure the _Subscription_ and _Resource Group_ are correct, then provide the following configuration for the storage account:

    - _Name_ - `my-strapi-app`
    - _Region_ - Select an appropriate region
    - _Performance_ - `Standard`
    - _Redundancy_ - Select the appropriate level of redundancy for your files

1. Click **Review + create** then **Create**

1. Navigate back to the Resource Group and click **Create** then search for _Azure Database for MySQL_ and click **Create**

1. Select _Single server_ for the service type

1. Ensure the _Subscription_ and _Resource Group_ are correct, then provide the following configuration for the storage account:

    - _Name_ - `my-strapi-db`
    - _Data source_ - `None` (unless you're wanting to import from a backup)
    - _Location_ - Select an appropriate region
    - _Version_ - `5.7`
    - _Compute + storage_ - Select an appropriate scale for your requirements (Basic is adequate for many Strapi workloads)

1. Enter a username and password for the _Administrator account_, click **Review + create** then **Create**

#### Configuring the Resources

Once all the resources are created, you will need to get the connection information for the MySQL and Storage account to the Web App, as well as configure the resources for use.

##### Configure the Storage Account

1. Navigate to the Storage Account resource, then **Data storage** - **Containers**
1. Create a new Container, provide a _Name_, `strapi-uploads`, and set _Public access level_ to `Blob`, then click **Create**
1. Navigate to **Security + networking** - **Access keys**, copy the _Storage account name_ and _key1_
1. Navigate to the **Web App** you created and go to **Settings** - **Configuration**
1. Create new application settings for the Storage account, storage account key and container name (these will become the environment variables available to Strapi) and click _Save_

##### Configure MySQL

1. Navigate to the MySQL resource then **Settings** - **Connection security**
1. Set `Allow access to Azure services` to `Yes` and click **Save**
1. Navigate to **Overview** and copy _Server name_ and _Server admin login name_
1. Open the [Azure Cloud Shell](https://shell.azure.com?{{<cda>}}) and log into the `mysql` cli:

    - `mysql --host <server> --user <username> -p`

1. Create a database for Strapi to use `CREATE DATABASE strapi;` then close the Cloud Shell
    - Optional - create a separate non server admin user (see [this doc](https://docs.microsoft.com/azure/mysql/howto-create-users?tabs=single-server&{{<cda>}}) for guidance)
1. Navigate to the **Web App** you created and go to **Settings** - **Configuration**
1. Create new application settings for the Database host, username and password (these will become the environment variables available to Strapi) and click _Save_

## Creating Resources via the Azure CLI

In this section, we'll use the [Azure CLI](https://docs.microsoft.com/cli/azure/?{{<cda>}}) to create the required resources. This will assume you have some familiarity with the Azure CLI and how to find the right values.

1. Create a new Resource Group

    ```bash
    rgName=my-strapi-app
    location=westus
    az group create --name $rgName --location $location
    ```

1. Create a new Linux App Service Plan (ensure you change the `number-of-workers` and `sku` to meet your scale requirements)

    ```bash
    appPlanName=strapi-app-service-plan
    az appservice plan create --resource-group $rgName --name $appPlanName --is-linux --number-of-workers 4 --sku S1 --location $location
    ```

1. Create a Web App running Node.js 14

    ```bash
    webAppName=my-strapi-app
    az webapp create --resource-group $rgName --name $webAppName --plan $appPlanName --runtime "node|10.14"
    ```

1. Create a Storage Account

    ```bash
    saName=mystrapiapp
    az storage account create --resource-group $rgName --name $saName --location $location

    # Get the access key
    saKey=$(az storage account keys list --account-name $saName --query "[?keyName=='key1'].value" --output tsv)

    # Add a container to the storage account
    container=strapi-uploads
    az storage container create --name $container --public-access blob --access-key $saKey --account-name $saName
    ```

1. Create a MySQL database

    ```bash
    serverName=my-strapi-db
    dbName=strapi
    username=strapi
    password=...

    # Create the server
    az mysql server create --resource-group $rgName --name $serverName --location $location --admin-user $username --admin-password $password --version 5.7 --sku-name B_Gen5_1

    # Create the database
    az mysql db create --resource-group $rgName --name $dbName --server-name $serverName

    # Allow Azure resources through the firewall
    az mysql server firewall-rule create --resource-group $rgName --server-name $serverName --name AllowAllAzureIps --start-ip-range 0.0.0.0 --end-ip-range 0.0.0.0
    ```

1. Add configuration values to the Web App

    ```bash
    az webapp config appsettings set --resource-group $rgName --name $webAppName --setting STORAGE_ACCOUNT=$saName
    az webapp config appsettings set --resource-group $rgName --name $webAppName --setting STORAGE_ACCOUNT_KEY=$saKey
    az webapp config appsettings set --resource-group $rgName --name $webAppName --setting STORAGE_ACCOUNT_CONTAINER=$container
    az webapp config appsettings set --resource-group $rgName --name $webAppName --setting DATABASE_HOST=$serverName.mysql.database.azure.com
    az webapp config appsettings set --resource-group $rgName --name $webAppName --setting DATABASE_USERNAME=$username@$serverName
    az webapp config appsettings set --resource-group $rgName --name $webAppName --setting DATABASE_PASSWORD=$password
    ```

## Deploy with an Azure Resource Manager template

To deploy using an Azure Resource Manager template, use the botton below, or upload [this template](https://gist.githubusercontent.com/aaronpowell/f216f119ffe5ed52945b46d0bb55569b/raw/2490a9295ea25c905096dbaae57da6ef8edb0e43/azuredeploy.json) as a custom deployment in Azure.

[![Deploy to Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fgist.githubusercontent.com%2Faaronpowell%2Ff216f119ffe5ed52945b46d0bb55569b%2Fraw%2F2490a9295ea25c905096dbaae57da6ef8edb0e43%2Fazuredeploy.json)

## Storing files and images

As AppService is a PaaS hosting model, an upload provider will be required to save the uploaded assets to Azure Storage. Check out https://github.com/jakeFeldman/strapi-provider-upload-azure-storage for more details on using Azure Storage as an upload provider.

### Local development

For local development, you can either use the standard Strapi file/image upload provider (which stored on the local disk), or the [Azurite emulator](https://docs.microsoft.com/azure/storage/common/storage-use-azurite?tabs=visual-studio-code&{{<cda>}}#install-and-run-azurite).

## Deploying and running Strapi

Azure AppService can be deployed to using CI/CD pipelines or via FTPS, refer to the [Azure docs](https://docs.microsoft.com/azure/app-service/deploy-continuous-deployment?tabs=github&{{<cda>}}) on how to do this for your preferred manner.

To start the Node.js application, AppService will run the `npm start` command. As there is no guarantee that the symlinks created by `npm install` were preserved (in the case of an upload from a CI/CD pipeline) it is recommended that the `npm start` command directly references the Keystone entry point:

```json
"scripts": {
    "start": "node node_modules/strapi/bin/strapi.js start"
}
```

## Conclusion

This has been a look at how we can use the different PaaS features of Azure to host Strapi, and the different ways in which you can setup those resources. I prefer to use the Resource Manager template myself, and then configure GitHub Actions as the CI/CD pipeline so that deployments all happen smoothly in the future.

Hopefully this makes it easier for you to also get your Strapi sites running in Azure, and once Strapi 4 is out, I'll get some updated content on the differences that you need to be aware of when hosting in Azure.
