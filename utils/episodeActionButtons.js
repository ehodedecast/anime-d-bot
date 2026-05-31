const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

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

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'http:' ||
      url.protocol === 'https:'
    );
  } catch {
    return false;
  }
}

function getBestWatchUrl(anime) {
  const externalLink =
    (anime.externalLinks || [])
      .find(link =>
        isValidUrl(link?.url)
      );

  if (externalLink?.url) {
    return externalLink.url;
  }

  if (anime.id) {
    return `https://anilist.co/anime/${anime.id}`;
  }

  return null;
}

function createWatchOpenRow({
  userId,
  animeId,
  episode
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
        .setLabel('Assistir')
        .setStyle(ButtonStyle.Primary)
    );
}

function createWatchReadyRow({
  userId,
  animeId,
  episode,
  url
}) {
  const row =
    new ActionRowBuilder();

  if (
    isValidUrl(url)
  ) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel('Assistir novamente')
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
  url
}) {
  const row =
    new ActionRowBuilder();

  if (
    isValidUrl(url)
  ) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel('Assistir novamente')
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
  getBestWatchUrl,
  parseWatchCustomId
};
