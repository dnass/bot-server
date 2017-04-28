require('./env')
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fs = require('fs');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const generator = require('generate-password');
const Account = require('./models/account');
const mongoose = require('mongoose');
const manager = require('./helpers/manager');
const index = require('./routes/index');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(require('express-session')({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);

passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error.ejs', { err: err });
});

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_URL);
mongoose.connection.on('open', () => {
  app.listen(process.env.PORT, () => console.log(`listening on ${process.env.PORT}`));
  manager.checkBots();
  Account.find().exec()
    .then(result => {
      if (!result.length) {
        const password = generator.generate({length: 10, numbers: true});
        Account.register(new Account({ username : 'admin' }), password, (err, account) => {
          if (err) console.log(err);
          console.log(`Account created.
Username: admin
Password: ${password}`)
        });
      }
    })
})

module.exports = app;
