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
  t
} = require('./language');

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
  guildId = null,
  hasStreaming = true,
  officialSiteUrl = null
}) {
  const row =
    new ActionRowBuilder();

  if (
    hasStreaming
  ) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(
          createWatchOpenCustomId({
            userId,
            animeId,
            episode
          })
        )
        .setLabel(
          t(guildId, 'watch_button')
        )
        .setStyle(ButtonStyle.Primary)
    );
  } else {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(
          `watch_missing:${userId}:${animeId}:${episode}`
        )
        .setLabel(
          t(guildId, 'watch_link_not_found')
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
          t(guildId, 'official_site_button')
        )
        .setStyle(ButtonStyle.Link)
        .setURL(
          officialSiteUrl
        )
    );
  }

  return row;
}

function createWatchReadyRow({
  userId,
  animeId,
  episode,
  url,
  officialSiteUrl = null,
  guildId = null
}) {
  const row =
    new ActionRowBuilder();

  if (
    isValidUrl(url)
  ) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel(
          t(guildId, 'watch_again_button')
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
          t(guildId, 'official_site_button')
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
          t(guildId, 'watched_button')
        )
        .setStyle(ButtonStyle.Success)
    );
  }

  return row;
}

function createWatchedRow({
  url,
  officialSiteUrl = null,
  guildId = null
}) {
  const row =
    new ActionRowBuilder();

  if (
    isValidUrl(url)
  ) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel(
          t(guildId, 'watch_again_button')
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
          t(guildId, 'official_site_button')
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
