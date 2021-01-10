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

router.get('/dashboard', (req, res, next) => {
  if (!req.session.user) {
    res.redirect('/login');
  }

  res.render('dashboard', { title: 'Movie Manager', username: req.session.user.username });
});

module.exports = router;