const axios = require('axios');

const chalk = require('chalk').default;

const { t } =
  require('./language');
const {
  tUser
} = require('./language');

const {
  loadUserAnimes
} = require('./userAnimeStorage');

const {
  loadSentEpisodes,
  saveSentEpisodes
} = require('./sentStorage');

const {
  saveAnalytics
} = require('./analyticsStorage');

const {
  loadCache,
  saveCache
} = require('./cacheManager');

const {
  EmbedBuilder
} = require('discord.js');

const runtimeStatus =
  require('../state/runtimeStatus');

const {
  createWatchOpenRow,
  getBestWatchTarget
} = require('./episodeActionButtons');

const {
  markEpisodeNotified
} = require('./userProfileStorage');

const {
  getAnimeLinkFields
} = require('./animeLinks');

const {
  notifyPartnerChannels
} = require('./partnerNotifications');

const {
  processPendingTrailers
} = require('./trailerNotifications');

const {
  getSequelCandidate,
  sendSeasonEndPrompt
} = require('./seasonEndService');

function chunkArray(array, size) {

  const result = [];

  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }

  return result;
}

function logAniListRepairDiagnostic({
  phase,
  anime = null,
  query = null,
  response = null,
  error = null,
  validationResult = null,
  brokenCondition = null
}) {

  console.log(
    chalk.cyan(
      `\n[ANIME REPAIR DIAGNOSTIC] ${phase}`
    )
  );

  if (anime) {
    console.log(
      chalk.cyan(
        `[ANIME REPAIR DIAGNOSTIC] Anime: ${anime.title || 'Unknown'} (${anime.id})`
      )
    );
  }

  if (query) {
    console.log(
      chalk.gray(
        `[ANIME REPAIR DIAGNOSTIC] GraphQL query:\n${query}`
      )
    );
  }

  if (response) {
    console.log(
      chalk.gray(
        `[ANIME REPAIR DIAGNOSTIC] HTTP status: ${response.status || 'unknown'}`
      )
    );
    console.log(
      chalk.gray(
        `[ANIME REPAIR DIAGNOSTIC] AniList response body:\n${JSON.stringify(response.data, null, 2)}`
      )
    );
  }

  if (error) {
    console.log(
      chalk.red(
        `[ANIME REPAIR DIAGNOSTIC] Error message: ${error.message}`
      )
    );
    console.log(
      chalk.red(
        `[ANIME REPAIR DIAGNOSTIC] Error code: ${error.code || 'none'}`
      )
    );
    console.log(
      chalk.red(
        `[ANIME REPAIR DIAGNOSTIC] HTTP status: ${error.response?.status || 'none'}`
      )
    );
    console.log(
      chalk.red(
        `[ANIME REPAIR DIAGNOSTIC] Network/timeout/rate-limit: ${(error.code || error.response?.status === 429) ? 'possible' : 'not detected'}`
      )
    );
    console.log(
      chalk.red(
        `[ANIME REPAIR DIAGNOSTIC] AniList error body:\n${JSON.stringify(error.response?.data || null, null, 2)}`
      )
    );
  }

  if (validationResult) {
    console.log(
      chalk.yellow(
        `[ANIME REPAIR DIAGNOSTIC] Validation result: ${validationResult}`
      )
    );
  }

  if (brokenCondition) {
    console.log(
      chalk.yellow(
        `[ANIME REPAIR DIAGNOSTIC] Broken condition: ${brokenCondition}`
      )
    );
  }

  console.log(
    chalk.cyan(
      '[ANIME REPAIR DIAGNOSTIC] Quarantine/repair JSON write skipped for investigation.\n'
    )
  );
}

function quarantineAnime(

  userAnimeData,

  animeId,

  reason

) {

  let quarantined = false;

  for (const userId in userAnimeData) {

    const userAnime =
      userAnimeData[userId]
        ?.anime || [];

    userAnime.forEach(
      anime => {

        if (
          anime.id ===
          animeId
        ) {

          anime.invalid = true;

          anime.invalidReason =
            reason;

          anime.invalidDetectedAt =
            new Date()
              .toISOString();

          quarantined = true;
        }
      }
    );
  }

  return quarantined;
}

function getSentEpisodeEntry(
  sentEpisodes,
  userId,
  animeId,
  episode
) {

  const animeKey =
    String(animeId);

  const episodeKey =
    String(episode);

  sentEpisodes[userId] =
    sentEpisodes[userId] || {};

  sentEpisodes[userId][animeKey] =
    sentEpisodes[userId][animeKey] || {};

  sentEpisodes[userId][animeKey][episodeKey] =
    sentEpisodes[userId][animeKey][episodeKey] || {
      '24h': false,
      release: false
    };

  return sentEpisodes[userId][animeKey][episodeKey];
}

function createCacheEntry(data, previous = {}) {
  const externalLinks =
    data.externalLinks?.length
      ? data.externalLinks
      : previous.externalLinks || [];

  const linkFields =
    getAnimeLinkFields({
      ...previous,
      ...data,
      externalLinks
    });

  return {
    id: data.id,
    title:
      data.title?.romaji ||
      data.title ||
      'Unknown',
    coverImage:
      data.coverImage?.large ||
      data.coverImage ||
      null,
    nextEpisode:
      data.nextAiringEpisode || null,
    externalLinks:
      externalLinks,
    animePageUrl:
      linkFields.animePageUrl ||
      previous.animePageUrl ||
      previous.siteUrl ||
      null,
    streamingUrl:
      linkFields.streamingUrl,
    streamingProvider:
      linkFields.streamingProvider,
    officialSiteUrl:
      linkFields.officialSiteUrl,
    socialUrl:
      linkFields.socialUrl,
    trailerUrl:
      linkFields.trailerUrl,
    trailer:
      data.trailer ||
      previous.trailer ||
      null,
    startDate:
      data.startDate ||
      previous.startDate ||
      null,
    episodes:
      data.episodes ??
      previous.episodes ??
      null,
    relations:
      data.relations ||
      previous.relations ||
      null,
    status:
      data.status ||
      previous.status ||
      null,
    lastUpdated:
      new Date().toISOString()
  };
}

function getWarningMessage(hoursLeft) {
  if (hoursLeft <= 1) {
    return t(
      null,
      'episode_less_than_1h'
    );
  }

  if (hoursLeft <= 6) {
    return t(
      null,
      'episode_less_than_6h'
    );
  }

  return t(
    null,
    'episode_less_than_24h'
  );
}

function getUserWarningMessage(
  userId,
  hoursLeft
) {
  if (hoursLeft <= 1) {
    return tUser(
      userId,
      'episode_less_than_1h'
    );
  }

  if (hoursLeft <= 6) {
    return tUser(
      userId,
      'episode_less_than_6h'
    );
  }

  return tUser(
    userId,
    'episode_less_than_24h'
  );
}

async function getNotificationTarget(
  client,
  userId,
  options
) {

  if (
    options.testUserId
  ) {

    return client.users.fetch(
      options.testUserId
    );
  }

  return client.users.fetch(
    userId
  );
}

async function sendUserNotification({
  client,
  userId,
  animeTitle,
  payload,
  options
}) {

  try {

    const user =
      await getNotificationTarget(
        client,
        userId,
        options
      );

    await user.send(
      payload
    );

    return true;

  } catch {

    console.log(
      chalk.yellow(
        `Could not DM user ${userId} for anime ${animeTitle}`
      )
    );

    return false;
  }
}

async function checkAnime(

  client,

  options = {}

) {

  console.log(
    chalk.cyan('🔄 [CHECK] Iniciando verificação...')
  );

  runtimeStatus.tracker.lastStartedAt =
    new Date().toISOString();
  runtimeStatus.tracker.lastError = null;

  const cache = loadCache();
  if (!cache.animes) {
  cache.animes = {};
}
  const analytics =
  require('./analyticsStorage')
    .loadAnalytics();

  const userAnimeData =
    loadUserAnimes();

  const totalUsers =
    Object.keys(userAnimeData).length;

  const totalGlobal =
  Object.values(userAnimeData)
    .reduce(

      (acc, userData) =>

        acc + (
          userData.anime?.length || 0
        ),

      0
    );

  const sentEpisodes =
    loadSentEpisodes();

  // 🔥 PEGA TODOS OS ANIMES ÚNICOS
  const uniqueAnimes = new Set();

  const animeCount = {};

 for (const userId in userAnimeData) {

  const userAnime =

    userAnimeData[userId]
      ?.anime || [];

  for (
    const anime of
    userAnime
  ) {
    if (
  !anime ||
  !anime.id ||
  !anime.title
) {

  console.log(
    chalk.red(
      `Invalid anime entry for user ${userId}`
    )
  );

  continue;
}
    if (
      anime.mode !==
      'tracking'
    ) {

      continue;
    }

    if (
      anime.invalid
    ) {

      console.log(
        chalk.gray(
          `Skipping quarantined anime for user ${userId}: ${anime.title}`
        )
      );

      continue;
    }

    uniqueAnimes.add(
      JSON.stringify(anime)
    );

    if (
      !animeCount[anime.id]
    ) {

      animeCount[
        anime.id
      ] = {

        title:
          anime.title,

        count: 0
      };
    }

    animeCount[
      anime.id
    ].count++;
  }
}

  const animeArray =
    [...uniqueAnimes].map(
      anime => JSON.parse(anime)
    );

  console.log(
    chalk.cyan(
      `🌍 Total de animes únicos: ${animeArray.length}`
    )
  );

  console.log(
    chalk.yellow(
      `📚 Total global de animes: ${totalGlobal}`
    )
  );

  // 🔥 DIVIDE EM CHUNKS
  const chunks =
    chunkArray(animeArray, 25);

  let totalRequests = 0;

  const savedRequests =
    totalGlobal - totalRequests;

  console.log(
    chalk.green(
      `⚡ Economia de requests: ${savedRequests}`
    )
  );

  const sortedAnimes =
  Object.values(animeCount)
    .sort((a, b) =>
      b.count - a.count
    );

const topAnimes =
  sortedAnimes.slice(0, 5);

let weeklyTop =
  analytics.weeklyTop || [];

const now = Date.now();

const weekMs =
  7 * 24 * 60 * 60 * 1000;
const monthMs =
  30 * 24 * 60 * 60 * 1000;
const yearMs =
  365 * 24 * 60 * 60 * 1000;

const weeklyUpdatedAt =
  analytics.weeklyUpdatedAt
    ? new Date(
        analytics.weeklyUpdatedAt
      ).getTime()
    : 0;
const monthlyUpdatedAt =
  analytics.monthlyUpdatedAt

    ? new Date(
        analytics.monthlyUpdatedAt
      ).getTime()

    : 0;
const yearlyUpdatedAt =
  analytics.yearlyUpdatedAt

    ? new Date(
        analytics.yearlyUpdatedAt
      ).getTime()

    : 0;

if (
  now - weeklyUpdatedAt >
  weekMs
) {

  console.log(
    chalk.yellow(
      '📅 Resetando Weekly Top'
    )
  );

  weeklyTop =
    sortedAnimes.slice(0, 100);
}

let monthlyTop =
  analytics.monthlyTop || [];

if (
  now - monthlyUpdatedAt >
  monthMs
) {

  console.log(
    chalk.yellow(
      '📅 Resetando Monthly Top'
    )
  );

  monthlyTop =
    sortedAnimes.slice(0, 100);
}

let yearlyTop =
  analytics.yearlyTop || [];

if (
  now - yearlyUpdatedAt >
  yearMs
) {

  console.log(
    chalk.yellow(
      '📅 Resetando Yearly Top'
    )
  );

  yearlyTop =
    sortedAnimes.slice(0, 100);
}

const allTimeTop =
  sortedAnimes.slice(0, 100);

  console.log(
    chalk.magenta(
      '🏆 Top 5 Animes Mais Seguidos:'
    )
  );

  topAnimes.forEach((anime, index) => {

    console.log(
      chalk.magenta(
        ` ${index + 1}. ${anime.title} (${anime.count})`
      )
    );
  });

  // 🔥 STATS POR USUARIO
  const guildStats = {};

  for (
  const userId in
  userAnimeData
) {

  const userAnime =

    userAnimeData[userId]
      ?.anime || [];

  guildStats[userId] = {

    animeCount:
      userAnime.length
  };
}

  // 🔥 SALVA ANALYTICS
  saveAnalytics({

    lastCheck:
      new Date().toISOString(),

    totalGuilds:
      totalUsers,

    totalUsers,

    totalGlobal,

    uniqueGlobal:
      animeArray.length,

    totalRequests,

    savedRequests,

    guildStats,

    topAnimes,
weeklyUpdatedAt:

  now - weeklyUpdatedAt >
  weekMs

    ? new Date().toISOString()

    : analytics.weeklyUpdatedAt,

monthlyUpdatedAt:

  now - monthlyUpdatedAt >
  monthMs

    ? new Date().toISOString()

    : analytics.monthlyUpdatedAt,

yearlyUpdatedAt:

  now - yearlyUpdatedAt >
  yearMs

    ? new Date().toISOString()

    : analytics.yearlyUpdatedAt,
    
    weeklyTop,

    monthlyTop,

    yearlyTop,

    allTimeTop,

    animeMetrics:
  analytics.animeMetrics || {}
  });


 // 🔥 PROCESSA CHUNKS

for (const chunk of chunks) {

  const filteredChunk = [];
  const cachedResults = [];
  let querySources = [];

  try {

    chunk.forEach((anime) => {

      const cachedAnime =
        cache.animes[anime.id];

      const nowSeconds =
        Math.floor(Date.now() / 1000);

      if (

  cachedAnime &&
  cachedAnime.nextEpisode &&

  !options.force24h &&
  !options.forceRelease
) {

        console.log(
          chalk.gray(
            `💾 CACHE HIT: ${anime.title}`
          )
        );

        cachedResults.push({

  id: anime.id,

  title: {
    romaji:
      cachedAnime.title
  },

  siteUrl:
    cachedAnime.animePageUrl ||
    cachedAnime.siteUrl,

  status:
    cachedAnime.status,

  episodes:
    cachedAnime.episodes,

  relations:
    cachedAnime.relations,

  startDate:
    cachedAnime.startDate,

  coverImage: {
    large:
      cachedAnime.coverImage
  },

  nextAiringEpisode:
    cachedAnime.nextEpisode,

  externalLinks:
    cachedAnime.externalLinks || [],

  animePageUrl:
    cachedAnime.animePageUrl,

  streamingUrl:
    cachedAnime.streamingUrl,

  streamingProvider:
    cachedAnime.streamingProvider,

  officialSiteUrl:
    cachedAnime.officialSiteUrl,

  socialUrl:
    cachedAnime.socialUrl,

  trailerUrl:
    cachedAnime.trailerUrl,

  trailer:
    cachedAnime.trailer
});

        if (
          cachedAnime.nextEpisode.airingAt >
          nowSeconds
        ) {

return;
        }

        console.log(
          chalk.yellow(
            `CACHE EXPIRED: ${anime.title}`
          )
        );
      }
      const noEpisodeCacheTtl =
  6 * 60 * 60 * 1000;

const lastUpdated =
  cachedAnime?.lastUpdated

    ? new Date(
        cachedAnime.lastUpdated
      ).getTime()

    : 0;

if (
  cachedAnime &&
  !cachedAnime.nextEpisode &&
  Date.now() - lastUpdated <
    noEpisodeCacheTtl
) {

  console.log(
    chalk.gray(
      `💾 DAILY CACHE HOLD: ${anime.title}`
    )
  );

  return;
}

      filteredChunk.push(anime);
    });

    let results = [...cachedResults];
    let query = null;
    querySources = [];

if (!filteredChunk.length) {

  console.log(
    chalk.gray(
      '💾 Chunk totalmente servido pelo cache'
    )
  );

} else {

    query = 'query {';

    filteredChunk.forEach((anime, index) => {
      if (

  !Number.isInteger(
    anime.id
  )

) {

  console.log(

    chalk.red(
      `💥 Invalid ID type: ${anime.title}`
    )
  );

  logAniListRepairDiagnostic({
    phase:
      'Invalid AniList ID type before query',
    anime,
    validationResult:
      `Number.isInteger(${anime.id}) === false`,
    brokenCondition:
      'Invalid AniList ID type'
  });

  return;
}
      console.log(
  chalk.yellow(
    `📦 Chunk anime: ${anime.title} (${anime.id})`
  )
);
if (
  anime.invalid
) {

  console.log(

    chalk.gray(
      `🛡️ Skipping quarantined anime: ${anime.title}`
    )
  );

  return;
}
      const queryIndex =
        querySources.length;

      querySources.push(
        anime
      );

      query += `

        anime${queryIndex}: Media(id: ${anime.id}, type: ANIME) {

          id

          siteUrl

          status

          episodes

          startDate {
            year
            month
            day
          }

          title { romaji }

          coverImage { large }

          nextAiringEpisode {
            episode
            airingAt
          }
          externalLinks {
            site
            url
          }

          trailer {
            id
            site
            thumbnail
          }

          relations {
            edges {
              relationType
              node {
                id
                type
                format
                status
                episodes
                siteUrl
                title { romaji }
                coverImage { large medium }
                nextAiringEpisode {
                  episode
                  airingAt
                }
              }
            }
          }
          
        }
      `;
    });

    query += '\n}';

totalRequests++;

if (
  !query.includes(
    'Media('
  )
) {

  console.log(
    chalk.red(
      '💥 Empty query blocked'
    )
  );

  continue;
}

    logAniListRepairDiagnostic({
      phase:
        'Main tracker AniList query before request',
      query,
      validationResult:
        `Query sources: ${querySources.map(source => `${source.title || 'Unknown'} (${source.id})`).join(', ')}`
    });

    const res = await axios.post(
      'https://graphql.anilist.co/graphql',
      { query }
    );

    logAniListRepairDiagnostic({
      phase:
        'Main tracker AniList query response',
      query,
      response:
        res,
      validationResult:
        'Main query returned HTTP response'
    });

    const apiResults =
  Object.entries(res.data.data)
    .map(([alias, data]) => {

      const sourceIndex =
        Number(
          alias.replace('anime', '')
        );

      return {
        data,
        sourceAnime:
          querySources[sourceIndex]
      };
    });

results = [

  ...results,

  ...apiResults
];
}

      // 🔥 PROCESSA RESULTADOS

      for (const result of results) {

        const wrappedResult =
          result &&
          Object.prototype.hasOwnProperty.call(
            result,
            'data'
          );

        const data =
          wrappedResult
            ? result.data
            : result;

        const sourceAnime =
          result?.sourceAnime;

        if (!data) {

  console.log(

    chalk.red(
      '⚠️ Invalid anime detected'
    )
  );

  if (sourceAnime) {

    logAniListRepairDiagnostic({
      phase:
        'Empty Media data in processed tracker result',
      anime:
        sourceAnime,
      validationResult:
        'AniList returned null/empty Media for this alias',
      brokenCondition:
        'AniList returned empty data'
    });
  }

  continue;
}
        cache.animes[data.id] =
          createCacheEntry(
            data,
            cache.animes[data.id]
          );

        if (!data.nextAiringEpisode) {
          continue;
        }

        console.log(
          chalk.green(
            `📺 ${data.title.romaji}`
          )
        );

        const airingAt =
          data.nextAiringEpisode.airingAt;

        const now =
          Math.floor(Date.now() / 1000);

        const diff =
          airingAt - now;

        const hoursLeft =
          diff / 3600;
          // 🧪 TEST MODE

const force24h =
  options.force24h;

const forceRelease =
  options.forceRelease;

const shouldSend24h =
  (
    (
      hoursLeft <= 24 &&
      hoursLeft > 0
    ) ||
    force24h
  );

const shouldSendRelease =
  (
    diff <= 0 ||
    forceRelease
  );

const warningMessage =
  getWarningMessage(
    hoursLeft
  );

        // 🔥 DISTRIBUI PARA USUARIOS
        for (const userId in userAnimeData) {

          const animeList =
            userAnimeData[userId]
              ?.anime || [];

          if (
            !animeList.find(
              anime =>
                anime.id === data.id &&
                anime.mode === 'tracking'
            )
          ) {
            continue;
          }

          const sentEntry =
            getSentEpisodeEntry(
              sentEpisodes,
              userId,
              data.id,
              data.nextAiringEpisode.episode
            );

          // 🔥 AVISO 24H
          if (

  shouldSend24h &&

  !sentEntry['24h']
) {

const sent24h =
  await sendUserNotification({
    client,
    userId,
    animeTitle:
      data.title.romaji,
    payload: {
              
              
              content:
              
                `⏰ ${data.title.romaji} • ` +
                `${tUser(userId, 'episode_label')} ${data.nextAiringEpisode.episode} ` +
                getUserWarningMessage(
                  userId,
                  hoursLeft
                )
    },
    options
  });

            if (
  sent24h &&
  !options.testUserId
) {

  sentEntry['24h'] = true;

  saveSentEpisodes(
    sentEpisodes
  );

              console.log(
                chalk.yellow(
                  `⏰ 24H enviado por DM para ${userId}`
                )
              );
}
          }

          // 🔥 EPISÓDIO LANÇADO
          if (

  shouldSendRelease &&

  !sentEntry.release
) {

            const embed =
              new EmbedBuilder()
                .setColor(0xff6600)
                .setTitle(
                  tUser(
                    userId,
                    'release_embed_title'
                  )
                )
                .setDescription(
                  tUser(
                    userId,
                    'release_embed_description'
                  )
                    .replace('{anime}', data.title.romaji)
                    .replace(
                      '{episode}',
                      data.nextAiringEpisode.episode
                    )
                )
                .setImage(
                  data.coverImage?.large
                )
                .setFooter({
                  text:
                    tUser(
                      userId,
                      'release_embed_footer'
                    )
                })
                .setTimestamp();

            const watchTarget =
              getBestWatchTarget(
                data
              );

            const sentRelease =
              await sendUserNotification({
                client,
                userId,
                animeTitle:
                  data.title.romaji,
                payload: {
                  embeds: [embed],
                  components: [
                    createWatchOpenRow({
                      userId,
                      animeId:
                        data.id,
                      episode:
                        data.nextAiringEpisode
                          .episode,
                      guildId: null,
                      userIdForLanguage:
                        userId,
                      hasStreaming:
                        watchTarget.isStreaming,
                      officialSiteUrl:
                        watchTarget.officialSiteUrl
                    })
                  ]
                },
                options
              });

            if (
  sentRelease &&
  !options.testUserId
) {

  markEpisodeNotified({
    userId,
    username:
      userAnimeData[userId]
        ?.username ||
      'Unknown User',
    animeId:
      data.id,
    episode:
      data.nextAiringEpisode
        .episode,
    watchUrl:
      watchTarget.url,
    watchLabel:
      watchTarget.label,
    watchIsStreaming:
      watchTarget.isStreaming,
    streamingProvider:
      watchTarget.provider,
    officialSiteUrl:
      watchTarget.officialSiteUrl
  });

  sentEntry.release = true;

  saveSentEpisodes(
    sentEpisodes
  );

  try {
    await sendSeasonEndPrompt({
      client,
      userId,
      username:
        userAnimeData[userId]
          ?.username ||
        'Unknown User',
      anime:
        data,
      sequel:
        getSequelCandidate(
          data
        ),
      options
    });
  } catch (seasonErr) {
    console.log(
      chalk.yellow(
        `Season end prompt failed for ${userId}: ${seasonErr.message}`
      )
    );
  }

              console.log(
                chalk.magenta(
                  `🚨 Episódio lançado enviado por DM para ${userId}`
                )
              );
}
          }
        }

        if (
          shouldSend24h
        ) {
          await notifyPartnerChannels({
            client,
            anime: data,
            notificationType: '24h',
            warningMessage,
            options
          });
        }

        if (
          shouldSendRelease
        ) {
          await notifyPartnerChannels({
            client,
            anime: data,
            notificationType: 'release',
            options
          });
        }
      }

    } catch (err) {
      runtimeStatus.tracker.lastError =
        err.message;

      logAniListRepairDiagnostic({
        phase:
          'Main tracker AniList query failed',
        query,
        error:
          err,
        validationResult:
          err.response?.data?.errors
            ? 'AniList returned GraphQL errors'
            : 'Request failed before a valid GraphQL response',
        brokenCondition:
          err.response?.data?.errors
            ? 'Tracker would inspect querySources as possible invalid IDs'
            : 'Network/timeout/rate-limit/server error path'
      });

      if (

  err.response?.data?.errors

) {

  console.log(

    chalk.red(
      '⚠️ POSSIBLE INVALID ANIME ID DETECTED'
    )
  );

  console.log(
    chalk.gray(
      JSON.stringify(
        err.response.data.errors,
        null,
        2
      )
    )
  );
}
if (

  err.response?.data?.errors

) {

  console.log(

    chalk.red(
      '⚠️ Invalid anime quarantine triggered'
    )
  );

  const brokenSources =
    querySources.length
      ? querySources
      : [];

  if (
    !brokenSources.length
  ) {

    console.log(
      chalk.yellow(
        'No query sources available for quarantine.'
      )
    );
  }

  for (
    const brokenAnime of brokenSources
  ) {

    try {

      const retryQuery = `
        query {
          Media(id: ${brokenAnime.id}, type: ANIME) {
            id
            siteUrl
            status
            episodes
            startDate {
              year
              month
              day
            }
            title { romaji }
            coverImage { large }
            nextAiringEpisode {
              episode
              airingAt
            }
            externalLinks {
              site
              url
            }
            trailer {
              id
              site
              thumbnail
            }
            relations {
              edges {
                relationType
                node {
                  id
                  type
                  format
                  status
                  episodes
                  siteUrl
                  title { romaji }
                  coverImage { large medium }
                  nextAiringEpisode {
                    episode
                    airingAt
                  }
                }
              }
            }
          }
        }`;

      logAniListRepairDiagnostic({
        phase:
          'Individual AniList validation retry before request',
        anime:
          brokenAnime,
        query:
          retryQuery,
        validationResult:
          'Validating one query source after chunk error'
      });

      const retryRes =
        await axios.post(
          'https://graphql.anilist.co/graphql',
          {
            query: retryQuery
          }
        );

      logAniListRepairDiagnostic({
        phase:
          'Individual AniList validation retry response',
        anime:
          brokenAnime,
        query:
          retryQuery,
        response:
          retryRes,
        validationResult:
          retryRes.data?.data?.Media
            ? 'Valid AniList Media returned'
            : 'AniList Media missing/null',
        brokenCondition:
          retryRes.data?.data?.Media
            ? null
            : 'Retry returned empty media'
      });

      const retryData =
        retryRes.data?.data?.Media;

      if (
        !retryData
      ) {

        throw new Error(
          'Retry returned empty media'
        );
      }

      console.log(
        chalk.green(
          `Retry recovered anime: ${retryData.title?.romaji || brokenAnime.title}`
        )
      );

    } catch (retryErr) {

      logAniListRepairDiagnostic({
        phase:
          'Individual AniList validation retry failed',
        anime:
          brokenAnime,
        error:
          retryErr,
        validationResult:
          'Individual validation did not return usable Media',
        brokenCondition:
          'AniList validation failed'
      });
    }
  }
}
      console.log(
  chalk.red(
    `💥 [ERROR] ${err.message}`
  )
);

if (
  err.response
) {

  console.log(

    chalk.red(
      `📡 STATUS: ${err.response.status}`
    )
  );

  console.log(

    chalk.red(
      `📄 DATA: ${JSON.stringify(err.response.data, null, 2)}`
    )
  );
}
    }
    cache.lastGlobalUpdate =
  new Date().toISOString();

cache.stats.totalCached =
  Object.keys(cache.animes).length;

saveCache(cache);


  } 

  await processPendingTrailers(
    client,
    options
  );

  console.log(
    chalk.yellow(
      '[ANIME REPAIR DIAGNOSTIC] Automatic repair scan skipped for investigation.'
    )
  );

  runtimeStatus.tracker.lastFinishedAt =
    new Date().toISOString();
}


console.log(
  chalk.gray(
    '⚙️ checkAnime carregado'
  )
);

module.exports = checkAnime;
