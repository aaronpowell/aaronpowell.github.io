+++
title = "Creating DEV's offline page using Blazor"
date = 2019-07-08T14:12:11+10:00
description = "Let's build something with Blazor!"
draft = false
tags = ["wasm", "dotnet"]
+++

_This post was [originally published](https://dev.to/azure/creating-dev-s-offline-page-using-blazor-29dl) under my [DEV.to](https://dev.to) account._

I came across a fun post from [Ali Spittel](https://dev.to/aspittel) on [Creating DEV's offline page](https://dev.to/aspittel/how-to-create-the-drawing-interaction-on-dev-s-offline-page-1mbe) (their offline page is [here](https://dev.to/offline)).

Given that I've done some [experiments in the past with WebAssembly]({{< ref "/posts/2019-02-04-golang-wasm-1-introduction.md" >}}) I decided to have a crack at my own implementation in WebAssembly, in particular with [Blazor](https://dotnet.microsoft.com/apps/aspnet/web-apps/client?{{< cda >}}).

## Getting Started

_Caveat: Blazor is a platform for building client side web applications using the .NET stack and specifically the C# language. It's highly experimental so there's a chance things will change from what it exists at the time of writing (I'm using build `3.0.0-preview6.19307.2`)._

First up you'll need to follow the [setup guide for Blazor](https://docs.microsoft.com/en-gb/aspnet/core/blazor/get-started?view=aspnetcore-3.0&tabs=visual-studio-code&{{< cda >}}) and once that's done create a new project in your favorite editor (I used VS Code).

I've then deleted all the boilerplate code from the `Pages` and `Shared` folder (except any `_Imports.razor` files), Bootstrap from the `css` folder and `sample-data`. Now we have a completely empty Blazor project.

## Creating Our Layout

First thing we'll need to do is create the [Layout file](https://docs.microsoft.com/en-gb/aspnet/core/blazor/layouts?view=aspnetcore-3.0&{{< cda >}}). Blazor, like ASP.NET MVC, uses a Layout file as the base template for all pages (well, all pages that use that Layout, you can have multiple layouts). So, create a new file in `Shared` called `MainLayout.razor` and we'll define it. Given that we want it to be full screen it'll be _pretty simple_:

```cshtml-razor
@inherits LayoutComponentBase

@Body
```

This file inherits the Blazor-provided base class for layouts, `LayoutComponentBase` which gives us access to the `@Body` property which allows us to place the page contents within any HTML we want. We don't need anything around it, so we just put `@Body` in the page.

## Creating Our Offline Page

Time to make the offline page, we'll start by creating a new file in the `Pages` folder, let's call it `Offline.html`:

```html
@page "/"

<h3>Offline</h3>
```

This is our starting point, first we have the `@page` directive which tells Blazor that this is a page we can navigate to and the URL it'll respond to is `"/"`. We've got some placeholder HTML in there that we'll replace next.

### Starting the Canvas

The offline page is essentially a large canvas that we can draw on, and we'll need to create that, let's update `Offline.razor` with a canvas element:

```html
@page "/"

<canvas></canvas>
```

### Setting the Canvas Size

We need to set the size of the canvas to be full screen and right now it's `0x0`, not ideal. Ideally, we want to get the `innerWidth` and `innerHeight` of the browser, and to do that we'll need to use the [JavaScript interop](https://docs.microsoft.com/en-gb/aspnet/core/blazor/javascript-interop?view=aspnetcore-3.0&{{< cda >}}) from Blazor.

We'll quickly make a new JavaScript file to interop with (call it `helper.js` and put it in `wwwroot`, also update `index.html` in `wwwroot` to reference it):

```js
window.getWindowSize = () => {
    return { height: window.innerHeight, width: window.innerWidth };
};
```

Next we'll create a C# `struct` to represent that data (I added a file called `WindowSize.cs` into the project root):

```csharp
namespace Blazor.DevToOffline
{
    public struct WindowSize
    {
        public long Height { get; set; }
        public long Width { get; set; }
    }
}

```

Lastly, we need to use that in our Blazor component:

```cshtml-razor
@page "/"
@inject IJSRuntime JsRuntime

<canvas height="@windowSize.Height" width="@windowSize.Width"></canvas>

@code {
    WindowSize windowSize;
    protected override async Task OnInitAsync()
    {
        windowSize = await JsRuntime.InvokeAsync<WindowSize>("getWindowSize");
    }
}
```

That's a bit of code added so let's break it down.

```cshtml-razor
@inject IJSRuntime JsRuntime
```

Here we use [Dependency Injection](https://docs.microsoft.com/en-gb/aspnet/core/blazor/dependency-injection?view=aspnetcore-3.0&{{< cda >}}) to inject the `IJSRuntime` as a property called `JsRuntime` on our component.

```cshtml-razor
<canvas height="@windowSize.Height" width="@windowSize.Width"></canvas>
```

Next, we'll set the `height` and `width` properties of the `<canvas>` element to the value of fields off _an instance of our `struct`_, an instance named `windowSize`. Note the `@` prefix, this tells the compiler that this is referring to a C# variable, not a static string.

```c#
@code {
    WindowSize windowSize;

    protected override async Task OnInitAsync()
    {
        windowSize = await JsRuntime.InvokeAsync<WindowSize>("getWindowSize");
    }
}
```

Now we've added a code block into our component. It contains the variable `windowSize` (which is uninitialized, but it's a struct so it has a default value) and then we override a [Lifecycle method](https://docs.microsoft.com/en-gb/aspnet/core/blazor/components?view=aspnetcore-3.0&{{< cda >}}#lifecycle-methods), `OnInitAsync`, in which we call out to JavaScript to get the window size and assign it to our local variable.

Congratulations, you now have a full screen canvas! 🎉

## Wiring Up Events

We may have our canvas appearing but it doesn't do anything yet, so let's get cracking on that by adding some event handlers:

```cshtml-razor
@page "/"
@inject IJSRuntime JsRuntime

<canvas
    height="@windowSize.Height"
    width="@windowSize.Width"
    @onmousedown="@StartPaint"
    @onmousemove="@Paint"
    @onmouseup="@StopPaint"
    @onmouseout="@StopPaint"
/>

@code {
    WindowSize windowSize;
    protected override async Task OnInitAsync()
    {
        windowSize = await JsRuntime.InvokeAsync<WindowSize>("getWindowSize");
    }

    private void StartPaint(UIMouseEventArgs e) { }
    private async Task Paint(UIMouseEventArgs e) { }
    private void StopPaint(UIMouseEventArgs e) { }
}
```

When you're binding events in Blazor you need to prefix the event name with `@`, like `@onmousedown`, and then provide it the name of the function to invoke when the event happens, e.g. `@StartPaint`. The signature of these functions are to either return a `void` or `Task`, depending on whether it's asynchronous or not. The argument to the function will need to be the appropriate type of event arguments, mapping to the DOM equivalent (`UIMouseEventArgs`, `UIKeyboardEventArgs`, etc.).

_Note: If you're comparing this to the JavaScript reference implementation, you'll notice I'm not using the `touch` events. This is because, in my experiments today, there is a bug with binding touch events in Blazor. Remember, this is preview!_

## Getting the Canvas Context

_Note: I'm going to talk about how to setup interactions with `<canvas>` from Blazor, but in a real application you'd more likely want to use [BlazorExtensions/Canvas](https://github.com/blazorExtensions/Canvas/) than roll-you-own._

Since we'll need to work with the 2D context of the canvas we're going to need access to that. But here's the thing, that's a JavaScript API and we're in C#/WebAssembly, this will be a bit interesting.

Ultimately, we're going to have to this in JavaScript and rely on the JavaScript interop feature of Blazor, so there's no escaping writing some JavaScript still!

Let's write a little JavaScript module to give us an API to work with:

```js
(window => {
    let canvasContextCache = {};

    let getContext = canvas => {
        if (!canvasContextCache[canvas]) {
            canvasContextCache[canvas] = canvas.getContext("2d");
        }
        return canvasContextCache[canvas];
    };

    window.__blazorCanvasInterop = {
        drawLine: (canvas, sX, sY, eX, eY) => {
            let context = getContext(canvas);

            context.lineJoin = "round";
            context.lineWidth = 5;
            context.beginPath();
            context.moveTo(eX, eY);
            context.lineTo(sX, sY);
            context.closePath();
            context.stroke();
        },

        setContextPropertyValue: (canvas, propertyName, propertyValue) => {
            let context = getContext(canvas);

            context[propertyName] = propertyValue;
        }
    };
})(window);
```

I've done this with a closure scope created in an anonymous-self-executing-function so that the `canvasContextCache`, which I use to avoid constantly getting the context, isn't exposed.

The module provides us two functions, the first is to draw a line on the canvas between two points (we'll need that for the doodling!) and the second updates a property of the context (we'll need that to change colours!).

You might also notice that I don't ever call `document.getElementById`, I just somehow "magically" get the canvas. This can be achieves by [capturing a component reference](https://docs.microsoft.com/en-gb/aspnet/core/blazor/components?view=aspnetcore-3.0&{{< cda >}}#capture-references-to-components) in C# and passing that reference around.

But this is still all JavaScript, what do we do in C#? Well, we create a C# wrapper class!

```csharp
public class Canvas2DContext
{
    private readonly IJSRuntime jsRuntime;
    private readonly ElementRef canvasRef;

    public Canvas2DContext(IJSRuntime jsRuntime, ElementRef canvasRef)
    {
        this.jsRuntime = jsRuntime;
        this.canvasRef = canvasRef;
    }

    public async Task DrawLine(long startX, long startY, long endX, long endY)
    {
        await jsRuntime.InvokeAsync<object>("__blazorCanvasInterop.drawLine", canvasRef, startX, startY, endX, endY);
    }

    public async Task SetStrokeStyleAsync(string strokeStyle)
    {
        await jsRuntime.InvokeAsync<object>("__blazorCanvasInterop.setContextPropertyValue", canvasRef, "strokeStyle", strokeStyle);
    }
}
```

This is a generic class that takes the captured reference and the JavaScript interop API and just gives us a nicer programmatic interface.

## Wiring Up Our Context

We can now wire up our context and prepare to draw lines on the canvas:

```cshtml-razor
@page "/" @inject IJSRuntime JsRuntime

<canvas
    height="@windowSize.Height"
    width="@windowSize.Width"
    @onmousedown="@StartPaint"
    @onmousemove="@Paint"
    @onmouseup="@StopPaint"
    @onmouseout="@StopPaint"
    @ref="@canvas"
/>

@code {
    ElementRef canvas;
    WindowSize windowSize;
    Canvas2DContext ctx;
    protected override async Task OnInitAsync() {
        windowSize = await JsRuntime.InvokeAsync<WindowSize>("getWindowSize");
        ctx = new Canvas2DContext(JsRuntime, canvas);
    }

    private void StartPaint(UIMouseEventArgs e) { }
    private async Task Paint(UIMouseEventArgs e) { }
    private void StopPaint(UIMouseEventArgs e) { }
}
```

By adding `@ref="@canvas"` to our `<canvas>` element we create the reference we need and then in the `OnInitAsync` function we create the `Canvas2DContext` that we'll use.

## Drawing On The Canvas

We're finally ready to do some drawing on our canvas, which means we need to implement those event handlers:

```csharp
bool isPainting = false;
long x;
long y;
private void StartPaint(UIMouseEventArgs e)
{
    x = e.ClientX;
    y = e.ClientY;
    isPainting = true;
}

private async Task Paint(UIMouseEventArgs e)
{
    if (isPainting)
    {
        var eX = e.ClientX;
        var eY = e.ClientY;

        await ctx.DrawLine(x, y, eX, eY);
        x = eX;
        y = eY;
    }
}

private void StopPaint(UIMouseEventArgs e)
{
    isPainting = false;
}
```

Admittedly, these aren't that different to the JavaScript implementation, all they have to do is grab the coordinates from the mouse event and then pass them through to the canvas context wrapper, which in turn calls the appropriate JavaScript function.

## Conclusion

🎉 We're done! You can see it [running here](https://blazordevtooffline.z23.web.core.windows.net/) and the code is on [GitHub](https://github.com/aaronpowell/blazor-devto-offline) (the GitHub repo contains the info to use [VS Code remote containers](https://code.visualstudio.com/docs/remote/containers) so you don't have to install anything).

This is a pretty quick look at Blazor, but more importantly, how we can use Blazor in a scenario that might require us to do a bit more interop with JavaScript that many scenarios require.

I hope you've enjoyed it and are ready to tackle your own Blazor experiments as well!

## Bonus, The Colour Picker

There's one thing that we didn't do in the above example, implement the colour picker!

I want to do this as a generic component so we could do this:

```cshtml-razor
<ColourPicker OnClick="@SetStrokeColour" Colours="@colours" />
```

In a new file, called `ColourPicker.razor` (the file name is important as this is the name of the component) we'll create our component:

```cshtml-razor
<div class="colours">
    @foreach (var colour in Colours) {
        <button class="colour" @onclick="@OnClick(colour)" @key="@colour"></button>
    }
</div>

@code {
    [Parameter] public Func<string, Action<UIMouseEventArgs>> OnClick { get; set; }
    [Parameter] public IEnumerable<string> Colours { get; set; }
}
```

Our component is going to have 2 parameters that can be set from the parent, the collection of colours and the function to call when you click on the button. For the event handler I've made is so that you pass in a _function that returns an action_, so it's a single function that is "bound" to the name of the colour when the `<button>` element is created.

This means we have a usage like this:

```cshtml-razor
@page "/"
@inject IJSRuntime JsRuntime

<ColourPicker OnClick="@SetStrokeColour" Colours="@colours" />

// snip
@code {
    IEnumerable<string> colours = new[] { "#F4908E", "#F2F097", "#88B0DC", "#F7B5D1", "#53C4AF", "#FDE38C" };

    // snip

    private Action<UIMouseEventArgs> SetStrokeColour(string colour)
    {
        return async _ => {
            await ctx.SetStrokeStyleAsync(colour);
        };
    }
}
```

Now if you click the colour picker across the top you get a different colour pen.

Happy doodling!
