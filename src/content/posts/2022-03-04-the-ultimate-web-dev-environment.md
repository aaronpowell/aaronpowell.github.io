+++
title = "The Ultimate Web Dev Environment"
date = 2022-03-04T00:25:57Z
description = "Let's setup the ultimate local dev experience for making web applications."
draft = false
tags = ["javascript", "webdev", "serverless"]
tracking_area = "javascript"
tracking_id = "30433"
+++

_This is a long post and I've presented on this topic, so if you prefer to watch a video rather than reading, scroll to [the end](#conclusion) and check out the video._

There's no denying that I am a huge fan of [Static Web Apps (SWA)](https://docs.microsoft.com/azure/static-web-apps?{{<cda>}}), I have [a]({{<ref "posts/2021-07-16-adding-user-profiles-to-swa.md">}}) [lot]({{<ref "posts/2021-07-09-creating-static-web-apps-with-fsharp-and-fable.md">}}) [of]({{<ref "posts/2021-07-02-calling-static-web-apps-authenticated-endpoints.md">}}) [posts]({{<ref "posts/2021-06-24-blazor-typescript-and-static-web-apps.md">}}) [about]({{<ref "posts/2021-05-25-leveling-up-static-web-apps-with-the-cli.md">}}) [it]({{<ref "posts/2020-12-21-simplifying-auth-with-static-web-apps-and-react.md">}}) on my blog. But one thing I'm always trying to do is to work out how we can make it easier to do development.

For today's blog post, I want to look at how we can create the ultimate dev environment for web development, one where you can clone a Git repository, open in [VS Code](http://code.visualstudio.com/?{{<cda>}}) and launch it with all debuggers attached and ready to go. Naturally, we're going to have some Static Web Apps specific things in here, but most of it will be applicable for a wide range of web applications.

## devcontainer, storage and API's

We're going to start at the bottom, where we can store data, and since we're using [Azure Functions](https://docs.microsoft.com/azure/azure-functions/?{{<cda>}}) for storage, we want an easy way in which we can store data without having to run a cloud service.

The easiest way to do data storage with Azure Functions is with [Cosmos DB](https://docs.microsoft.com/azure/cosmos-db/introduction?{{<cda>}}) as it has [provided bindings](https://docs.microsoft.com/azure/azure-functions/functions-bindings-cosmosdb-v2?{{<cda>}}), and as I showed in [a previous post]({{<ref "posts/2021-05-27-local-dev-with-cosmosdb-and-devcontainers.md">}}) there's a new emulator we can run in a Docker container.

We're going to build on the ideas of that previous post but make it a bit better for the web (so I won't repeat the process for adding the Cosmos DB emulator container).

### The web container

We need a container in which we can run SWA, as well as the `devcontainer.json` file, but since we're going to need a container with the database, we'll leverage the [Docker compose remote container patter](https://code.visualstudio.com/docs/remote/create-dev-container?{{<cda>}}#_use-docker-compose). We can scaffold that up using the **Remote-Containers: Add Development Container Configuration Files** from the _Command Pallette_ and choosing **Docker Compose** (you may need to go through **Show All Definitions** first to get this one). Once they are scaffolded, open the `Dockerfile` and ensure that we've got the right base image:

```dockerfile
FROM mcr.microsoft.com/azure-functions/python:4-python3.9-core-tools
```

This container contains the .NET Core runtime (needed by the Azure Functions runtime when using bindings like CosmosDB), the Azure Functions CLI tool, the Azure CLI and Python (Python is needed for the Azure CLI).

Like last time, we'll leave the boilerplate code in for setting up the inter-container communication, but we need to install Node.js and the best way to do that for a devcontainer is using the [Node.js install script](https://github.com/microsoft/vscode-dev-containers/blob/main/script-library/docs/node.md), which we'll add to the `library-scripts` folder. We'll also add a step to install the [SWA CLI](https://github.com/Azure/static-web-apps-cli), so that we can use that in our container (this was adapted from the [SWA devcontainer](https://github.com/microsoft/vscode-dev-containers/blob/main/containers/azure-static-web-apps/.devcontainer/Dockerfile)).

With everything setup, our Dockerfile will look like so:

```dockerfile
FROM mcr.microsoft.com/azure-functions/python:4-python3.9-core-tools

# [Option] Install zsh
ARG INSTALL_ZSH="true"
# [Option] Upgrade OS packages to their latest versions
ARG UPGRADE_PACKAGES="false"
# [Option] Enable non-root Docker access in container
ARG ENABLE_NONROOT_DOCKER="true"
# [Option] Use the OSS Moby CLI instead of the licensed Docker CLI
ARG USE_MOBY="true"

# Install needed packages and setup non-root user. Use a separate RUN statement to add your
# own dependencies. A user of "automatic" attempts to reuse an user ID if one already exists.
ARG USERNAME=automatic
ARG USER_UID=1000
ARG USER_GID=$USER_UID
ARG NODE_VERSION="lts/*"
ENV NVM_DIR="/usr/local/share/nvm" \
    NVM_SYMLINK_CURRENT=true \
    PATH="${NVM_DIR}/current/bin:${PATH}"
COPY library-scripts/*.sh /tmp/library-scripts/
RUN apt-get update \
    && /bin/bash /tmp/library-scripts/common-debian.sh "${INSTALL_ZSH}" "${USERNAME}" "${USER_UID}" "${USER_GID}" "${UPGRADE_PACKAGES}" "true" "true" \
    # Use Docker script from script library to set things up
    && /bin/bash /tmp/library-scripts/docker-debian.sh "${ENABLE_NONROOT_DOCKER}" "/var/run/docker-host.sock" "/var/run/docker.sock" "${USERNAME}" \
    # Install Node.js
    && bash /tmp/library-scripts/node-debian.sh "${NVM_DIR}" \
    # Install SWA CLI
    && su vscode -c "umask 0002 && . /usr/local/share/nvm/nvm.sh && nvm install ${NODE_VERSION} 2>&1" \
    && su vscode -c "umask 0002 && npm install --cache /tmp/empty-cache -g @azure/static-web-apps-cli" \
    # Clean up
    && apt-get autoremove -y && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/* /tmp/library-scripts/

# Setting the ENTRYPOINT to docker-init.sh will configure non-root access
# to the Docker socket. The script will also execute CMD as needed.
ENTRYPOINT [ "/usr/local/share/docker-init.sh" ]
CMD [ "sleep", "infinity" ]
```

_Note: Just remember to change the `remoteUser` of the `devcontainers.json` file from `vscode` to `node`, as that's the user the base image created._

### Setting up the devcontainer

Since we want to get up and running with as few additional steps as possible, we'll take advantage of the `postCreateCommand` in the `devcontainer.json` file. This option allows us to run a command, like `npm install`, but we're going to take it a step further and write a custom shell script to run in the container that will install the web packages, the API packages and setup our CosmosDB connection locally.

Create a new file called `./devcontainer/setup.sh` and start with installing the right version of Node.js and the packages:

```bash
#/bin/sh
. ${NVM_DIR}/nvm.sh
nvm install --lts
npm ci
cd api
npm ci
cd ..
```

_I've used `npm ci` here, rather than `npm install`, mostly to suppress a lot of the verbosity in the output during install, but that's the only reason._

Next, we'll check if we can access the CosmosDB container, and if we can, get the connection information for the API's `local.settings.json` file:

```bash
if ping -c 1 cosmos &> /dev/null
then
  echo Cosmos emulator found
  echo Preping emulator

  if [ ! -f "./api/local.settings.json" ]
  then
    sleep 5s
    curl --insecure -k https://cosmos:8081/_explorer/emulator.pem > ~/emulatorcert.crt
    sudo cp ~/emulatorcert.crt /usr/local/share/ca-certificates/
    sudo update-ca-certificates
    ipaddr=$(ping -c 1 cosmos | grep -oP '\(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\)' | sed -n 's/(//p' | sed -n 's/)//p' | head -n 1)
    key=$(curl -s https://$ipaddr:8081/_explorer/quickstart.html | grep -Po 'value="(?![Account]|[https]|[mongo])(.*)"' | sed 's/value="//g' | sed 's/"//g')
    echo "{
    \"IsEncrypted\": false,
    \"Values\": {
      \"FUNCTIONS_WORKER_RUNTIME\": \"node\",
      \"AzureWebJobsStorage\": \"\",
      \"StartupAdventurer_COSMOSDB\": \"AccountEndpoint=https://$ipaddr:8081/;AccountKey=$key;\",
      \"SHORT_URL\": \"http://localhost:4820\"
    }
  }" >> ./api/local.settings.json
  fi
fi
```

_Just a reminder, this post doesn't cover the addition of the Cosmos DB emulator, check out [my previous post]({{<ref "posts/2021-05-27-local-dev-with-cosmosdb-and-devcontainers.md">}}) for that._

Ok, this is a long and ugly script file, so let's break down what it does.

First, it'll check to see if it can find the container, using the name we've said the container should be in our Docker Compose file, `cosmos`. If it responds to `ping`, we can assume that it's the one we want to use.

Next, we'll check for the `api/local.settings.json` file, because if it's there, we don't want to override it (you might be testing against a remote Cosmos instance), but assuming it isn't there we'll sleep for a few seconds, just to make sure the emulator has started, download the local certificate and install it to the certificate store.

Lastly, it's time to create the connection information, so we'll resolve the IP of the emulator container using `ping` and some shell parsing, then we'll use cURL to get the page with the connection string on it and some horrible `grep` regex to find the right field in the HTML and extract the value.

_I'll freely admit that this is pretty ugly and hacky in parsing the connection string out, but it's the best I could find that didn't require hard coded values._

With our IP and account key, we can create the JSON file for the API, with a bit of `echo` and string interpolation.

Then within the `devcontainers.json` file we can add `"postCreateCommand": "sh ./.devcontainer/startup.sh"` to have our script run.

#### Using the self-signed certificate

Something I made a comment of in the [previous post]({{<ref "posts/2021-05-27-local-dev-with-cosmosdb-and-devcontainers.md">}}) was that Node doesn't make it easy to use self-signed certificates and this caused some challenges when it came to using the CosmosDB emulator (you'd need to set an environment value that would result in a warning on all network calls).

After some digging around, it turns out that there is a way to solve this, using the `--use-openssl-ca` flag to the Node.js binary, which tells it to use the local certificate store as well. That's all well and good when you can control the launching of a Node.js binary, but what if it's not under your control (it's launched by a third party)? We can use the `NODE_OPTIONS` environment variable to apply a CLI flag to ever time Node is launched, and that can be controlled with the `remoteEnv` section of `devcontainers.json`:

```json
"remoteEnv": {
    "LOCAL_WORKSPACE_FOLDER": "${localWorkspaceFolder}",
    "NODE_OPTIONS": "--use-openssl-ca"
  },
```

Awesome, now any Node process we run can talk to the CosmosDB emulator via HTTPS using the provided certificate.

## Extensions

VS Code has lots of extensions, and everyone has their favourite. But extensions can be used for more than adding colours to indents or additional language support, they can be used to enforce standards within a repository.

JavaScript projects will often use formatters and linters to do this, with [prettier](https://prettier.io/) and [eslint](https://eslint.org/) being two of the most popular.

With VS Code we can define an `extensions.json` file within the `.vscode` folder that contains a list of extensions that VS Code will offer to install for the user when they open a folder. Here's a base set that I use for this kind of a project:

```json
{
    "recommendations": [
        "ms-azuretools.vscode-docker",
        "ms-azuretools.vscode-azurefunctions",
        "ms-azuretools.vscode-azurestaticwebapps",
        "ms-azuretools.vscode-cosmosdb",
        "ms-vsliveshare.vsliveshare-pack",
        "github.vscode-pull-request-github",
        "GitHub.copilot",
        "editorconfig.editorconfig",
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode"
    ]
}
```

Because we're within a Docker container, we may as well install the Docker extension, it'll give us some syntax highlighting and ability to inspect the container if required.

As we're talking about Static Web Apps and CosmosDB, having those extensions (including Azure Functions, which backs the API side of SWA) installed is a good idea. You can even connect the CosmosDB emulator to VS Code!

For collaboration, I include [VS Code Live Share](https://visualstudio.microsoft.com/services/live-share/?{{<cda>}}). This will just make it easier for everyone to work together on the project and do as much collaboration from within VS Code itself, without context switching.

Since I'm using GitHub, I've added the GitHub extension and [GitHub Copilot](https://copilot.github.com/), because it's awesome.

Finally, we'll include extensions for [EditorConfig](https://editorconfig.org/), eslint and prettier, which helps setup up a consistent environment and ensures that we're all doing linting and formatting without having to think about it.

Since we're using a devcontainer, you can also add these to the `devcontainer.json` list of extensions, so that VS Code automatically installs them when you create a devcontainer, meaning the environment is fully configured and ready to run when opened.

## Debugging

With our environment setup, and able to be repeatably setup, now it's time to do some actual work; and that means we're likely to do some debugging.

### Server-side debugging

Whether we're building an app that runs a Node.js server like Express or using a serverless backed like Azure Functions (which SWA does), we're going to want some way to debug the server-side code.

VS Code has done some major improvements to the JavaScript debugger to make this simpler. Now, any time you run Node from a terminal VS Code will automatically attach the debugger, meaning all you need to do is pop the terminal (`` CTRL + ` ``) and run `npm start` to have the debugger setup. You can learn more about the new debugger on [VS Codes docs](https://code.visualstudio.com/docs/nodejs/nodejs-debugging?{{<cda>}}).

### Client-side debugging

Whether you're using a framework like React, or doing something with _gasp_ vanilla JS, you'll likely have to debug the client-side JavaScript at some point, which will see you opening the browser developer tools and setting breakpoints.

While this is 1000 times better than when I first started doing web development (shout out to all those who did `alert`-based debugging!), it still results in a disconnect between the place we build our app and the place we debug it.

Well, another new feature of the VS Code JavaScript debugger is [browser debugging](https://code.visualstudio.com/docs/nodejs/browser-debugging?{{<cda>}})!

To use this, open a link from a terminal that has the JavaScript debugger attached or using the **Debug: Open Link** command from the command palette (`CTRL + SHIFT + P`), and now VS Code will connect to Edge or Chrome (depending on which is your default browser, sorry no Firefox at the moment) and forward all client-side JavaScript debugging to VS Code, allowing you to put a breakpoint on the exact file you wrote and debug it.

This also means that if you're debugging an end-to-end process, like a button click through `fetch` request to the server, you have a single tool in which you are doing debugging, no switching between the browser and editor for different points in the debug pipeline.

_Aside - this doesn't work reliably from within a devcontainer, especially if you're using them on Windows with WSL2. This is because you're trying to hop across a lot of network and OS boundaries to connect the various tools together... but then again, debugging the client-side JavaScript in a browser running on Windows while the server is running on a Linux container via WSL2, back to a UI tool running on Windows... I'm not surprised it can be a bit unreliable!_

### Launch it all 🚀

While yes, we can pop open a bunch of terminals in VS Code and run `npm start` in the right folder, we can make it even simpler than that to get our app running and debugging, and that's using `launch.json` to start the right debugger.

Here's one that will 1) start the front-end app, 2) start Azure Functions and 3) run the SWA CLI to use as our entry point:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "command": "swa start http://localhost:3000 --api http://localhost:7071",
            "name": "Run emulator",
            "request": "launch",
            "type": "node-terminal"
        },
        {
            "command": "npm start",
            "name": "Run frontend",
            "request": "launch",
            "type": "node-terminal"
        },
        {
            "command": "npm start",
            "name": "Run backend",
            "request": "launch",
            "type": "node-terminal",
            "cwd": "${workspaceFolder}/api"
        }
    ]
}
```

This would still require us to run three separate commands to start each debugger, but thankfully VS Code has an answer for that, using compound launch configurations. This is where we provide an array of launch commands and VS Code will run all of them for us:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "command": "swa start http://localhost:3000 --api http://localhost:7071",
            "name": "Run emulator",
            "request": "launch",
            "type": "node-terminal"
        },
        {
            "command": "npm start",
            "name": "Run frontend",
            "request": "launch",
            "type": "node-terminal"
        },
        {
            "command": "npm start",
            "name": "Run backend",
            "request": "launch",
            "type": "node-terminal",
            "cwd": "${workspaceFolder}/api"
        }
    ],
    "compounds": [
        {
            "name": "Launch it all 🚀",
            "configurations": ["Run emulator", "Run frontend", "Run backend"]
        }
    ]
}
```

Admittedly, this will cause the SWA CLI to run _before_ the other components are also running, so it does sometimes timeout and need to be restarted (especially if you're using TypeScript to do a compilation step before launching the Functions), but I find that to be a minor issue in the scheme of things - just find the right debugger on the toolbar and restart it.

### Debugger Extensions

Did you know that there are extensions to make the VS Code JavaScript debugger even more powerful than it already is? These are two that I like to add to my `extensions.json` and `decontainer.json` to ensure that they are always available.

#### Performance Insights

Microsoft released a companion extension to the VS Code debugger, [vscode-js-profile-flame](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-js-profile-flame&{{<cda>}}) which will give you real-time performance (CPU and memory) of the JavaScript app that you're debugging.

What's even cooler is that if your debugging a client-side app, you'll also get metrics for things like the DOM, restyle and re-layout events, important diagnostic information when you're performance turning a web app!

### Debugging Styles

There's one more part of a web application we may need to debug, and that's the CSS (yes, I'm calling it _debugging_, don't @ me 😝).

You might think that this is something that you'll still be context switching to the browser for but nope! The Microsoft Edge team has [an extension](https://marketplace.visualstudio.com/items?itemName=ms-edgedevtools.vscode-edge-devtools?{{<cda>}}) that brings the element inspector and network panel into VS Code.

Now, if you use the inspector to find an element in the DOM, you'll find the CSS that is applied with the file link taking you to the file in VS Code, even if you're using a source map! This means that you don't have to jump between the browser to inspect the elements and the editor to persist updated, you're also right in the editor with the originally authored file, reducing context switching.

To use this, we can use the Edge extension from the sidebar to launch a new instance of Edge with VS Code attached but be aware that going this route will not connect the JavaScript debugger to that version of Edge. If you have the JavaScript debugger attached _and_ the DOM/network inspector, there's a new icon on the debugger toolbar (next to the drop down list to change the debugger you're attached to) that, when clicked, will connect the Edge debugger extension to a running version of Edge!

So, with this we can debug the server code, the client code, inspect performance metrics, inspect the DOM, edit styles and view the network requests, all without leaving VS Code.

Pretty slick if you ask me.

_Again, this can be hit and miss when running in a devcontainer for obvious reasons._

## Conclusion

This is, admittedly, quite a long post, but that's because there really is a lot of stuff to cover here.

First, we looked at how to make a completely local, repeatable dev environment using the Linux emulator for CosmosDB and combine that with another Docker container that we can build a web app within.

Next, we setup a consistent web dev environment by pre-installing VS Code extensions into it that will make it easier to enforce style and linting rules for a project, reducing the onboarding curve for someone into a project.

Finally, we looked at debugging, and how VS Code can debug both the server and client JavaScript, that we can use compound launch tasks to start all the servers we need (and even the SWA CLI), before learning about two more extensions that can level up the debugging experience by introducing performance metrics and bringing more of the browser dev tools into VS Code itself.

If you want to see how this can be applied to a repo, I've forked the [Startup Adventurer](https://github.com/staticwebdev/StartupAdventurer) SWA project [and added everything to it](https://github.com/aaronpowell/StartupAdventurer/tree/local-dev).

Also, since this is a long post, I've recorded a video where I've walked through everything, for those who are more visual learners.

{{<youtube "1QQVQ8vTUXU">}}
