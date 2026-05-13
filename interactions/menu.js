const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { t } = require('../utils/language');
function sendMenu(target) {
  const guildId = target.guild.id;
  console.log('SENDMENU EXECUTADO');

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(
  t(guildId, 'menu_title')
)
    .setDescription(
     t(guildId, 'menu_description')
    )
    .setFooter({
      text: 'AnimeDBot • DBots'
    })
    .setTimestamp();

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('menu_add')
      .setLabel(
  t(guildId, 'button_add_anime')
)
      .setEmoji('➕')
      .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
      .setCustomId('menu_next')
      .setLabel(
  t(guildId, 'button_next_episode')
)
      .setEmoji('🎯')
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId('menu_info')
      .setLabel(
  t(guildId, 'button_anime_info')
)
      .setEmoji('ℹ️')
      .setStyle(ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('menu_list')
      .setLabel(
  t(guildId, 'button_anime_list')
)
      .setEmoji('📋')
      .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
      .setCustomId('menu_remove')
      .setLabel(
  t(guildId, 'button_remove_anime')
)
      .setEmoji('🗑️')
      .setStyle(ButtonStyle.Danger)

    
  );

  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('menu_clear')
      .setLabel(
  t(guildId, 'button_clear_list')
)
      .setEmoji('🧹')
      .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
      .setCustomId('menu_help')
      .setLabel(
  t(guildId, 'button_help')
)
      .setEmoji('❓')
      .setStyle(ButtonStyle.Primary)
    
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