+++
title = "React SVG Chart Animation"
date = 2017-08-10T20:39:43+10:00
description = ""
draft = false
tags = ["react", "svg"]
+++

In my [last post]({{< ref "/posts/2017-08-08-react-svg-animations.md" >}}) I talked about animating SVG objects and how to combine that with React. As I talked about the catalyst for it was looking into how we could do charts.

Well of course after my initial experiments I wanted to actually look at how to do a chart.

## Creating a basic chart

For this I started with the great walk through on [SVG Charts at CSS Tricks](https://css-tricks.com/how-to-make-charts-with-svg/), and I'm going to use the [Line Chart](https://css-tricks.com/how-to-make-charts-with-svg/#article-header-id-5) example for this (but with randomly generated data).

Now we know what the basic React component would look like:

```js
const Line = ({ data }) => (
    <polyline
        fill="none"
        stroke="#0074d9"
        strokeWidth="2"
        points={data}
        />
);
```

But that's not what we've come here to look at, rendering elements to the DOM is pretty basic, let's start thinking about animation.

## Animating a line chart

The kind of animation I want to go with the for this is having the lines grow from a `0` x-axis to their final resting point on the y-axis.

Also, rather than just having an array for our input data, I'm going to try and represent something a bit more realistic by having an object. My data will look like this:

```js
const data = [{ x: 0, y: 120 }, { x: 20, y: 60 }];
```

Like my last post I'm going to use a Higher Order Component for wrapping up the logic around handling the animation. Let's start with the `constructor` and `render`:

```js
const animateLine = (WrappedComponent) => {
    class Wrapper extends React.Component {
        constructor(props) {
            super(props);

            const { xSelector, ySelector, data } = props;

            let mappedData = data.map((d) => [xSelector(d), ySelector(d)]).reduce((arr, curr) => arr.concat(curr), []);
            let max = data.map((d) => ySelector(d)).sort((a, b) => a - b).reverse()[0];
            let liveData = mappedData.map((x, i) => i % 2 ? max : x);

            this.mappedData = mappedData;
            this.max = max;
            this.state = {
                data: liveData,
                count: 0
            };
        }

        render() {
            return <WrappedComponent data={this.state.data} />;
        }
    };

    Wrapper.displayName = `AnimationWrapper(${WrappedComponent.displayName | WrappedComponent.name | 'Component'})`;

    return Wrapper;
};
```

Now, we're expecting 3 `props` on the component:

- An array of data
- A function for getting the `x` value from a data item
- A function for getting the `y` value from a data item

We then create a new array that is flattening the data, so it'd look like:

```js
[0, 120, 20, 60]
```

So now we need to prepare for our animation, to achieve this we need to flatten the line we first draw and then we'll walk back up to it. To do this we need to find the largest `y` value, this I'm putting into a variable called `max`.

Finally I need to create that flattened data set, doing is done by taking the array of points and turn all the `y` points to the `max` value (because it's the bottom of the graph we start at, which is the approximately height of the SVG). Now the data that we're rendering to the UI looks like this:

```js
[0, 0, 20, 0]
```

Great, we've got a hidden line graph that doesn't actually represent our data... not really useful.

Time to start building the animation. Like the last post we use `componentDidMount` to start the animation and the `componentWillUnmount` to stop it if needed. Here's the `componentDidMount`:

```js
componentWillMount() {
    const animator = () => {
        if (this.state.count >= this.max) {
            cancelAnimationFrame(this.rafId);
            return;
        }

        const newData = this.state.data.map((data, index) => {
            if (index % 2) {
                if (data > this.mappedData[index]) {
                    return data - 1;
                }
            }
            return data;
        });

        this.setState({ data: newData, count: this.state.count + 1 });
        this.rafId = requestAnimationFrame(animator);
    }

    this.rafId = requestAnimationFrame(animator);
}
```

Let's break it down, or more accurately, break down the `animator` function, which is really what does the animation for us.

First step, the reason we have the `max` on the component is so that we know when to stop trying to animate a point. That's what this logic is for:

```js
if (this.state.count >= this.max) {
    cancelAnimationFrame(this.rafId);
    return;
}
```

Second step, start taking our temporary data a bit closer to the real data:

```js
const newData = this.state.data.map((data, index) => {
    if (index % 2) {
        if (data > this.mappedData[index]) {
            return data - 1;
        }
    }
    return data;
});
```

We're going to map over the data and:

- If the current index is even, an x-axis value, just return it, we're not moving that
- If the current index is odd
  - Is it less than the target value, add 1 to it
  - Otherwise just return the current value

Third step is to put that new array into state (and cause a re-render) as well as increase the loop count, then kick off `requestAnimationFrame` again.

And that's all, we have a lovely animated line cart.

## Conclusion

Again we've seen that a small bit of code and React components can make a very easy to read animated SVG without any external dependencies.

I've created another example [that you can see here]({{< ref "/demos/react-svg/react-svg-line-chart.md" >}}) in action, and the data is randomly generated so reloading the page will get you a new chart each time :smile:.