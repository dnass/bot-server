#bot-server

An Express-based server for deploying and scheduling Twitter bots built with [twitter-bot-bot](https://www.npmjs.com/package/twitter-bot-bot).

##Setup

Configure bot-server with a MongoDB URL and listening port in `env.js`. Install your bots in a `bots` directory in the `botmanager` directory.

The first time bot-server is run, it will create a user and output the username and password to the console. **Save these**, as you will need them to access your bots from the browser.
