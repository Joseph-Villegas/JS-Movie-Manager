const fetch = require("node-fetch");

const { GoogleSpreadsheet } = require('google-spreadsheet');

// Retrieve necessary api keys
const TOMDB_API_KEY = process.env.TOMDB_API_KEY;

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

/**
 * Retrieves new DVD release info from a third party API
 */
const getReleases = async () => {
    const response = await fetch("https://dvd-release-dates.herokuapp.com/all-weeks");
    const data = await response.json();
    return data;
};

/**
 * Retrieves and stores new DVD release info
 */
const scrape_n_save = async () => {
  // Retrieve Spreadsheet, then the new releases sheet
  await authorize();

  const sheet = doc.sheetsByTitle["New Releases"];

  // Clear sheet of previous release values
  await sheet.clear();
  await sheet.setHeaderRow(["week", "title", "poster", "imdbId", "tomdbId", "scrape_date"]);

  // Get new release information
  const { scrape_results: weekly_results } = await getReleases();
  const scrape_date = new Date();

  // Get new release information from TOMDB then add as a row in the sheet
  let rows = [];
  for (let week of weekly_results) {
    const { release_week, movies } = week;

    await Promise.all(movies.map(async (movie) => {
      const url = `https://api.themoviedb.org/3/find/${movie.imdb_id}?api_key=${TOMDB_API_KEY}&language=en-US&external_source=imdb_id`;
      const response = await fetch(url);
      const data = await response.json();
      // TODO: Check for tv results
      const { movie_results } = data;
      if (movie_results.length == 0) return;
      const info = movie_results[0];
      rows.push({ week: release_week, title: info.title, poster: `https://image.tmdb.org/t/p/w342${info.poster_path}`, imdbId: movie.imdb_id, tomdbId: info.id, scrape_date: scrape_date });
    }));
  }

  await sheet.addRows(rows);
};

scrape_n_save();
