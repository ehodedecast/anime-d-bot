const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const {
  getBestWatchTarget,
  isValidUrl
} = require('./animeLinks');

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
  label = 'Assistir'
}) {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(
          createWatchOpenCustomId({
            userId,
            animeId,
            episode
          })
        )
        .setLabel(label)
        .setStyle(ButtonStyle.Primary)
    );
}

function createWatchReadyRow({
  userId,
  animeId,
  episode,
  url,
  label = 'Assistir novamente'
}) {
  const row =
    new ActionRowBuilder();

  if (
    isValidUrl(url)
  ) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel(label)
        .setStyle(ButtonStyle.Link)
        .setURL(url)
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
      .setLabel('Ja Assisti')
      .setStyle(ButtonStyle.Success)
  );

  return row;
}

function createWatchedRow({
  url,
  label = 'Assistir novamente'
}) {
  const row =
    new ActionRowBuilder();

  if (
    isValidUrl(url)
  ) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel(label)
        .setStyle(ButtonStyle.Link)
        .setURL(url)
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
