var express = require('express');
var router = express.Router();

router.get('/', (req, res) => {
  let data = { title: 'Movie Manager' };

  if (req.session.user) {
    data.username = req.session.user.username;
  }

  res.render('index', data);
});

router.get('/login', (req, res) => {
  if (req.session.user) {
    res.redirect('/dashboard');
  }

  res.render('login', { title: 'Movie Manager' });
});

router.get('/register', (req, res) => {
  if (req.session.user) {
    res.redirect('/dashboard');
  }

  res.render('register', { title: 'Movie Manager' });
});

router.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    res.redirect('/login');
  }

  res.render('dashboard', { title: 'Movie Manager', username: req.session.user.username });
});

router.get('/wish-list', (req, res) => {
  if (!req.session.user) {
    res.redirect('/login');
  }

  res.render('wishlist', { title: 'Movie Manager', username: req.session.user.username });
});

router.get('/catalog', (req, res) => {
  if (!req.session.user) {
    res.redirect('/login');
  }

  res.render('catalog', { title: 'Movie Manager', username: req.session.user.username });
});

/**
 * Gets a product given a productId.
 * @Parameter req.query.id productId
 * @Return returns a product and switches to a page with product info.
 */
router.get('/movie/:imdbId', async (req, res) => {
  let data = { title: 'Movie Manager', imdbId: req.params.imdbId };

  if (req.session.user) {
    data.username = req.session.user.username;
  }

  res.render('movie', data);
});
module.exports = router;