+++
title = "Creating Static Web Apps With F# and Fable"
date = 2021-07-09T00:56:43Z
description = "Some templates to make it easier to get started with F# and Static Web Apps"
draft = false
tags = ["azure", "serverless", "web", "fsharp", "dotnet"]
tracking_area = "dotnet"
tracking_id = "33392"
cover_image = "/images/banners/2021-07-09-creating-static-web-apps-with-fsharp-and-fable.png"
+++

While I've done [lots of stuff with F#](/tags/fsharp) over the years, it's pretty much all centred around apps on the server. With [Azure Static Web Apps](https://docs.microsoft.com/azure/static-web-apps/?{{<cda>}}) being a big area for myself these days I've been looking at the role that F# plays with it.

This led me to have a proper look at [Fable](https://fable.io). Fable is a F# to JavaScript compiler, meaning you can write F# code and have it compiled to JavaScript, which is then run in the browser (or in a Node.js/Electron/etc. but I'm focusing on the browser usage).

So, in an effort to make it easier to get started with Fable and Static Web Apps, I've put together three [GitHub repo templates](https://docs.github.com/github/creating-cloning-and-archiving-repositories/creating-a-repository-on-github/creating-a-repository-from-a-template?{{<cda>}}). All the templates have a common Azure Function backend (using F#), use [Paket](https://fsprojects.github.io/Paket/) for dependency management, [Vite](https://vitejs.dev/) for bundling the JavaScript (I wanted to avoid webpack), [Thoth.Fetch](https://thoth-org.github.io/Thoth.Fetch/) for calling the API and a [VS Code Remote Container](https://code.visualstudio.com/docs/editor/remote-containers?{{<cda>}}) config to setup an F# environment. For the client, there's [Fable](https://github.com/aaronpowell/swa-fable-template), [Feliz](https://github.com/aaronpowell/swa-feliz-template) ([a React DSL in F#](https://zaid-ajaj.github.io/Feliz/#/)) and [Elmish](https://github.com/aaronpowell/swa-elmish-template) ([a Model-View-Update pattern](https://elmish.github.io/elmish/)).

I've also included some instructions on deploying to SWA, as it's a bit tricker than a _normal_ app.

Check out the templates, and let me know if there's anything you'd like to see in them to make it easier to get started with F# and Static Web Apps.

{{<github "aaronpowell/swa-fable-template">}}
{{<github "aaronpowell/swa-feliz-template">}}
{{<github "aaronpowell/swa-elmish-template">}}
