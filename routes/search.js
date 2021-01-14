const express = require('express');
const router = express.Router();

const fetch = require("node-fetch");

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
 
const adapter = new FileSync('db.json');
const db = low(adapter);

router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

/**
 * Searches for a film given a title OR an IMDb ID
 */
router.get('/', async (req, res) => {
    if (!req.query.title && !req.query.id) {
        return res.json({success: false, films: [], msg: "Missing parameter: title or id"});
    } else if (req.query.title && req.query.id) {
        return res.json({success: false, films: [], msg: "You may search by title OR id"});
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
 * Retrieves film info for new DVD releases
 * Makes use of a third party API developed as a companion to this application
 */
router.get('/new-releases', async (req, res) => {
    const releases = db.get('releases').value();
    return res.json({ releases: releases });
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

    return await response.json();
}

module.exports = router;