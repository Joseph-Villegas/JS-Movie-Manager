const express = require('express');
const router = express.Router();

const fetch = require("node-fetch");

const { GoogleSpreadsheet } = require('google-spreadsheet');

// Initialize the sheet
const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);

// Initialize Auth
const authorize = async () => {
  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/gm, '\n')
  });

  await doc.loadInfo(); 
};

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
    // Retrieve Spreadsheet, then the new releases sheet
    await authorize();

    const sheet = doc.sheetsByTitle["New Releases"];
    const rows = await sheet.getRows();

    let releases = [];
    rows.forEach(row => {
        releases.push({ week: row.week, title: row.title, poster: row.poster, imdbId: row.imdbId, scrape_date: row.scrape_date });
    });

    return res.json(releases);
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