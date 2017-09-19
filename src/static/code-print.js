(() => {
    'use strict';

    const code = document.querySelector('script[data-preview-code]');

    if (!code) {
        return;
    }

    const codeBlockContainer = document.createElement('pre');
    const codeBlock = document.createElement('code');
    codeBlock.className = 'javascript';
    codeBlock.innerHTML = code.innerHTML.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    codeBlockContainer.appendChild(codeBlock);

    const el = document.getElementsByClassName('entry-content')[0];

    const header = document.createElement('h2');
    header.innerHTML = 'Source';

    el.appendChild(header);
    el.appendChild(codeBlockContainer);
})();