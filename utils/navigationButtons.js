const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

function createMenuBackButton() {

  return new ButtonBuilder()
    .setCustomId('menu_back')
    .setLabel('Voltar ao Menu')
    .setStyle(ButtonStyle.Secondary);
}

function createActionButton(
  customId,
  label
) {

  return new ButtonBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(ButtonStyle.Primary);
}

function createNavigationRow(
  action
) {

  const row =
    new ActionRowBuilder()
      .addComponents(
        createMenuBackButton()
      );

  if (action) {

    row.addComponents(
      createActionButton(
        action.customId,
        action.label
      )
    );
  }

  return row;
}

function createBackToMenuRow() {

  return createNavigationRow();
}

function createAddNavigationRow() {

  return createNavigationRow({
    customId: 'add_again',
    label: 'Adicionar Outro Anime'
  });
}

function createInfoNavigationRow() {

  return createNavigationRow({
    customId: 'info_again',
    label: 'Pesquisar Outro Anime'
  });
}

function createRemoveNavigationRow() {

  return createNavigationRow({
    customId: 'remove_again',
    label: 'Remover Outro Anime'
  });
}

module.exports = {
  createBackToMenuRow,
  createAddNavigationRow,
  createInfoNavigationRow,
  createRemoveNavigationRow,
  createMenuBackButton
};
