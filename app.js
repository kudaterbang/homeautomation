var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var five = require("johnny-five")
    , board, relay;
var ngrok = require('ngrok');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express()
	, server = require('http').createServer(app);;

var srv = server.listen(4300, function(){
	console.log("Server running on port 4300, enjoy!");
});

ngrok.connect({authtoken: 'oiUp1ummfRcm3Me1Yafa',
		subdomain: 'kudaponi',
		port: 4300});


var io = require('socket.io').listen(srv);
board = new five.Board();

var flash = require('connect-flash')
  , passport = require('passport')
  , util = require('util')
  , LocalStrategy = require('passport-local').Strategy;

var users = [
    { id: 1, username: 'kudaponi', password: 'rahasia', email: 'kudaponi@peternakan.com' }
];

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

//app.use('/', routes);


function findById(id, fn) {
  var idx = id - 1;
  if (users[idx]) {
    fn(null, users[idx]);
  } else {
    fn(new Error('User ' + id + ' does not exist'));
  }
}

function findByUsername(username, fn) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    if (user.username === username) {
      return fn(null, user);
    }
  }
  return fn(null, null);
}

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      findByUsername(username, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
        if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
        return done(null, user);
      })
    });
  }
));

app.get('/', function(req, res){
  res.render('index', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user, message: req.flash('error') });
});

app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


board.on("ready", function() {

	arduinoRelay1 = new five.Relay(6);
	arduinoRelay2 = new five.Relay(7);
	arduinoRelay3 = new five.Relay(8);
	arduinoRelay4 = new five.Relay(9);
	
	arduinoRelay1.on();
	arduinoRelay2.on();
	arduinoRelay3.on();
	arduinoRelay4.on();
	
	io.sockets.on('connection', function (socket) {
		socket.emit('robot connected', { data: 'Connected' });

		socket.on('robot command', function (data) {
			console.log(data);

			var command = data.command;
			if(command == 'relay1_on'){
				arduinoRelay1.off();
			}else if (command == 'relay1_off') {
				arduinoRelay1.on();
			}else if (command == 'relay2_on') {
				arduinoRelay2.off();
			}else if (command == 'relay2_off') {
				arduinoRelay2.on();
			}else if (command == 'relay3_on') {
				arduinoRelay3.off();
			}else if (command == 'relay3_off') {
				arduinoRelay3.on();
			}else if (command == 'relay4_on') {
				arduinoRelay4.off();
			}else if (command == 'relay4_off') {
				arduinoRelay4.on();
			}
		});
	});
	
	board.repl.inject({
		r1: arduinoRelay1,
		r2: arduinoRelay2,
		r3: arduinoRelay3,
		r4: arduinoRelay4
	});
});


module.exports = app;
