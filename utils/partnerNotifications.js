const chalk = require('chalk').default;

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');

const {
  getBestWatchTarget,
  isValidUrl
} = require('./animeLinks');

const {
  loadPartnerChannels,
  loadPartnerSentEpisodes,
  savePartnerSentEpisodes
} = require('./partnerChannelStorage');

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .trim();
}

function getAnimeTitle(anime) {
  return (
    anime?.title?.romaji ||
    anime?.title ||
    'Unknown'
  );
}

function getCoverImageUrl(anime) {
  if (
    typeof anime?.coverImage === 'string'
  ) {
    return anime.coverImage;
  }

  return (
    anime?.coverImage?.large ||
    anime?.coverImage?.medium ||
    null
  );
}

function isPartnerAnime(partner, anime) {
  const animeId =
    Number(anime?.id);

  const animeIds =
    Array.isArray(partner.animeIds)
      ? partner.animeIds.map(Number)
      : [];

  if (
    animeIds.includes(animeId)
  ) {
    return true;
  }

  const title =
    normalize(
      getAnimeTitle(anime)
    );

  const titleIncludes =
    Array.isArray(partner.titleIncludes)
      ? partner.titleIncludes
      : [];

  return titleIncludes.some(value =>
    title.includes(
      normalize(value)
    )
  );
}

function getPartnerSentEntry(
  sent,
  partnerKey,
  animeId,
  episode
) {
  const animeKey =
    String(animeId);

  const episodeKey =
    String(episode);

  sent[partnerKey] =
    sent[partnerKey] || {};

  sent[partnerKey][animeKey] =
    sent[partnerKey][animeKey] || {};

  sent[partnerKey][animeKey][episodeKey] =
    sent[partnerKey][animeKey][episodeKey] || {
      '24h': false,
      release: false
    };

  return sent[partnerKey][animeKey][episodeKey];
}

async function sendPartnerPayload({
  client,
  partnerKey,
  channelId,
  payload
}) {
  try {
    const channel =
      await client.channels.fetch(
        channelId
      );

    if (
      !channel ||
      typeof channel.send !== 'function'
    ) {
      console.log(
        chalk.yellow(
          `[PARTNER] Channel not sendable for ${partnerKey}: ${channelId}`
        )
      );
      return false;
    }

    await channel.send(
      payload
    );

    return true;
  } catch (err) {
    console.log(
      chalk.yellow(
        `[PARTNER] Failed to send notification for ${partnerKey}: ${err.message}`
      )
    );

    return false;
  }
}

function createReleasePayload(anime) {
  const title =
    getAnimeTitle(anime);

  const episode =
    anime.nextAiringEpisode?.episode;

  const embed =
    new EmbedBuilder()
      .setColor(0xff6600)
      .setTitle('🚨 Episódio Disponível!')
      .setDescription(
        `📺 **${title}**\n` +
        `🎯 Episódio ${episode} já está disponível!`
      )
      .setFooter({
        text:
          'AnimeDBot • Boa sessão'
      })
      .setTimestamp();

  const coverImage =
    getCoverImageUrl(anime);

  if (
    coverImage
  ) {
    embed.setImage(
      coverImage
    );
  }

  const watchTarget =
    getBestWatchTarget(anime);

  const payload = {
    embeds: [
      embed
    ]
  };

  if (
    isValidUrl(watchTarget.url)
  ) {
    payload.components = [
      new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel(
              watchTarget.label
            )
            .setStyle(ButtonStyle.Link)
            .setURL(
              watchTarget.url
            )
        )
    ];
  }

  return payload;
}

function create24hPayload(
  anime,
  warningMessage
) {
  const title =
    getAnimeTitle(anime);

  return {
    content:
      `⏰ ${title} • ` +
      `Episódio ${anime.nextAiringEpisode?.episode} ` +
      warningMessage
  };
}

async function notifyPartnerChannels({
  client,
  anime,
  notificationType,
  warningMessage = '',
  options = {}
}) {
  if (
    options.skipPartnerNotifications
  ) {
    return;
  }

  const partners =
    loadPartnerChannels();

  const sent =
    loadPartnerSentEpisodes();

  let changed = false;

  for (
    const [partnerKey, partner] of
    Object.entries(partners)
  ) {
    if (
      !partner?.enabled ||
      !partner.channelId ||
      !isPartnerAnime(partner, anime)
    ) {
      continue;
    }

    if (
      notificationType === '24h' &&
      !partner.send24h
    ) {
      continue;
    }

    if (
      notificationType === 'release' &&
      !partner.sendRelease
    ) {
      continue;
    }

    const sentEntry =
      getPartnerSentEntry(
        sent,
        partnerKey,
        anime.id,
        anime.nextAiringEpisode?.episode
      );

    if (
      sentEntry[notificationType]
    ) {
      continue;
    }

    const payload =
      notificationType === 'release'
        ? createReleasePayload(anime)
        : create24hPayload(
            anime,
            warningMessage
          );

    const delivered =
      await sendPartnerPayload({
        client,
        partnerKey,
        channelId:
          partner.channelId,
        payload
      });

    if (
      delivered
    ) {
      sentEntry[notificationType] = true;
      changed = true;

      console.log(
        chalk.cyan(
          `[PARTNER] ${notificationType} sent to ${partnerKey}`
        )
      );
    }
  }

  if (
    changed
  ) {
    savePartnerSentEpisodes(
      sent
    );
  }
}

module.exports = {
  notifyPartnerChannels
};
