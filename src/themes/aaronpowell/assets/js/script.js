document.addEventListener("DOMContentLoaded", function () {
    function setupDynamicCodeBlock() {
        const code = document.querySelector("script[data-preview-code]");

        if (!code) {
            return;
        }

        const codeBlockContainer = document.createElement("pre");
        const codeBlock = document.createElement("code");
        codeBlock.classList.add("javascript");
        codeBlock.innerHTML = code.innerHTML
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        codeBlockContainer.appendChild(codeBlock);

        const header = document.createElement("h2");
        header.innerHTML = "Source";

        code.parentElement.appendChild(header);
        code.parentElement.appendChild(codeBlockContainer);
    }

    function setupToggleHeader() {
        const header = document.querySelector(".site-header");
        const toggle = header?.querySelector(".nav__toggle");
        const navList = header?.querySelector(".nav__list");

        if (!header || !toggle || !navList) {
            return;
        }

        const closeMenu = () => {
            header.classList.remove("is-open");
            toggle.setAttribute("aria-expanded", "false");
        };

        toggle.addEventListener("click", (event) => {
            event.preventDefault();
            const isOpen = header.classList.toggle("is-open");
            toggle.setAttribute("aria-expanded", String(isOpen));
            if (isOpen) {
                navList.querySelector("a")?.focus();
            }
        });

        navList.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => {
                closeMenu();
            });
        });

        window.matchMedia("(min-width: 992px)").addEventListener("change", () => {
            closeMenu();
        });
    }

    function addCopyToCodeBlocks() {
        document
            .querySelectorAll("pre > code[class^='language']")
            .forEach(function (codeBlock) {
                let button = document.createElement("button");
                button.className = "copy code";
                button.type = "button";
                button.innerText = "✂";

                if (!codeBlock.id) {
                    codeBlock.id = `code-${Math.random()
                        .toString()
                        .replace(".", "")}`;
                }
                button.setAttribute("data-target", `#${codeBlock.id}`);

                const copied = document.createElement("span");
                copied.classList.add("copied");
                copied.innerHTML = "✔";

                const pre = codeBlock.parentNode;
                if (pre.parentNode.classList.contains("highlight")) {
                    const highlight = pre.parentNode;
                    highlight.parentNode.insertBefore(button, highlight);
                    highlight.parentNode.insertBefore(copied, highlight);
                } else {
                    pre.parentNode.insertBefore(button, pre);
                    pre.parentNode.insertBefore(copied, pre);
                }
            });
    }

    function setupCopyBlock() {
        const copy = document.querySelectorAll(".copy");
        const handleCopy = async (e) => {
            const item = e.target;
            const target = document.querySelector(item.dataset["target"]);
            await window.navigator.clipboard.writeText(
                target.innerText.replace("\n\n", "\n")
            );
            const copied = item.parentElement.querySelector(".copied");
            copied.style.display = "inline";
            setTimeout(() => {
                copied.style.display = "none";
            }, 1000);
        };

        for (const item of copy) {
            item.addEventListener("click", handleCopy);
        }
    }

    setupDynamicCodeBlock();
    setupToggleHeader();
    addCopyToCodeBlocks();
    setupCopyBlock();

    const upcoming = document.querySelector(".toggle-upcoming");
    if (upcoming) {
        upcoming.addEventListener("click", (e) => {
            const sib = e.target.nextElementSibling;

            const display = window
                .getComputedStyle(sib)
                .getPropertyValue("display");

            if (display === "none") {
                sib.style.display = "block";
            } else {
                sib.style.display = "none";
            }
        });
    }
});
