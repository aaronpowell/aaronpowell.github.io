---
title: "What Key"
date: 2017-08-30T15:15:13+10:00
draft: false
hidden: true
layout: simple
---

What was the key code in JavaScript for that key you just pressed?

<style>
.key {
    font-size: 40px;
    height: 50px;
    text-shadow: #CCC 2px 2px 2px;
}
</style>

# `keydown` [reference](https://developer.mozilla.org/en-US/docs/Web/Events/keydown)

<div id="kc-keydown" class="key"></div>

# `keypress` [reference](https://developer.mozilla.org/en-US/docs/Web/Events/keypress)

<div id="kc-keypress" class="key"></div>

# `keyup` [reference](https://developer.mozilla.org/en-US/docs/Web/Events/keyup)

<div id="kc-keyup" class="key"></div>

<script>
(() => {
    'use strict';

    const keypress = document.getElementById('kc-keypress');
    const keydown = document.getElementById('kc-keydown');
    const keyup = document.getElementById('kc-keyup');

    let handler = (el, x) => (e) => {
        console.log(x);
        el.innerHTML = e.keyCode === 0 ? e.which : e.keyCode;
    };

    document.addEventListener('keypress', handler(keypress, 'keypress'));
    document.addEventListener('keydown', handler(keydown, 'keydown'));
    document.addEventListener('keyup', handler(keyup, 'keyup'));
})();
</script>