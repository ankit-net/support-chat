var express = require('express');  
var passport = require('passport');  
var router = express.Router();
const authenticationController = require('../controllers/authentication');

router.get('/', function(req, res, next) { 
  console.log('Cookies on index page: ', req.cookies)
  res.render('index', { title: 'Express' });
});

router.get('/login', function(req, res, next) {  
  res.render('login.ejs', { message: req.flash('loginMessage') });
});

router.post('/login', passport.authenticate('local-login', {
  successRedirect:'/dashboard',
  failureRedirect:'/login',
  failureFlash: true
}));

router.post('/signup', passport.authenticate('local-signup', {
  successRedirect: '/dashboard',
  failureRedirect: '/signup',
  failureFlash: true
}));

router.get('/signup', function(req, res) {  
  res.render('signup.ejs', { message: req.flash('signupMessage') });
});

router.get('/forgot', function(req, res){
  res.render('forgotPassword.ejs', {message: req.flash('forgotPasswordMessage')});
});

router.post('/forgot', authenticationController.forgotPassword);

router.get('/dashboard', authenticationController.userAuthenticated, function(req, res) {
  console.log('Cookies on dashboard: ', req.cookies);
  console.log('Session on dashboard: ', req.session);
  res.render('dashboard.ejs', { user: req.user });
});

router.get('/logout', function(req, res) {  
  req.logout();
  res.redirect('/');
});

module.exports = router;

function isLoggedIn(req, res, next) {  
  if (req.isAuthenticated())
      return next();
  res.redirect('/');
}