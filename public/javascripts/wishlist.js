document.addEventListener("DOMContentLoaded", async () => {
    // Retrieve the user's wish list
    const response = await fetch(`/lists/wish-list`);
    const data = await response.json();

    // If a wish list could not be fetched then there is not a user logged in so go home
    if (!data.success) window.location.href = "/";
    
    // Display how many search results were found
    document.getElementById("results-count").innerHTML = `${data.length} Film(s) in Wish List`;

    const wishList = data.wish_list;

     // Display all movies in the user's wish list using pagination
     buildPage(wishList, 1, 5);

     const wishListSearchBar = document.getElementById("wish-list-search");
     wishListSearchBar.addEventListener("input", () => {
         const matches = findMatches(wishList, wishListSearchBar.value);
         showMatches(matches);
     });
});

// ---------- Auto Gen Match Functions ---------- //

/**
 * Checks for a match between a movie title and search input
 * @param wishList list of movie objects
 * @param searchText string
 * @returns list of matches
 */
const findMatches = (wishList, searchText) => {
    if (searchText.trim().length === 0) return [];

    return wishList.filter(movie => {
        const regex = new RegExp(`^${searchText}`, "gi");
        return movie.title.match(regex);
    });
};

/**
 * Dynamically add HTML elements containing movie info under the wish list search bar
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
            <h4><a href="/movie/${match.imdbId}">${match.title}</a> (${match.year})</h4>
            <small>IMDb ID: ${match.imdbId}</small>
        </div>
        `
    ).join("");

    matchList.innerHTML = html;
};

// ---------- Pagination Functions ---------- //

/**
 * Selects a section of a wish list given a page number and the max number of possible pages
 * @param wishList list of movie objects
 * @param page determines where the selection is made
 * @param rows number of movies per page
 * @returns object containg a sub-select of the wish list and the max number of possible pages
 */
const pagination = (wishList, page, rows) => {
    const trimStart = (page - 1) * rows;
    const trimEnd = trimStart + rows;

    const trimmedData = wishList.slice(trimStart, trimEnd);

    const pages = Math.ceil(wishList.length / rows);

    return { wishList: trimmedData, pages: pages };
};

/**
 * Determines and displays page buttons
 * @param wishList list of movie objects
 * @param currentPage what value was made to make the sub-select
 * @param pages number of possible pages
 * @returns void
 */
const pageButtons = (wishList, currentPage, pages) => {
    const wrapper = document.getElementById('pagination-wrapper');
    wrapper.innerHTML = "";

    const window = 5; // Max # of btns in window

    let maxLeft = (currentPage - Math.floor(window / 2));
    let maxRight = (currentPage + Math.floor(window / 2));

    if (maxLeft < 1) {
        maxLeft = 1;
        maxRight = window;
    }

    if (maxRight > pages) {
        maxLeft = pages - (window - 1);
        
        if (maxLeft < 1){
            maxLeft = 1;
        }
        maxRight = pages;
    }

    for (let page = maxLeft; page <= maxRight; page++) {
        wrapper.innerHTML += `<button value=${page} class="page btn btn-sm btn-info">${page}</button>`;
    }

    if (currentPage != 1) {
        wrapper.innerHTML = `<button value=${1} class="page btn btn-sm btn-info">&#171; First</button>` + wrapper.innerHTML;
    }

    if (currentPage != pages) {
        wrapper.innerHTML += `<button value=${pages} class="page btn btn-sm btn-info">Last &#187;</button>`;
    }

    const divs = document.querySelectorAll('.page');
    divs.forEach(element => element.addEventListener('click', event => {
        let page = Number(event.target.getAttribute("value"));
        buildPage(wishList, page, 5);
    }));
};

/**
 * Displays the wish list using pagination
 * @param wishList list of movie objects
 * @param page determines where the selection is made
 * @param rows number of movies per page
 * @returns void
 */
const buildPage = (wishList, page, rows) => {
    const wishListDisplay = document.querySelector(".search-results");

    // Clear the previous page's results
    wishListDisplay.innerHTML = "";

    // Collect movies to display for a specific page and determine pagination buttons
    const { wishList: movies, pages } = pagination(wishList, page, rows);

    for (var i = 1 in movies) {
        const { title, year, imdbId, poster } = movies[i];

        const movie = document.createElement("div");
        movie.classList.add("movie");

        movie.innerHTML = `
            <img src="${poster}" alt="${title}"/>
            <div class="movie-info">
                <h3><a href="/movie/${imdbId}" aria-label="See info for ${title}">${title} (${year})</a></h3>
            </div>
        `;

        wishListDisplay.appendChild(movie);
    }

    pageButtons(wishList, page, pages);
};