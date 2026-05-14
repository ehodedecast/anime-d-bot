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
const syncAll = require('../dev/syncall');
const migrateAnimeData = require('../dev/migrateAnimeData');
const devReply = require('../utils/devReply');
const testQuery = require('../dev/testquery');
const repairGuildNames = require('../dev/repairGuildNames');





async function handleCommands(message, animeList, client) {

  const isCommand = message.content.startsWith('!');

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



  
console.log(
  chalk.cyan(`[${message.guild.name}]`) +
  chalk.gray(` (${message.guild.id})`) +
  chalk.green(` ${message.author.username}`) +
  `: ${message.content}`
);


if (!guildConfig && message.content !== '!setchannel') {
  return message.reply(
    t(message.guild.id, 'no_channel_set') + '\n\n' +
    t(message.guild.id, 'setchannel_instructions')
  );
}
if (
  guildConfig &&
  message.channel.id !== guildConfig.channelId &&
  message.content !== '!setchannel'
) {
  return;
}
// 🔧 REPAIR GUILD NAMES

if (
  message.content ===
  '!repairguilds'
) {

  return repairGuildNames(

    message,

    client
  );
}
	// 🔹 COMANDO FORCECHeCK

if (message.content === '!forcecheck') {

  return forcecheck(
    message,
    message.client
  );
}
// 🔧 MIGRATE ANIME DATA

if (
  message.content ===
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
  message.content ===
  '!syncall'
) {

  return syncAll(
    message
  );
}
// 🔹 COMANDO LANGUAGE

if (
  message.content ===
  '!language'
) {

  return language(
    message
  );
}
// 🔹 COMANDO SERVERCOUNTER

if (
  message.content ===
  '!servercounter'
) {

  return servercounter(
    message,
    message.client
  );
}
// 🔹 COMANDO BOTSTATS

if (
  message.content ===
  '!botstats'
) {

  return botstats(
    message,
    client
  );
}
// 🔹 COMANDO HELP

if (
  message.content ===
  '!help'
) {

  return help(
    message
  );
}

	 // 🔹 COMANDO SETCHANNEL
	 if (message.content === '!setchannel') {
  return setChannel(message);
}
// 🔧 TEST QUERY

if (
  message.content.startsWith(
    '!testquery '
  )
) {

  const query =

    message.content.replace(
      '!testquery ',
      ''
    );

  return testQuery(

    message,

    query
  );
}
	 // 🔹 COMANDO REMOVE
	 if (state.waitingForRemove?.[message.author.id]) {

  const input = message.content;
  delete state.waitingForRemove[message.author.id];

  return remove(message, input);
}
  // 🔹 COMANDO CLEAR
 const clear = require('./clear');

if (message.content === '!clearlist') {
  return clear(message, animeList);
}
  // 🔹 COMANDO ADD
  if (state.waitingForAdd?.[message.author.id]) {
  const input = message.content;
  delete state.waitingForAdd[message.author.id];

  return add(message, animeList, input);
}
  if (message.content.startsWith('!add ')) {
    const name = message.content.replace('!add ', '');
    return add(message, animeList, name);
  }
// 🔹 COMANDO INFO
if (state.waitingForInfo?.[message.author.id]) {
  const input = message.content;
  delete state.waitingForInfo[message.author.id];

  return info(message, input);
}
  if (message.content.startsWith('!info ')) {
    const name = message.content.replace('!info ', '');
    return info(message, name);
  }
// 🔹 COMANDO LIST
  if (message.content === '!list') {
    return list(message, animeList);
  }
  // 🔹 COMANDO NEXT
if (state.waitingForNext?.[message.author.id]) {
  const input = message.content;
  delete state.waitingForNext[message.author.id];

  return next(message, input);
}
  if (message.content.startsWith('!next ')) {
    const name = message.content.replace('!next ', '');
    return next(message, name);
  }
}
// 🔹 fechou os comandos
module.exports = handleCommands;