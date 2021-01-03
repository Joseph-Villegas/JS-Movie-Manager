const express = require('express');
const router = express.Router();

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
 * Displays user dashboard page (for film lists)
 */
router.get('/', (req, res) => {
    if (!req.session.user) {
        res.render('index', { title: 'Express' });
    }

    res.render('dashboard', { title: 'Express', username: req.session.user.username });
});

//=========================== Catalog Methods ================================//

/**
 * Retrieves a logged in user's catalog
 */
router.get('/catalog', async (req, res) => {
    if (!req.session.user) {
        return res.json({ success: false, msg: "A user must be logged in to see their catalog" });
    }

    // Retrieve Spreadsheet, then the catalog sheet
    await authorize();

    const catalog = doc.sheetsByTitle[`Catalog for ${req.session.user.username}`];

    const rows = await catalog.getRows();

    if (rows.length == 0) {
        return res.json({ success: true, msg: "User catalog empty", catalog: [], length: rows.length });
    }

    let films = [];
    rows.forEach(row => {
        films.push({title: row.title, year: row.year, imdbId: row.imdbId, poster: row.poster, copies: row.copies});
    });

    return res.json({ success: true, msg: "User catalog accessed", catalog: films, length: rows.length });
});

/**
 * Adds a film to a logged in user's catalog
 */
router.post('/add-to-catalog', async (req, res) => {
    // Ensure a user is logged in and all parameters are present
    if (!req.session.user) {
        return res.json({ success: false, msg: "A user must be logged in to see their catalog" });
    }

    if (!req.body.title || !req.body.year || !req.body.imdbId || !req.body.poster || !req.body.copies) {
        return res.json({ success: false, msg: "Missing parameter(s): title, year, imdbId, poster, and/or copies" });
    }

    const film = {
        title: req.body.title, 
        year: req.body.year, 
        imdbId: req.body.imdbId, 
        poster: req.body.poster,
        copies: req.body.copies
    };

    // Retrieve Master Spreadsheet, then the user's catalog sheet
    await authorize();

    const catalog = doc.sheetsByTitle[`Catalog for ${req.session.user.username}`];

    const rows = await catalog.getRows();

    // TODO: If film is in wish list remove it before adding to catalog

    // Check if the film has already been cataloged, if not then catalog it
    if (getFilmIndex(rows, film) > -1) {
        return res.json({ success: false, 
                          msg: `User, ${req.session.user.username}, already added ${film.title} to their catalog. Consider updating their catalog's record of copies for this film` 
                        });
    }

    await catalog.addRow(film);

    return res.json({ success: true, msg: `User, ${req.session.user.username}, added "${film.title}" to their catalog` });
});

/**
 * Updates a film's number of copies to a logged in user's catalog
 */
router.put('/update-copy-count', async (req, res) => {
    // Ensure a user is logged in and all parameters are present
    if (!req.session.user) {
        return res.json({ success: false, msg: "A user must be logged in to update their catalog" });
    }

    if (!req.body.imdbId || !req.body.copies) {
        return res.json({ success: false, msg: "Missing parameter(s): imdbId and/or copies" });
    }
    
    if (req.body.copies < 1) {
        return res.json({ success: false, msg: "Invalid copy count, must be greater than 1" });
    }

    // Retrieve Master Spreadsheet, then the user's catalog sheet
    await authorize();

    const catalog = doc.sheetsByTitle[`Catalog for ${req.session.user.username}`];
 
    const rows = await catalog.getRows();

    // Find row with matching imdbId to update
    const filmIndex = getFilmIndex(rows, { imdbId: req.body.imdbId });
    if (filmIndex < 0) {
        return res.json({ success: false, msg: "No film with matching imdbId found" });
    }

    rows[filmIndex].copies = req.body.copies;
    await rows[filmIndex].save();

    return res.json({ success: true, msg: "Film copy count updated in catalog" });
});

/**
 * Removes a film from a logged in user's catalog
 */
router.delete('/remove-from-catalog', async (req, res) => {
    // Ensure a user is logged in and all parameters are present
    if (!req.session.user) {
        return res.json({ success: false, msg: "A user must be logged in to remove from their catalog" });
    }

    if (!req.body.imdbId) {
        return res.json({ success: false, msg: "Missing parameter: imdbId" });
    }

    // Retrieve Master Spreadsheet, then the user's catalog sheet
    await authorize();

    const catalog = doc.sheetsByTitle[`Catalog for ${req.session.user.username}`];
 
    const rows = await catalog.getRows();

    // Find row with matching imdbId for deletion
    const filmIndex = getFilmIndex(rows, { imdbId: req.body.imdbId });
    if (filmIndex < 0) {
        return res.json({ success: false, msg: "No film with matching imdbId found" });
    }

    await rows[filmIndex].delete();

    return res.json({ success: true, msg: "Film deleted from catalog" });
});

//=========================== Wish List Methods ================================//

/**
 * Retrieves a logged in user's wish list
 */
router.get('/wish-list', async (req, res) => {
    if (!req.session.user) {
        return res.json({ success: false, msg: "A user must be logged in to see their wish list" });
    }

    // Retrieve Spreadsheet, then the wish list sheet
    await authorize();

    const wishList = doc.sheetsByTitle[`Wish List for ${req.session.user.username}`];

    const rows = await wishList.getRows();

    if (rows.length == 0) {
        return res.json({ success: true, msg: "User wish list empty", wish_list: [], length: rows.length });
    }

    let films = [];
    rows.forEach(row => {
        films.push({title: row.title, year: row.year, imdbId: row.imdbId, poster: row.poster, copies: row.copies});
    });

    return res.json({ success: true, msg: "User wish list accessed", wish_list: films, length: rows.length });
});

/**
 * Adds a film to a logged in user's wish list
 */
router.post('/add-to-wish-list', async (req, res) => {
    // Ensure a user is logged in and all parameters are present
    if (!req.session.user) {
        return res.json({ success: false, msg: "A user must be logged in to see their wish list" });
    }

    if (!req.body.title || !req.body.year || !req.body.imdbId || !req.body.poster) {
        return res.json({ success: false, msg: "Missing parameter(s): title, year, imdbId, and/or poster" });
    }

    const film = {
        title: req.body.title, 
        year: req.body.year, 
        imdbId: req.body.imdbId, 
        poster: req.body.poster
    };

    // Retrieve Master Spreadsheet, then the user's wish list sheet
    await authorize();

    // TODO: Don't add to wish list if already in catalog

    const wishList = doc.sheetsByTitle[`Wish List for ${req.session.user.username}`];

    const rows = await wishList.getRows();

    // Check if the film has already been wished for, if not then wish for it
    if (getFilmIndex(rows, film) > -1) {
        return res.json({ success: false, msg: `${req.session.user.username} already added ${film.title} to their wish list` });
    }

    await wishList.addRow(film);

    return res.json({ success: true, msg: `${req.session.user.username} added ${film.title} to their wish list` });
});

/**
 * Removes a film from a logged in user's wish list
 */
router.delete('/remove-from-wish-list', async (req, res) => {
    // Ensure a user is logged in and all parameters are present
    if (!req.session.user) {
        return res.json({ success: false, msg: "A user must be logged in to remove from their wish list" });
    }

    if (!req.body.imdbId) {
        return res.json({ success: false, msg: "Missing parameter: imdbId" });
    }

    // Retrieve Master Spreadsheet, then the user's wish list sheet
    await authorize();

    const wishList = doc.sheetsByTitle[`Wish List for ${req.session.user.username}`];

    const rows = await wishList.getRows();

    // Find row with matching imdbId for deletion
    const filmIndex = getFilmIndex(rows, { imdbId: req.body.imdbId });
    if (filmIndex < 0) {
        return res.json({ success: false, msg: "No film with matching imdbId found" });
    }

    await rows[filmIndex].delete();

    return res.json({ success: true, msg: "Film deleted from wish list" });
});

//=========================== Helper Methods ================================//

/**
 * Checks if a film with matching properties already exists
 * @param rows
 * @param film
 * @returns index value if found, -1 if not
 */
const getFilmIndex = (rows, film) => {
    let index = -1;

    for (let i = 0; i < rows.length; i++) {
        if (rows[i].imdbId == film.imdbId) {
            index = i;
            break;
        }
    }

    return index;
}

module.exports = router;