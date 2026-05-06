
const fs = require('fs');
const add = require('../commands/add');
const list = require('../commands/list');
const next = require('../commands/next');
const info = require('../commands/info');
const clear = require('../commands/clear');
const sendMenu = require('./menu');
const state = require('../state/state');


module.exports = async (interaction, animeList, waitingForAdd) => {
	console.log('BOTÃO CLICADO:', interaction.customId);
	
	// 🔹 BOTAO MENU
	if (interaction.customId === 'menu_home') {
  return sendMenu(interaction);
}

 // 🔹 BOTAO ADD
  if (interaction.customId === 'menu_add') {
  state.waitingForAdd[interaction.user.id] = true;

  return interaction.update('✏️ Digite o nome do anime:');
}

// 🔹 BOTAO LISTA
  if (interaction.customId === 'menu_list') {
  return list(
  {
    reply: (msg) => interaction.reply(msg),
    guild: interaction.guild
  },
  animeList
);
}

// 🔹 BOTAO LIMPAR
if (interaction.customId === 'menu_clear') {
  return clear(
  {
    reply: (msg) => interaction.reply(msg),
    guild: interaction.guild
  },
  animeList
);
}

// 🔹 BOTAO NEXT
  if (interaction.customId === 'menu_next') {
  state.waitingForNext = state.waitingForNext || {};
  state.waitingForNext[interaction.user.id] = true;

  return interaction.update('🔍 Digite o nome do anime:');
}

// 🔹 BOTAO INFO
if (interaction.customId === 'menu_info') {
  state.waitingForInfo = state.waitingForInfo || {};
  state.waitingForInfo[interaction.user.id] = true;

  return interaction.update('📚 Digite o nome do anime:');
}
};
