const mobileMenuButton =
    document.getElementById("mobileMenuButton");

const mobileMenu =
    document.getElementById("mobileMenu");


mobileMenuButton.addEventListener("click", () => {

    const isOpen =
        mobileMenu.classList.toggle("active");


    mobileMenuButton.setAttribute(
        "aria-expanded",
        isOpen
    );


    mobileMenuButton.textContent =
        isOpen ? "✕" : "☰";
});


const mobileMenuLinks =
    mobileMenu.querySelectorAll("a");


mobileMenuLinks.forEach((link) => {

    link.addEventListener("click", () => {

        mobileMenu.classList.remove("active");

        mobileMenuButton.setAttribute(
            "aria-expanded",
            "false"
        );

        mobileMenuButton.textContent = "☰";
    });

});