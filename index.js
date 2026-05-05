const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const handleCommands = require('./commands');
const handleButtons = require('./interactions/buttons');
const sendMenu = require('./interactions/menu');
const checkAnime = require('./utils/checkAnime');

const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

let animeList = [];
let waitingForAdd = {};

try {
  animeList = JSON.parse(fs.readFileSync('animes.json'));
} catch {
  fs.writeFileSync('animes.json', '[]');
}

client.once('clientReady', async () => {
  console.log('Bot online!');
  const channel = await client.channels.fetch(CHANNEL_ID);
  channel.send('✅ Bot funcionando!');
  setInterval(() => checkAnime(client, animeList, CHANNEL_ID), 30000);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content === '!menu') {
    return sendMenu(message);
  }

  handleCommands(message, animeList, waitingForAdd);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  handleButtons(interaction, animeList, waitingForAdd);
});

client.login(TOKEN);