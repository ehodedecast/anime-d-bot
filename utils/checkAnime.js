const axios = require('axios');

const chalk = require('chalk').default;

const { t } =
  require('./language');

const { loadAnimeData } = require('./animeStorage');

const { loadConfig } = require('./config');

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

const fs = require('fs');

const repairInvalidAnime =
  require('./repairInvalidAnime');

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

function chunkArray(array, size) {

  const result = [];

  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }

  return result;
}

function quarantineAnime(

  animeData,

  animeId,

  reason

) {

  let quarantined = false;

  for (const guildId in animeData) {

    const guildAnime =
      animeData[guildId]
        ?.anime || [];

    guildAnime.forEach(
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

async function checkAnime(

  client,

  options = {}

) {

  console.log(
    chalk.cyan('🔄 [CHECK] Iniciando verificação...')
  );

  const cache = loadCache();
  if (!cache.animes) {
  cache.animes = {};
}
  const analytics =
  require('./analyticsStorage')
    .loadAnalytics();

  const animeData = loadAnimeData();

  const totalGuilds =
    Object.keys(animeData).length;

  const totalGlobal =
  Object.values(animeData)
    .reduce(

      (acc, guild) =>

        acc + (
          guild.anime?.length || 0
        ),

      0
    );

  const config = loadConfig();

  const sentEpisodes =
    loadSentEpisodes();

  // 🔥 PEGA TODOS OS ANIMES ÚNICOS
  const uniqueAnimes = new Set();

  const animeCount = {};

 for (const guildId in animeData) {

  const guildAnime =

    animeData[guildId]
      ?.anime || [];

  for (
    const anime of
    guildAnime
  ) {
    if (
  !anime ||
  !anime.id ||
  !anime.title
) {

  console.log(
    chalk.red(
      `💥 Invalid anime entry in guild ${guildId}`
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

  // 🔥 STATS POR SERVIDOR
  const guildStats = {};

  for (
  const guildId in
  animeData
) {

  const guildAnime =

    animeData[guildId]
      ?.anime || [];

  guildStats[guildId] = {

    animeCount:
      guildAnime.length
  };
}

  // 🔥 SALVA ANALYTICS
  saveAnalytics({

    lastCheck:
      new Date().toISOString(),

    totalGuilds,

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

  try {

    const filteredChunk = [];
    const cachedResults = [];

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
      const oneDay =
  24 * 60 * 60 * 1000;

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
    oneDay
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
    let querySources = [];

if (!filteredChunk.length) {

  console.log(
    chalk.gray(
      '💾 Chunk totalmente servido pelo cache'
    )
  );

} else {

    query = 'query {';


console.log(
  filteredChunk
);

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
    animeData,
    anime.id,
    'Invalid AniList ID type'
  );

  fs.writeFileSync(
    './data/animes.json',
    JSON.stringify(
      animeData,
      null,
      2
    )
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

    console.log(query);
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
      animeData,
      sourceAnime.id,
      'AniList returned empty data'
    );

    fs.writeFileSync(
      './data/animes.json',
      JSON.stringify(
        animeData,
        null,
        2
      )
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

        // 🔥 DISTRIBUI PARA SERVIDORES
        for (const guildId in animeData) {

          const animeList =

  animeData[guildId]
    ?.anime || [];

          if (
            !animeList.find(
              anime => anime.id === data.id
            )
          ) {
            continue;
          }

          const guildConfig =
            config[guildId];

          if (!guildConfig) continue;

          const channelId =
            guildConfig.channelId;

          const channel =
            await client.channels.fetch(channelId);
            
            // 🧪 TEST USER

let testUser = null;

if (
  options.testUserId
) {

  testUser =
    await client.users.fetch(
      options.testUserId
    );
}

          const key =
            `${guildId}-${data.title.romaji}-${data.nextAiringEpisode.episode}`;

          if (!sentEpisodes[key]) {

            sentEpisodes[key] = {
              initial: false,
              '24h': false,
              released: false
            };
          }

          // 🔥 AVISO 24H
          console.log(hoursLeft);
          console.log(sentEpisodes[key]);
          console.log(typeof sentEpisodes[key]['24h']);
          if (

  (
    (
      hoursLeft <= 24 &&
      hoursLeft > 0
    ) ||

    force24h
  ) &&

  !sentEpisodes[key]['24h']
) {

            let warningMessage;

if (hoursLeft <= 1) {

  warningMessage =
    t(
      guildId,
      'episode_less_than_1h'
    );

} else if (hoursLeft <= 6) {

  warningMessage =
    t(
      guildId,
      'episode_less_than_6h'
    );

} else {

  warningMessage =
    t(
      guildId,
      'episode_less_than_24h'
    );
}
console.log('ENVIANDO ALERTA');

const target =
  testUser || channel;

await target.send({
              
              
              content:
              
                `⏰ ${data.title.romaji} • ` +
                `Episódio ${data.nextAiringEpisode.episode} ` +
                warningMessage
            });

            if (
  !options.testUserId
) {

  sentEpisodes[key]['24h'] = true;

  saveSentEpisodes(
    sentEpisodes
  );
}

            console.log(
              chalk.yellow(
                `⏰ 24H enviado para ${guildId}`
              )
            );
          }

          // 🔥 EPISÓDIO LANÇADO
          if (

  (
    diff <= 0 ||

    forceRelease
  ) &&

  !sentEpisodes[key].released
) {

            const crunchyroll =
              data.externalLinks?.find(
                link => link.site === 'Crunchyroll'
              );

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

            const row =
              new ActionRowBuilder()
                .addComponents(
                  new ButtonBuilder()
                    .setLabel('🍿 Assistir')
                    .setStyle(ButtonStyle.Link)
                    .setURL(
                      crunchyroll?.url ||
                      `https://www.crunchyroll.com/search?q=${encodeURIComponent(data.title.romaji)}`
                    )
                );

            const target =
  testUser || channel;

await target.send({
              embeds: [embed],
              components: [row]
            });

            if (
  !options.testUserId
) {

  sentEpisodes[key].released = true;

  saveSentEpisodes(
    sentEpisodes
  );
}

            console.log(
              chalk.magenta(
                `🚨 Episódio lançado enviado para ${guildId}`
              )
            );
          }
        }
      }

    } catch (err) {
      if (

  err.response?.data?.errors

) {

  console.log(

    chalk.red(
      '⚠️ POSSIBLE INVALID ANIME ID DETECTED'
    )
  );

  console.log(query);
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
      : filteredChunk;

  brokenSources.forEach(
    brokenAnime => {

      quarantineAnime(
        animeData,
        brokenAnime.id,
        'AniList validation failed'
      );
    }
  );

  fs.writeFileSync(

    './data/animes.json',

    JSON.stringify(
      animeData,
      null,
      2
    )
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
}


console.log(
  chalk.gray(
    '⚙️ checkAnime carregado'
  )
);

module.exports = checkAnime;
