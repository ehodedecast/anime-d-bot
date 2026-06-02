const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  SeparatorBuilder,
  SectionBuilder,
  ThumbnailBuilder,
  TextDisplayBuilder
} = require('discord.js');

const { t } =
  require('./language');

function createProfilePayload(
  guildId,
  avatarUrl
) {

  const container =
    new ContainerBuilder()
      .setAccentColor(0x5865F2)
      .addSectionComponents(
        new SectionBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder()
              .setContent(
                `# ${t(guildId, 'profile_title')}`
              )
          )
          .setThumbnailAccessory(
            new ThumbnailBuilder()
              .setURL(avatarUrl)
          )
      )
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
                t(guildId, 'profile_achievements')
              )
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId(
                'profile_titles'
              )
              .setLabel(
                t(guildId, 'profile_titles')
              )
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId(
                'profile_history'
              )
              .setLabel(
                t(guildId, 'profile_history')
              )
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId('menu_back')
              .setLabel(
                t(guildId, 'profile_back')
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
