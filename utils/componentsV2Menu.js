const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  SeparatorBuilder,
  TextDisplayBuilder
} = require('discord.js');

const { t } =
  require('./language');

const MENU_BANNER_URL =
  'https://raw.githubusercontent.com/ehodedecast/anime-d-bot/refs/heads/main/assets/banner.png';

const VOTE_URL =
  'https://top.gg/bot/1500880961603244112/vote';

function createMenuButton({
  customId,
  label,
  style
}) {

  return new ButtonBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(style);
}

function createMainMenuComponents(
  guildId
) {

  const container =
    new ContainerBuilder()
      .setAccentColor(0x5865F2)
      .addTextDisplayComponents(
        new TextDisplayBuilder()
          .setContent(
            `# ${t(guildId, 'menu_title')}`
          )
      )
      .addMediaGalleryComponents(
        new MediaGalleryBuilder()
          .addItems(
            new MediaGalleryItemBuilder()
              .setURL(MENU_BANNER_URL)
          )
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder()
          .setContent(
            t(
              guildId,
              'menu_v2_description'
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
            createMenuButton({
              customId: 'menu_add',
              label:
                t(guildId, 'button_add_anime'),
              style:
                ButtonStyle.Primary
            }),
            createMenuButton({
              customId: 'menu_next',
              label:
                t(guildId, 'button_next_episode'),
              style:
                ButtonStyle.Secondary
            }),
            createMenuButton({
              customId: 'menu_info',
              label:
                t(guildId, 'button_anime_info'),
              style:
                ButtonStyle.Secondary
            })
          )
      )
      .addActionRowComponents(
        new ActionRowBuilder()
          .addComponents(
            createMenuButton({
              customId: 'menu_list',
              label:
                t(guildId, 'button_anime_list'),
              style:
                ButtonStyle.Secondary
            }),
            createMenuButton({
              customId: 'menu_remove',
              label:
                t(guildId, 'button_remove_anime'),
              style:
                ButtonStyle.Secondary
            }),
            createMenuButton({
              customId: 'menu_clear',
              label:
                t(guildId, 'button_clear_list'),
              style:
                ButtonStyle.Danger
            })
          )
      )
      .addActionRowComponents(
        new ActionRowBuilder()
          .addComponents(
            createMenuButton({
              customId: 'menu_help',
              label:
                t(guildId, 'button_help'),
              style:
                ButtonStyle.Primary
            }),
            new ButtonBuilder()
              .setLabel(
                t(guildId, 'button_vote')
              )
              .setStyle(ButtonStyle.Link)
              .setURL(VOTE_URL)
          )
      );

  return [container];
}

function createMainMenuPayload(
  guildId
) {

  return {
    flags:
      MessageFlags.IsComponentsV2,
    components:
      createMainMenuComponents(
        guildId
      )
  };
}

module.exports = {
  createMainMenuPayload
};
