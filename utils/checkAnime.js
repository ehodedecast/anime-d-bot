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

async function checkAnime(client) {

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
        (acc, list) => acc + list.length,
        0
      );

  const config = loadConfig();

  const sentEpisodes =
    loadSentEpisodes();

  // 🔥 PEGA TODOS OS ANIMES ÚNICOS
  const uniqueAnimes = new Set();

  const animeCount = {};

  for (const guildId in animeData) {

    console.log(
      chalk.blue(
        `🏠 [${guildId}] ${animeData[guildId].length} animes`
      )
    );

    for (const anime of animeData[guildId]) {

    if (anime.mode !== 'tracking') {
    continue;
    }
    
      uniqueAnimes.add(
        JSON.stringify(anime)
      );

      if (!animeCount[anime.id]) {

        animeCount[anime.id] = {
          title: anime.title,
          count: 0
        };
      }

      animeCount[anime.id].count++;
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

  const totalRequests =
    chunks.length;

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

  for (const guildId in animeData) {

    guildStats[guildId] = {
      animeCount:
        animeData[guildId].length
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

    chunk.forEach((anime) => {

      const cachedAnime =
        cache.animes[anime.id];

      if (
        cachedAnime &&
        cachedAnime.nextEpisode &&
        cachedAnime.nextEpisode.airingAt >
          Math.floor(Date.now() / 1000)
      ) {

        console.log(
          chalk.gray(
            `💾 CACHE HIT: ${anime.title}`
          )
        );

        return;
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

    if (!filteredChunk.length) {

      console.log(
        chalk.gray(
          '💾 Chunk totalmente servido pelo cache'
        )
      );

      continue;
    }

    let query = 'query {';

    filteredChunk.forEach((anime, index) => {

      query += `

        anime${index}: Media(id: ${anime.id}, type: ANIME) {

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

    const res = await axios.post(
      'https://graphql.anilist.co/graphql',
      { query }
    );

    const results =
      Object.values(res.data.data);

      // 🔥 PROCESSA RESULTADOS

      for (const data of results) {

        if (!data) continue;
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

        // 🔥 DISTRIBUI PARA SERVIDORES
        for (const guildId in animeData) {

          const animeList =
            animeData[guildId];

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
            hoursLeft <= 24 &&
            hoursLeft > 0 &&
            !sentEpisodes[key]['24h']
          ) {

            sentEpisodes[key]['24h'] = true;

            saveSentEpisodes(sentEpisodes);

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
            await channel.send({
              
              
              content:
              
                `⏰ ${data.title.romaji} • ` +
                `Episódio ${data.nextAiringEpisode.episode} ` +
                warningMessage
            });

            console.log(
              chalk.yellow(
                `⏰ 24H enviado para ${guildId}`
              )
            );
          }

          // 🔥 EPISÓDIO LANÇADO
          if (
            diff <= 0 &&
            !sentEpisodes[key].released
          ) {

            sentEpisodes[key].released = true;

            saveSentEpisodes(sentEpisodes);

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

            await channel.send({
              embeds: [embed],
              components: [row]
            });

            console.log(
              chalk.magenta(
                `🚨 Episódio lançado enviado para ${guildId}`
              )
            );
          }
        }
      }

    } catch (err) {

      console.log(
        chalk.red(
          `💥 [ERROR] ${err.message}`
        )
      );
    }
    cache.lastGlobalUpdate =
  new Date().toISOString();

cache.stats.totalCached =
  Object.keys(cache.animes).length;

saveCache(cache);
  } 
}

console.log(
  chalk.gray(
    '⚙️ checkAnime carregado'
  )
);

module.exports = checkAnime;

