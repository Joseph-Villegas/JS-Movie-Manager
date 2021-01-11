document.addEventListener("DOMContentLoaded", async () => {
    const imdbId = document.getElementById("imdbId").textContent;
    console.log(`In movie page, showing infor for movie with id ${imdbId}`);

    const rawURL = `/search?id=${imdbId}`;
    const url = encodeURI(rawURL);

    // Search for film
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);
});

