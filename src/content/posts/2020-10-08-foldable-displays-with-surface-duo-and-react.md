+++
title = "Foldable Displays With Surface Duo and React"
date = 2020-10-08T10:12:28+10:00
description = "Let's look at how we can make a foldable web experience using React for the Surface Duo"
draft = false
tags = ["javascript", "surfaceduo", "react"]
cover_image = "/images/banners/2020-10-08-foldable-displays-with-surface-duo-and-react.png"
+++

Last month Microsoft released the long awaited [Surface Duo](https://www.microsoft.com/surface/devices/surface-duo?{{<cda>}}), a foldable, dual-screen mobile device.

While it's not (yet?) available in Australia, it didn't stop me being interested in it, in particular because of what they are doing for web developers. You can read the full blog post [here](https://devblogs.microsoft.com/surface-duo/dual-screen-web-experiences-preview/?{{<cda>}}) but the key points are:

-   CSS primitives to detect the layout spanning mode
-   CSS variables for screen and hinge dimensions
-   A JavaScript API for getting window segments

Basically, the browser sees both displays as a single viewport and it's up to you to manage how that viewport is utilised, and in particular, how you manage the gap between them (which the browser doesn't know about). Armed with this knowledge, I decided to have a look at how we can do responsive design and progressive enhancement for web applications, targeting a Surface Duo, using React.

## Setting up an environment

As mentioned above, the Duo isn't available outside of the US (at the time of writing), so how can we get up and running with it? With the browser dev tools of course! [Here's a blog about it all](https://devblogs.microsoft.com/surface-duo/build-and-test-dual-screen-web-apps/?{{<cda>}}), but the way it works is the same way as any other mobile device emulation in Chrome or Edge, it's just available\*, so we can get started building an application.

_\*Note: This is still classed as experimental in the browser, so you'll need to be running Edge or Chrome Canary, and enable it from `edge://flags`. Read more about that [here](https://docs.microsoft.com/dual-screen/web/emulator-device-testing?{{<cda>}})._

### Origin Trials

If you're wanting to deploy this out to a wider set of users, but don't want each one to configure their browser directly, you can setup an [Origin Trial](https://developer.microsoft.com/microsoft-edge/origin-trials/?{{<cda>}}), which allows you to create time-boxed periods in which experimental features are enabled for your users. Check out [this article](https://devblogs.microsoft.com/surface-duo/dual-screen-website-edge-origin-trials/?{{<cda>}}) on how to get started, and I've also added it to the demo app.

## Introducing React-Foldable

React is my happy place when it comes to JavaScript UI libraries, so I wanted to think about how I'd want to use React to progressively enhance an application, and this has lead me to create [react-foldable](https://github.com/aaronpowell/react-foldable).

`react-foldable` is a series of React components and hooks that make it easier to work with a foldable device, using the proposed standards mentioned above.

## Creating a foldable layout

My first goal is to look at how we can target the different displays with content, and _react_ to the change, meaning that if we're in a single display mode and "unfold" into dual-display, we want the ability to bring in more content.

We'll start by creating a foldable zone in our application. This basically says that we're going to be observing changes to the _foldabilty_ of the device and reacting accordingly.

```tsx
import React from "react";
import { Foldable } from "react-foldable";

const App = () => <Foldable>{/* TODO: Components */}</Foldable>;
```

Inside the `<Foldable>` component we specify `<FoldableScreen>`'s, which are added/removed from the component tree.

```jsx
import React from "react";
import "./App.css";
import { Foldable, FoldableScreen } from "react-foldable";
import { MainApp } from "./MainApp";
import { SecondScreen } from "./SecondScreen";

function App() {
    return (
        <Foldable>
            <FoldableScreen matchScreen={0} component={MainApp} />
            <FoldableScreen matchScreen={1} component={SecondScreen} />
        </Foldable>
    );
}

export default App;
```

Each `<FoldableScreen>` needs to be told which screen to match. Non-foldable devices will always have a `0` screen, so that is where you'd put the things you **always** want displayed. There's no restriction on the number of components you can have matching a screen either, as `<FoldableScreen>` acts like a wrapper component to determine whether or not it displays.

### Advanced matching

Matching on a screen is good for a lot of common scenarios, but what if you're wanting to conditionally show a component if the device supports dual screen or not? For this, we'd use the `match` prop, like so:

```jsx
<Foldable>
    <FoldableScreen
        match={({ isDualScreen }) => isDualScreen}
        component={() => <p>I'm only appearing when we can dual-screen</p>}
    />
</Foldable>
```

The `match` prop takes a function with the signature `(props: FoldableContextProps) => boolean`, where `FoldableContextProps` is defined like so:

```typescript
interface FoldableContextProps {
    windowSegments?: DOMRect[];
    isDualScreen: boolean;
    screenSpanning: ScreenSpanning;
}
```

Using this, we can completely remove a component if it's in dual screen mode, allowing you to swap out large chunks of the component hierarchy.

## Using hooks

While swapping components can work in many cases, sometimes you'll want to programmatically detect the foldable information, and to make this easier there are a series of hooks. In fact, the hook values are all exposed through the `FoldableContextProps` type on the `match` as well, so the component dogfoods itself!

-   `useDualScreen` - a boolean to indicate whether or not the device is in dual-screen mode
-   `useScreenSpanning` - indicates whether the screen is horizontal, vertical or unknown (unknown is primarily when it's not a foldable device)
-   `useWindowSegments` - returns an array of `DOMRect` that shows the bounding dimensions for each screen (non-foldable devices will return an array of one)
-   `useFoldableContext` - easy access to the React context containing all of the above values

## Conclusion

This was a quick introduction to [react-foldable](https://github.com/aaronpowell/react-foldable), a library that I've been building to hopefully make it easier to create progressively enhanced applications for foldable devices using React.

You'll find a demo of the component at [https://react-foldable.aaron-powell.com/](https://react-foldable.aaron-powell.com/).

I'm very much open to feedback on how the component works and the general design, as right now it's very much how _I_ would tackle the problem, but if there's aspects to prove on do reach out.
