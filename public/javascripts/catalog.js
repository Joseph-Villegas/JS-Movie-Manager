// Global variable storing the user's catalog information
let state;

document.addEventListener("DOMContentLoaded", async () => {
    // Retrieve the user's catalog
    const response = await fetch(`/lists/catalog`);
    const data = await response.json();

    // If a catalog could not be fetched then there is not a user logged in so go home
    if (!data.success) window.location.href = "/";
    
    // Display how many search results were found
    document.getElementById("results-count").innerHTML = `${data.length} Film(s) in Catalog`;

    const catalog = data.catalog;
    console.table(catalog);

    state = {
        catalog: catalog, // data to show on page
        page: 1,          // what page to display
        rows: 5,          // how many rows to display per page
        window: 5,        // how many page options to show on screen
    };

    // Display all movies in the user's catalog using pagination
    buildTable();

    const catalogSearchBar = document.getElementById("catalog-search");
    catalogSearchBar.addEventListener("input", () => {
        const matches = findMatches(catalog, catalogSearchBar.value);
        showMatches(matches);
    });
});

/**
 * Checks for a match between a movie title and search input
 * @param catalog list of movie objects
 * @param searchText string
 * @returns list of matches
 */
const findMatches = (catalog, searchText) => {
    if (searchText.trim().length === 0) return [];

    return catalog.filter(movie => {
        const regex = new RegExp(`^${searchText}`, "gi");
        return movie.title.match(regex);
    });
};

/**
 * Dynamically add HTML elements containing movie info under the catalog search bar
 * @param matches list of movie objects
 * @returns void
 */
const showMatches = (matches) => {
    const matchList = document.getElementById("match-list");

    if (!matches.length) {
        matchList.innerHTML = "";
        return;
    }

    const html = matches.map(match =>
        `
        <div class="card card-body mb-1">
            <h4><a href="/movie/${match.imdbId}">${match.title}</a> (${match.year}) <span class="text-primary">x${match.copies}</span></h4>
            <small>IMDb ID: ${match.imdbId}</small>
        </div>
        `
    ).join("");

    matchList.innerHTML = html;
};

// ---------- Pagination Functions ---------- //

const pagination = (catalog, page, rows) => {
    // Calculate the left and right bounds of the catalog to
    // display and how many pages are to be accessable at once
    var trimStart = (page - 1) * rows;
    var trimEnd = trimStart + rows;

    var trimmedData = catalog.slice(trimStart, trimEnd);

    var pages = Math.ceil(catalog.length / rows);

    return { catalog: trimmedData, pages: pages };
};

function pageButtons(pages) {
    var wrapper = document.getElementById('pagination-wrapper')

    wrapper.innerHTML = ``
    console.log('Pages:', pages)

    var maxLeft = (state.page - Math.floor(state.window / 2))
    var maxRight = (state.page + Math.floor(state.window / 2))

    if (maxLeft < 1) {
        maxLeft = 1
        maxRight = state.window
    }

    if (maxRight > pages) {
        maxLeft = pages - (state.window - 1)
        
        if (maxLeft < 1){
            maxLeft = 1
        }
        maxRight = pages
    }



    for (var page = maxLeft; page <= maxRight; page++) {
        wrapper.innerHTML += `<button value=${page} class="page btn btn-sm btn-info">${page}</button>`
    }

    if (state.page != 1) {
        wrapper.innerHTML = `<button value=${1} class="page btn btn-sm btn-info">&#171; First</button>` + wrapper.innerHTML
    }

    if (state.page != pages) {
        wrapper.innerHTML += `<button value=${pages} class="page btn btn-sm btn-info">Last &#187;</button>`
    }

    const divs = document.querySelectorAll('.page');

    divs.forEach(el => el.addEventListener('click', event => {
        console.log(event.target.getAttribute("value"));
        state.page = Number(event.target.getAttribute("value"))
        buildTable()
    }));

}


function buildTable() {
    const page = document.querySelector(".search-results");

    // Clear the previous page's results
    page.innerHTML = "";

    var data = pagination(state.catalog, state.page, state.rows)
    var catalog = data.catalog

    for (var i = 1 in catalog) {
        const { title, year, imdbId, poster, copies } = catalog[i];
        const movieEl = document.createElement("div");
        movieEl.classList.add("movie");

        movieEl.innerHTML = `
            <img src="${poster}" alt="${title}"/>
            <div class="movie-info">
                <h3><a href="/movie/${imdbId}" aria-label="See info for ${title}">${title} (${year})</a></h3>
                <span>x${copies}</span>
            </div>
        `;

        page.appendChild(movieEl);
    }

    pageButtons(data.pages)
}

