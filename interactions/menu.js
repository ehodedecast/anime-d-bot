const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function sendMenu(target) {

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('🤖 AnimeDBot')
    .setDescription(
      'Controle seus animes de forma simples.\n\n' +

      '**📺 Animes**\n' +
      '➕ Adicionar anime\n' +
      '📋 Ver lista\n' +
      '🧹 Limpar lista\n\n' +

      '**⏰ Episódios**\n' +
      '🎯 Próximo episódio\n\n' +

      '**📚 Informações**\n' +
      'ℹ️ Detalhes do anime'
    )
    .setFooter({
      text: 'AnimeDBot • André Castro'
    })
    .setTimestamp();

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('menu_add')
      .setLabel('Adicionar')
      .setEmoji('➕')
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId('menu_list')
      .setLabel('Lista')
      .setEmoji('📋')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('menu_clear')
      .setLabel('Limpar lista')
      .setEmoji('🧹')
      .setStyle(ButtonStyle.Danger)
  );

  const row2 = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
  .setCustomId('menu_home')
  .setLabel('Menu')
  .setEmoji('🏠')
  .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('menu_next')
      .setLabel('Próximo')
      .setEmoji('🎯')
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId('menu_info')
      .setLabel('Info')
      .setEmoji('ℹ️')
      .setStyle(ButtonStyle.Secondary)
  );

  if (target.update) {
  return target.update({
    embeds: [embed],
    components: [row1, row2]
  });
}

return target.reply({
  embeds: [embed],
  components: [row1, row2]
});
}

module.exports = sendMenu;