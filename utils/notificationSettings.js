const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  SeparatorBuilder,
  StringSelectMenuBuilder,
  TextDisplayBuilder
} = require('discord.js');

const {
  getUserLanguage,
  tUser
} = require('./language');

const NOTIFICATION_SETTINGS_BUTTON_ID =
  'notification_settings_open';

const NOTIFICATION_SETTINGS_LANGUAGE_ID =
  'notification_settings_language';

const NOTIFICATION_SETTINGS_CLOSE_ID =
  'notification_settings_close';

const NOTIFICATION_SETTINGS_LANGUAGE_SELECT_ID =
  'notification_settings_language_select';

const LANGUAGE_NAMES = {
  en:
    'English',
  pt:
    'Português',
  es:
    'Español'
};

function createTextDisplay(
  content
) {

  return new TextDisplayBuilder()
    .setContent(
      content
    );
}

function createNotificationSettingsButton({
  userId,
  guildId = null
}) {

  return new ButtonBuilder()
    .setCustomId(
      `${NOTIFICATION_SETTINGS_BUTTON_ID}:${userId}`
    )
    .setLabel(
      tUser(
        userId,
        'notification_settings_button',
        guildId
      )
    )
    .setStyle(
      ButtonStyle.Secondary
    );
}

function createNotificationSettingsRow({
  userId,
  guildId = null
}) {

  return new ActionRowBuilder()
    .addComponents(
      createNotificationSettingsButton({
        userId,
        guildId
      })
    );
}

function withNotificationSettingsButton({
  payload,
  userId,
  guildId = null
}) {

  return {
    ...payload,
    components: [
      ...(payload.components || []),
      createNotificationSettingsRow({
        userId,
        guildId
      })
    ]
  };
}

function createSettingsActionRow(
  userId
) {

  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(
          `${NOTIFICATION_SETTINGS_LANGUAGE_ID}:${userId}`
        )
        .setLabel(
          tUser(
            userId,
            'notification_settings_language_button'
          )
        )
        .setStyle(
          ButtonStyle.Primary
        ),
      new ButtonBuilder()
        .setCustomId(
          `${NOTIFICATION_SETTINGS_CLOSE_ID}:${userId}`
        )
        .setLabel(
          tUser(
            userId,
            'notification_settings_close_button'
          )
        )
        .setStyle(
          ButtonStyle.Secondary
        )
    );
}

function createNotificationSettingsPanel(
  userId
) {

  const language =
    getUserLanguage(
      userId,
      null
    );

  const container =
    new ContainerBuilder()
      .setAccentColor(
        0xff6600
      )
      .addTextDisplayComponents(
        createTextDisplay(
          [
            `## ${tUser(userId, 'notification_settings_title')}`,
            '',
            `${tUser(userId, 'notification_settings_language_label')}:`,
            LANGUAGE_NAMES[language] || LANGUAGE_NAMES.en,
            '',
            tUser(userId, 'notification_settings_choose')
          ].join('\n')
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
      )
      .addActionRowComponents(
        createSettingsActionRow(
          userId
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

function createLanguageSelectPanel(
  userId
) {

  const currentLanguage =
    getUserLanguage(
      userId,
      null
    );

  const select =
    new StringSelectMenuBuilder()
      .setCustomId(
        `${NOTIFICATION_SETTINGS_LANGUAGE_SELECT_ID}:${userId}`
      )
      .setPlaceholder(
        tUser(
          userId,
          'notification_settings_language_select'
        )
      )
      .addOptions(
        Object.entries(LANGUAGE_NAMES)
          .map(([value, label]) => ({
            label,
            value,
            default:
              value === currentLanguage
          }))
      );

  const container =
    new ContainerBuilder()
      .setAccentColor(
        0xff6600
      )
      .addTextDisplayComponents(
        createTextDisplay(
          [
            `## ${tUser(userId, 'notification_settings_language_title')}`,
            '',
            tUser(userId, 'notification_settings_language_description')
          ].join('\n')
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
      )
      .addActionRowComponents(
        new ActionRowBuilder()
          .addComponents(
            select
          )
      )
      .addActionRowComponents(
        new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(
                `${NOTIFICATION_SETTINGS_CLOSE_ID}:${userId}`
              )
              .setLabel(
                tUser(
                  userId,
                  'notification_settings_close_button'
                )
              )
              .setStyle(
                ButtonStyle.Secondary
              )
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

function createNotificationSettingsMessagePanel(
  userId,
  key
) {

  const container =
    new ContainerBuilder()
      .setAccentColor(
        0xff6600
      )
      .addTextDisplayComponents(
        createTextDisplay(
          tUser(
            userId,
            key
          )
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
  NOTIFICATION_SETTINGS_BUTTON_ID,
  NOTIFICATION_SETTINGS_CLOSE_ID,
  NOTIFICATION_SETTINGS_LANGUAGE_ID,
  NOTIFICATION_SETTINGS_LANGUAGE_SELECT_ID,
  createLanguageSelectPanel,
  createNotificationSettingsMessagePanel,
  createNotificationSettingsPanel,
  createNotificationSettingsRow,
  withNotificationSettingsButton
};
