document.addEventListener("DOMContentLoaded", async () => {
    // Retrieve the user's catalog
    const response = await fetch(`/lists/catalog`);
    const data = await response.json();
    console.table(data.catalog);

    // If no user is logged in no catalog is to be fetched, go home
    if (!data.success) {
        window.location.href = "/";
        return;
    }

    const numFilmsInCatalog = data.length;
    console.log(`Number of films in catalog: ${numFilmsInCatalog}`);

    const headerElement = document.createElement("h2");
    headerElement.classList.add("header");
    headerElement.innerHTML = `${numFilmsInCatalog} Films in Catalog`;
    main.appendChild(headerElement);
});
