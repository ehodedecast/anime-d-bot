const state = require('../state/state');
const fs = require('fs');
const chalk = require('chalk').default;
const add = require('./add');
const list = require('./list');
const next = require('./next');
const info = require('./info');
const clear = require('./clear');
const remove = require('./remove');
const setChannel = require('./setchannel');
const language = require('./language');
const help = require('./help');
const botstats = require('./botstats');
const servercounter = require('./servercounter');
const { t } = require('../utils/language');
const forcecheck = require('./forcecheck');
const { loadConfig } = require('../utils/config');
const {
  shouldIgnoreForLocalTest,
  getEffectiveChannelId
} = require('../utils/localMode');
const syncAll = require('../dev/syncall');
const migrateAnimeData = require('../dev/migrateAnimeData');
const devReply = require('../utils/devReply');
const testQuery = require('../dev/testQuery');
const repairGuildNames = require('../dev/repairGuildNames');
const serverhistory = require('./serverhistory');





async function handleCommands(message, animeList, client) {

  const rawContent =
    message.content || '';

  const trimmedContent =
    rawContent.trim();

  const normalizedContent =
    trimmedContent.toLowerCase();

  const isCommand =
    normalizedContent.startsWith('!');

const hasActiveState =

  state.waitingForAdd?.[message.author.id] ||
  state.waitingForNext?.[message.author.id] ||
  state.waitingForInfo?.[message.author.id] ||
  state.waitingForRemove?.[message.author.id];

if (!isCommand && !hasActiveState) {
  return;
} 
	
	const config = loadConfig();
const guildConfig = config[message.guild?.id];

if (
  shouldIgnoreForLocalTest(message)
) {
  return;
}

const effectiveChannelId =
  getEffectiveChannelId(
    guildConfig
  );



  
console.log(
  chalk.cyan(`[${message.guild.name}]`) +
  chalk.gray(` (${message.guild.id})`) +
  chalk.green(` ${message.author.username}`) +
  `: ${message.content}`
);


if (
  (
    !guildConfig ||
    !effectiveChannelId
  ) &&
  normalizedContent !== '!setchannel'
) {
  return message.reply(
    t(message.guild.id, 'no_channel_set') + '\n\n' +
    t(message.guild.id, 'setchannel_instructions')
  );
}
if (
  effectiveChannelId &&
  message.channel.id !== effectiveChannelId &&
  normalizedContent !== '!setchannel'
) {
  if (
    normalizedContent.startsWith('!')
  ) {

    return message.reply(
      `Este servidor esta configurado para usar comandos em <#${effectiveChannelId}>.\n` +
      'Se quiser usar este canal, envie `!setchannel` aqui.'
    );
  }

  return;
}
// 🔧 REPAIR GUILD NAMES

if (
  normalizedContent ===
  '!repairguilds'
) {

  return repairGuildNames(

    message,

    client
  );
}
	// 🔹 COMANDO FORCECHeCK

if (normalizedContent === '!forcecheck') {

  return forcecheck(
    message,
    message.client
  );
}
// 🔧 MIGRATE ANIME DATA

if (
  normalizedContent ===
  '!migrateanime'
) {

  await migrateAnimeData();

  return devReply(

  message,

  '✅ Anime data migrated.'
);
}
// 🔹 COMANDO SYNCALL

if (
  normalizedContent ===
  '!syncall'
) {

  return syncAll(
    message
  );
}

if (
  normalizedContent ===
  '!serverhistory'
) {

  return serverhistory(
    message
  );
}

// 🔹 COMANDO LANGUAGE

if (
  normalizedContent ===
  '!language'
) {

  return language(
    message
  );
}
// 🔹 COMANDO SERVERCOUNTER

if (
  normalizedContent ===
  '!servercounter'
) {

  return servercounter(
    message,
    message.client
  );
}
// 🔹 COMANDO BOTSTATS

if (
  normalizedContent ===
  '!botstats'
) {

  return botstats(
    message,
    client
  );
}
// 🔹 COMANDO HELP

if (
  normalizedContent ===
  '!help'
) {

  return help(
    message
  );
}

	 // 🔹 COMANDO SETCHANNEL
	 if (normalizedContent === '!setchannel') {
  return setChannel(message);
}
// 🔧 TEST QUERY

if (
  normalizedContent.startsWith(
    '!testquery '
  )
) {

  const query =

    trimmedContent.slice(11).trim();

  return testQuery(

    message,

    query
  );
}
   // 🔹 COMANDO REMOVE
   if (
  normalizedContent.startsWith(
    '!remove '
  )
) {

  const name =

    trimmedContent.slice(8).trim();

  return remove(
    message,
    name
  );
}
if (state.waitingForRemove?.[message.author.id]) {

  const input = trimmedContent;

  delete state.waitingForRemove[
    message.author.id
  ];

  return remove(
    message,
    input
  );
}
  // 🔹 COMANDO CLEAR
 const clear = require('./clear');

if (normalizedContent === '!clearlist') {
  return clear(message, animeList);
}
  // 🔹 COMANDO ADD
  if (state.waitingForAdd?.[message.author.id]) {
  const input = trimmedContent;
  delete state.waitingForAdd[message.author.id];

  return add(message, animeList, input);
}
  if (normalizedContent.startsWith('!add ')) {
    const name = trimmedContent.slice(5).trim();
    return add(message, animeList, name);
  }
// 🔹 COMANDO INFO
if (state.waitingForInfo?.[message.author.id]) {
  const input = trimmedContent;
  delete state.waitingForInfo[message.author.id];

  return info(message, input);
}
  if (normalizedContent.startsWith('!info ')) {
    const name = trimmedContent.slice(6).trim();
    return info(message, name);
  }
// 🔹 COMANDO LIST
  if (
    normalizedContent === '!list'
  ) {
    return list(message, animeList);
  }
  // 🔹 COMANDO NEXT
if (state.waitingForNext?.[message.author.id]) {
  const input = trimmedContent;
  delete state.waitingForNext[message.author.id];

  return next(message, input);
}
  if (normalizedContent.startsWith('!next ')) {
    const name = trimmedContent.slice(6).trim();
    return next(message, name);
  }
}
// 🔹 fechou os comandos
module.exports = handleCommands;
