const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const handleCommands = require('./commands');
const handleButtons = require('./interactions/buttons');
const sendMenu = require('./interactions/menu');
const checkAnime = require('./utils/checkAnime');

const fs = require('fs');
const notifier = require('node-notifier');

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 🔥 LISTA DE ANIMES
let animeList = [];

try {
  animeList = JSON.parse(fs.readFileSync('animes.json'));
} catch {
  fs.writeFileSync('animes.json', '[]');
}

// 🔥 ERROS (UNIFICADO)
process.on('uncaughtException', async (err) => {
  console.error(err);
  process.stdout.write('\x07'); // beep

  notifier.notify({
    title: 'Erro no Bot',
    message: err.message
  });

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    channel.send(`💥 ERRO CRÍTICO:\n\`\`\`${err.message}\`\`\``);
  } catch {}
});

process.on('unhandledRejection', async (err) => {
  console.error(err);
  process.stdout.write('\x07'); // beep

  notifier.notify({
    title: 'Erro Async',
    message: err?.message || 'Erro desconhecido'
  });

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    channel.send(`⚠️ ERRO ASYNC:\n\`\`\`${err?.message || err}\`\`\``);
  } catch {}
});

// 🔥 BOT ONLINE
client.once('clientReady', async () => {
  console.log('Bot online!');

  notifier.notify({
    title: 'Bot iniciado',
    message: 'AnimeBot está online'
  });

  const channel = await client.channels.fetch(CHANNEL_ID);
  channel.send('✅ Bot funcionando!');

  setInterval(() => checkAnime(client, animeList, CHANNEL_ID), 30000);
});

// 🔥 BOT ENTRA NO SERVER
client.on('guildCreate', async (guild) => {
  try {
    const channel = guild.channels.cache.find(c =>
      c.isTextBased() &&
      c.permissionsFor(guild.members.me).has('SendMessages')
    );

    if (!channel) return;

    sendMenu({
      reply: (msg) => channel.send(msg)
    });

  } catch (err) {
    console.log('Erro ao enviar menu inicial:', err);
  }
});

// 🔥 MENSAGENS
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content === '!menu') {
    return sendMenu(message);
  }

  handleCommands(message, animeList);
});

// 🔥 BOTÕES
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  handleButtons(interaction, animeList);
});

// 🔥 LOGIN
client.login(TOKEN);