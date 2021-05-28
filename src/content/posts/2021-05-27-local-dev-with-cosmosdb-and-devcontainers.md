+++
title = "Local Dev With CosmosDB and devcontainers"
date = 2021-05-27T03:42:47Z
description = "I'm mad about devcontainers, so let's take it to the limits!"
draft = false
tags = ["javascript", "vscode", "cosmosdb"]
tracking_area = "javascript"
tracking_id = "30067"
cover_image = "/images/2021-05-27-local-dev-with-cosmosdb-and-devcontainers_cover.png"
+++

When I was a consultant the nirvana that I tried to achieve on projects was to be able to clone them from source control and have everything ready to go, no wiki pages to follow on what tools to install, no unmaintained setup scripts, just clone + install dependencies. This is why I love [VS Code Remote Containers](https://code.visualstudio.com/docs/remote/containers?{{<cda>}}), aka devcontainers.

I've previously said [all projects need devcontainers]({{<ref "/posts/2021-03-08-your-open-source-project-needs-a-dev-container-heres-why.md">}}), that they are an [essential tool for workshops]({{<ref "/posts/2021-04-29-tools-to-make-remote-workshops-easier.md">}}) and might go overboard on it locally...

{{<tweet 1391619892852396041>}}

Yes, I really had 23 devcontainers on my machine. These days I don't do any development on my machine, it all happens inside a container.

This works well for dev, I can run the web servers/APIs/etc. just fine, but there's one piece that is more difficult... storage. Since I'm commonly using CosmosDB as the backend, I end up having a CosmosDB instance deployed to work against. While this is fine for _me_, if I'm creating a repo for others to use or a workshop to follow along with, there's a hard requirement on deploying a CosmosDB service, which adds overhead to getting started.

For a while there has been a [CosmosDB emulator](https://docs.microsoft.com/azure/cosmos-db/local-emulator?tabs=ssl-netstd21&{{<cda>}}), but it's a Windows emulator and that still means a series of steps to install it beyond what can be in the Git repo, and I hadn't had any luck connecting to it from a devcontainer.

Things changed this week with Microsoft Build, a [preview of a Linux emulator was released](https://docs.microsoft.com/azure/cosmos-db/linux-emulator?{{<cda>}}). Naturally I had to take it for a spin.

## Setting up the emulator

The emulator is available as a Docker image, which means it's pretty easy to setup, just pull the image:

```bash
$> docker pull mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator
```

And then start a container:

```bash
docker run -p 8081:8081 -p 10251:10251 -p 10252:10252 -p 10253:10253 -p 10254:10254 --name=cosmos -it mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator
```

This runs it locally, which is all well and good, but I want to use it with VS Code and devcontainers.

## Cosmos devcontainers

A devcontainer is, as the name suggests, where you do your development, and since we need to development against CosmosDB it could make sense to use the emulator image as the base image and then add all the other stuff we need, like Node, dotnet, etc.

While this is a viable option, I feel like it's probably not the simplest way. First off, you have a **mega** container that will be running, and if you want to change anything about the dev environment, you'll end up trashing everything, including any data you might have. Also, the emulator image is pretty slimmed down, it doesn't have runtimes like Node or dotnet installed, so you'll need to add the appropriate apt sources, install the runtimes, etc. Very doable, but I think that's not the best way to tackle.

Enter Docker Compose.

I only recently learnt that [devcontainers support Docker Compose](https://code.visualstudio.com/docs/remote/create-dev-container?{{<cda>}}#_use-docker-compose), meaning you can create a more complex environment stack and have VS Code start it all up for you.

Let's take the [Node.js quickstart](https://github.com/Azure-Samples/azure-cosmos-db-sql-api-nodejs-getting-started) ([full docs here](https://docs.microsoft.com/azure/cosmos-db/create-sql-api-nodejs?{{<cda>}})) and run it in a devcontainer.

## Our devcontainer Dockerfile

We'll park the CosmosDB emulator for a moment and look at the Dockerfile we'll need for this codebase.

Follow the [VS Code docs](https://code.visualstudio.com/docs/remote/create-dev-container?{{<cda>}}#_use-docker-compose) to scaffold up the devcontainer definition and let's start hacking.

_Note: You may need to select "Show All Definitions" to get to the Docker Compose option, also, it'll detect you've added the `.devcontainer` folder and prompt to open it in a container, but we'll hold off for now until we set everything up._

The app is a Node.js app so we probably want to use that as our base image. Start by changing the base image to the Node.js image:

```dockerfile
ARG VARIANT="16-buster"
FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:0-${VARIANT}
```

We'll want to ensure we have the _right_ version of Node installed, so we'll allow the flexibility of passing that in as a container argument, but default to `16` as the Node.js version.

## Setting up Docker Compose

Our Dockerfile is ready for the devcontainer, and we can run it just fine, but we want it to be part of a composed environment, so it's time to finish off the Docker Compose file.

The one that was scaffolded up for us already has what we need for the app, all that we need to do is add the CosmosDB emulator as a service.

```yml
version: "3"

services:
    cosmos:
        image: mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:latest
        mem_limit: 3g
        cpu_count: 2
        environment:
            AZURE_COSMOS_EMULATOR_PARTITION_COUNT: 10
            AZURE_COSMOS_EMULATOR_ENABLE_DATA_PERSISTENCE: "true"
        volumes:
            # Forwards the local Docker socket to the container.
            - /var/run/docker.sock:/var/run/docker-host.sock
    app:
        # snip
```

We've added a new service called `cosmos` (obvious huh!) that uses the image for the emulator and passes in the environment variables to control startup. We'll also mount the [Docker socket](https://docs.docker.com/engine/reference/commandline/dockerd/#daemon-socket-option), just in case we need it later on.

There's one final thing we need to configure before we open in the container, and that is to expose the CosmosDB emulator via the devcontainer port mapping. Now, it's true we can do port mapping with the Docker Compose file, if you are running this environment via VS Code it does some hijacking of the port mapping, so we expose ports in the `devcontainer.json` file, not the `docker-compose.yml` file (this is more important if you're using it with Codespaces as well, since then you don't have access to the Docker host). But if we add the port forwarding in the `devcontainer.json` it won't know that we want to expose a port from our `cosmos` service, as that's not the _main_ container for VS Code. Instead, we need to map the service into our `app`'s network with `network_mode: service:cosmos`:

```yml {hl_lines=[21]}
services:
    cosmos:
    # snip
    app:
        build:
        context: .
        dockerfile: Dockerfile.compose
        args:
            USER_UID: 1000
            USER_GID: 1000
            VARIANT: 16

        init: true
        volumes:
            - /var/run/docker.sock:/var/run/docker-host.sock
            - ..:/workspace:cached

        entrypoint: /usr/local/share/docker-init.sh
        command: sleep infinity

        network_mode: service:cosmos
```

## Tweaking the `devcontainer.json`

Our environment is ready to go, but if you were to launch it, the devcontainer won't start because of the following error:

```
[2209 ms] Start: Run in container: uname -m
[2309 ms] Start: Run in container: cat /etc/passwd
[2309 ms] Stdin closed!
[2312 ms] Shell server terminated (code: 126, signal: null)
unable to find user vscode: no matching entries in passwd file
```

The problem here is that the base Docker image we're using has created a user to run everything as named `node`, but the `devcontainer.json` file specifies the `remoteUser` as `vscode`:

```json {hl_lines=[32]}
// For format details, see https://aka.ms/devcontainer.json. For config options, see the README at:
// https://github.com/microsoft/vscode-dev-containers/tree/v0.179.0/containers/docker-from-docker-compose
{
    "name": "Docker from Docker Compose",
    "dockerComposeFile": "docker-compose.yml",
    "service": "app",
    "workspaceFolder": "/workspace",

    // Use this environment variable if you need to bind mount your local source code into a new container.
    "remoteEnv": {
        "LOCAL_WORKSPACE_FOLDER": "${localWorkspaceFolder}"
    },

    // Set *default* container specific settings.json values on container create.
    "settings": {
        "terminal.integrated.shell.linux": "/bin/bash"
    },

    // Add the IDs of extensions you want installed when the container is created.
    "extensions": ["ms-azuretools.vscode-docker"],

    // Use 'forwardPorts' to make a list of ports inside the container available locally.
    // "forwardPorts": [],

    // Use 'postCreateCommand' to run commands after the container is created.
    // "postCreateCommand": "docker --version",

    // Comment out connect as root instead. More info: https://aka.ms/vscode-remote/containers/non-root.
    "remoteUser": "vscode"
}
```

We can change the `remoteUser` to `node` and everything is ready to go. But while we're in the `devcontainer.json` file, let's add some more extensions:

```json
	"extensions": [
		"ms-azuretools.vscode-docker",
		"dbaeumer.vscode-eslint",
		"esbenp.prettier-vscode",
		"ms-azuretools.vscode-cosmosdb"
	],
```

This will give us eslint + prettier (my preferred linter and formatter), as well as the CosmosDB tools for VS Code. I also like to add `npm install` as the `postCreateCommand`, so all the npm packages are installed before I start to use the container.

## Connecting to the CosmosDB emulator

The emulator is running in a separate container to our workspace, you can see that with `docker ps` on your host:

```
➜ docker ps
CONTAINER ID   IMAGE                                                             COMMAND                  CREATED          STATUS          PORTS     NAMES
a883d9a21499   azure-cosmos-db-sql-api-nodejs-getting-started_devcontainer_app   "/usr/local/share/do…"   4 minutes ago    Up 4 minutes              azure-cosmos-db-sql-api-nodejs-getting-started_devcontainer_app_1
c03a7a625470   mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:latest     "/usr/local/bin/cosm…"   20 minutes ago   Up 4 minutes              azure-cosmos-db-sql-api-nodejs-getting-started_devcontainer_cosmos_1
```

So how do we address it from our app? either using its hostname or its IP address. I prefer to use the hostname, which is the name of the service in our `docker-compose.yml` file, so `cosmos` and it's running on port `8081`. For the _Account Key_, we get a standard one [that you'll find in the docs](https://docs.microsoft.com/azure/cosmos-db/local-emulator?tabs=ssl-netstd21&{{<cda>}}#authenticate-requests).

Open `config.js` and fill in the details:

```js
// @ts-check

const config = {
    endpoint: "https://cosmos:8081/",
    key:
        "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==",
    databaseId: "Tasks",
    containerId: "Items",
    partitionKey: { kind: "Hash", paths: ["/category"] }
};

module.exports = config;
```

Now open the terminal and run `node app.js` to run the app against the emulator.

```bash
node ➜ /workspace (main ✗) $ node app.js

/workspace/node_modules/node-fetch/lib/index.js:1455
                        reject(new FetchError(`request to ${request.url} failed, reason: ${err.message}`, 'system', err));
                               ^
FetchError: request to https://cosmos:8081/ failed, reason: self signed certificate
    at ClientRequest.<anonymous> (/workspace/node_modules/node-fetch/lib/index.js:1455:11)
    at ClientRequest.emit (node:events:365:28)
    at TLSSocket.socketErrorListener (node:_http_client:447:9)
    at TLSSocket.emit (node:events:365:28)
    at emitErrorNT (node:internal/streams/destroy:193:8)
    at emitErrorCloseNT (node:internal/streams/destroy:158:3)
    at processTicksAndRejections (node:internal/process/task_queues:83:21) {
  type: 'system',
  errno: 'DEPTH_ZERO_SELF_SIGNED_CERT',
  code: 'DEPTH_ZERO_SELF_SIGNED_CERT',
  headers: {
    'x-ms-throttle-retry-count': 0,
    'x-ms-throttle-retry-wait-time-ms': 0
  }
}
```

Oh, it went 💥. That's not what we wanted...

It turns out that we're missing something. Node.js uses a defined list of TLS certificates, and doesn't support self-signed certificates. The CosmosDB SDK [handles this for `localhost`](https://docs.microsoft.com/azure/cosmos-db/local-emulator-export-ssl-certificates?{{<cda>}}#how-to-use-the-certificate-in-nodejs), which is how the emulator is _designed_ to be used, but we're not able to access it on `localhost` (unless maybe if you named the service that in the compose file, but that's probably a bad idea...), so we have to work around this by disabling TLS.

_Note: Disabling TLS is not really a good idea, but it's the only workaround we've got. Just don't disable it on any production deployments!_

Open the `devcontainer.json` file, as we can use this to inject environment variables into the container when it starts up, using the `remoteEnv` section:

```json {hl_lines=[3]}
  "remoteEnv": {
    "LOCAL_WORKSPACE_FOLDER": "${localWorkspaceFolder}",
    "NODE_TLS_REJECT_UNAUTHORIZED": "0"
  },
```

We'll set `NODE_TLS_REJECT_UNAUTHORIZED` to `0`, which will tell Node.js to ignore TLS errors. This will result in a warning on the terminal when the app runs, just a reminder that you shouldn't do this in production!

Now the environment needs to be recreated, reload VS Code and it'll detect the changes to the `devcontainer.json` file and ask if you want to rebuild the environment. Click **Rebuild** and in a few moments your environments will be created (a lot quicker this time as the images already exist!), and you can open the terminal to run the app again:

```bash
node ➜ /workspace (main ✗) $ node app.js
(node:816) Warning: Setting the NODE_TLS_REJECT_UNAUTHORIZED environment variable to '0' makes TLS connections and HTTPS requests insecure by disabling certificate verification.
(Use `node --trace-warnings ...` to show where the warning was created)
Created database:
Tasks

Created container:
Items

Querying container: Items

Created new item: 3 - Complete Cosmos DB Node.js Quickstart ⚡

Updated item: 3 - Complete Cosmos DB Node.js Quickstart ⚡
Updated isComplete to true

Deleted item with id: 3
```

🎉 Tada! the sample is running against the CosmosDB emulator within a Docker container, being called from another Docker container.

## Conclusion

Throughout this post we've seen how we can create a complex environment with VS Code Remote Containers (aka, devcontainers), which uses the CosmosDB emulator to do local dev of a Node.js app against CosmosDB.

You'll find my sample [on GitHub](https://github.com/aaronpowell/azure-cosmos-db-sql-api-nodejs-getting-started), should you want to spin it.

## Alternative solution

After posting this article I got into a Twitter discussion in which it looks like there might be another solution to this that doesn't require disabling TLS. [Noel Bundick](https://twitter.com/acanthamoeba?s=20) has [an example repo](https://github.com/noelbundick/docker-cosmosdb) that uses the `NODE_EXTRA_CA_CERTS` environment variable to add the [cert that comes with the emulator](https://docs.microsoft.com/en-us/azure/cosmos-db/linux-emulator?{{<cda>}}#run-on-linux) to Node.js at runtime, rather than disabling TLS. It's a bit more clunky as you'll need to run a few more steps once the devcontainer starts, but do check it out as an option.
