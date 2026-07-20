const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const {
  getBestWatchTarget,
  isValidUrl
} = require('./animeLinks');

const {
  t,
  tUser
} = require('./language');

function translate({
  guildId,
  userIdForLanguage,
  key
}) {
  return userIdForLanguage
    ? tUser(
        userIdForLanguage,
        key,
        guildId
      )
    : t(
        guildId,
        key
      );
}

function createWatchOpenCustomId({
  userId,
  animeId,
  episode
}) {
  return `watch_open:${userId}:${animeId}:${episode}`;
}

function createWatchDoneCustomId({
  userId,
  animeId,
  episode
}) {
  return `watch_done:${userId}:${animeId}:${episode}`;
}

function parseWatchCustomId(customId) {
  const [
    action,
    userId,
    animeId,
    episode
  ] = String(customId || '').split(':');

  return {
    action,
    userId,
    animeId,
    episode
  };
}

function createWatchOpenRow({
  userId,
  animeId,
  episode,
  url = null,
  guildId = null,
  userIdForLanguage = null,
  hasStreaming = true,
  officialSiteUrl = null
}) {
  const row =
    new ActionRowBuilder();

  if (
    hasStreaming &&
    isValidUrl(url)
  ) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel(
          translate({
            guildId,
            userIdForLanguage,
            key: 'watch_button'
          })
        )
        .setStyle(ButtonStyle.Link)
        .setURL(url)
    );
  } else {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(
          `watch_missing:${userId}:${animeId}:${episode}`
        )
        .setLabel(
          translate({
            guildId,
            userIdForLanguage,
            key: 'watch_link_not_found'
          })
        )
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );
  }

  if (
    isValidUrl(officialSiteUrl)
  ) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel(
          translate({
            guildId,
            userIdForLanguage,
            key: 'official_site_button'
          })
        )
        .setStyle(ButtonStyle.Link)
        .setURL(
          officialSiteUrl
        )
    );
  }

  row.addComponents(
    new ButtonBuilder()
      .setCustomId(
        createWatchDoneCustomId({
          userId,
          animeId,
          episode
        })
      )
      .setLabel(
        translate({
          guildId,
          userIdForLanguage,
          key: 'watched_button'
        })
      )
      .setStyle(ButtonStyle.Success)
  );

  return row;
}

function createWatchReadyRow({
  userId,
  animeId,
  episode,
  url,
  officialSiteUrl = null,
  guildId = null,
  userIdForLanguage = null
}) {
  const row =
    new ActionRowBuilder();

  if (
    isValidUrl(url)
  ) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel(
          translate({
            guildId,
            userIdForLanguage,
            key: 'watch_again_button'
          })
        )
        .setStyle(ButtonStyle.Link)
        .setURL(url)
    );
  }

  if (
    isValidUrl(officialSiteUrl)
  ) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel(
          translate({
            guildId,
            userIdForLanguage,
            key: 'official_site_button'
          })
        )
        .setStyle(ButtonStyle.Link)
        .setURL(
          officialSiteUrl
        )
    );
  }

  if (
    isValidUrl(url)
  ) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(
          createWatchDoneCustomId({
            userId,
            animeId,
            episode
          })
        )
        .setLabel(
          translate({
            guildId,
            userIdForLanguage,
            key: 'watched_button'
          })
        )
        .setStyle(ButtonStyle.Success)
    );
  }

  return row;
}

function createWatchedRow({
  url,
  officialSiteUrl = null,
  guildId = null,
  userIdForLanguage = null
}) {
  const row =
    new ActionRowBuilder();

  if (
    isValidUrl(url)
  ) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel(
          translate({
            guildId,
            userIdForLanguage,
            key: 'watch_again_button'
          })
        )
        .setStyle(ButtonStyle.Link)
        .setURL(url)
    );
  }

  if (
    isValidUrl(officialSiteUrl)
  ) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel(
          translate({
            guildId,
            userIdForLanguage,
            key: 'official_site_button'
          })
        )
        .setStyle(ButtonStyle.Link)
        .setURL(
          officialSiteUrl
        )
    );
  }

  return row.components.length
    ? row
    : null;
}

module.exports = {
  createWatchOpenRow,
  createWatchReadyRow,
  createWatchedRow,
  getBestWatchTarget,
  parseWatchCustomId
};
