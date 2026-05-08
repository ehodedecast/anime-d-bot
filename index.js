const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const fs = require('fs');
const notifier = require('node-notifier');
const chalk = require('chalk').default;
const handleCommands = require('./commands');
const handleButtons = require('./interactions/buttons');
const sendMenu = require('./interactions/menu');
const checkAnime = require('./utils/checkAnime');
const { getGuildAnimeList } = require('./utils/animeStorage');
const { loadConfig } = require('./utils/config');

const TOKEN = process.env.TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 📺 LISTA (vazio no momento)


// 🚨 ERROS
process.on('uncaughtException', async (err) => {
  console.error(err);

  notifier.notify({
    title: 'Erro no Bot',
    message: err.message
  });

});

process.on('unhandledRejection', async (err) => {
  console.error(err);

  notifier.notify({
    title: 'Erro Async',
    message: err?.message || 'Erro desconhecido'
  });

});

// 🤖 BOT ONLINE
client.once('clientReady', async () => {
  console.log('Bot online!');

  
  setInterval(() => {
  checkAnime(client);
 }, 30000);
 
});

// 🌍 BOT ENTROU EM SERVIDOR
client.on('guildCreate', async (guild) => {
  try {

    const channel = guild.channels.cache.find(c =>
      c.isTextBased() &&
      c.permissionsFor(guild.members.me).has('SendMessages')
    );

    if (!channel) return;

    channel.send(
      '⚠️ Configure um canal para o AnimeDBot usando `!setchannel`.'
    );

  } catch (err) {
    console.log('Erro guildCreate:', err);
  }
});

// 💬 MENSAGENS
client.on('messageCreate', async (message) => {

  if (message.author.bot) return;

  const config = loadConfig();
  const guildConfig = config[message.guild?.id];

  // ⚠️ sem canal configurado
  if (
    !guildConfig &&
    message.content !== '!setchannel'
  ) {
    return message.reply(
      '⚠️ Este servidor ainda não configurou um canal.\n\nUse `!setchannel` no canal desejado.'
    );
  }

  // 🚫 canal errado
  if (
    guildConfig &&
    message.channel.id !== guildConfig.channelId &&
    message.content !== '!setchannel'
  ) {
    return;
  }

  // 📋 MENU
  if (message.content === '!menu') {
    console.log(
  chalk.cyan(`[${message.guild.name}]`) +
  chalk.green(` ${message.author.username}`) +
  ' abriu o menu'
);
    return sendMenu(message);
  }

  // 🎮 COMANDOS
  const animeList = getGuildAnimeList(message.guild.id);
console.log(animeList);
handleCommands(message, animeList);
});

// 🔘 BOTÕES
client.on('interactionCreate', async (interaction) => {

  if (!interaction.isButton()) return;

  const animeList = getGuildAnimeList(interaction.guild.id);

handleButtons(interaction, animeList);
});

// 🔑 LOGIN
client.login(TOKEN);