
const fs = require('fs');
const chalk = require('chalk').default;
const add = require('../commands/add');
const list = require('../commands/list');
const next = require('../commands/next');
const info = require('../commands/info');
const clear = require('../commands/clear');
const sendMenu = require('./menu');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const state = require('../state/state');

function clearUserStates(userId) {

  delete state.waitingForAdd?.[userId];
  delete state.waitingForNext?.[userId];
  delete state.waitingForInfo?.[userId];
  delete state.waitingForRemove?.[userId];
}
module.exports = async (interaction, animeList, waitingForAdd) => {
  console.log(
  chalk.cyan(`[${interaction.guild.name}]`) +
  chalk.gray(` (${interaction.guild.id})`) +
  chalk.yellow(` ${interaction.user.username}`) +
  ` clicou ${interaction.customId}`
);
	console.log('BOTÃO CLICADO:', interaction.customId);
	console.log(interaction.replied);
  console.log(interaction.deferred);

 // 🔹 BOTAO ADD
  if (interaction.customId === 'menu_add') {
    clearUserStates(interaction.user.id);
  state.waitingForAdd[interaction.user.id] = true;

  return interaction.reply({
  content: '✏️ Digite o nome do anime:',
  flags: 64
});
}
// 🔹 BOTAO REMOVE
if (interaction.customId === 'menu_remove') {
  clearUserStates(interaction.user.id);
  state.waitingForRemove = state.waitingForRemove || {};
  state.waitingForRemove[interaction.user.id] = true;

  return interaction.reply({
  content: '✏️ Digite o nome do anime:',
  flags: 64
});
}
// 🔹 BOTAO NEXT
  if (interaction.customId === 'menu_next') {
  clearUserStates(interaction.user.id);
  state.waitingForNext = state.waitingForNext || {};
  state.waitingForNext[interaction.user.id] = true;

  return interaction.reply({
  content: '✏️ Digite o nome do anime:',
  flags: 64
});
}
// 🔹 BOTAO LISTA
  if (interaction.customId === 'menu_list') {
  clearUserStates(interaction.user.id);
  return list(
  {
    reply: (msg) => interaction.reply(msg),
    guild: interaction.guild
  },
  animeList
);
}
// 🔹 BOTAO INFO
if (interaction.customId === 'menu_info') {
  clearUserStates(interaction.user.id);
  state.waitingForInfo = state.waitingForInfo || {};
  state.waitingForInfo[interaction.user.id] = true;

  return interaction.reply({
  content: '📚 Digite o nome do anime:',
  flags: 64
});
}
// 🔹 BOTAO LIMPAR
if (interaction.customId === 'menu_clear') {

  const row = new ActionRowBuilder().addComponents(

    new ButtonBuilder()
      .setCustomId('confirm_clear')
      .setLabel('Confirmar limpeza')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId('cancel_clear')
      .setLabel('Cancelar')
      .setEmoji('❌')
      .setStyle(ButtonStyle.Secondary)

  );

  return interaction.reply({
    content:
      '⚠️ Você está prestes a limpar a lista deste servidor.\n\n' +
      'AnimeDBot deixará de informar novos episódios dos animes removidos da lista.',
    components: [row],
    flags: 64
  });
}
if (interaction.customId === 'confirm_clear') {

  return clear(
    {
      reply: (msg) => interaction.update({
  content: msg,
  components: []
}),
      guild: interaction.guild
    },
    animeList
  );
}
if (interaction.customId === 'cancel_clear') {

  return interaction.update({
    content: '❌ Limpeza cancelada.',
    components: []
  });
}

};
