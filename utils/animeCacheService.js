const {
  loadCache,
  saveCache
} = require('./cacheManager');

const {
  getAnimeLinkFields
} = require('./animeLinks');

const NO_EPISODE_TTL_MS = 6 * 60 * 60 * 1000;

function getAnimeTitle(anime) {
  return (
    anime.title?.romaji ||
    anime.title ||
    'Unknown'
  );
}

function getCoverImage(anime) {
  if (typeof anime.coverImage === 'string') {
    return anime.coverImage;
  }

  return (
    anime.coverImage?.large ||
    anime.coverImage?.medium ||
    null
  );
}

function getNextEpisode(anime) {
  return (
    anime.nextAiringEpisode ||
    anime.nextEpisode ||
    null
  );
}

function ensureCacheShape(cache) {
  if (!cache.animes) {
    cache.animes = {};
  }

  if (!cache.stats) {
    cache.stats = {
      totalCached: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  return cache;
}

function upsertAnimeCacheEntry(
  cache,
  anime
) {
  ensureCacheShape(cache);

  if (!anime?.id) {
    return cache;
  }

  const previous =
    cache.animes[anime.id] || {};

  const externalLinks =
    anime.externalLinks?.length
      ? anime.externalLinks
      : previous.externalLinks || [];

  const linkFields =
    getAnimeLinkFields({
      ...previous,
      ...anime,
      externalLinks
    });

  cache.animes[anime.id] = {
    id: anime.id,
    title: getAnimeTitle(anime),
    coverImage: getCoverImage(anime),
    nextEpisode: getNextEpisode(anime),
    externalLinks:
      externalLinks,
    streamingUrl:
      linkFields.streamingUrl,
    streamingProvider:
      linkFields.streamingProvider,
    officialSiteUrl:
      linkFields.officialSiteUrl,
    animePageUrl:
      linkFields.animePageUrl ||
      previous.animePageUrl ||
      previous.siteUrl ||
      null,
    socialUrl:
      linkFields.socialUrl,
    trailerUrl:
      linkFields.trailerUrl,
    trailer:
      anime.trailer ||
      previous.trailer ||
      null,
    startDate:
      anime.startDate ||
      previous.startDate ||
      null,
    episodes:
      anime.episodes ??
      previous.episodes ??
      null,
    relations:
      anime.relations ||
      previous.relations ||
      null,
    status: anime.status,
    lastUpdated: new Date().toISOString()
  };

  cache.stats.totalCached =
    Object.keys(cache.animes).length;

  return cache;
}

function saveAnimeToCache(anime) {
  const cache =
    ensureCacheShape(loadCache());

  upsertAnimeCacheEntry(
    cache,
    anime
  );

  saveCache(cache);
}

function getCachedUpcomingEpisode(
  cache,
  anime
) {
  ensureCacheShape(cache);

  const cachedAnime =
    cache.animes?.[anime.id];

  if (!cachedAnime) {
    return {
      status: 'miss'
    };
  }

  const nowSeconds =
    Math.floor(Date.now() / 1000);

  if (
    cachedAnime.nextEpisode &&
    cachedAnime.nextEpisode.airingAt >
      nowSeconds
  ) {
    return {
      status: 'hit',
      item: {
        title:
          cachedAnime.title ||
          anime.title,
        image:
          cachedAnime.coverImage ||
          getCoverImage(anime),
        episode:
          cachedAnime.nextEpisode.episode,
        airingTime:
          cachedAnime.nextEpisode.airingAt * 1000,
        timeLeft:
          cachedAnime.nextEpisode.airingAt * 1000 -
          Date.now(),
        status:
          cachedAnime.status
      }
    };
  }

  const lastUpdated = cachedAnime.lastUpdated
    ? new Date(cachedAnime.lastUpdated).getTime()
    : 0;

  if (
    !cachedAnime.nextEpisode &&
    Date.now() - lastUpdated <
      NO_EPISODE_TTL_MS
  ) {
    return {
      status: 'fresh-empty'
    };
  }

  return {
    status: 'stale'
  };
}

module.exports = {
  ensureCacheShape,
  getCachedUpcomingEpisode,
  saveAnimeToCache,
  upsertAnimeCacheEntry
};
