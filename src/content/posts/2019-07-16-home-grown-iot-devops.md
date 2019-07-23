+++
title = "Home Grown IoT - Simple DevOps"
date = 2019-07-16T11:15:32+10:00
description = "It's time to rub some DevOps on IoT"
draft = false
tags = ["fsharp", "iot", "devops"]
series = "home-grown-iot"
series_title = "Simple DevOps"
+++

The [app is build]({{< ref "/posts/2019-06-12-home-grown-iot-data-downloader.md" >}}) and our [data can be processed]({{< ref "/posts/2019-07-01-home-grown-iot-processing-data.md" >}}), all that is left is to get everything deployed, and guess what the topic of this post will be!

When it comes to CI/CD (Continuous Integration/Continuous Deployment) for IoT projects it can feel a bit daunting, you've got this tiny little computer that you're trying to get stuff onto, it's not just "the cloud" that you're targetting. And these devices are not like normal computers, they have weird chipsets like ARM32!

## Deploying to a Raspberry Pi

We need to work out how to get our downloader onto the Raspberry Pi. As I mentioned in the post on [how the downloader works]({{< ref "/posts/2019-06-12-home-grown-iot-data-downloader.md" >}}) I do the local development using Docker and ideally, I want to run Docker on the Pi. Running Docker on a Pi is straight forward, you just install it from the Linux package manager like any other piece of software, the only difference is that your base image will need to be an ARM32 image, and thankfully Microsoft [ships this for us](https://hub.docker.com/_/microsoft-dotnet-core-runtime) (for reference I use `mcr.microsoft.com/dotnet/core/runtime:2.2.5-stretch-slim-arm32v7` as my base image).

### Getting Containers onto the Pi

I've got my `Dockerfile`, I can make an Image but how do I get that onto the Pi and then run a Container?

**DevOps**! 🎉

My initial idea was to deploy an Azure Pipeline agent on to the Raspberry Pi and then add that to my agent pool in Azure Pipelines. I know this is possible, I've seen [Damian Brady](https://twitter.com/damovisa) do it, but it turns out that he was using a custom compiled agent and it's not really a supported. So that's not really ideal, I don't want a solution that I have to constantly ensure is working, I just want something that works.

And this is what led me to [Azure IoT Edge](https://docs.microsoft.com/en-us/azure/iot-edge?{{< cda >}}).

## Introducing IoT Edge

IoT Edge is part of the [Azure IoT suite](https://docs.microsoft.com/en-us/azure/iot-fundamentals/?{{< cda >}}) and it's designed for deploying reusable modules onto IoT devices, also known as "Edge Devices".

The way IoT Edge works is you run an agent on the device that communicates with IoT Hub. In IoT Hub you create a deployment against a device in which you specify the modules, which are Docker images, that you want to run on the device. IoT Edge checks for deployments, when it finds one it pulls it down, grabs the Docker images and runs the containers. [Here](https://docs.microsoft.com/en-us/azure/iot-edge/iot-edge-runtime?{{< cda >}}) is a really good starting point to understand IoT Edge's architecture and how it fits into a solution. I'm not going to cover all of that in detail, instead I'm going to focus on the pieces that you need to understand when it comes do using IoT Edge for deployments.

## Getting the Solution Ready for DevOps

If you're like me and started building a project before learning about all the things you'd need to use you may need to retrofit IoT Edge into it. The IoT Edge docs have a good [getting started guide](https://docs.microsoft.com/en-us/azure/iot-edge/tutorial-develop-for-linux?{{< cda >}}) that I'd encourage you to read if you're just getting started, but since I didn't know about IoT Edge until I had already built it let's look at what is needed to do to _IoT Edge-ify_ a project.

### Docker Images

The really nice thing about how IoT Edge works is that it uses Docker as the delivery mechanism for the applications you want to run on the device, the only stipulation is that the Image uses a base of ARM32 (or ARM64 if that's what your device runs). So this means that we'll need to create an additional Dockerfile that will be able to run on our Raspberry Pi.

```Dockerfile
FROM mcr.microsoft.com/dotnet/core/runtime:2.2.5-stretch-slim-arm32v7

WORKDIR /app
COPY ./bin/Release/netcoreapp2.2/publish ./

ENTRYPOINT ["dotnet", "Sunshine.Downloader.dll"]
```

_[Source on GitHub](https://github.com/aaronpowell/sunshine/blob/1ecabaa3905198a650ecacc9a1b51811aea4758c/src/Sunshine.Downloader/Dockerfile.arm32v7)_

Oh, that's not really that different to how we do local dev, in fact it's actually a really basic Dockerfile, all it does is copy the build artifacts in (we're not using multi-stage Dockerfiles as I discussed in the [local dev post]({{< ref "/posts/2019-06-19-home-grown-iot-local-dev.md" >}})).

### IoT Edge Modules

Before we talk about how to do a deployment with IoT Edge I want to talk about [IoT Edge Modules](https://docs.microsoft.com/en-us/azure/iot-edge/iot-edge-modules?{{< cda >}}). A Module is an application that is running on your device and is defined in a JSON file. A device may have multiple Modules deployed onto it, but a Module is a single application.

```json
{
    "$schema-version": "0.0.1",
    "description": "",
    "image": {
        "repository": "${CONTAINER_REGISTRY_SERVER}/sunshine-downloader",
        "tag": {
            "version": "${BUILD_BUILDID}",
            "platforms": {
                "amd64": "./Dockerfile.amd64",
                "amd64.debug": "./Dockerfile.amd64.debug",
                "arm32v7": "./Dockerfile.arm32v7"
            }
        },
        "buildOptions": [],
        "contextPath": "./"
    },
    "language": "csharp"
}
```

_[Source on GitHub](https://github.com/aaronpowell/sunshine/blob/1ecabaa3905198a650ecacc9a1b51811aea4758c/src/Sunshine.Downloader/module.json)_

Here's the JSON for my Sunshine Downloader Module. There's a bit of metadata in there (`description`, `language`) with the important part of it being the `image`. In here we define how we're going to build our Image and what container registry is it going to be published to.

First off, the registry. This can be published to a private registry, such as your own [Azure Container Registry](https://azure.microsoft.com/en-us/services/container-registry/?{{< cda >}}) (this is what I use) or to a public registry like Docker Hub (although I wouldn't advise that). You'll need to make sure that the registry can be accessed by the device you're deploying to, so they need to be on the same local network, vpn or it needs to be internet addressable.

Next, you define the `tag` for the Image, and the `Dockerfile`s that will be used to create them. I'm generating 3 Images, two AMD64 images (one which contains the debugging symbols) and my ARM32 image. It's generally good practice to name the tags relative to the architecture they represent, but it's not mandatory. We will need the names soon, so make sure they aren't too obscure.

Finally, we can give some arguments to the `docker build` command that will ultimately be executed here in the `buildOptions`.

Something you might've noticed in the JSON above is that I have a few `${...}` _things_. These are references to environment variables that will be available when I'm creating the deployment. The `CONTAINER_REGISTRY_SERVER` will need to be the URL of the registry you're using and I'm passing `BUILD_BUILDID` from the [Azure Pipeline Build Variables](https://docs.microsoft.com/en-us/azure/devops/pipelines/build/variables?view=azure-devops&tabs=yaml&{{< cda >}}#build-variables), but that can be anything you want to tag the version.

One thing I did find that was important with Modules is that you need to name the file `module.json` and have it sitting alongside the `Dockerfile`s that you are using. Because of this I ended up placing all the files in the same folder as the source code for the downloader.

## Deployments with IoT Edge

With our Module defined we can go ahead and create a deployment with IoT Edge. For this we'll need to create a `deployment.template.json` file, which is our deployment template that will be used to create the deployment for our different module platforms.

```json
{
    "$schema-template": "1.0.0",
    "modulesContent": {
        "$edgeAgent": {
            "properties.desired": {
                "schemaVersion": "1.0",
                "runtime": {
                    "type": "docker",
                    "settings": {
                        "minDockerVersion": "v1.25",
                        "loggingOptions": "",
                        "registryCredentials": {
                            "YourACR": {
                                "username": "${CONTAINER_REGISTRY_USERNAME}",
                                "password": "${CONTAINER_REGISTRY_PASSWORD}",
                                "address": "${CONTAINER_REGISTRY_SERVER}"
                            }
                        }
                    }
                },
                "systemModules": {
                    "edgeAgent": {
                        "type": "docker",
                        "settings": {
                            "image": "mcr.microsoft.com/azureiotedge-agent:1.0.7",
                            "createOptions": ""
                        }
                    },
                    "edgeHub": {
                        "type": "docker",
                        "status": "running",
                        "restartPolicy": "always",
                        "settings": {
                            "image": "mcr.microsoft.com/azureiotedge-hub:1.0.7",
                            "createOptions": {
                                "HostConfig": {
                                    "PortBindings": {
                                        "5671/tcp": [{ "HostPort": "5671" }],
                                        "8883/tcp ": [{ "HostPort": "8883" }],
                                        "443/tcp": [{ "HostPort": "443" }]
                                    }
                                }
                            }
                        }
                    }
                },
                "modules": {
                    "SunshineDownloader": {
                        "version": "1.0",
                        "type": "docker",
                        "status": "running",
                        "restartPolicy": "always",
                        "settings": {
                            "image": "${MODULES.Sunshine.Downloader}",
                            "createOptions": {}
                        }
                    }
                }
            }
        },
        "$edgeHub": {
            "properties.desired": {
                "schemaVersion": "1.0",
                "routes": {
                    "route": "FROM /* INTO $upstream"
                },
                "storeAndForwardConfiguration": {
                    "timeToLiveSecs": 7200
                }
            }
        }
    }
}
```

_[Source on GitHub](https://github.com/aaronpowell/sunshine/blob/1ecabaa3905198a650ecacc9a1b51811aea4758c/.build/deployment.template.json)_

This file is a bit large so it's time to break it down and learn what we need to know about it.

It starts off defining some information about the agent that's running on our device in the `$edgeAgent` node. You'll notice in there are the credentials for your container registry (ACR or other), like the `module.json` file, these come from environment variables that you would set before generating the deployment from the template.

Next up we define the `systemModules` which tells the deployed Edge agent about the Edge agent to run, really what this means is that we can configure the agent and upgrade it just by creating a deployment. The agent is a Docker image ([found here](https://hub.docker.com/_/microsoft-azureiotedge-agent)) as is the Edge Hub ([found here](https://hub.docker.com/_/microsoft-azureiotedge-hub)). I'm using release `1.0.7` which was the stable at the time I build Sunshine, but there may be a newer version that you can grab. Both of these pieces are important as the Agent is the container that talks to IoT Hub, reports statuses, etc. whereas the Hub is the bridge between your application and IoT Hub.

Within the `modules` node you define the modules that you wish to install into your device. This is a JSON object where you can define as many as you want, and the name that you give it is the name that will appear if you do a `docker ps` on your device (I've used `SunshineDownloader`) so it'll need to conform to Docker container naming conventions. The two important parts of the module definition that you'll need to set are the Image variable and any `createOptions` that your Container will need.

For the `image` property I have `${MODULES.Sunshine.Downloader}`, but what does that represent and how does it even work? This variable is made up for two parts, the first, `MODULES` is the `MODULES_PATH` that the IoT Edge tooling looks for. By default it will look for a folder called `modules` relative to the directory that the template is in ([source reference](https://github.com/Azure/iotedgedev/blob/b7742a1925581ea0db9848ccaa1bdf05ed191f63/iotedgedev/constants.py#L3)) but can be overridden using a `.env` file. In fact, [this is what I do](https://github.com/aaronpowell/sunshine/blob/1ecabaa3905198a650ecacc9a1b51811aea4758c/.build/.env) since my source code is in the `src` folder. The rest of the variable is the folder within the `MODULES_PATH` that your module resides in, leading up to `module.json`.

The final node within our JSON is `$edgeHub` which is some instructions for the IoT Hub module that allows us to control information about it. I'm using this to ensure that messages from _my_ module land in IoT Hub using the `route`. Defining a route of `FROM /* INTO $upstream` basically says "every message from the device goes into the primary IoT Hub endpoint". This can be used to configure pre-routing of the messages, but I route messages within IoT Hub instead.

## Running a Deployment

Our deployment template is created, our module is defined and our images are ready to be built, all that is left is to, well, deploy!

To do a deployment we will use the [IoT Edge Dev Tool](https://aka.ms/iotedgedev), an Open Source Python application for working with IoT Edge.

### Creating an Image

Because my `deployment.template.json` file lives in the `.build` folder (I like to keep my files for different tasks out of the repository root) we'll navigate there. Now we can run `iotedgedev build` and it'll build the Image for us. By default it'll use the `amd64` architecture and "push" to your local Docker registry, but we want to deploy to our Pi so we'll need to edit the `.env` and set the `IOTHUB_CONNECTION_STRING` and `DEVICE_CONNECTION_STRING` entries to the appropriate pieces from Azure (note: I **didn't** check those into source control!) and you'll need to pass the `--platform` argument with `arm32v7` to build that module image.

Once the build has completed you'll find a new deployment file named `deployment.<platform>.json` (so `deployment.arm32v7.json`) which is what we'll use for the deployment to the device.

### Publishing an Image

With our Image built we can push it to our container registry, again to support that you need to set the `CONTAINER_REGISTRY_USERNAME`, `CONTAINER_REGISTRY_PASSWORD` and `CONTAINER_REGISTRY_SERVER` environment variables to ACR (or any other container registry you want to push to) **prior** to doing a build, as they are added to the `deployment.<platform>.json` file. Then execute the `iotedgedev push` command to push your image to the registry. This command will want to do a build, so pass `--no-build` if you want to skip Image creation.

### Deploying an Image

For us to deploy the image we won't use the `iotedgedev` tool, instead we'll use the [Azure CLI](https://docs.microsoft.com/en-us/cli/azure?{{< cda >}}) and specifically the [IoT Extensions](https://github.com/azure/azure-iot-cli-extension), so grab the Azure CLI (I use the Docker distribution of it), log in to your account and install the IoT Extension.

We're going to use the [`edge deployment create`](https://docs.microsoft.com/en-us/cli/azure/ext/azure-cli-iot-ext/iot/edge/deployment?view=azure-cli-latest&{{< cda >}}#ext-azure-cli-iot-ext-az-iot-edge-deployment-create) command to create a deployment in IoT Hub for our IoT Edge device using the deployment template we specified above.

```sh
$> az iot edge deployment create --deployment-id deployment-01 --hub-name <iot hub name in Azure> --content <path to deployment JSON file> --target-condition deviceId='<name of IoT device in Azure>' --priority 0
```

Assuming everything went successfully you will now see a deployment listed in Azure against your IoT Edge device and shortly the device will pull the Image and start a Container from it!

## Conclusion

Phew, that was a bit of a complex blog as there's a lot of little pieces that come into play when you start looking to deploy to an IoT device. Admittedly, I made things a bit harder on myself because I went down the route of creating the application _before_ deciding to use IoT Edge for deployments. If I was to start again I would stick more with the guidance outlines on the docs site, there's quite a good step-by-step guide starting [here](https://docs.microsoft.com/en-us/azure/iot-edge/tutorial-develop-for-linux?{{< cda >}}) that goes through the process.

We start with defining our Module, which is the _thing_ that we'll run on the IoT device as a Docker Container, next we create a `deployment.template.json` file which is a generic template that describes how to deploy to a platform and finally we can use the Azure CLI to create a deployment for our device to pick up.

Next time we'll move away from executing the commands ourselves and control it all via Azure Pipelines.
