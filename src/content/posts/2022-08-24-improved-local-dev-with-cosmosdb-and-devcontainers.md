+++
title = "Improved Local Dev With CosmosDB and devcontainers"
date = 2022-08-24T00:22:27Z
description = "A second take on how to work with CosmosDB's docker-based emulator"
draft = false
tags = ["javascript", "vscode", "cosmosdb"]
tracking_area = "javascript"
tracking_id = "75081"
+++

Last year I wrote a post on [using the CosmosDB Docker-based emulator with devcontainers]({{<ref "/posts/2021-05-27-local-dev-with-cosmosdb-and-devcontainers.md">}}) and since then I've used that pattern many times to build applications, but there was one thing that kept bothering me, having to disable SSL for Node.js.

Sure, disabling SSL with `NODE_TLS_REJECT_UNAUTHORIZED` wasn't a _huge_ pain, but it did feel like a dirty little workaround, it also hit a snag - dotnet projects.

I had the idea that I should add the CosmosDB emulator to the devcontainer used by [FSharp.CosmosDb](https://github.com/aaronpowell/FSharp.CosmosDb), as I kept deleting the Azure resource that I used between when I was working on it. But when I'd set the account host to `https://cosmos:8081` for the connection string, it'd fail to do queries as the self-signed certificate was rejected.

I guess it's time to install the certificate.

The emulator provides the certificate at a well-known endpoint, which you can get using `cURL`:

```bash
curl -k https://$ipaddr:8081/_explorer/emulator.pem > emulatorcert.crt
```

But when should we run that, and what's the IP of the Cosmos emulator container?

## Installing the certificate

Because we need to wait until the containers have started, we'll use the `postCreateCommand` in the `devcontainer.json` file, and we'll have it call a bash script. Here's the bash script:

```bash
#!/usr/bin/env bash

set -euxo pipefail

ipAddress=https://$(docker inspect cosmos -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'):8081

# Try to get the emulator cert in a loop
until sudo curl -ksf "${ipAddress}/_explorer/emulator.pem" -o '/usr/local/share/ca-certificates/emulator.crt'; do
  echo "Downloading cert from $ipAddress"
  sleep 1
done

sudo update-ca-certificates
```

To get the IP of the emulator, we'll use `docker inspect` and in the `docker-compose` I set a name for the container, `cosmos`, so that it's a well-known name (we could make an assumption of the name, based off the way compose names containers, but this is safest), and we provide a template to grab the IP from the JSON response - `{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}`. This is combined with the protocol/port information to make a variable for the IP address to then download and install the certificate as [described here](https://docs.microsoft.com/azure/cosmos-db/linux-emulator?tabs=sql-api%2Cssl-netstd21&{{<cda>}}#run-the-linux-emulator-on-linux-os).

## Setting the connection info

With the certificate installed, it might be convenient to set the connection string information so that it can be used. Initially, I thought to use environment variables (since we have the IP as a bash variable) and load them with the [`Microsoft.Extensions.Configuration.EnvironmentVariables`](https://www.nuget.org/packages/Microsoft.Extensions.Configuration.EnvironmentVariables) NuGet package, so we can add a `export ipAddress` to the end of the bash script (or maybe make the variable something easier to parse into the dotnet config system), but it turns out that you can't export variables from `postCreateCommand`s (see [this issue](https://github.com/microsoft/vscode-remote-release/issues/7016)).

Since that was off the table, an alternative solution would be to dump the info out as a file on disk. Here's the dotnet approach for my project, you just have to adapt the file (and its contents) for your project needs:

```bash
if [ ! -f ./samples/FSharp.CosmosDb.Samples/appsettings.Development.json ]
then
  echo '{ "Cosmos": { "EndPoint" : "'$ipAddress'" } }' >> ./samples/FSharp.CosmosDb.Samples/appsettings.Development.json
fi
```

_Note: I have the Access Key for cosmos in the `docker-compose` file, but you could also dump it out here if you prefer._

And with that, when the container starts, the connection to Cosmos is ready for your application to use.

## Summary

In this post we've seen how we can run the Docker CosmosDB emulator side-by-side with our app container using a VS Code devcontainer. The full definitions that I published for my project [can be found here](https://github.com/aaronpowell/FSharp.CosmosDb/tree/baad43a885ac66a9c7ac3698ddc9622dc982c943/.devcontainer).

Now that I've figured out how to do this, I'm going to be going back and retrofitting some other repos so that I don't have to disable SSL validation for Node.js apps, making it more secure to run them locally.

## Addendum

After writing this post and going back to some JavaScript/Node.js projects, I found that they were _still_ failing with an invalid certificate and it turns out that if I'd [read the docs fully](https://docs.microsoft.com/azure/cosmos-db/linux-emulator?tabs=sql-api%2Cssl-netstd21&{{<cda>}}#my-nodejs-app-is-reporting-a-self-signed-certificate-error) I'd have know this. It seems that while dotnet applications running on Linux respect the certificate store, Node.js apps don't, so you need to explicitly add the certificate using the [`NODE_EXTRA_CA_CERTS`](https://nodejs.org/api/cli.html#node_extra_ca_certsfile) environment variable, so I've added `"NODE_EXTRA_CA_CERTS": "/usr/local/share/ca-certificates/emulator.crt"` to the `remoteEnv` section of the `devcontainer.json` file... _sigh_.
