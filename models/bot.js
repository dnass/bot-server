var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Bot = new Schema({
  id: String,
  name: String,
  version: String,
  description: String,
  author: String,
  main: String,
  handle: String,
  params: Object,
  twit: {
    access_token_secret: {type: String, default: ''},
    access_token: {type: String, default: ''},
    consumer_secret: {type: String, default: ''},
    consumer_key: {type: String, default: ''}
  },
  interval: {type: Number, default: 60},
  count: {type: Number, default: 0},
  running: {type: Boolean, default: false},
  initialized: {type: Boolean, default: false},
  configure: {type: Boolean, default: true}
})

Bot.methods.toggle = function() {
  this.running = !this.running;
}

module.exports = mongoose.model('Bot', Bot);
