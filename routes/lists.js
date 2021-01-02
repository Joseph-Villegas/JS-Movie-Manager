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
router.get('/', async (req, res) => {
    if (!req.session.user) {
        res.render('index', { title: 'Express' });
    }

    res.render('dashboard', { title: 'Express', username: req.session.user.username });
});

module.exports = router;