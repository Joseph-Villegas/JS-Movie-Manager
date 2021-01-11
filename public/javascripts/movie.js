document.addEventListener("DOMContentLoaded", async () => {
    const imdbId = document.getElementById("imdbId").textContent;
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
            <a href="http://imdb.com/title/${imdbId}" target="_blank" class="btn btn-primary">View IMDB</a>
            <a href="/" class="btn btn-primary">Go Back To Home</a>
        </div>
    </div>
    `;

    movie.innerHTML = output;

});

