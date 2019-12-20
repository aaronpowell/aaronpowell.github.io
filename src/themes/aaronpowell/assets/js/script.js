document.addEventListener("DOMContentLoaded", function() {
    var toggle = document.querySelector("header .toggle");
    toggle.addEventListener("click", function(e) {
        e.preventDefault();
        toggle.parentElement.classList.toggle("active");

        var i = toggle.querySelector("i");
        i.classList.toggle("ion-md-menu");
        i.classList.toggle("ion-md-close");
    });
});
