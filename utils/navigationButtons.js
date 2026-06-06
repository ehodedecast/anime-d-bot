const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const {
  t,
  tUser
} = require('./language');

function translate(
  guildId,
  userId,
  key
) {
  return userId
    ? tUser(userId, key, guildId)
    : t(guildId, key);
}

function createMenuBackButton(
  guildId = null,
  userId = null
) {

  return new ButtonBuilder()
    .setCustomId('menu_back')
    .setLabel(
      translate(
        guildId,
        userId,
        'nav_back_menu'
      )
    )
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
  action,
  guildId = null,
  userId = null
) {

  const row =
    new ActionRowBuilder()
      .addComponents(
        createMenuBackButton(
          guildId,
          userId
        )
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

function createBackToMenuRow(
  guildId = null,
  userId = null
) {

  return createNavigationRow(
    null,
    guildId,
    userId
  );
}

function createAddNavigationRow(
  guildId = null,
  userId = null
) {

  return createNavigationRow(
    {
      customId: 'add_again',
      label:
        translate(
          guildId,
          userId,
          'nav_add_again'
        )
    },
    guildId,
    userId
  );
}

function createInfoNavigationRow(
  guildId = null,
  userId = null
) {

  return createNavigationRow(
    {
      customId: 'info_again',
      label:
        translate(
          guildId,
          userId,
          'nav_info_again'
        )
    },
    guildId,
    userId
  );
}

function createRemoveNavigationRow(
  guildId = null,
  userId = null
) {

  return createNavigationRow(
    {
      customId: 'remove_again',
      label:
        translate(
          guildId,
          userId,
          'nav_remove_again'
        )
    },
    guildId,
    userId
  );
}

module.exports = {
  createBackToMenuRow,
  createAddNavigationRow,
  createInfoNavigationRow,
  createRemoveNavigationRow,
  createMenuBackButton
};
