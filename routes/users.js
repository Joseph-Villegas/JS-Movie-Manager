var express = require('express');
var router = express.Router();

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
}

/**
 * Adds a user given a valid username, password, and email.
 */
router.post('/register', async (req, res) => {
  // Ensure all required parameters are present in the request body
  if (!req.body.username || !req.body.password || !req.body.email) {
    return res.json({ success: false, msg: "missing one or more parameters (username, password, and/or email)" });
  }

  // Retrieve Spreadsheet, then the "Users" sheet
  await authorize();

  const usersSheet = doc.sheetsByTitle["Users"]

  // Enforce unique username constraint
  const uniqueUsername = await usernameTaken(usersSheet, req.body.username);
  if (!uniqueUsername) {
    return res.json({success: false, msg: "Username already taken"});
  }

  // Add new user to "Users" spreadsheet, then create new catalog and wish list sheets for them
  await usersSheet.addRow({ username: req.body.username, password: req.body.password, email: req.body.email });

  await doc.addSheet({ title: `Catalog for ${req.body.username}`, headerValues: ['title', 'year', 'imdbId', 'poster', 'copies'] });
  await doc.addSheet({ title: `Wish List for ${req.body.username}`, headerValues: ['title', 'year', 'imdbId', 'poster'] });

  return res.json({success: true, msg: "User added, new catalog and wish list also created for them"});
});

/**
 * Attempts to log a user into the website. Either returns true if successful, or false if unsuccessful.
 */
router.get('/login', async (req, res) => {
  if (!req.query.username || !req.query.password) {
    return res.json({ success: false, msg: "Missing username or password" });
  }

  // Retrieve Spreadsheet, then the "Users" sheet
  await authorize();

  const usersSheet = doc.sheetsByTitle["Users"]

  // Each row represents a user, iterate through each one and compare info
  // if a match is found set user info to a session variable

  const rows = await usersSheet.getRows();
  
  let authenticated = false;

  rows.forEach(row => {
    if (row.username == req.query.username && row.password == req.query.password) {
      req.session.user = { username: row.username, email: row.email };
      authenticated = true;
    }
  });

  if (authenticated) {
    return res.json({ success: true });
  } else {
    delete req.session.user;
    return res.json({ success: false });
  }
});

/**
 * Logs a user out of the website.
 */
router.get('/logout', async (req, res) => {
  delete req.session.user;

  if (!req.session.user) {
    return res.json({ success: true });
  }

  return res.json({ success: false });
});

/**
 * Checks if a user with the given username already exists
 * @param sheet
 * @param username
 * @returns boolean
 */
const usernameTaken  = async (sheet, username) => {
  const rows = await sheet.getRows();

  rows.forEach(row => {
    if (row.username == username) {
      return true;
    }
  });
  
  return false;
}

module.exports = router;