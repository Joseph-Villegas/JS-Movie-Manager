var express = require('express');
var router = express.Router();

const fetch = require("node-fetch");

/**
 * Searches for a film given a title OR an IMDb ID
 */
router.get('/', async function(req, res, next) {
    if (!req.query.title && !req.query.id) {
        return res.json({success: false, films: [], msg: "Missing parameter: title or id"});
    }

    let result = {};

    if (req.query.title) {
        result = await search(`https://movie-database-imdb-alternative.p.rapidapi.com/?s=${req.query.title}&page=1&r=json`);
    } else if (req.query.id) {
        result = await search(`https://movie-database-imdb-alternative.p.rapidapi.com/?i=${req.query.id}&r=json`);
    }

    if (result.Response === "True") {
        return res.json({success: true, films: result});
    } else {
        return res.json({success: false, msg: result.Error});
    }
});

/**
 * Conducts a query using a third party API
 * @param url
 * @returns JSON Object
 */
const search = async url => {
    const response = await fetch(url, {
        method: "GET",
        headers: {
            "x-rapidapi-key": process.env.API_KEY,
            "x-rapidapi-host": "movie-database-imdb-alternative.p.rapidapi.com"
        }
    });

    return  await response.json();
}

module.exports = router;