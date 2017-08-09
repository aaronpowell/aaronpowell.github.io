---
title: "React SVG Example"
date: 2017-08-08T15:08:13+10:00
draft: false
hidden: true
---

<div id="svg-demo"></div>

<script src="https://fb.me/react-15.1.0.js"></script>
<script src="https://fb.me/react-dom-15.1.0.js"></script>
<script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>

<script type="text/babel">
(function () {
    'use strict';

    class SvgThing extends React.Component {
        constructor(props) {
            super(props);

            this.state = {
                currentTheta: 0
            };
        }

        componentDidMount() {
            const animate = () => {
                const nextTheta = this.state.currentTheta > this.props.angularLimit ? 0 : this.state.currentTheta + this.props.thetaDelta;

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
                <svg width="800px" height="800px" viewBox="0 0 800 800">
                    <g transform="translate(400, 400)">
                        <rect x="-100" y="-100" width="200" height="200" rx="5" ry="5" 
                                style={{ fill: 'orange', stroke: 'black', 'stroke-width': 3, 'stroke-dasharray': '10, 5' }}
                                transform={`rotate(${this.state.currentTheta})`} />
                        <line x1="-400" y1="0" x2="400" y2="0" style={ { stroke: 'black' } } /> 
                        <line x1="0" y1="-400" x2="0" y2="400" style={ { stroke: 'black' } } /> 
                    </g>
                </svg>
            );
        }
    }

    ReactDOM.render(<SvgThing angularLimit={360} thetaDelta={0.3} />, document.getElementById('svg-demo'));

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