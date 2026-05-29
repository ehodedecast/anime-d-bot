const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('add')
    .setDescription('Add an anime to AnimeDBot.')
    .addStringOption(option =>
      option
        .setName('anime')
        .setDescription('Anime name')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('list')
    .setDescription('Show this server anime list.'),

  new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove an anime from this server.')
    .addStringOption(option =>
      option
        .setName('anime')
        .setDescription('Anime name')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('next')
    .setDescription('Show upcoming tracked episodes.'),

  new SlashCommandBuilder()
    .setName('info')
    .setDescription('Show anime information.')
    .addStringOption(option =>
      option
        .setName('anime')
        .setDescription('Anime name')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show AnimeDBot help.'),

  new SlashCommandBuilder()
    .setName('menu')
    .setDescription('Open the AnimeDBot main menu.'),

  new SlashCommandBuilder()
    .setName('language')
    .setDescription('Choose this server language.')
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild
    ),

  new SlashCommandBuilder()
    .setName('setchannel')
    .setDescription('Set the current channel as AnimeDBot channel.')
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild
    ),

  new SlashCommandBuilder()
    .setName('botstats')
    .setDescription('Send bot status to your DM.')
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild
    ),

  new SlashCommandBuilder()
    .setName('resetdata')
    .setDescription('Temporarily reset AnimeDBot data after strict confirmation.')
    .addStringOption(option =>
      option
        .setName('confirmation')
        .setDescription('Required exact confirmation string')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    ),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clear this server anime list.')
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild
    )
];

module.exports = commands;
