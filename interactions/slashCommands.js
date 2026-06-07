const add = require('../commands/add');
const list = require('../commands/list');
const next = require('../commands/next');
const info = require('../commands/info');
const clear = require('../commands/clear');
const remove = require('../commands/remove');
const setChannel = require('../commands/setchannel');
const language = require('../commands/language');
const userlanguage = require('../commands/userlanguage');
const help = require('../commands/help');
const botstats = require('../commands/botstats');
const resetdata = require('../commands/resetdata');
const profile = require('../commands/profile');
const sendMenu = require('./menu');
const {
  PermissionFlagsBits,
  MessageFlags
} = require('discord.js');

const {
  getUserAnimeList
} = require('../utils/userAnimeStorage');

const {
  loadConfig
} = require('../utils/config');

const {
  getEffectiveChannelId
} = require('../utils/localMode');

const {
  createInteractionMessage
} = require('../utils/interactionAdapter');

const {
  runWithDmStatusWarning
} = require('../utils/dmStatus');

const dmCheckedCommands = new Set([
  'add',
  'list',
  'remove',
  'next',
  'info',
  'menu',
  'profile',
  'help'
]);

function runCommand(
  interaction,
  command,
  handler
) {

  if (
    dmCheckedCommands.has(
      command
    )
  ) {

    return runWithDmStatusWarning(
      interaction,
      handler
    );
  }

  return handler();
}

function requireAdmin(
  interaction
) {

  if (
    interaction.memberPermissions?.has(
      PermissionFlagsBits.ManageGuild
    )
  ) {
    return true;
  }

  return false;
}

function requireBotOwner(
  interaction
) {

  return Boolean(
    (
      process.env.OWNER_ID ||
      process.env.BOT_OWNER_ID
    ) &&
    interaction.user.id === (
      process.env.OWNER_ID ||
      process.env.BOT_OWNER_ID
    )
  );
}

async function handleSlashCommand(
  interaction,
  client
) {

  const message =
    createInteractionMessage(
      interaction
    );

  const config =
    loadConfig();

  const guildConfig =
    config[interaction.guild.id];

  const effectiveChannelId =
    getEffectiveChannelId(
      guildConfig
    );

  const command =
    interaction.commandName;

  if (
    command === 'botstats' &&
    !requireBotOwner(
      interaction
    )
  ) {

    return interaction.reply({
      content:
        'Apenas o administrador do bot pode usar este comando.',
      flags: MessageFlags.Ephemeral
    });
  }

  if (
    (
      !guildConfig ||
      !effectiveChannelId
    ) &&
    command !== 'setchannel' &&
    command !== 'botstats' &&
    command !== 'resetdata' &&
    command !== 'userlanguage'
  ) {

    return interaction.reply({
      content:
        'Este servidor ainda nao configurou um canal. Use /setchannel no canal desejado.',
      flags: MessageFlags.Ephemeral
    });
  }

  if (
    effectiveChannelId &&
    interaction.channelId !== effectiveChannelId &&
    command !== 'setchannel' &&
    command !== 'botstats' &&
    command !== 'resetdata' &&
    command !== 'userlanguage'
  ) {

    return interaction.reply({
      content:
        `Este servidor esta configurado para usar comandos em <#${effectiveChannelId}>.`,
      flags: MessageFlags.Ephemeral
    });
  }

  const adminCommands = [
    'language',
    'setchannel',
    'clear'
  ];

  if (
    adminCommands.includes(command) &&
    !requireAdmin(interaction)
  ) {

    return interaction.reply({
      content: 'Voce nao tem permissao para usar este comando.',
      flags: MessageFlags.Ephemeral
    });
  }

  if (command === 'add') {

    return runCommand(
      interaction,
      command,
      async () => {
        await interaction.deferReply();

        return add(
          message,
          getUserAnimeList(
            interaction.user.id,
            interaction.user.username
          ),
          interaction.options.getString('anime')
        );
      }
    );
  }

  if (command === 'list') {

    return runCommand(
      interaction,
      command,
      async () => {
        await interaction.deferReply({
          flags: MessageFlags.Ephemeral
        });

        return list(
          message
        );
      }
    );
  }

  if (command === 'remove') {

    return runCommand(
      interaction,
      command,
      () => remove(
        message,
        interaction.options.getString('anime')
      )
    );
  }

  if (command === 'next') {

    return runCommand(
      interaction,
      command,
      async () => {
        await interaction.deferReply();

        return next(
          message,
          getUserAnimeList(
            interaction.user.id,
            interaction.user.username
          )
        );
      }
    );
  }

  if (command === 'info') {

    return runCommand(
      interaction,
      command,
      async () => {
        await interaction.deferReply();

        return info(
          message,
          interaction.options.getString('anime')
        );
      }
    );
  }

  if (command === 'help') {

    return runCommand(
      interaction,
      command,
      () => help(
        message
      )
    );
  }

  if (command === 'menu') {

    return runCommand(
      interaction,
      command,
      () => sendMenu(
        interaction
      )
    );
  }

  if (command === 'profile') {

    return runCommand(
      interaction,
      command,
      async () => {
        await interaction.deferReply({
          flags: MessageFlags.Ephemeral
        });

        return profile(
          message
        );
      }
    );
  }

  if (command === 'language') {

    return language(
      message
    );
  }

  if (command === 'userlanguage') {

    return runCommand(
      interaction,
      command,
      () => userlanguage(
        message
      )
    );
  }

  if (command === 'setchannel') {

    return setChannel(
      message
    );
  }

  if (command === 'botstats') {

    return botstats(
      message,
      client
    );
  }

  if (command === 'resetdata') {

    return resetdata(
      interaction
    );
  }

  if (command === 'clear') {

    return clear(
      message
    );
  }
}

module.exports = handleSlashCommand;
