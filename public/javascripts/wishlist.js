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
