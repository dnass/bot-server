var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Event = new Schema({
  botId: String,
  tweet: String,
  error: String,
  date: Date
})

module.exports = mongoose.model('Event', Event);
