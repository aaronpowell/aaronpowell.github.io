(async () => {
    const createScript = url => {
        return new Promise(resolve => {
            let script = document.createElement("script");
            script.src = url;
            document.head.append(script);
            script.addEventListener("load", resolve);
        });
    };

    await createScript("/highlightjs/highlight.pack.js");
    hljs.COMMENT = hljs.C;
    await createScript(
        "https://unpkg.com/highlightjs-cshtml-razor@1.0.0/cshtml-razor.js"
    );

    hljs.registerLanguage("cshtml-razor", window.hljsDefineCshtmlRazor);
})();
