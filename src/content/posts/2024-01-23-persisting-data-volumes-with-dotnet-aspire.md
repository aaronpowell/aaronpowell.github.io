+++
title = "Persisting Data Volumes With .NET Aspire"
date = 2024-01-23T02:31:26Z
description = "Tired of losing all the data when you restart your .NET Aspire app? Let's fix that!"
draft = false
tags = ["dotnet"]
tracking_area = "dotnet"
tracking_id = "117908"
+++

_This post is written against the .NET Aspire Preview 2 release, so it may change when the final version is released._

Recently, I've been building an app using [.NET Aspire](https://learn.microsoft.com/dotnet/aspire/?{{<cda>}}) which I'm using PostgreSQL as the database and Azure Storage Blobs and Queues in.

.NET Aspire is awesome for this, as you can setup a developer inner loop super simply with [the components that ship](https://learn.microsoft.com/dotnet/aspire/fundamentals/components-overview?tabs=dotnet-cli&{{<cda>}}), and the nice thing about this is that locally PostgreSQL is run in a Docker container and Azure Storage uses the [Azurite storage emulator](https://learn.microsoft.com/azure/storage/common/storage-use-azurite?tabs=visual-studio%2Cblob-storage&{{<cda>}}) (which also happens to run in a container).

The problem with this is that when you restart your app, you lose all the data in the database and storage emulator, since they are started fresh each time.

Turns out, it's a pretty easy fix - all that you need to do is mount a volume into the container where it would store it's data.

Here's the PostgreSQL example:

```csharp
IResourceBuilder<PostgresContainerResource> postgresContainerDefinition = builder.AddPostgresContainer();

if (builder.Environment.IsDevelopment())
{
    postgresContainerDefinition
    // Mount the Postgres data directory into the container so that the database is persisted
    .WithVolumeMount("./data/postgres", "/var/lib/postgresql/data", VolumeMountType.Bind);
}
```

And here's the Azure Storage example:

```csharp
IResourceBuilder<AzureStorageResource> storage = builder.AddAzureStorage("azure-storage");

if (builder.Environment.IsDevelopment())
{
    storage.UseEmulator()
    .WithAnnotation(new VolumeMountAnnotation("./data/azurite", "/data", VolumeMountType.Bind));
}
```

With this I'm mounting the `./data/<service name>` folder from within the AppHost project into the respective data paths, but also wrapping them with a `builder.Environment.IsDevelopment()` check so that it only happens when running locally (since you don't want to mount volumes in production - we'll use the Azure services for that).

> Note: The Azure Storage emulator doesn't have a `WithVolumeMount` method, so we have to use the `WithAnnotation` method, which is what the `WithVolumeMount` method wraps anyway. Also, due to [this pull request](https://github.com/dotnet/aspire/pull/1631) it's likely there'll be an easier way come Preview 3, where you provide the `./data/azurite` path as part of the `UseEmulator` method.

Now when I restart my app, the data is persisted, meaning I don't have to rebuild state each time. Just make sure you put those paths in the `.gitignore` file so that you don't accidentally commit them to source control!
