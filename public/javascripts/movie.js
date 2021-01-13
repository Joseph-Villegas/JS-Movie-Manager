document.addEventListener("DOMContentLoaded", async () => {
    const imdbId = document.getElementById("imdbId").textContent;
    console.log(`In movie page, showing info for movie with id ${imdbId}`);

    // Search for film
    const response = await fetch(`/search?id=${imdbId}`);
    const data = await response.json();
    console.log(data);

    if (!data.success || (data.films.Poster == "N/A" || data.films.Type == "game")) window.location.href = "/";

    const { Poster, Title, Year, imdbID } = data.films;

    showMovie(data.films);

    defineListPermissions(imdbId);

    const addToCatalogButton = document.getElementById("a-c");
    addToCatalogButton.addEventListener("click", () => {
        addToList("/lists/add-to-catalog", { title: Title, year: Year, imdbId: imdbID, poster: Poster, copies: 1 });
    });

    const removeFromCatalogButton = document.getElementById("r-c");
    removeFromCatalogButton.addEventListener("click", () => {
        removeFromList("/lists/remove-from-catalog", { imdbId: imdbID });
    });

    const addToWishListButton = document.getElementById("a-w");
    addToWishListButton.addEventListener("click", () => {
        addToList("/lists/add-to-wish-list", { title: Title, year: Year, imdbId: imdbID, poster: Poster });
    });

    const removeFromWishListButton = document.getElementById("r-w");
    removeFromWishListButton.addEventListener("click", () => {
        removeFromList("/lists/remove-from-wish-list", { imdbId: imdbID });
    });
});

/**
 * Defines possible list actions by checking if a movie is in the user's catalog or wish list
 * @param imdbId String
 * @returns void
 */
const defineListPermissions = async (imdbId) => {
    if (!(await checkLoginStatus())) {
        console.log("No user logged in");
        setDisplayOptions(0, 0, 0, 0);
        return;
    }

    console.log("User logged in");

    const getListsResponse = await Promise.all([fetch(`/lists/catalog`), fetch(`/lists/wish-list`)]);
    const lists = await Promise.all([getListsResponse[0].json(), getListsResponse[1].json()]);

    console.log(lists);

    const catalog = lists[0].catalog;
    const wishList = lists[1].wish_list;

    console.log(`# of films in catalog: ${catalog.length}\n# of films in wish list: ${wishList.length}`);

    // Check if this movie is in the user's catalog or wish list
    console.log(`Looking for film with an imdbId of ${imdbId} in the catalog`);
    const inCatalog = catalog.find(movie => movie.imdbId == imdbId) != undefined;
    console.log(`Movie in catalog? ${inCatalog}`);

    console.log(`Looking for film with an imdbId of ${imdbId} in the wish list`);
    const inWishList = wishList.find(movie => movie.imdbId == imdbId) != undefined;
    console.log(`Movie in wish list? ${inWishList}`);

    // If the movie is not in either, display the add to catalog and wish list buttons
    if (!inCatalog && !inWishList) {
        setDisplayOptions(1, 1, 0, 0);
        return;
    }

    // If the movie is in the catalog, only show the remove from catalog button
    if (inCatalog && !inWishList) {
        setDisplayOptions(0, 0, 1, 0);
        return;
    }

    // If the movie is in the wish list, display the add to catalog button and remove from wish list buttons
    if (!inCatalog && inWishList) {
        setDisplayOptions(1, 0, 0, 1);
        return;
    }
};

/**
 * Checks if a user is logged in or not
 * @returns true or false
 */
const checkLoginStatus = async() => {
    const loginResponse = await fetch(`/users`);
    const loginStatus = await loginResponse.json();
    return loginStatus.logged_in;
};

/**
 * Adds a movie to a logged in user's catalog or wish list, then redefines possible list button options
 * @param url String
 * @param movie Object
 * @returns void
 */
const addToList = async (url, movie) => {
    console.log(`Sending info to route: ${url}`);

    setListOptions(true);

    const options = { method: "POST", headers: { "Content-type": "application/json" }, body: JSON.stringify(movie) };

    const response = await fetch(url, options);
    const data = await response.json();

    console.log(data);

    if (!data.success) {
        console.log(`Route - ${url} - could not process data`);
        setListOptions(false);
        return;
    }

    await defineListPermissions(movie.imdbId);
    setListOptions(false);
};

/**
 * Removes a movie from a logged in user's catalog or wish list, then redefines possible list button options
 * @param url String
 * @param movie Object
 * @returns void
 */
const removeFromList = async (url, movie) => {
    console.log(`Sending info for ${movie.imdbId} to endpoint ${url} for removal`);

    setListOptions(true);
    
    const options = { method: "DELETE", headers: { "Content-type": "application/json" }, body: JSON.stringify(movie) };

    const response = await fetch(url, options);
    const data = await response.json();

    console.log(data);

    if (!data.success) {
        console.log(`Could not remove ${movie.imdbId} using endpoint ${url}`);
        setListOptions(false);
        return;
    }

    await defineListPermissions(movie.imdbId);
    setListOptions(false);
};

/**
 * Decides whether or not to disable list buttons
 * @param selection true or false
 * @returns void
 */
const setListOptions = (selection) => { 
    document.getElementById("a-c").disabled = selection;
    document.getElementById("a-w").disabled = selection;
    document.getElementById("r-c").disabled = selection;
    document.getElementById("r-w").disabled = selection;
};

/**
 * Appends html containing movie info to movie.hbs
 * @param movie Object
 * @returns void
 */
const showMovie = (movie) => {
    const { Actors, Director, Genre, Plot, Poster, Rated, Released, Title, Writer, imdbRating } = movie;

    const poster = document.getElementById("movie-poster");
    poster.innerHTML = `<img src=${Poster} alt=${Title}>`;

    const stats = document.getElementById("movie-stats");
    stats.innerHTML = `
        <h2>${Title}</h2>
        <ul class="list-group">
            <li class="list-group-item"><strong>Genre:</strong> ${Genre}</li>
            <li class="list-group-item"><strong>Released:</strong> ${Released}</li>
            <li class="list-group-item"><strong>Rated:</strong> ${Rated}</li>
            <li class="list-group-item"><strong>IMDB Rating:</strong> ${imdbRating}/10</li>
            <li class="list-group-item"><strong>Director:</strong> ${Director}</li>
            <li class="list-group-item"><strong>Writer(s):</strong> ${Writer}</li>
            <li class="list-group-item"><strong>Actors:</strong> ${Actors}</li>
        </ul>
    `;
     
    const plot = document.getElementById("movie-plot");
    plot.innerHTML = `
        <h3>Plot</h3>
        ${Plot}
        <hr style="color:white;">
        <a href="http://imdb.com/title/${imdbId}" target="_blank" class="btn btn-primary">View on IMDB</a>
    `;

    return
};

/**
 * Sets status of list buttons to inline-block or none
 * @param ac 0 or 1, decides whether or not to show a button
 * @param aw 0 or 1, decides whether or not to show a button
 * @param rc 0 or 1, decides whether or not to show a button
 * @param rw 0 or 1, decides whether or not to show a button
 * @returns void
 */
const setDisplayOptions = (ac, aw, rc, rw) => {
    // 0 => false hide , 1 => true show
    document.getElementById("a-c").style.display = ac == 1 ? 'inline-block' : 'none';
    document.getElementById("a-w").style.display = aw == 1 ? 'inline-block' : 'none';
    document.getElementById("r-c").style.display = rc == 1 ? 'inline-block' : 'none';
    document.getElementById("r-w").style.display = rw == 1 ? 'inline-block' : 'none';
};