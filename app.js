var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const passport = require('passport')
const facebookStrategy = require('passport-facebook').Strategy
const session = require('express-session');
require('dotenv/config')

var app = express();

app.get('/', function(req, res, next) {
	res.render('index', { title: 'Passport facebook auth' });
  });

//facebook strategy

passport.use(new facebookStrategy(
	{
		clientID: '964874551287668',
		clientSecret: '82284b3f67b98235e7b717a16299f757',
		callbackURL: "https://3000/facebook/callback",
		profileFields: [
			'id', 
			'displayName', 
			'name', 
			'gender',
			'picture.type(large)',
			'email'
		]
	},
	(token, refreshToken, profile, done) => {
		console.log(profile)
		return done(null, profile)
	}
))

app.use(session({ 
	secret: process.env.SESSION_SECRET,
	resave: true,
	saveUninitialized: true,
	cookie: {
		maxAge: 24 * 60 * 60 * 1000
	}
}))
app.use(passport.session())
app.use(passport.initialize())

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.get('/auth/passport', 
	passport.authenticate('facebook', { scope: 'email'})
)

app.get('/facebook/callback', 
	passport.authenticate('facebook', {
		successRedirect: '/profile',
		failureRedirect: '/failed'
	})
)

app.get('/profile', (req, res) => {
	res.json({ message: "You are a valid user" })
})

app.get('failed', (req, res) =>{
	res.json({ message: "Unauthorised user" })
})
// catch 404 and forward to error 	
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
