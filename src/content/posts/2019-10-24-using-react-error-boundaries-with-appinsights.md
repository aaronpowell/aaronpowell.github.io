+++
title = "Using React Error Boundaries With AppInsights"
date = 2019-10-24T09:02:43+11:00
description = "Combining React Error Boundaries with AppInsights for automatic error logging"
draft = false
tags = ["react", "azure", "javascript"]
series = "react-monitoring"
series_title = "Automatic Logging with Error Boundaries"
+++

[Error Boundaries](https://reactjs.org/docs/error-boundaries.html) is a new feature introduced in React 16 to better handle unexpected errors that happen when a component tree is attempting to render.

The goal of Error Boundaries is to ensure that when an error does occur during render React has a way to catch that error in a component and handle it gracefully, rather than the component tree being broken and resulting in a white screen for the user. This all works by using a new lifecycle method on a `Component` called `componentDidCatch`:

```jsx
class ErrorBoundary extends React.Component {
    state = { hasError: false };

    componentDidCatch(error, info) {
        this.setState({ hasError: true });
    }

    render() {
        if (this.state.hasError) {
            return <h1 className="error">Error!</h1>;
        }

        return this.props.children;
    }
}

const App = () => (
    <ErrorBoundary>
        <SomeComponent />
    </ErrorBoundary>
);
```

The `componentDidCatch` method receives two pieces of information, the `error` that was thrown and `info` which is the [component stack trace](https://reactjs.org/docs/error-boundaries.html#component-stack-traces). This sounds like information that would be **really** great for us to track in an error monitoring platform, like, say [AppInsights](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview?{{<cda>}})!

## Designing Our Component

Let's create a generic "App Insights Aware Error Boundary" component, which will allow us to place a boundary somewhere in our component tree but also be generic enough to use in multiple places. After all, we don't want a _single_ error boundary, that'd be akin to wrapping the whole application with a `try`/`catch` block and make it harder to handle errors-at-the-source.

```jsx
import React from "react";
import { SeverityLevel } from "@microsoft/applicationinsights-web";

class AppInsightsErrorBoundary extends React.Component {
    state = { hasError: false };

    componentDidCatch(error, info) {
        this.setState({ hasError: true });
        this.props.appInsights.trackException({
            error: error,
            exception: error,
            severityLevel: SeverityLevel.Error,
            properties: { ...info }
        });
    }

    render() {
        if (this.state.hasError) {
            const { onError } = this.props;
            return typeof onError === "function"
                ? onError()
                : React.createElement(onError);
        }

        return this.props.children;
    }
}
```

Our component will take two `props`, `appInsights` and `onError`. The first is the AppInsights instance you would initialise within an application, as we did in [the last post]({{<ref "/posts/2019-10-04-implementing-monitoring-in-react-using-appinsights.md">}}), the other is the component to render _or_ a function to return a component.

## Using Our Error Boundary

I've created a [demo application](https://appinsightserrorboundary.z22.web.core.windows.net/) using the Gastby eCommerce starter kit (like last time) that shows how you can use an Error Boundary ([source code is on my GitHub](https://github.com/aaronpowell/react-app-insights/tree/5307f90808f6765921072f6e975a6b6ce9964d55/AppInsights-Part2)).

Since it turns out it's hard to create a reproducible error in a well-written application I've created a fake error scenario, basically whenever you try to add more than 1 item to the cart it'll throw an error during `render` ([error in codebase](https://github.com/aaronpowell/react-app-insights/blob/5307f90808f6765921072f6e975a6b6ce9964d55/AppInsights-Part2/src/components/AddToCart/index.js#L54-L56)).

Before seeing the error boundary in action, what would it look like if we didn't have one?

![No Error Boundary in action](/images/spa-appinsights/no-error-boundary.gif)

Without the error boundary, we end up with a blank screen because the whole component tree has become corrupt.

![Error Boundary in action](/images/spa-appinsights/error-boundary.gif)

Now we wrap our "buggy" component with an error boundary and if we click the 'Add to Cart' button we successfully added to cart, but if when you try to increase the number in the text box it throws an error and the error boundary is displayed.

How does that look in code? Well, we wrap the component we want with the error boundary ([source](https://github.com/aaronpowell/react-app-insights/blob/5307f90808f6765921072f6e975a6b6ce9964d55/AppInsights-Part2/src/components/ProductSummary/index.js#L26-L30)):

```jsx
<ErrorBoundary onError={() => <h1>I believe something went wrong</h1>}>
    <AddToCart productId={id} />
</ErrorBoundary>
```

Because I've got a really basic component to put in when there's an error, I'm just created an inline function component, but you might want to provide a proper component reference instead.

## Inspecting Errors in AppInsights

By logging into the Azure Portal and navigating to your AppInsights resource you'll be able to filter the data to the exceptions you've captured:

![AppInsights view of error](/images/spa-appinsights/error-details.png)

The information might be a little tricky to read if you're using a minified bundle, but to help with that you can [upload your Source Map](https://docs.microsoft.com/en-us/azure/azure-monitor/app/javascript?{{<cda>}}#source-map-support) and have it help give you more detailed information in the logs!

## Conclusion

AppInsights will automatically capture unhandled errors that reach the `onError` event in the browser, but when using React you want to do something that'll allow you to handle the component tree failing to render, which is where Error Boundaries come into play. We can then combine this with AppInsights to have our Error Boundary log those _handled_ errors, you could even provide additional information to the properties of the tracked events if desired.
