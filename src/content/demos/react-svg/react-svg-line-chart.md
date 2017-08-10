---
title: "React SVG line chart"
date: 2017-08-09T15:08:13+10:00
draft: false
hidden: true
---

<style>
    .chart svg {
        background: white;
        width: 500px;
        height: 100px;
        border-left: 1px dotted #555;
        border-bottom: 1px dotted #555;
        padding: 20px 20px 20px 0;
        -webkit-box-sizing: unset;
        box-sizing: unset;
    }
</style>

<div id="svg-demo" class="chart"></div>

<script src="https://fb.me/react-15.1.0.js"></script>
<script src="https://fb.me/react-dom-15.1.0.js"></script>
<script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>

<script type="text/babel">
(function () {
    'use strict';

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

            componentWillUnmount() {
                cancelAnimationFrame(this.rafId);
            }

            render() {
                return <WrappedComponent data={this.state.data} />;
            }
        }

        Wrapper.displayName = `AnimationWrapper(${WrappedComponent.displayName | WrappedComponent.name | 'Component'})`;

        return Wrapper;
    };

    const Line = ({ data }) => (
        <polyline
            fill="none"
            stroke="#0074d9"
            strokeWidth="2"
            points={data}
            />
    );

    const AnimatedLine = animateLine(Line);

    const SvgThing = ({ data }) => (
        <svg viewBox="0 0 500 100">
            <AnimatedLine
                data={data}
                xSelector={(d) => d.x}
                ySelector={(d) => d.y} />
        </svg>
    );

    let randomChartData = [];

    for (let i = 0; i < 46; i++) {
        randomChartData.push({ y: Math.floor(120 - Math.random() * (120 - 0)), x: i * 20 });
    }

    ReactDOM.render(<SvgThing data={randomChartData} />, document.getElementById('svg-demo'));

})();
</script>

## Source

<pre>
    <code id="code-block" class="javascript"></code>
</pre>

<script>
(function () {
    'use strict';

    const code = document.querySelector('script[type="text/babel"]');
    const codeBlock = document.getElementById('code-block');

    codeBlock.innerHTML = code.innerHTML.replace(/</g, '&lt;').replace(/>/g, '&gt;');
})();
</script>