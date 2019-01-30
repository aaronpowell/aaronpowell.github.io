+++
title = "React SVG Animations"
date = 2017-08-08T20:58:32+10:00
description = ""
draft = false
tags = ["react", "svg"]
+++

I've been working on a project recently that we've using React for the UI component of it. While starting planning out the next phase of the project we looked at a requirement around doing charting. Now it's been a while since I've done charting in JavaScript, let alone charting with React, so I did what everyone does these days and shouted out on the twittersphere to get input.

Joke replies aside there was the suggestion that, if I'm using React, to just do raw SVG and add a touch of [d3](https://d3js.org/) to animate if required.

Well that's an approach I'd never thought of, but pondering it a bit, it made a lot of sense. If you look at charting libraries what are they doing? Providing you helper methods to build SVG elements and adding them to the DOM. And what does React do? Creates a virtual DOM which is then rendered to the browser in the _real_ DOM. So using an external library what you find is that you're creating elements that lives outside the virtual DOM and as a result can cause issues for React.

That was all a few weeks ago and while the idea seemed sound I didn't need to investigate it much further, at least not until earlier this week when charting + React came up again in conversation. So I decided to have a bit of a play around with it and see how it'd work.

## Basic React + SVG

Honestly drawing SVG's in React isn't really that different to doing any other kind of DOM elements, it's as simple as this:

```js
const Svg = () => (
  <svg height="100" width="100">
    <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
  </svg>
);

ReactDOM.render(<Svg />, document.getElementById('main'));
```

Ta-da!

## React + SVG + animations

Ok, so that wasn't a particularly hard ey? Well how if we want to add animations? I grabbed an example off [MSDN (example #2)](https://msdn.microsoft.com/en-us/library/gg193979(v=vs.85).aspx#example2) to use as my demo.

I created a demo [that can be found here]({{< ref "/demos/react-svg/react-svg-example.md" >}}). Comparing that to the original example code it's a lot cleaner as we no longer need to dive into the DOM ourselves, by using `setState` it's quite easy to set the `transform` attribute.

Now we're using `requestAnimationFrame` to do the animation (which in turn calls `setState`) which we can use the `componentDidMount` to start and `componentWillUnmount` to stop it.

## Adding HOC

So we've got a downside, we're combining our state in with our application code, so what if we wanted to go down the path of using a [Higher Order Component](https://facebook.github.io/react/docs/higher-order-components.html) to wrap up the particular transformation that we're applying to SVG elements.

Let's create a HOC like so:

```js
const rotate = (Component, { angularLimit, thetaDelta }) => {
    class Rotation extends React.Component {
        constructor(props) {
            super(props);

            this.state = {
                currentTheta: 0
            };
        }

        componentDidMount() {
            const animate = () => {
                const nextTheta = this.state.currentTheta > angularLimit ? 0 : this.state.currentTheta + thetaDelta;

                this.setState({ currentTheta: nextTheta });
                this.rafId = requestAnimationFrame(animate);
            };

            this.rafId = requestAnimationFrame(animate);
        }

        componentWillUnmount() {
            cancelAnimationFrame(this.rafId);
        }
        render() {
            return (
                <g transform={`rotate(${this.state.currentTheta})`}>
                    <Component {...this.props} />
                </g>
            );
        }
    }

    Rotation.displayName = `RotatingComponent(${getDisplayName(Component)})`;

    return Rotation;
};
```

Basically we've moved the logic for playing with `requestAnimationFrame` up into it, making it really easy to rotate a lot of different SVG elements. Also instead of applying the `transform` to the `rect` element itself we apply it to a wrapping `<g>` element.

I've created a [second example]({{< ref "/demos/react-svg/react-svg-example-hoc.md" >}}) to show how this works too.

## Conclusion

Ultimately I thought this was going to be a lot harder than it turned out to be! If you spend a bit of time aiming to understand how SVG works directly rather than relying on abstraction layers we can quickly make a React application that uses inline SVG + animation.

Now back on the original topic of charting? Well that really just comes down to using array methods to go over a dataset, create the appropriate SVG elements and apply attributes to them, so I don't see it being much more than taking this simple example and expanding on it.