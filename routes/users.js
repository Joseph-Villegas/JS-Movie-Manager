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

  const rows = await usersSheet.getRows();

  // Enforce unique username constraint
  // const uniqueUsername = await usernameTaken(usersSheet, req.body.username);
  // if (!uniqueUsername) {
  //   return res.json({success: false, msg: "Username already taken"});
  // }

  let userIndex = getUserIndex(rows, req.body.username);
  if (userIndex > -1) {
    return res.json({ success: false, msg: "Username already taken" });
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
  // Ensure all required parameters are present in the request query
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

  // Each row represents a user, iterate through each one and compare info
  // if a match is found update row by columns

  const rows = await usersSheet.getRows();

  let userIndex = -1;

  for (let i = 0; i < rows.length; i++) {
      if (rows[i].username == req.session.user.username) {
        userIndex = i;
      }
  }

  if (userIndex == -1) {
    return res.json({ success: false, msg: "User not found, cannot update" });
  }

  if (req.body.username) {
    // Update user sheets...
    const catalog = doc.sheetsByTitle[`Catalog for ${req.session.user.username}`];
    const wishList = doc.sheetsByTitle[`Wish List for ${req.session.user.username}`];

    await catalog.updateProperties({ title: `Catalog for ${req.body.username}` });
    await wishList.updateProperties({ title: `Wish List for ${req.body.username}` });

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

  // Each row represents a user, iterate through each one and compare info
  // if a match is found update row by columns
  const rows = await usersSheet.getRows();

  const userIndex = await getUserIndex(rows, req.session.user.username);

  if (userIndex < 0) {
    return res.json({ success: false, msg: "Could not find user to delete" });
  }

  if (rows[userIndex].password != req.body.password) {
    return res.json({ success: false, msg: "Invalid password" });
  }

  const catalogTitle = `Catalog for ${req.session.user.username}`;
  const wishListTitle = `Wish List for ${req.session.user.username}`;

  const catalog =  doc.sheetsByTitle[catalogTitle];
  const wishList =  doc.sheetsByTitle[wishListTitle];
  
  await catalog.delete();
  await wishList.delete();
  
  await rows[userIndex].delete();

  delete req.session.user;

  return res.json({ success: true, msg: "User deleted" });
});

/**
 * Checks if a user with the given username already exists
 * @param rows
 * @param username
 * @returns index value if found, -1 if not
 */
const getUserIndex = async (rows, username) => {
  let userIndex = -1;

  for (let i = 0; i < rows.length; i++) {
      if (rows[i].username == username) {
        userIndex = i;
      }
  }

  return userIndex;
}

module.exports = router;
