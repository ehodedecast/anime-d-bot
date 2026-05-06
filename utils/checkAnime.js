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

if (sentEpisodes[key]) continue;

sentEpisodes[key] = true;

saveSentEpisodes(sentEpisodes);

      await channel.send({
        content: `📺 ${data.title.romaji} tem episódio novo chegando!`
      }).catch(err => {
        console.log(chalk.red(`💥 [DISCORD] ${err.message}`));
      });

    } catch (err) {
      console.log(chalk.red(`💥 [ERROR] ${err.message}`));
    }
  }
  }
}
console.log(chalk.gray('⚙️ checkAnime carregado'));
module.exports = checkAnime;