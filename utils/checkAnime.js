const axios = require('axios');
const chalk = require('chalk').default;

const { loadAnimeData } = require('./animeStorage');
const { loadConfig } = require('./config');
const {
  loadSentEpisodes,
  saveSentEpisodes
} = require('./sentStorage');

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

  const animeData = loadAnimeData();
  const config = loadConfig();
  const sentEpisodes = loadSentEpisodes();

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
      uniqueAnimes.add(JSON.stringify(anime));
      if (!animeCount[anime.id]) {

  animeCount[anime.id] = {
    title: anime.title,
    count: 0
  };
}

animeCount[anime.id].count++;
    }
  }

  const animeArray = [...uniqueAnimes].map(
  anime => JSON.parse(anime)
);

console.log(
  chalk.cyan(
    `🌍 Total de animes únicos: ${animeArray.length}`
  )
);
const totalGlobal = Object.values(animeData)
  .reduce((acc, list) => acc + list.length, 0);

console.log(
  chalk.yellow(
    `📚 Total global de animes: ${totalGlobal}`
  )
);



  // 🔥 DIVIDE EM CHUNKS
  const chunks = chunkArray(animeArray, 25);

  const totalRequests = chunks.length;
  console.log(
  chalk.green(
    `⚡ Economia de requests: ${totalGlobal - totalRequests}`
  )
);

const topAnimes = Object.values(animeCount)
  .sort((a, b) => b.count - a.count)
  .slice(0, 5);
console.log(
  chalk.magenta('🏆 Top 5 Animes Mais Seguidos:')
);
topAnimes.forEach((anime, index) => {
  console.log(
    chalk.magenta(` ${index + 1}. ${anime.title} (${anime.count})`)
  );
});

  // 🔥 PROCESSA CADA CHUNK
  for (const chunk of chunks) {

    try {

      let query = 'query {';

      chunk.forEach((anime, index) => {

  query += `

    anime${index}: Media(id: ${anime.id}, type: ANIME) {
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
        'https://graphql.anilist.co',
        { query }
      );

      const results = Object.values(res.data.data);

      // 🔥 PROCESSA CADA RESULTADO
      for (const data of results) {

        if (!data) continue;

        if (!data.nextAiringEpisode) {
          continue;
        }

        console.log(
          chalk.green(`📺 ${data.title.romaji}`)
        );

        const airingAt = data.nextAiringEpisode.airingAt;
        const now = Math.floor(Date.now() / 1000);

        const diff = airingAt - now;
        const hoursLeft = diff / 3600;

        // 🔥 DISTRIBUI PARA SERVIDORES
        for (const guildId in animeData) {

          const animeList = animeData[guildId];

          if (!animeList.find(
  anime => anime.id === data.id
)) {
            continue;
          }

          const guildConfig = config[guildId];

          if (!guildConfig) continue;

          const channelId = guildConfig.channelId;

          const channel = await client.channels.fetch(channelId);

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
          if (
            hoursLeft <= 24 &&
            hoursLeft > 0 &&
            !sentEpisodes[key]['24h']
          ) {

            sentEpisodes[key]['24h'] = true;

            saveSentEpisodes(sentEpisodes);

            await channel.send({
              content:
                `⏰ ${data.title.romaji} • ` +
                `Episódio ${data.nextAiringEpisode.episode} ` +
                `estreia em menos de 24 horas!`
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

            const crunchyroll = data.externalLinks?.find(
              link => link.site === 'Crunchyroll'
            );

            const embed = new EmbedBuilder()
              .setColor(0xff6600)
              .setTitle('🚨 Episódio Disponível!')
              .setDescription(
                `📺 **${data.title.romaji}**\n` +
                `🎯 Episódio ${data.nextAiringEpisode.episode} já está disponível!`
              )
              .setImage(data.coverImage?.large)
              .setFooter({
                text: 'AnimeDBot • Boa sessão 🍿'
              })
              .setTimestamp();

            const row = new ActionRowBuilder()
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
        chalk.red(`💥 [ERROR] ${err.message}`)
      );
    }
  }
}

console.log(
  chalk.gray('⚙️ checkAnime carregado')
);

module.exports = checkAnime;