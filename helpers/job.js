const spawn = require('child_process').spawn;
const Event = require('../models/event');
const bots = require ('./bots');

class Job {
  constructor(id, once) {
    const botData = bots[id];
    this.id = id;
    this.interval = once ? false : botData.interval;
    this.botPath = __dirname + '/../bots/' + this.id + '/' + botData.main;
    this.initData = {
      id: botData.id,
      params: botData.params,
      twit: botData.twit
    }
    this.running = false;
    this.lastRun = null;
    this.loop = null;
    console.log(this.id + ': Job created for bot');
  }

   run() {
    if (this.id && !this.running) {
      this.running = true;
      const self = this;
      if (this.interval) {
        this.lastRun = new Date();
        console.log(this.id + ': Starting run loop');
        this.loop = setInterval(function () {
          console.log(self.id + ': Running bot');
          self.lastRun = new Date();
          runBot(self.botPath, self.initData);
        }, this.interval * 60000);
      } else {
        console.log(this.id + ': Running bot once');
        runBot(self.botPath, self.initData);
      }
    }
  }

  stop() {
    if (this.running) {
      console.log(this.id + ': Bot stopped');
      clearInterval(this.loop);
      this.loop = null;
      this.running = false;
      this.lastRun = null;
    }
  }
}

function runBot(path, initData) {
  const bot = spawn('node', [path]);
  const id = initData.id;
  bot.stdout.on('data', (data) => {
    const messages = data.toString().split('\n');
    messages.forEach(msg => {
      if (msg !== '') {
        const message = JSON.parse(msg);
        if (typeof message.content === 'string')
          if (message.content === 'kill')
            bot.kill()
          else
            console.log(`${id}: ${message.content}`)
        else if (typeof message.content === 'object') {
          const eventData = {
            botId: id,
            date: message.date
          }
          if (message.content.tweet) {
            eventData.tweet = message.content.tweet.data.id_str;
            saveEvent(eventData);
          }
          else if (message.content.error) {
            console.log(`${id} error: ${message.content.error}`);
            eventData.error = message.content.error;
            bot.kill()
            saveEvent(eventData);
          } else {
            console.log(message.content);
          }
        }
      }
    })
  });
  bot.stderr.on('data', (data) => {
    console.log(data.toString());
  })
  bot.on('exit', () => {
    console.log(id + ': bot exited')
  })
  bot.stdin.write(JSON.stringify(initData))
}

function saveEvent(data) {
  const event = Event(data);
  event.save()
    .catch(console.log);
  console.log(data.botId + ': Event saved in database');
}

module.exports = Job
