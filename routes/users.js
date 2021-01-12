const express = require('express');
const router = express.Router();

const { GoogleSpreadsheet } = require('google-spreadsheet');

const bcrypt = require('bcrypt');

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
 * Gets a logged in user's information 
 */
router.get('/', async (req, res) => {
  if (!req.session.user) {
    return res.json({ logged_in: false });
  }

  return res.json({ logged_in: true, username: req.session.user.username, email: req.session.user.email });
});

/**
 * Adds a user given a valid username, password, and email.
 */
router.post('/register', async (req, res) => {
  // Ensure all required parameters are present in the request body
  if (!req.body.username || !req.body.password || !req.body.email || !req.body.firstName || !req.body.lastName) {
    return res.json({ success: false, msg: "missing one or more parameters (username, password, email, first name, and/or last name)" });
  }

  // Enforce username and password constraints
  if (req.body.username.length < 6 || req.body.username.length > 32 || req.body.username.includes(" ")) {
    return res.json({ success: false, msg: "Invalid username" });
  }

  let validPass = validatePassword(req.body.password);
  if (!validPass) {
    return res.json({ success: false, msg: "Invalid password" });
  }

  // Validate first and last names
  if (req.body.firstName.length == 0 || req.body.lastName == 0 || req.body.firstName.includes(" ") || req.body.lastName.includes(" ")) {
    return res.json({ success: false, msg: "Invalid first and/or last name" });
  }

  // Retrieve Spreadsheet, then the "Users" sheet
  await authorize();

  const usersSheet = doc.sheetsByTitle["Users"]

  const rows = await usersSheet.getRows();

  // Enforce unique username constraint
  let userIndex = getUserIndex(rows, req.body.username);
  if (userIndex > -1) {
    return res.json({ success: false, msg: "Username already taken" });
  }

  // Hash the password
   const salt = await bcrypt.genSalt(10);
   const hashedPassword = await bcrypt.hash(req.body.password, salt);

  // Add new user to "Users" spreadsheet, then create new catalog and wish list sheets for them
  await Promise.all([
    usersSheet.addRow({ username: req.body.username, password: hashedPassword, email: req.body.email, firstName: req.body.firstName, lastName: req.body.lastName }),
    doc.addSheet({ title: `Catalog for ${req.body.username}`, headerValues: ['title', 'year', 'imdbId', 'poster', 'copies'] }),
    doc.addSheet({ title: `Wish List for ${req.body.username}`, headerValues: ['title', 'year', 'imdbId', 'poster'] }) 
  ]);

  return res.json({success: true, msg: "User added, new catalog and wish list also created for them"});
});

/**
 * Attempts to log a user into the website
 */
router.get('/login', async (req, res) => {
  // Ensure all required parameters are present in the request query
  if (!req.query.username || !req.query.password) {
    return res.json({ success: false, msg: "Missing username or password" });
  }

  // Retrieve Spreadsheet, then the "Users" sheet
  await authorize();

  const usersSheet = doc.sheetsByTitle["Users"];

  // Validate credentials: check for a match with the provided username then compare passwords
  const rows = await usersSheet.getRows();

  let userIndex = getUserIndex(rows, req.query.username);
  if (userIndex < 0) {
    return res.json({ success: false, msg: "Invalid username" });
  }

  let validPass = await bcrypt.compare(req.query.password, rows[userIndex].password);
  if (!validPass) {
    return res.json({ success: false, msg: "Invalid credentials" });
  } 
  
  req.session.user = { username: rows[userIndex].username, email: rows[userIndex].email };
  return res.json({ success: true, msg: "User logged in" });
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
 * Updates user information
 */
router.put('/update', async (req, res) => {
  // Ensure that a user is logged in 
  // and that all required parameters are present in the request body
  if (!req.session.user) {
    return res.json({ success: false, msg: "A user must be logged in to update user info "});
  } else if (!req.body.username && !req.body.password && !req.body.email) {
    return res.json({ success: false, msg: "Missing parameter(s): username, password, enail" });
  }

  // Retrieve Spreadsheet, then the "Users" sheet
  await authorize();

  const usersSheet = doc.sheetsByTitle["Users"]

  const rows = await usersSheet.getRows();

  const userIndex = getUserIndex(rows, req.session.user.username);

  if (userIndex < 0) {
    return res.json({ success: false, msg: "User not found, cannot update" });
  }

  if (req.body.username) {
    // Update user sheets...
    const catalog = doc.sheetsByTitle[`Catalog for ${req.session.user.username}`];
    const wishList = doc.sheetsByTitle[`Wish List for ${req.session.user.username}`];

    await Promise.all([
      catalog.updateProperties({ title: `Catalog for ${req.body.username}` }),
      wishList.updateProperties({ title: `Wish List for ${req.body.username}` }) 
    ]);

    rows[userIndex].username = req.body.username;
    req.session.user.username = req.body.username;
  }

  if (req.body.password) {
    rows[userIndex].password = req.body.password;
  }

  if (req.body.email) {
    rows[userIndex].email = req.body.email;
    req.session.user.email = req.body.email;
  }

  await rows[userIndex].save();
  return res.json({ success: true, msg: "User updated" });
});

/**
 * Given a valid password and user with a session this route removes there account.
 */
router.delete('/remove', async (req, res) => {
  if (!req.session.user) {
    return res.json({ success: false, msg: "A user must be logged in to delete their account"});
  } else if (!req.body.password) {
    return res.json({ success: false, msg: "User password must be provided" });
  }

  // Retrieve Spreadsheet, then the "Users" sheet
  await authorize();

  const usersSheet = doc.sheetsByTitle["Users"]

  const rows = await usersSheet.getRows();

  // Validate credentials: check for a user with a matching username then compare passwords
  const userIndex = getUserIndex(rows, req.session.user.username);

  if (userIndex < 0) {
    return res.json({ success: false, msg: "Could not find user to delete" });
  }

  let validPass = await bcrypt.compare(req.body.password, rows[userIndex].password);
  if (!validPass) {
    return res.json({ success: false, msg: "Invalid credentials" });
  } 

  // Delete all relevant user information: 
  // 1. Row in the "Users" sheet, 
  // 2. Catalog and wish list sheets, 
  // 3. Remove user info from session

  const catalog =  doc.sheetsByTitle[`Catalog for ${req.session.user.username}`];
  const wishList =  doc.sheetsByTitle[`Wish List for ${req.session.user.username}`];

  await Promise.all([catalog.delete(), wishList.delete(), rows[userIndex].delete()]);

  delete req.session.user;

  return res.json({ success: true, msg: "User deleted" });
});

/**
 * Checks if a user with the given username already exists
 * @param rows
 * @param username
 * @returns index value if found, -1 if not
 */
const getUserIndex = (rows, username) => {
  // Each row represents a user, iterate through each one and compare
  // usernames if a match is found return its row index, else -1
  let userIndex = -1;

  for (let i = 0; i < rows.length; i++) {
      if (rows[i].username == username) {
        userIndex = i;
        break;
      }
  }

  return userIndex;
}

/**
 * Checks if a password has all required properties
 * @param password
 * @returns true if requirements met, false if not
 */
const validatePassword = password => {
  // Validate length
  if (password.length < 6) return false;
  
  // Validate lowercase letters
  var lowerCaseLetters = /[a-z]/g;
  if (!password.match(lowerCaseLetters)) return false;

  // Validate capital letters
  var upperCaseLetters = /[A-Z]/g;
  if (!password.match(upperCaseLetters)) return false;

  // Validate numbers
  var numbers = /[0-9]/g;
  if (!password.match(numbers)) return false;

  // Validate special characters
  var specialCharacters = /[!@#$%^&*]/g;
  if (!password.match(specialCharacters)) return false;

  return true;
}

module.exports = router;