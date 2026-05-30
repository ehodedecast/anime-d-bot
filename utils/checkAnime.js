const axios = require('axios');

const chalk = require('chalk').default;

const { t } =
  require('./language');

const {
  loadUserAnimes,
  saveUserAnimes
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

const repairInvalidAnime =
  require('./repairInvalidAnime');

const {
  EmbedBuilder
} = require('discord.js');

const runtimeStatus =
  require('../state/runtimeStatus');

function chunkArray(array, size) {

  const result = [];

  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }

  return result;
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

  coverImage: {
    large:
      cachedAnime.coverImage
  },

  nextAiringEpisode:
    cachedAnime.nextEpisode,

  externalLinks:
    cachedAnime.externalLinks || []
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

  quarantineAnime(
    userAnimeData,
    anime.id,
    'Invalid AniList ID type'
  );

  saveUserAnimes(
    userAnimeData
  );

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

    const res = await axios.post(
      'https://graphql.anilist.co/graphql',
      { query }
    );

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

    quarantineAnime(
      userAnimeData,
      sourceAnime.id,
      'AniList returned empty data'
    );

    saveUserAnimes(
      userAnimeData
    );
  }

  continue;
}
        cache.animes[data.id] = {

  id: data.id,

  title:
    data.title?.romaji ||

    'Unknown',

  coverImage:
    data.coverImage?.large ||

    null,

  nextEpisode:
    data.nextAiringEpisode || null,

  externalLinks:
    data.externalLinks || [],

  lastUpdated:
    new Date().toISOString()
};

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

  (
    (
      hoursLeft <= 24 &&
      hoursLeft > 0
    ) ||

    force24h
  ) &&

  !sentEntry['24h']
) {

            let warningMessage;

if (hoursLeft <= 1) {

  warningMessage =
    t(
      null,
      'episode_less_than_1h'
    );

} else if (hoursLeft <= 6) {

  warningMessage =
    t(
      null,
      'episode_less_than_6h'
    );

} else {

  warningMessage =
    t(
      null,
      'episode_less_than_24h'
    );
}

const sent24h =
  await sendUserNotification({
    client,
    userId,
    animeTitle:
      data.title.romaji,
    payload: {
              
              
              content:
              
                `⏰ ${data.title.romaji} • ` +
                `Episódio ${data.nextAiringEpisode.episode} ` +
                warningMessage
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

  (
    diff <= 0 ||

    forceRelease
  ) &&

  !sentEntry.release
) {

            const embed =
              new EmbedBuilder()
                .setColor(0xff6600)
                .setTitle('🚨 Episódio Disponível!')
                .setDescription(
                  `📺 **${data.title.romaji}**\n` +
                  `🎯 Episódio ${data.nextAiringEpisode.episode} já está disponível!`
                )
                .setImage(
                  data.coverImage?.large
                )
                .setFooter({
                  text:
                    'AnimeDBot • Boa sessão 🍿'
                })
                .setTimestamp();

            const sentRelease =
              await sendUserNotification({
                client,
                userId,
                animeTitle:
                  data.title.romaji,
                payload: {
                  embeds: [embed]
                },
                options
              });

            if (
  sentRelease &&
  !options.testUserId
) {

  sentEntry.release = true;

  saveSentEpisodes(
    sentEpisodes
  );

              console.log(
                chalk.magenta(
                  `🚨 Episódio lançado enviado por DM para ${userId}`
                )
              );
}
          }
        }
      }

    } catch (err) {
      runtimeStatus.tracker.lastError =
        err.message;

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
          }
        }`;

      const retryRes =
        await axios.post(
          'https://graphql.anilist.co/graphql',
          {
            query: retryQuery
          }
        );

      const retryData =
        retryRes.data?.data?.Media;

      if (
        !retryData
      ) {

        throw new Error(
          'Retry returned empty media'
        );
      }

      cache.animes[retryData.id] = {
        id: retryData.id,
        title:
          retryData.title?.romaji ||
          'Unknown',
        coverImage:
          retryData.coverImage?.large ||
          null,
        nextEpisode:
          retryData.nextAiringEpisode || null,
        externalLinks:
          retryData.externalLinks || [],
        lastUpdated:
          new Date().toISOString()
      };

      console.log(
        chalk.green(
          `Retry recovered anime: ${retryData.title?.romaji || brokenAnime.title}`
        )
      );

    } catch {

      quarantineAnime(
        userAnimeData,
        brokenAnime.id,
        'AniList validation failed'
      );
    }
  }

  saveUserAnimes(
    userAnimeData
  );
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
  await repairInvalidAnime();

  runtimeStatus.tracker.lastFinishedAt =
    new Date().toISOString();
}


console.log(
  chalk.gray(
    '⚙️ checkAnime carregado'
  )
);

module.exports = checkAnime;
