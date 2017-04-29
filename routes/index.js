const express = require('express');
const passport = require('passport');
const _ = require('lodash');
const manager = require('../helpers/manager');
const Account = require('../models/account');
const Bot = require('../models/bot');
const Event = require('../models/event');
const router = express.Router();

function writeResponse(id, action, error) {
  const response = { id }
  if (action) response.action = action;
  if (error) response.message = { type: 'error', text: error }
  return JSON.stringify(response);
}

router.get('/', (req, res) => {
  manager.checkBots();
  if (!req.user)
    res.redirect('/login')
  else
    res.render('index.ejs', { user : req.user })
})

router.get('/login', function(req, res) {
    res.render('login', { user : req.user });
});

router.post('/login', passport.authenticate('local'), function(req, res) {
    res.redirect('/');
});

router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

router.post('/bots', (req, res) => {
  const query = {};
  if (req.body.id) query.id = req.body.id;
  Bot.find(query).sort({ id: 1 }).exec()
    .then(results => {
      bots = [];
      results.forEach(result => {
        const bot = manager.updateBot(result.toObject());
        Event.findOne({ botId: bot.id }).sort({ $natural: -1 }).exec()
          .then(event => {
            if (event) bot.lastEvent = event;
            bots.push(bot);
            if (bots.length === results.length) res.json(bots);
          })
    })
  }).catch(console.log);
});

router.post('/run/:id', (req, res) => {
  const id = req.params.id;
  Bot.findOne({ id }).exec()
    .then(bot => {
      if (bot.initialized) {
        manager.runOnce(id);
        res.end(writeResponse(id, 'render'));
      } else res.end(writeResponse(id, null, 'Bot not initialized'));
      }).catch(console.log);
})

router.post('/toggle/:id', (req, res) => {
  const id = req.params.id;
  Bot.findOne({ id }).exec()
    .then(bot => {
      if (bot.initialized) {
        bot.toggle();
        bot.save();
        res.end(writeResponse(id, 'render'));
      } else
        res.end(writeResponse(id, null, 'Bot not initialized'));
    }).catch(console.log)
})

router.post('/update/:id', (req, res) => {
  const id = req.params.id;
  Bot.findOne({ id }).exec()
    .then(bot => {
      const params = {};
      _.forIn(req.body, (value, key) => {
        if (['consumer_key', 'consumer_secret', 'access_token', 'access_token_secret'].indexOf(key) > -1) bot.twit[key] = value;
        else if (key === 'interval') bot.interval = Number(value);
        else params[key] = value;
      })
      bot.params = params;
      bot.configure = false;
      bot.initialized = true;
      bot.save();
      res.end(writeResponse(id, 'render'));
    }).catch(console.log)
})

router.post('/edit/:id', (req, res) => {
  const id = req.params.id;
  Bot.findOne({ id }).exec()
    .then(bot => {
      bot.configure = true;
      bot.save()
      res.end(writeResponse(id, 'render'));
    }).catch(console.log);
})

module.exports = router;
