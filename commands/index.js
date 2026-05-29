const state = require('../state/state');
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

const { t } = require('../utils/language');
const { loadConfig } = require('../utils/config');
const {
  shouldIgnoreForLocalTest,
  getEffectiveChannelId
} = require('../utils/localMode');

async function handleCommands(
  message,
  animeList,
  client
) {

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

  if (
    shouldIgnoreForLocalTest(message)
  ) {
    return;
  }

  const config =
    loadConfig();

  const guildConfig =
    config[message.guild?.id];

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

  if (normalizedContent === '!language') {
    return language(message);
  }

  if (normalizedContent === '!help') {
    return help(message);
  }

  if (normalizedContent === '!botstats') {
    return botstats(
      message,
      client
    );
  }

  if (normalizedContent === '!setchannel') {
    return setChannel(message);
  }

  if (
    normalizedContent.startsWith('!remove ')
  ) {

    return remove(
      message,
      trimmedContent.slice(8).trim()
    );
  }

  if (
    state.waitingForRemove?.[message.author.id]
  ) {

    delete state.waitingForRemove[
      message.author.id
    ];

    return remove(
      message,
      trimmedContent
    );
  }

  if (normalizedContent === '!clearlist') {
    return clear(message, animeList);
  }

  if (
    state.waitingForAdd?.[message.author.id]
  ) {

    delete state.waitingForAdd[
      message.author.id
    ];

    return add(
      message,
      animeList,
      trimmedContent
    );
  }

  if (
    normalizedContent.startsWith('!add ')
  ) {

    return add(
      message,
      animeList,
      trimmedContent.slice(5).trim()
    );
  }

  if (
    state.waitingForInfo?.[message.author.id]
  ) {

    delete state.waitingForInfo[
      message.author.id
    ];

    return info(
      message,
      trimmedContent
    );
  }

  if (
    normalizedContent.startsWith('!info ')
  ) {

    return info(
      message,
      trimmedContent.slice(6).trim()
    );
  }

  if (normalizedContent === '!list') {
    return list(message, animeList);
  }

  if (
    state.waitingForNext?.[message.author.id]
  ) {

    delete state.waitingForNext[
      message.author.id
    ];

    return next(
      message,
      trimmedContent
    );
  }

  if (
    normalizedContent.startsWith('!next ')
  ) {

    return next(
      message,
      trimmedContent.slice(6).trim()
    );
  }
}

module.exports = handleCommands;
