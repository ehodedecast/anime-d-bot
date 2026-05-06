const axios = require('axios');
const createEmbed = require('../utils/embed');

function formatTimeLeft(ms) {
  if (ms <= 0) return "Já lançado";

  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatTimeLeft(ms) {
  const totalMinutes = Math.floor(ms / 60000);

  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

async function next(message, animeName) {
  try {
    const query = `
    query {
      Media(search: "${animeName}", type: ANIME) {
        title { romaji }
        coverImage { large }
        episodes
        status
        nextAiringEpisode {
          episode
          airingAt
        }
      }
    }`;

    const res = await axios.post('https://graphql.anilist.co', { query });
    const data = res.data.data.Media;

    if (!data) {
      return message.reply('❌ Anime não encontrado.');
    }

    const name = data.title.romaji;

    // 🧠 STATUS
    const statusMap = {
      FINISHED: "Finalizado",
      RELEASING: "Em exibição",
      NOT_YET_RELEASED: "Ainda não lançado",
      CANCELLED: "Cancelado",
      HIATUS: "Em hiato"
    };

    const status = statusMap[data.status] || data.status;

    // ❌ SEM PRÓXIMO EP
    if (!data.nextAiringEpisode) {
      const embed = createEmbed({
        title: `📺 ${name}`,
        description: `⚠️ Nenhum episódio futuro confirmado.`,
        image: data.coverImage?.large,
        color: 0xff9900,

        fields: [
          { name: '📊 Status', value: status, inline: true },
          { name: '🎬 Total episódios', value: `${data.episodes || "?"}`, inline: true }
        ]
      });

      return message.reply({ embeds: [embed] });
    }

    // ✅ COM PRÓXIMO EP
    const ep = data.nextAiringEpisode.episode;
    const airingTime = data.nextAiringEpisode.airingAt * 1000;
    const now = Date.now();

    const timeLeft = airingTime - now;
	// 🎨 cor dinâmica
let color = 0x00ccff;

if (timeLeft <= 3600000) color = 0xff0000; // < 1h
else if (timeLeft <= 10800000) color = 0xff9900; // < 3h

// 🧠 texto inteligente
let statusText = "🎯 Próximo episódio confirmado!";

if (timeLeft <= 3600000 && timeLeft > 0) {
  statusText = "🚨 Sai em breve!";
}

    const formattedDate = new Date(airingTime).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    const embed = createEmbed({
  title: `📺 ${name}`,
  description: statusText,
  image: data.coverImage?.large,
  color: color,

      fields: [
        { name: '🎬 Episódio', value: `Ep ${ep}`, inline: true },
        { name: '⏰ Lançamento', value: formattedDate, inline: true },
        {name: '⏳ Tempo', value: formatTimeLeft(timeLeft), inline: true },
        { name: '📊 Status', value: status, inline: true }
      ]
    });

    return message.reply({ embeds: [embed] });

  } catch (err) {
    console.log(err);
    return message.reply('❌ Erro ao buscar anime.');
  }
}

module.exports = next;