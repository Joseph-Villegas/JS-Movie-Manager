/* Filename: public/javascripts/index.js
 * Abstract: This script contains functions
 *           specifically related to the page index.hbs
 */

// Retrieve and display this weeks DVD releases
const getNewReleases = async () => {
    const response = await fetch("/search/new-releases");
    const releases = await response.json();
    showMovies(releases);
};

document.addEventListener("DOMContentLoaded", getNewReleases);

const groupBy = key => array =>
  array.reduce((objectsByKeyValue, obj) => {
    const value = obj[key];
    objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
    return objectsByKeyValue;
  }, {});

const showMovies = movies => {
    // clear main
    main.innerHTML = "";

    // Group movies by their week attribute
    const weeklyReleases = groupBy('week')(movies);

    for (const week in weeklyReleases) {
        // Set each release date as a header
        const headerElement = document.createElement("h2");
        headerElement.classList.add("header");
        headerElement.innerHTML = week;
        main.appendChild(headerElement);
    
        // Create a container to hold movies by week
        const searchResults = document.createElement("div");
        searchResults.classList.add("search-results");

        // Fill container with movies for that week
        weeklyReleases[week].forEach((movie) => {
            const { poster, title, imdbId } = movie;

            const movieEl = document.createElement("div");
            movieEl.classList.add("movie");

            movieEl.innerHTML = `
                <img src="${poster}" alt="${title}"/>
                <div class="movie-info">
                    <h3><a href="/movie/${imdbId}" aria-label="See info for ${title}">${title}</a></h3>
                </div>
            `;

            searchResults.appendChild(movieEl);
        });

        main.appendChild(searchResults);
    }
};