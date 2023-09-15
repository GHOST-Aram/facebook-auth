var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const passport = require('passport')
const facebookStrategy = require('passport-facebook').Strategy
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { default: mongoose } = require('mongoose');
const { User } = require('./User');
require('dotenv/config')

var app = express();

mongoose.connect(process.env.MONGODB_URI, {
	useUnifiedTopology: true,
	useNewUrlParser: true
})
.then(result => console.log("Connected to DB"))
.catch((error =>console.log("Some thing went wrong: ", error.message)))
//facebook strategy

passport.use(new facebookStrategy(
	{
		clientID: process.env.FACEBOOK_CLIENT_ID,
		clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
		callbackURL: "http://localhost:3000/facebook/callback",
		profileFields: [
			'id', 
			'displayName', 
			'name', 
			'gender',
			'picture.type(large)',
			'email'
		]
	},
	async (token, refreshToken, profile, done) => {
		try {
			const user = await User.findOne({profileId: profile.id})
			if(user){
				console.log("User already exists in DB: ", user)
				return done(null, user)
			}
			else{
				const newUser = await User.create({
					profileId: profile.id,
					name: profile.displayName,
					first_name: profile.name.givenName,
					last_name: profile.name.familyName,
					middle_name: profile.name.middleName,
					pictureUrl: profile._json.picture.data.url
				})

				console.log("New USER CREATE AND SAVED: ", newUser)
				return done(null, newUser)
			}
			
		} catch (error) {
			return done(error, false)
		}
	}
))

app.use(session({ 
	secret: process.env.SESSION_SECRET,
	resave: true,
	saveUninitialized: true,
	store: MongoStore.create({
		mongoUrl: process.env.MONGODB_URI,
		mongoOptions: {
			useUnifiedTopology: true,
			useNewUrlParser: true,
		}
	}),
	cookie: {
		maxAge: 24 * 60 * 60 * 1000
	}
}))
app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser((user, done) =>{
	return done(null, user.id)
})

passport.deserializeUser(async(id, done) =>{
	return done(null, id)
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res, next) {
	res.render('index', { title: 'Passport facebook auth' });
})

app.get('/auth/passport', 
passport.authenticate('facebook', { scope: 'email'})
)

app.get('/facebook/callback', 
	passport.authenticate('facebook'), (req, res) =>{
		res.json({user: req.user})
	}
)
app.get('/profile', (req, res) => {
	res.json({ message: "You are a valid user" })
})

app.get('/failed', (req, res) =>{
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
