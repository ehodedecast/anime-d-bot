const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  SeparatorBuilder
} = require('discord.js');

const { tUser } =
  require('./language');

function createProfilePayload(
  guildId,
  userId
) {

  const container =
    new ContainerBuilder()
      .setAccentColor(0x5865F2)
      .addMediaGalleryComponents(
        new MediaGalleryBuilder()
          .addItems(
            new MediaGalleryItemBuilder()
              .setURL(
                'attachment://profile_card.png'
              )
          )
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
      )
      .addActionRowComponents(
        new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(
                'profile_achievements'
              )
              .setLabel(
                tUser(userId, 'profile_achievements', guildId)
              )
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId(
                'profile_titles'
              )
              .setLabel(
                tUser(userId, 'profile_titles', guildId)
              )
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId(
                'profile_history'
              )
              .setLabel(
                tUser(userId, 'profile_history', guildId)
              )
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId('menu_back')
              .setLabel(
                tUser(userId, 'profile_back', guildId)
              )
              .setStyle(ButtonStyle.Primary)
          )
      );

  return {
    flags:
      MessageFlags.IsComponentsV2,
    components: [
      container
    ]
  };
}

module.exports = {
  createProfilePayload
};
