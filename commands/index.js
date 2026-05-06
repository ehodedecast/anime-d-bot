const state = require('../state/state');
const fs = require('fs');

const add = require('./add');
const list = require('./list');
const next = require('./next');
const info = require('./info');
const clear = require('./clear');
const remove = require('./remove');
const setChannel = require('./setchannel');
const { loadConfig } = require('../utils/config');







async function handleCommands(message, animeList) {
	
	const config = loadConfig();
const guildConfig = config[message.guild?.id];

if (!guildConfig && message.content !== '!setchannel') {
  return message.reply(
    '⚠️ Este servidor ainda não configurou um canal.\n\nUse `!setchannel` no canal desejado.'
  );
}
if (
  guildConfig &&
  message.channel.id !== guildConfig.channelId &&
  message.content !== '!setchannel'
) {
  return;
}
	
	 // 🔹 COMANDO SETCHANNEL
	 if (message.content === '!setchannel') {
  return setChannel(message);
}
	 // 🔹 COMANDO REMOVE
	 if (message.content.startsWith('!remove ')) {

  const name = message.content.replace('!remove ', '');

  return remove(message, name);
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