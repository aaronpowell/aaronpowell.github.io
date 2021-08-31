+++
title = "Regenerate All CosmosDB Keys"
date = 2021-08-31T00:56:52Z
description = "Here's how to regen all your keys for CosmosDB"
draft = false
tags = ["azure"]
tracking_area = "javascript"
tracking_id = "0000"
+++

A few days ago a [vulnerability in CosmosDB was announced](https://www.wiz.io/blog/chaosdb-how-we-hacked-thousands-of-azure-customers-databases) that allows attackers to access the access keys and thus get into a database.

While Microsoft has disabled the feature that was allowing for the vulnerability, it is strongly recommended that everyone [regenerate their access keys](https://docs.microsoft.com/azure/cosmos-db/secure-access-to-data?tabs=using-primary-key?{{<cda>}}#primary-keys). But if you've got multiple databases, this can be a slow process.

So, here's handy script that will do it for you, using the Azure CLI:

```bash
info=$(az cosmosdb list --query "[].{​​​​​​​ name: name, resourceGroup: resourceGroup }​​​​​​​" -o tsv)
echo $info | xargs -L1 bash -c 'az cosmosdb keys regenerate --key-kind primary --name $0 -g $1'
echo $info | xargs -L1 bash -c 'az cosmosdb keys regenerate --key-kind primaryReadonly --name $0 -g $1'
echo $info | xargs -L1 bash -c 'az cosmosdb keys regenerate --key-kind secondary --name $0 -g $1'
echo $info | xargs -L1 bash -c 'az cosmosdb keys regenerate --key-kind secondaryReadonly --name $0 -g $1'
```

You'll still need to get the keys and update your apps to use the new keys, but this will at least get them all cycled for you!
