const axios = require('axios');
const fs = require('fs');
const chalk = require('chalk').default;
const { loadAnimeData } = require('./animeStorage');
const { loadConfig } = require('./config');

const { loadSentEpisodes , saveSentEpisodes } = require('./sentStorage');


async function checkAnime(client) {
  console.log(chalk.cyan("🔄 [CHECK] Iniciando verificação..."));

  
  const animeData = loadAnimeData();
  const config = loadConfig();
  const sentEpisodes = loadSentEpisodes();
  for (const guildId in animeData) {

  const animeList = animeData[guildId];

  const guildConfig = config[guildId];

  if (!guildConfig) continue;

  const channelId = guildConfig.channelId;
  
  const channel = await client.channels.fetch(channelId);

  for (const animeName of animeList) { 
    console.log(chalk.green(`📺 [ANIME] ${animeName}`));

    try {
      const query = `
      query {
        Media(search: "${animeName}", type: ANIME) {
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

      const res = await axios.post('https://graphql.anilist.co', { query });
      const data = res.data?.data?.Media;

      if (!data) {
        console.log(chalk.yellow(`⚠️ [API] Nenhum resultado para ${animeName}`));
        continue;
      }

      console.log(chalk.blue(`📡 [API] Dados recebidos`));

      if (!data.nextAiringEpisode) {
        console.log(chalk.yellow(`⚠️ [ANIME] ${data.title.romaji} não tem próximo episódio`));
        continue;
      }

      console.log(chalk.magenta(`⏰ [EP] Próximo episódio detectado para ${data.title.romaji}`));

      const key =
  `${guildId}-${data.title.romaji}-${data.nextAiringEpisode.episode}`;
  if (!sentEpisodes[key]) {
  sentEpisodes[key] = {
    initial: false,
    "24h": false,
    released: false
  };
}
const airingAt = data.nextAiringEpisode.airingAt;
const now = Math.floor(Date.now() / 1000);

const diff = airingAt - now;

const hoursLeft = diff / 3600;
console.log(hoursLeft);



if (
  hoursLeft <= 24 &&
  !sentEpisodes[key]["24h"]
) {

  sentEpisodes[key]["24h"] = true;

  saveSentEpisodes(sentEpisodes);

  await channel.send({
    content:
      `⏰ ${data.title.romaji} • Episódio ${data.nextAiringEpisode.episode} estreia em menos de 24 horas!`
  });

  continue;
}
if (
  diff <= 0 &&
  !sentEpisodes[key].released
) {

  sentEpisodes[key].released = true;

  saveSentEpisodes(sentEpisodes);

  const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

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

  continue;
}

      

    } catch (err) {
      console.log(chalk.red(`💥 [ERROR] ${err.message}`));
    }
  }
  }
}
console.log(chalk.gray('⚙️ checkAnime carregado'));
module.exports = checkAnime;