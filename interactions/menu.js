const { ButtonBuilder, ActionRowBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = (message) => {

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('menu_add')
      .setLabel('Adicionar')
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId('menu_next')
      .setLabel('Próximo')
      .setStyle(ButtonStyle.Success)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('menu_info')
      .setLabel('Info')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('menu_list')
      .setLabel('Lista')
      .setStyle(ButtonStyle.Secondary)
  );

  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('menu_clear')
      .setLabel('Limpar')
      .setStyle(ButtonStyle.Danger)
  );

  const embed = new EmbedBuilder()
    .setTitle('🤖 AnimeDBot')
    .setDescription('Escolha uma opção:')
    .setColor(0x5865F2);

  return message.reply({
    embeds: [embed],
    components: [row1, row2, row3]
  });
};