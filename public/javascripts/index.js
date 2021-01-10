/* Filename: public/javascripts/index.js
 * Abstract: This script contains functions
 *           specifically related to the page index.hbs
 */

// Retrieve and display this weeks DVD releases
const getNewReleases = async () => {
    document.getElementById("search-data").focus();

    const response = await fetch("/search/new-releases");
    const data = await response.json();
    console.log(`New DVD releases for the week of ${data.weekOf}`);
    console.table(data.releases);
    showMovies(data.releases);
};

document.addEventListener("DOMContentLoaded", getNewReleases);

function showMovies(movies) {
    // clear main
    main.innerHTML = "";

    const headerElement = document.createElement("h2");
    headerElement.classList.add("header");
    headerElement.innerHTML = `New This Week`;
    main.appendChild(headerElement);

    const searchResults = document.createElement("div");
    searchResults.classList.add("search-results");

    movies.forEach((movie) => {
        const { poster, title } = movie;

        const movieEl = document.createElement("div");
        movieEl.classList.add("movie");

        movieEl.innerHTML = `
            <img src="${poster}" alt="${title}"/>
            <div class="movie-info">
                <h3><a href="#" aria-label="See info for ${title}">${title}</a></h3>
            </div>
        `;

        searchResults.appendChild(movieEl);
    });

    main.appendChild(searchResults);
}

