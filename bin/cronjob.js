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

/**
 * Retrieves new DVD release info from a third party API
 */
const getReleases = async () => {
    const response = await fetch("https://dvd-release-dates.herokuapp.com/this-week");
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
    await sheet.setHeaderRow(["week", "title", "poster", "imdbId", "scrape_date"]);

    // Get new release information
    const { releases, weekOf: week_of } = await getReleases();
    const scrape_date = new Date();

    // Add new release information as rows in the sheet
    let rows = [];
    releases.forEach(release => {
      rows.push({ week: week_of, title: release.title, poster: release.poster, imdbId: release.imdbID, scrape_date: scrape_date });
    });
    
    await sheet.addRows(rows);
};

scrape_n_save();
