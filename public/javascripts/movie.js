const imdbId = document.getElementById("imdbId").textContent;

document.addEventListener("DOMContentLoaded", async () => {
    console.log(`In movie page, showing infor for movie with id ${imdbId}`);

    const rawURL = `/search?id=${imdbId}`;
    const url = encodeURI(rawURL);

    // Search for film
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);

    if (!data.success) {
        console.log("No movie found with matching ID");
        return;
    }

    const { Actors, Director, Genre, Plot, Poster, Rated, Released, Title, Type, Writer, imdbRating } = data.films;

    if (Poster == "N/A" || Type == "game") {
        console.log("Invalid or missing attr.");
        return;
    }
    
    const container = document.createElement("div");
    container.classList.add("container-fluid");

    const movie = document.createElement("div");
    movie.setAttribute("id", "movie");

    container.appendChild(movie);
    
    main.appendChild(container);

    let output =`
    <div class="row">
        <div class= "col-md-4">
            <img src=${Poster} alt=${Title}>
        </div>
        <div class="col-md-8">
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
        </div>
    </div>
    <div class="row">
        <div class="col-md-12">
            <h3>Plot</h3>
            ${Plot}
            <hr style="color:white;">
            <a href="http://imdb.com/title/${imdbId}" target="_blank" class="btn btn-primary">View on IMDB</a>
            <button type="button" id="a-c" class="btn btn-success">Add to Catalog</button>
            <button type="button" id="a-w" class="btn btn-success">Add to Wish List</button>
            <button type="button" id="r-c" class="btn btn-danger">Remove from Catalog</button>
            <button type="button" id="r-w" class="btn btn-danger">Remove from WishList</button>
        </div>
    </div>
    `;

    movie.innerHTML = output;

    defineListPermissions();
});

// Define list permissions
const defineListPermissions = async () => {
    const addToCatalog = document.getElementById("a-c");
    const addToWishList = document.getElementById("a-w");

    const removeFromCatalog = document.getElementById("r-c");
    const removeFromWishList = document.getElementById("r-w");

    if (!(await checkLoginStatus())) {
        console.log("No user logged in");
        addToCatalog.style.display = 'none';
        addToWishList.style.display = 'none';
        removeFromCatalog.style.display = 'none';
        removeFromWishList.style.display = 'none';
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
        addToCatalog.style.display = 'inline-block';
        addToWishList.style.display = 'inline-block';
        removeFromCatalog.style.display = 'none';
        removeFromWishList.style.display = 'none';
        return;
    }

    // If the movie is in the catalog, only show the remove from catalog button
    if (inCatalog && !inWishList) {
        addToCatalog.style.display = 'none';
        addToWishList.style.display = 'none';
        removeFromCatalog.style.display = 'inline-block';
        removeFromWishList.style.display = 'none';
        return;
    }

    // If the movie is in the wish list, display the add to catalog button and remove from wish list buttons
    if (!inCatalog && inWishList) {
        addToCatalog.style.display = 'inline-block';
        addToWishList.style.display = 'none';
        removeFromCatalog.style.display = 'none';
        removeFromWishList.style.display = 'inline-block';
        return;
    }
};

const checkLoginStatus = async() => {
    const loginResponse = await fetch(`/users`);
    const loginStatus = await loginResponse.json();
    return loginStatus.logged_in;
};

// The array find method returns the first object from the array 
// that by the conditional statement evaluates to true
const foundItem = items.find((item) => {
    return item.name === "Book";
});