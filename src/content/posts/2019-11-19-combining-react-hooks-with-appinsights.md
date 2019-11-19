+++
title = "Combining React Hooks With AppInsights"
date = 2019-11-19T11:40:02+11:00
description = "A look at how to create a custom React Hook to work with AppInsights"
draft = false
tags = ["react", "azure", "javascript"]
series = "react-monitoring"
series_title = "Using AppInsights as a React Hook"
+++

The introduction of [Hooks](https://reactjs.org/docs/hooks-intro.html) into React 16.8 changed the way that people thought about creating components to with within the React life cycle.

With the [AppInsights React plugin](https://docs.microsoft.com/en-us/azure/azure-monitor/app/javascript?{{<cda>}}#react-extensions) you get a good starting point for integrating AppInsights but it uses a [Higher Order Component (HOC)](https://reactjs.org/docs/higher-order-components.html) and a custom plugin, and I wanted something that'd integrate nicely into the Hooks pattern. So let's take a look at how you can go about building that.

## React Context

Before creating my custom Hook I wanted to have a more _React_ way in which I could access AppInsights, so let's create a [React Context](https://reactjs.org/docs/context.html) to use as a starting point. This will make the plugin available to all children components, and in theory, allow you to have different plugin configurations through different contexts (we won't try that out, but it's an idea that you may want to explore yourself). Admittedly, you don't _need_ to create a Context to expose the plugin, but I just like the way the programmatic model comes together as a result of it.

We'll set up the AppInsights instance like we did in [the first article of the series]({{<ref "/posts/2019-10-04-implementing-monitoring-in-react-using-appinsights.md">}}) and export the `reactPlugin` from it as well (previously we'd only exported the AppInsights instance):

```js
import { ApplicationInsights } from "@microsoft/applicationinsights-web";
import {
    ReactPlugin,
    withAITracking
} from "@microsoft/applicationinsights-react-js";
import { globalHistory } from "@reach/router";

const reactPlugin = new ReactPlugin();
const ai = new ApplicationInsights({
    config: {
        instrumentationKey: process.env.APPINSIGHTS_KEY,
        extensions: [reactPlugin],
        extensionConfig: {
            [reactPlugin.identifier]: { history: globalHistory }
        }
    }
});
ai.loadAppInsights();

export default Component => withAITracking(reactPlugin, Component);
export const appInsights = ai.appInsights;
export { reactPlugin };
```

Now we can start creating our Context. Let's start with a new file called `AppInsightsContext.js`:

```jsx
import React, { createContext } from "react";
import { reactPlugin } from "./AppInsights";

const AppInsightsContext = createContext(reactPlugin);

const AppInsightsContextProvider = ({ children }) => {
    return (
        <AppInsightsContext.Provider value={reactPlugin}>
            {children}
        </AppInsightsContext.Provider>
    );
};

export { AppInsightsContext, AppInsightsContextProvider };
```

Great, you have the context ready for use and we have a component that sets up the `reactPlugin` for us when we use it. The last thing to do is to use it within our application somewhere.

Like in the first post, we'll update the `Layout/index.js` file so that we set the context up as high as we can:

```jsx
const LayoutWithContext = ({ location, children }) => (
    <AppInsightsContextProvider>
        <>
            <Headroom
                upTolerance={10}
                downTolerance={10}
                style={{ zIndex: "20", height: "6.5em" }}
            >
                <Header location={location} />
            </Headroom>
            <Container text>{children}</Container>
            <Footer />
        </>
    </AppInsightsContextProvider>
);
```

🎉 Context is now in use and all children components are able to access it within our children components. And if we wanted to use the standard page interaction tracking of the React plugin we can combine this with the HOC:

```jsx
import React from "react";
import Headroom from "react-headroom";
import { Container } from "semantic-ui-react";
import Footer from "../Footer";
import Header from "../Header";
import "semantic-ui-css/semantic.min.css";
import { AppInsightsContextProvider } from "../../AppInsightsContext";
import withAppInsights from "../../AppInsights";

const Layout = withAppInsights(({ location, children }) => (
    <>
        <Headroom
            upTolerance={10}
            downTolerance={10}
            style={{ zIndex: "20", height: "6.5em" }}
        >
            <Header location={location} />
        </Headroom>
        <Container text>{children}</Container>
        <Footer />
    </>
));

const LayoutWithContext = ({ location, children }) => (
    <AppInsightsContextProvider>
        <Layout location={location} children={children} />
    </AppInsightsContextProvider>
);

export default LayoutWithContext;
```

### Exposing Context as a Hook

The final thing we can do with our new Context-provided `reactPlugin` is to make it easier to access it and to do that we'll use the [`useContext`](https://reactjs.org/docs/hooks-reference.html#usecontext) Hook. To do this it's a simple matter of updating `AppInsightsContext.js`:

```js
const useAppInsightsContext = () => useContext(AppInsightsContext);
```

Our first Hook is ready!

## Creating a Hook for Tracking Events

With Context ready we can make some custom Hooks to use within our application. The Hook that we'll create is going to be a generic one so we can use it in multiple scenarios and work with the [`trackEvent`](https://docs.microsoft.com/en-gb/azure/azure-monitor/app/api-custom-events-metrics?{{<cda>}}#trackevent) method. Our Hook will take a few pieces of information, the `reactPlugin` instance to use, the name of the event (which will appear in AppInsights) and some data to track.

```js
const useCustomEvent = (reactPlugin, eventName, eventData) => ({});
export default useCustomEvent;
```

Primarily, we'll need to use the [`useEffect`](https://reactjs.org/docs/hooks-reference.html#useeffect) Hook to call AppInsights, let's implement taht:

```js
import { useEffect } from "react";
const useCustomEvent = (reactPlugin, eventName, eventData) => {
    useEffect(() => {
        reactPlugin.trackEvent({ name: eventName }, eventData);
    }, [reactPlugin, eventName, eventData]);
};
export default useCustomEvent;
```

We're also making sure that we follow the [Rules of Hooks](https://reactjs.org/docs/hooks-rules.html) and specifying the dependencies of the `useEffect` Hook so if they update the effect will run.

The first place we'll use the Hook is on the Add To Cart button, like we did [in the first article]({{<ref "/posts/2019-10-04-implementing-monitoring-in-react-using-appinsights.md">}}):

```js
const AddToCart = ({productId}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [visible, setVisible] = useState(false)
  const {addToCart} = useContext(CartContext)
  const reactPlugin = useAppInsightsContext()
  useCustomEvent(reactPlugin, 'Added to Cart', quantity)
  // snip
```

But wait, we have a problem here, now every time the `quantity` state changes our Effect will run, not when you click the button (or some other controlled action). This isn't ideal since it's an input field, so instead, we need to think differently about how to trigger the Effect.

### Adding More Hooks

To solve this we'll add more Hooks! In particular, we'll add the [`useState`](https://reactjs.org/docs/hooks-reference.html#usestate) Hook to our custom one.

```js
import { useState, useEffect, useRef } from "react";

export default function useCustomEvent(reactPlugin, eventName, eventData) {
    const [data, setData] = useState(eventData);

    useEffect(() => {
        reactPlugin.trackEvent({ name: eventName }, data);
    }, [reactPlugin, data, eventName]);

    return setData;
}
```

We'll create some internal state, which I've called `data`, and initialise it with whatever we pass as the `eventData`. Now in our dependencies we'll stop using `eventData` and use `data` then return the `setData` state mutation function from our Hook. With this change we will update our usage in Add to Cart like so:

```js
const AddToCart = ({productId}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [visible, setVisible] = useState(false)
  const {addToCart} = useContext(CartContext)
  const reactPlugin = useAppInsightsContext()
  const trackAddedToCart = useCustomEvent(reactPlugin, 'Added to Cart')
  // snip
```

We now have a function that is in the variable `trackAddedToCart` that can be used at any point in our component to trigger off the effect:

```js
// snip
Moltin.addToCart(cartId, productId, quantity).then(() => {
    addToCart(quantity, cartId);
    setLoading(false);
    setQuantity(quantity);
    setVisible(true);
    toggleMessage();
    trackAddedToCart({ quantity, cartId, productId });
});
// snip
```

Here once the cart has successfully been updated we track the event with some data that we want.

### Ignoring Unwanted Effect Runs

If you were to start watching your AppInsight logs now you'll see that you're receiving events for the interaction, but you're also receiving other tracking events from when the component first renders. That isn't ideal is it! Why does this happen? well, the Effect Hook is similar to `componentDidUpdate` but also `componentDidMount`, meaning that the Effect runs _on the initial pass_, which we may not want it to do, especially if the Effect is meant to be triggered by a certain action in our component.

Thankfully, [there's a solution for this](https://reactjs.org/docs/hooks-faq.html#what-can-i-do-if-my-effect-dependencies-change-too-often) and that is to use the [`useRef`](https://reactjs.org/docs/hooks-reference.html#useref) Hook. We'll update our custom Hook to allow us to set whether we want the `componentDidMount`-equivalent life cycle to trigger the effect or not:

```js
import { useState, useEffect, useRef } from "react";

export default function useCustomEvent(
    reactPlugin,
    eventName,
    eventData,
    skipFirstRun = true
) {
    const [data, setData] = useState(eventData);
    const firstRun = useRef(skipFirstRun);

    useEffect(() => {
        if (firstRun.current) {
            firstRun.current = false;
            return;
        }
        reactPlugin.trackEvent({ name: eventName }, data);
    }, [reactPlugin, data, eventName]);

    return setData;
}
```

The argument, `skipFirstRun`, will be defaulted to `true` and we create a ref using that value. Then when the Effect runs we check if we are to skip the first run, we update the ref and return early from the function. This works because the ref mutation doesn't notify changes to the component and thus it won't re-render.

## Conclusion

Throughout this post we've had a look at how to use Hooks with AppInsights to create a programmatic model that feels like how we would expect a React application to work.

We started by introducing Context so that we can resolve the React AppInsights plugin through the React component structure rather than treating it as an external dependency. Next, we created a custom Hook that allows us to track events through the Hook life cycle and learnt a bit about how the Hooks can be triggered and what to do to handle them in the smoothest way possible.

You'll find the sample I used in this post [on GitHub](https://github.com/aaronpowell/react-app-insights/blob/a8b6aa84b1549c50d9804d1175b6a70089de3ec7/AppInsights-Part3) with the [custom Hook](https://github.com/aaronpowell/react-app-insights/blob/a8b6aa84b1549c50d9804d1175b6a70089de3ec7/AppInsights-Part3/src/useCustomEvent.js), [Add to Cart component](https://github.com/aaronpowell/react-app-insights/blob/a8b6aa84b1549c50d9804d1175b6a70089de3ec7/AppInsights-Part3/src/components/AddToCart/index.js) and a second usage on the [Remove from Cart page](https://github.com/aaronpowell/react-app-insights/blob/a8b6aa84b1549c50d9804d1175b6a70089de3ec7/AppInsights-Part3/src/pages/cart.js#L89-L94).

At the time of writing the AppInsights React plugin doesn't provide a method `trackEvent`, so I [patched it myself](https://github.com/aaronpowell/react-app-insights/blob/a8b6aa84b1549c50d9804d1175b6a70089de3ec7/AppInsights-Part3/src/AppInsights.js#L20-L22) when initializing the plugin:

```js
ReactPlugin.prototype.trackEvent = function(event, customProperties) {
    this._analyticsPlugin.trackEvent(event, customProperties);
};
```

### Bonus Feature - Track Metrics via Hooks

The React plugin provides a HOC for tracking metrics such as interaction with a component, so I thought, why not look to see if we can do that with a Hook?

To do that I've created another custom Hook, [`useComponentTracking`](https://github.com/aaronpowell/react-app-insights/blob/7501862fc5127c54ef227a759a8ba9b510c9981b/AppInsights-Part3/src/useComponentTracking.js) that simulates what the HOC was doing, but doesn't inject a DOM element, you need to attach it to the element(s) yourself. I've updated [the Layout component](https://github.com/aaronpowell/react-app-insights/blob/7501862fc5127c54ef227a759a8ba9b510c9981b/AppInsights-Part3/src/components/Layout/index.js) to show how it would work too.
