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
const forcecheck = require('./forcecheck');
const { loadConfig } = require('../utils/config');





async function handleCommands(message, animeList) {

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
	// 🔹 COMANDO FORCECHeCK

if (message.content === '!forcecheck') {

  return forcecheck(
    message,
    message.client
  );
}
	 // 🔹 COMANDO SETCHANNEL
	 if (message.content === '!setchannel') {
  return setChannel(message);
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