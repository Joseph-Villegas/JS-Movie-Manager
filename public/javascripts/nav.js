// Retrieve DOM Elements

// Nav Bar Icons
const menuIcon = document.querySelector(".menu-icon span");
const searchIcon = document.querySelector(".search-icon");
const cancelIcon = document.querySelector(".cancel-icon");

// Nav Bar Page Options
const items = document.querySelector(".nav-items");

// Nav Bar Search Form
const form = document.querySelector(".search-form");

// Event Listeners

// The menu icon is a product of responsive design
// Update the look of the nav bar when shown
menuIcon.addEventListener("click", () => {
    items.classList.add("active");
    menuIcon.classList.add("hide");
    searchIcon.classList.add("hide");
    cancelIcon.classList.add("show");
});

// The cancel icon is a product of responsive design
// Update the look of the nav bar when shown
cancelIcon.addEventListener("click", () => {
    items.classList.remove("active");
    menuIcon.classList.remove("hide");
    searchIcon.classList.remove("hide");
    cancelIcon.classList.remove("show");
    form.classList.remove("active");
    cancelIcon.style.color = "#ff3d00";
});

// The search icon is a product of responsive design
// Update the look of the nav bar when shown
searchIcon.addEventListener("click", () => {
    form.classList.add("active");
    searchIcon.classList.add("hide");
    cancelIcon.classList.add("show");
});