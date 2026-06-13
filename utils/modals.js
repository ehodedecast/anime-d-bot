const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

function createAnimeNameModal(
  customId,
  title,
  label
) {

  const input =
    new TextInputBuilder()
      .setCustomId('anime_name')
      .setLabel(label)
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

  return new ModalBuilder()
    .setCustomId(customId)
    .setTitle(title)
    .addComponents(
      new ActionRowBuilder()
        .addComponents(input)
    );
}

function createPasswordModal(
  customId,
  title,
  label
) {

  const input =
    new TextInputBuilder()
      .setCustomId('password')
      .setLabel(label)
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

  return new ModalBuilder()
    .setCustomId(customId)
    .setTitle(title)
    .addComponents(
      new ActionRowBuilder()
        .addComponents(input)
    );
}

module.exports = {
  createAnimeNameModal,
  createPasswordModal
};
