// Retrive DOM Elements
const wishListSearchBar = document.getElementById("wish-list-search");
const matchList = document.getElementById("match-list");

// Global variable storing the user's wish list information
let wishList = [];

document.addEventListener("DOMContentLoaded", async () => {
    // Retrieve the user's wish list
    const response = await fetch(`/lists/wish-list`);
    const data = await response.json();

    // If no user is logged in no wish list is to be fetched, go home
    if (!data.success) {
        window.location.href = "/";
        return;
    }

    console.table(data.wish_list);
    wishList = data.wish_list;

    const numFilmsInWishList = data.length;
    console.log(`Number of films in wish list: ${numFilmsInWishList}`);

    // Display how many search results were found
    const headerElement = document.createElement("h2");
    headerElement.classList.add("header");
    headerElement.innerHTML = `${numFilmsInWishList} Film(s) in Wish List`;
    main.appendChild(headerElement);

    // Display all movies in the user's wish list
    displayWishList(data.wish_list);
});

const displayWishList = movies => {
    const searchResults = document.createElement("div");
    searchResults.classList.add("search-results");

    movies.forEach((movie) => {
        const { title, year, imdbId, poster } = movie;
        const movieEl = document.createElement("div");
        movieEl.classList.add("movie");

        movieEl.innerHTML = `
            <img src="${poster}" alt="${title}"/>
            <div class="movie-info">
                <h3><a href="/movie/${imdbId}" aria-label="See info for ${title}">${title} (${year})</a></h3>
            </div>
        `;

        searchResults.appendChild(movieEl);
    });

    main.appendChild(searchResults);
};

// search states.json and filter
const searchStates = async (searchText) => {

    // get matches to current text input
    let matches = wishList.filter(state => {
        const regex = new RegExp(`^${searchText}`, "gi");
        return state.title.match(regex);
    });

    if (searchText.trim().length === 0) {
        matches = [];
        matchList.innerHTML = "";
    }

    console.log("Matches");
    console.log(matches);

    outputHtml(matches);
};

const outputHtml = matches => {
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

    console.log(html);

    matchList.innerHTML = html;
};

wishListSearchBar.addEventListener("input", () => searchStates(wishListSearchBar.value));