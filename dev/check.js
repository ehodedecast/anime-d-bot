require('dotenv').config();

const { Client, GatewayIntentBits }
  = require('discord.js');

const checkAnime =
  require('../utils/checkAnime');

const client = new Client({

  intents: [
    GatewayIntentBits.Guilds
  ]
});

client.once(
  'clientReady',
  async () => {

    console.log(
      '🧪 DEV CHECK STARTED'
    );

    await checkAnime(client);

    console.log(
      '✅ DEV CHECK FINISHED'
    );

    process.exit();
  }
);

client.login(process.env.TOKEN);