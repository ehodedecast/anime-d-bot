const axios = require('axios');

const chalk = require('chalk').default;

const {
  getAnimeLinkFields,
  isTrailerUrl,
  isValidUrl
} = require('./animeLinks');

const {
  loadCache,
  saveCache
} = require('./cacheManager');

const {
  ensureCacheShape,
  upsertAnimeCacheEntry
} = require('./animeCacheService');

const {
  getTrailerProgress,
  getPendingTrailerEntries,
  markTrailerSent,
  markTrailerWaiting
} = require('./userProfileStorage');

const {
  t,
  tUser
} = require('./language');

function getAnimeTitle(anime) {
  return (
    anime?.title?.romaji ||
    anime?.title ||
    'Unknown'
  );
}

function getStartDateTime(startDate) {
  if (
    !startDate?.year ||
    !startDate?.month ||
    !startDate?.day
  ) {
    return null;
  }

  return new Date(
    Date.UTC(
      startDate.year,
      startDate.month - 1,
      startDate.day
    )
  ).getTime();
}

function isNotYetReleased(anime) {
  if (
    anime?.status === 'NOT_YET_RELEASED'
  ) {
    return true;
  }

  const startDateTime =
    getStartDateTime(
      anime?.startDate
    );

  return Boolean(
    startDateTime &&
    startDateTime > Date.now()
  );
}

function getTrailerUrl(anime) {
  const links =
    getAnimeLinkFields(anime);

  if (
    isValidUrl(links.trailerUrl) &&
    isTrailerUrl(links.trailerUrl)
  ) {
    return links.trailerUrl;
  }

  return null;
}

async function sendTrailerDm({
  client,
  userId,
  animeTitle,
  trailerUrl,
  guildId = null,
  options = {}
}) {
  try {
    const targetUserId =
      options.testUserId ||
      userId;

    const user =
      await client.users.fetch(
        targetUserId
      );

    await user.send(
      tUser(targetUserId, 'trailer_available', guildId)
        .replace('{anime}', animeTitle) +
      `\n\n${trailerUrl}`
    );

    return true;
  } catch (err) {
    console.log(
      chalk.yellow(
        `${t(guildId, 'trailer_dm_failed')} ${userId}: ${err.message}`
      )
    );

    return false;
  }
}

async function handleTrailerAfterAdd({
  client,
  userId,
  username,
  anime,
  guildId = null,
  options = {}
}) {
  if (
    !client ||
    !isNotYetReleased(anime)
  ) {
    return {
      status: 'ignored'
    };
  }

  const animeTitle =
    getAnimeTitle(anime);

  const existing =
    getTrailerProgress({
      userId,
      animeId:
        anime.id
    });

  if (
    existing?.sent
  ) {
    return {
      status: 'already_sent'
    };
  }

  const trailerUrl =
    getTrailerUrl(anime);

  if (
    !trailerUrl
  ) {
    markTrailerWaiting({
      userId,
      username,
      animeId:
        anime.id,
      animeTitle
    });

    return {
      status: 'waiting'
    };
  }

  const delivered =
    await sendTrailerDm({
      client,
      userId,
      animeTitle,
      trailerUrl,
      guildId,
      options
    });

  if (
    delivered &&
    !options.testUserId
  ) {
    markTrailerSent({
      userId,
      username,
      animeId:
        anime.id,
      animeTitle,
      trailerUrl
    });

    return {
      status: 'sent'
    };
  }

  markTrailerWaiting({
    userId,
    username,
    animeId:
      anime.id,
    animeTitle,
    trailerUrl
  });

  return {
    status: 'dm_failed'
  };
}

async function fetchAnimeForTrailer(animeId) {
  const query = `
    query {
      Media(id: ${Number(animeId)}, type: ANIME) {
        id
        siteUrl
        status
        startDate {
          year
          month
          day
        }
        title {
          romaji
        }
        coverImage {
          large
          medium
        }
        nextAiringEpisode {
          episode
          airingAt
        }
        trailer {
          id
          site
          thumbnail
        }
        externalLinks {
          site
          url
        }
      }
    }`;

  const response =
    await axios.post(
      'https://graphql.anilist.co/graphql',
      {
        query
      }
    );

  return response.data?.data?.Media || null;
}

async function processPendingTrailers(
  client,
  options = {}
) {
  const pending =
    getPendingTrailerEntries();

  if (
    !pending.length
  ) {
    return {
      checked: 0,
      sent: 0
    };
  }

  const cache =
    ensureCacheShape(
      loadCache()
    );

  let sent = 0;
  let cacheChanged = false;

  for (
    const entry of pending
  ) {
    try {
      const cachedAnime =
        cache.animes?.[entry.animeId];

      let anime =
        cachedAnime || null;

      let trailerUrl =
        anime
          ? getTrailerUrl(anime)
          : null;

      if (
        !trailerUrl
      ) {
        anime =
          await fetchAnimeForTrailer(
            entry.animeId
          );

        if (
          !anime
        ) {
          continue;
        }

        upsertAnimeCacheEntry(
          cache,
          anime
        );
        cacheChanged = true;

        trailerUrl =
          getTrailerUrl(anime);
      }

      if (
        !trailerUrl
      ) {
        continue;
      }

      const animeTitle =
        getAnimeTitle(anime) ||
        entry.animeTitle;

      const delivered =
        await sendTrailerDm({
          client,
          userId:
            entry.userId,
          animeTitle,
          trailerUrl,
          options
        });

      if (
        delivered &&
        !options.testUserId
      ) {
        markTrailerSent({
          userId:
            entry.userId,
          username:
            entry.username,
          animeId:
            entry.animeId,
          animeTitle,
          trailerUrl
        });

        sent++;
      }
    } catch (err) {
      console.log(
        chalk.yellow(
          `Trailer check failed for ${entry.animeId}: ${err.message}`
        )
      );
    }
  }

  if (
    cacheChanged
  ) {
    saveCache(cache);
  }

  return {
    checked:
      pending.length,
    sent
  };
}

module.exports = {
  getTrailerUrl,
  handleTrailerAfterAdd,
  isNotYetReleased,
  processPendingTrailers,
  sendTrailerDm
};
