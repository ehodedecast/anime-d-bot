const axios = require('axios');
const { t } = require('../utils/language');
const {
  createNextPayload
} = require('../utils/componentsV2Next');
const state = require('../state/state');
const {
  loadCache,
  saveCache
} = require('../utils/cacheManager');
const {
  ensureCacheShape,
  getCachedUpcomingEpisode,
  upsertAnimeCacheEntry
} = require('../utils/animeCacheService');

const ITEMS_PER_PAGE = 5;
const PAGINATION_TTL_MS = 10 * 60 * 1000;

function formatTimeLeft(ms) {
  if (ms <= 0) {
    return 'Ja lancado';
  }

  const totalMinutes =
    Math.floor(ms / 60000);
  const days =
    Math.floor(totalMinutes / 1440);
  const hours =
    Math.floor((totalMinutes % 1440) / 60);
  const minutes =
    totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

async function fetchUpcomingEpisodes(
  animeList
) {

  const results = [];
  const cache =
    ensureCacheShape(
      loadCache()
    );
  let cacheChanged = false;

  for (const anime of animeList) {
    const cached =
      getCachedUpcomingEpisode(
        cache,
        anime
      );

    if (cached.status === 'hit') {
      cache.stats.cacheHits += 1;
      cacheChanged = true;
      results.push(cached.item);
      continue;
    }

    if (cached.status === 'fresh-empty') {
      cache.stats.cacheHits += 1;
      cacheChanged = true;
      continue;
    }

    cache.stats.cacheMisses += 1;
    cacheChanged = true;

    try {
      const query = `
        query {
          Media(id: ${anime.id}, type: ANIME) {
            isAdult
            title {
              romaji
            }
            coverImage {
              medium
            }
            status
            nextAiringEpisode {
              episode
              airingAt
            }
          }
        }`;

      const res =
        await axios.post(
          'https://graphql.anilist.co/graphql',
          { query }
        );

      const data =
        res.data.data.Media;

      if (
        !data ||
        data.isAdult
      ) {
        continue;
      }

      upsertAnimeCacheEntry(
        cache,
        data
      );

      if (
        !data.nextAiringEpisode
      ) {
        continue;
      }

      const airingTime =
        data.nextAiringEpisode.airingAt * 1000;

      results.push({
        title:
          data.title.romaji,
        image:
          data.coverImage?.medium,
        episode:
          data.nextAiringEpisode.episode,
        airingTime,
        timeLeft:
          airingTime - Date.now(),
        status:
          data.status
      });
    } catch (err) {
      console.log(
        `NEXT FAILED: ${anime.title}`
      );
    }
  }

  if (cacheChanged) {
    saveCache(cache);
  }

  return results.sort(
    (a, b) =>
      a.airingTime - b.airingTime
  );
}

function getStoredNextResults(
  userId
) {

  const pagination =
    state.nextPagination?.[userId];

  if (
    !pagination ||
    !Array.isArray(pagination.results)
  ) {
    return null;
  }

  if (
    Date.now() - pagination.createdAt >
    PAGINATION_TTL_MS
  ) {
    delete state.nextPagination[userId];
    return null;
  }

  return [
    ...pagination.results
  ];
}

function storeNextResults(
  userId,
  results
) {

  state.nextPagination[userId] = {
    results: [
      ...results
    ],
    createdAt:
      Date.now()
  };
}

async function next(
  message,
  animeList = [],
  currentPage = 0,
  options = {}
) {

  try {
    const userAnime =
      Array.isArray(animeList)
        ? animeList
        : [];

    if (
      userAnime.length === 0
    ) {
      return message.reply(
        'Voce ainda nao adicionou animes a sua lista pessoal.'
      );
    }

    const userId =
      message.author?.id;

    let allItems =
      options.useStored && userId
        ? getStoredNextResults(userId)
        : null;

    if (!allItems) {
      allItems =
        await fetchUpcomingEpisodes(
          userAnime
        );

      if (userId) {
        storeNextResults(
          userId,
          allItems
        );
      }
    }

    if (
      allItems.length === 0
    ) {
      return message.reply(
        t(
          message.guild.id,
          'next_episode_not_found'
        )
      );
    }

    const totalPages =
      Math.ceil(
        allItems.length / ITEMS_PER_PAGE
      );

    const safePage =
      Math.min(
        Math.max(
          Number.isFinite(currentPage)
            ? currentPage
            : 0,
          0
        ),
        totalPages - 1
      );

    const pageItems =
      allItems.slice(
        safePage * ITEMS_PER_PAGE,
        safePage * ITEMS_PER_PAGE +
          ITEMS_PER_PAGE
      );

    return message.reply(
      createNextPayload({
        guildId:
          message.guild.id,
        pageItems,
        safePage,
        totalPages,
        formatTimeLeft
      })
    );
  } catch (err) {
    console.log(err);

    return message.reply(
      t(
        message.guild.id,
        'error_occurred'
      )
    );
  }
}

module.exports = next;
