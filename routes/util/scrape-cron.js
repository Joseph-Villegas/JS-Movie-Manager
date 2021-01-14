const cron = require('node-cron');

const fetch = require("node-fetch");

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
 
const adapter = new FileSync('db.json');
const db = low(adapter);

// Set db defaults
db.defaults({ releases: [], scrape_date: "", week_of: "" }).write();

/**
 * Resets keys in "db.json" file acting as a database
 */
const reset = () => {
    db.set('releases', [])
      .write();
    db.set('scrape_date', "")
      .write();
    db.set('week_of', "")
      .write();
}

/**
 * Sets key values in "db.json" file acting as a database
 * @param releases object array of new DVD releases
 * @param scrape_date date object detailing at what point the data was scraped
 * @param week_of string detailing the date for the new releases
 */
const save = (releases, scrape_date, week_of) => {
    db.set('releases', releases)
      .write();
    db.set('scrape_date', scrape_date)
      .write();
    db.set('week_of', week_of)
      .write();
}

/**
 * Retrieves new DVD release info from a third party API
 */
const getReleases = async () => {
    const response = await fetch("https://dvd-release-dates.herokuapp.com/this-week");
    const data = await response.json();
    return data;
};
  
// Schedule formatted by http://corntab.com/ to be at 00 minutes past every hour
cron.schedule('0 * * * *', async () => {
    reset();
    const { releases, weekOf: week_of} = await getReleases();
    const scrape_date = new Date();
    save(releases, scrape_date, week_of);
});