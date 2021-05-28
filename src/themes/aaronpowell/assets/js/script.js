document.addEventListener("DOMContentLoaded", function() {
    const toggle = document.querySelector("header .toggle");
    toggle.addEventListener("click", function(e) {
        e.preventDefault();
        toggle.parentElement.classList.toggle("active");

        const i = toggle.querySelector("i");
        i.classList.toggle("ion-md-menu");
        i.classList.toggle("ion-md-close");
    });

    const copy = document.querySelectorAll(".copy");
    const handleCopy = async e => {
        const item = e.target;
        const target = document.querySelector(item.dataset["target"]);
        await window.navigator.clipboard.writeText(target.innerHTML);
        const copied = item.parentElement.querySelector(".copied");
        copied.style.display = "inline";
        setTimeout(() => {
            copied.style.display = "none";
        }, 1000);
    };

    for (const item of copy) {
        item.addEventListener("click", handleCopy);
    }

    const upcoming = document.querySelector(".toggle-upcoming");
    if (upcoming) {
        upcoming.addEventListener("click", e => {
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
