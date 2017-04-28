const fs = require('fs');
const Job = require('./job');
const Bot = require('../models/bot');
const bots = require('./bots')

const jobs = {}

const dir = __dirname + '/../bots/';

function runOnce(id) {
  new Job(id, true).run();
}

function updateBot(botData) {
  const id = botData.id;
  if (botData.initialized) {
    bots[id] = botData;
    if (!jobs[id]) jobs[id] = new Job(id);
    if (jobs[id].interval !== botData.interval) {
      jobs[id].stop();
      jobs[id] = new Job(id);
    }
    if (botData.running && !jobs[id].running) jobs[id].run()
    if (!botData.running && jobs[id].running) jobs[id].stop()
    if (jobs[id].running) botData.lastRun = jobs[id].lastRun;
  }
  return botData;
}

function initBotData(id, {name, version, description, author, main, botConfig: {params, handle}}) {
  var params = params.reduce((obj, param) => {
    obj[param] = '';
    return obj;
  }, {});
  const botData = {
    id,
    name,
    version,
    description,
    author,
    main,
    params,
    handle
  }
  return botData;
}

function checkBots() {
  const installedBots = fs.readdirSync(dir).filter(f => fs.statSync(dir + f).isDirectory());
  Bot.find().exec()
    .then(dbBots => {
      dbBots.forEach(bot => {
        const id = bot.id;
        if (installedBots.indexOf(id) > -1) updateBot(bot);
        else {
          bot.remove();
          bots[id] = null;
          if (jobs[id]) {
            jobs[id].stop()
            jobs[id] = null;
          }
        }
      })
    }).catch(console.log);
  installedBots.forEach(id => {
    try {
      const packageData = JSON.parse(fs.readFileSync(dir + id + '/package.json', 'utf-8'));
      Bot.findOne({id}).exec()
        .then(bot => {
          if (!bot) {
            const newBot = Bot(initBotData(id, packageData)).save();
          } else if (bot.version !== packageData.version) {
            console.log('Upgrading bot ' + id + ' to version ' + packageData.version)
            bot.version = packageData.version;
            updateBot(bot);
            return bot.save();
          }
        }).catch(console.log);
    } catch (err) {
      console.log('Could not load bot ' + id);
    }
  })
}

module.exports = {
  updateBot,
  runOnce,
  checkBots,
  bots
}
