document.addEventListener("DOMContentLoaded", async () => {
    // Retrieve the user's catalog
    const response = await fetch(`/lists/catalog`);
    const data = await response.json();

    // If no user is logged in no catalog is to be fetched, go home
    if (!data.success) {
        window.location.href = "/";
        return;
    }

    console.table(data.catalog);

    const numFilmsInCatalog = data.length;
    console.log(`Number of films in catalog: ${numFilmsInCatalog}`);

    // Display how many search results were found
    const headerElement = document.createElement("h2");
    headerElement.classList.add("header");
    headerElement.innerHTML = `${numFilmsInCatalog} Film(s) in Catalog`;
    main.appendChild(headerElement);

    // Display all movies in the user's catalog
    displayCatalog(data.catalog);
});

const displayCatalog = movies => {
    const searchResults = document.createElement("div");
    searchResults.classList.add("search-results");

    movies.forEach((movie) => {
        const { title, year, imdbId, poster, copies } = movie;
        const movieEl = document.createElement("div");
        movieEl.classList.add("movie");

        movieEl.innerHTML = `
            <img src="${poster}" alt="${title}"/>
            <div class="movie-info">
                <h3><a href="/movie/${imdbId}" aria-label="See info for ${title}">${title} (${year})</a></h3>
                <span>x${copies}</span>
            </div>
        `;

        searchResults.appendChild(movieEl);
    });

    main.appendChild(searchResults);
};
