document.addEventListener("DOMContentLoaded", async event => { 
    let title = "Avengers Endgame";
    let IMDbID = "tt4154796";

    // fetch(`/search?title=${title}`)
    // .then(res => res.json())
    // .then(data => console.log(data))
    // .catch(err => console.error(err));

    const searchByTitle = await search(`/search?title=${title}`);
    console.log(searchByTitle);

    const searchByIMDbID = await search(`/search?id=${IMDbID}`);
    console.log(searchByIMDbID);
});


const search = async url => {
    const response = await fetch(url);
    return await response.json();
}




