document.addEventListener("DOMContentLoaded", event => {
       document.getElementById("search-data").focus();
});

const searchForm = document.getElementById("search-form");
searchForm.addEventListener("submit", async event => {
	// Keep form data from reaching server before being validated
    event.preventDefault();

    // Clear main to display search results
    main.innerHTML = "";

    const rawInput = document.getElementById("search-data").value.trim();

    // Validate input length
    if (!rawInput.length) {
        setHeader("Invalid Search Term");
        return;
    }

    // Prepare title for URL integration
    const regex = /[ ]{2,}/gi;
    const title = rawInput.replaceAll(regex, " ");

    const rawURL = `/search?title=${title}`;
    const url = encodeURI(rawURL);

    // Search for film
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);

    // If a movie was not found display the message sent by the server
    if (!data.success) {
        setHeader(data.msg);
        return;
    }

    // Display the search results
    const count = countValidResults(data.films.Search);
    console.table(data.films.Search);
    setHeader(`Showing ${count} Results`);
    showResults(data.films.Search);
});

const setHeader = msg => {
    const headerElement = document.createElement("h2");
    headerElement.classList.add("header");
    headerElement.innerHTML = `${msg}`;
    main.appendChild(headerElement);

    return;
};

const showResults = movies => {
    console.table(movies);
    const searchResults = document.createElement("div");
    searchResults.classList.add("search-results");

    movies.forEach((movie) => {
        const { Poster, Title, imdbID, Type } = movie;

        if (Poster != "N/A" && (Type == "movie" || Type == "series")) {
            const movieEl = document.createElement("div");
            movieEl.classList.add("movie");

            movieEl.innerHTML = `
                <img src="${Poster}" alt="${Title}"/>
                <div class="movie-info">
                    <h3><a href="/movie/${imdbID}" aria-label="See info for ${Title}">${Title}</a></h3>
                </div>
            `;

            searchResults.appendChild(movieEl);
        }
    });

    main.appendChild(searchResults);
};

const countValidResults = movies => {
    let validResults = 0;
    movies.forEach(movie => {
        if (movie.Poster != "N/A" && (movie.Type == "movie" || movie.Type == "series")) {
            validResults++;
        }
    });

    return validResults;
};