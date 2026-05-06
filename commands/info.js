const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

async function info(message, animeName) {
  try {
    const query = `
    query {
      Media(search: "${animeName}", type: ANIME) {
        title { romaji }
        description
        averageScore
        episodes
        status
        studios {
          nodes {
            name
          }
        }
        coverImage { large }
      }
    }`;

    const res = await axios.post('https://graphql.anilist.co', { query });
    const data = res.data.data.Media;

    if (!data) {
      return message.reply('❌ Anime não encontrado.');
    }

    // limpa HTML da descrição
    let description = data.description
      ?.replace(/<[^>]*>/g, '')
      .slice(0, 300);

    if (data.description && data.description.length > 300) {
      description += '...';
    }

    // traduz status
    const statusMap = {
      FINISHED: "Finalizado",
      RELEASING: "Em exibição",
      NOT_YET_RELEASED: "Ainda não lançado",
      CANCELLED: "Cancelado",
      HIATUS: "Em hiato"
    };

    const status = statusMap[data.status] || data.status;
    const studio = data.studios?.nodes[0]?.name || "Desconhecido";

    const embed = new EmbedBuilder()
      .setColor(0x9933ff)
      .setTitle(`📺 ${data.title.romaji}`)
      .setDescription(description || "Sem descrição disponível.")
      .addFields(
        { name: '⭐ Nota', value: `${data.averageScore || "N/A"}`, inline: true },
        { name: '🎬 Episódios', value: `${data.episodes || "?"}`, inline: true },
        { name: '📊 Status', value: status, inline: true },
        { name: '🎥 Estúdio', value: studio, inline: true }
      )
      .setImage(data.coverImage?.large || null)
      .setFooter({ text: 'AnimeDBot' })
      .setTimestamp();

    return message.reply({ embeds: [embed] });

  } catch (err) {
    console.log("💥 [INFO ERROR]", err.message);
    return message.reply('❌ Erro ao buscar informações.');
  }
}

module.exports = info;