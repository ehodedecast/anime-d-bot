const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function sendMenu(target) {
  console.log('SENDMENU EXECUTADO');

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('🤖 ANIMEDBOT')
    .setDescription(
      'Adicione animes e receba avisos de novos episódios automaticamente.\n\n' +

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
      .setLabel('Adicionar anime')
      .setEmoji('➕')
      .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
      .setCustomId('menu_next')
      .setLabel('Próximo episódio')
      .setEmoji('🎯')
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId('menu_info')
      .setLabel('Informações do anime')
      .setEmoji('ℹ️')
      .setStyle(ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('menu_list')
      .setLabel('Lista de animes')
      .setEmoji('📋')
      .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
      .setCustomId('menu_remove')
      .setLabel('Remover anime')
      .setEmoji('🗑️')
      .setStyle(ButtonStyle.Danger)

    
  );

  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('menu_clear')
      .setLabel('Limpar lista')
      .setEmoji('🧹')
      .setStyle(ButtonStyle.Danger)
    
  );

 if (target.isButton?.()) {
console.log('USANDO UPDATE');
  return target.update({
    embeds: [embed],
    components: [row1, row2, row3]
  });
}

console.log('USANDO REPLY');
return target.reply({
  embeds: [embed],
  components: [row1, row2, row3]
});
}

module.exports = sendMenu;