var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var socketEvents = require('./socketEvents');

//import routes
var routes = require('./routes/index');
var userRoutes = require('./routes/users');
var chatRoutes = require('./routes/chat');
var customerRoutes = require('./routes/customer');
var port = process.env.port || 3000;
var socketPort = 3001;

var passport = require('passport');
var mongoose = require('mongoose');
var flash = require('connect-flash');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

var configDB = require('./config/database.js');
mongoose.connect(configDB.url);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret:'mytestsecret',
  store: new MongoStore({url: configDB.url})
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

require('./config/passport')(passport);

app.use('/', routes);
app.use('/users', userRoutes);
app.use('/chat', chatRoutes);
app.use('/customer', function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:8080");
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Accept");
  next();
});
app.use('/customer', customerRoutes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next){
    res.status(err.status || 500).render('error', {
      message: err.message,
      error: err
    });
});

app.listen(port);

http.listen(socketPort, function(){
  console.log('listening for socket connections on *:3001');
});
socketEvents(io);

module.exports = app;
