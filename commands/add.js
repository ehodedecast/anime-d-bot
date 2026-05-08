const axios = require('axios');
const {
  loadAnimeData,
  saveAnimeData
} = require('../utils/animeStorage');
const createEmbed = require('../utils/embed');

async function add(message, animeList, inputName) {
  try {
    const query = `
    query {
      Media(search: "${inputName}", type: ANIME) {
      id
      isAdult
        title { romaji }
        coverImage { large }
        status
        nextAiringEpisode {
          episode
          airingAt
        }
      }
    }`;

    const res = await axios.post('https://graphql.anilist.co', { query });
    const data = res.data.data.Media;
    if (data.isAdult) {

  return message.reply(
    '🔞 AnimeDBot não permite animes +18.'
  );
}

    if (!data) {
      return message.reply('❌ Anime não encontrado.');
    }

    const name = data.title.romaji;

    const alreadyExists = animeList.find(
  anime => anime.id === data.id
);

if (alreadyExists) {
  return message.reply('⚠️ Anime já está na lista.');
}

    const animeData = loadAnimeData();

if (!animeData[message.guild.id]) {
  animeData[message.guild.id] = [];
}

animeData[message.guild.id].push(name);

animeList.push({
  id: data.id,
  title: data.title.romaji
});

animeData[message.guild.id] = animeList;

console.log(animeData);

saveAnimeData(animeData);

    // 🧠 STATUS
    const statusMap = {
      FINISHED: "Finalizado",
      RELEASING: "Em exibição",
      NOT_YET_RELEASED: "Ainda não lançado",
      CANCELLED: "Cancelado",
      HIATUS: "Em hiato"
    };

    const status = statusMap[data.status] || data.status;

    // 🎯 COM EPISÓDIO
    if (data.nextAiringEpisode) {
      const ep = data.nextAiringEpisode.episode;
      const time = new Date(data.nextAiringEpisode.airingAt * 1000);

      const formatted = time.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      const embed = createEmbed({
        title: `📺 ${name}`,
        description:
          `✅ **Adicionado com sucesso!**\n\n` +
          `🎯 Próximo episódio: **${ep}**\n` +
          `⏰ ${formatted}\n` +
          `📊 Status: ${status}` +
		  `\n\n🔔 Você receberá um lembrete próximo ao lançamento.`,
        image: data.coverImage?.large,
        color: 0x00ccff
      });

      return message.reply({ embeds: [embed] });
    }

    // ❌ SEM EPISÓDIO
    const embed = createEmbed({
      title: `📺 ${name}`,
      description:
        `✅ **Adicionado com sucesso!**\n\n` +
        `⚠️ Nenhum episódio futuro confirmado.\n` +
        `📊 Status: ${status}`,
      image: data.coverImage?.large,
      color: 0xff9900
    });

    return message.reply({ embeds: [embed] });

  } catch (err) {
    console.log(err);
    return message.reply('❌ Erro ao adicionar anime.');
  }
}
module.exports = add;