const axios = require('axios');
const createEmbed = require('../utils/embed');
const { t } = require('../utils/language');

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
      isAdult
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

    const res = await axios.post('https://graphql.anilist.co/graphql', { query });
    const data = res.data.data.Media;
    if (data.isAdult) {

  return message.reply(
    t(
      message.guild.id,
      'adult_content_warning'
    )
  );
}

    if (!data) {
  return message.reply(
    t(
      message.guild.id,
      'search_temporarily_disabled'
    )
  );
}

    const name = data.title.romaji;

    // 🧠 STATUS
    const statusMap = {
      FINISHED: t(message.guild.id, 'finished'), // "Finalizado"
      RELEASING: t(message.guild.id, 'releasing'), // "Em exibição"
      NOT_YET_RELEASED: t(message.guild.id, 'not_yet_released'), // "Ainda não lançado"
      CANCELLED: t(message.guild.id, 'cancelled'), // "Cancelado"
      HIATUS: t(message.guild.id, 'hiatus') // "Em hiato"
    };

    const status = statusMap[data.status] || data.status;

    // ❌ SEM PRÓXIMO EP
    if (!data.nextAiringEpisode) {
      const embed = createEmbed({
        title: `📺 ${name}`,
        description: t(message.guild.id, 'next_episode_not_found'),
        image: data.coverImage?.large,
        color: 0xff9900,

        fields: [
          { name: t(message.guild.id, 'status'), value: status, inline: true },
          { name: t(message.guild.id, 'episodes'), value: `${data.episodes || "?"}`, inline: true }
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
let statusText = t(message.guild.id, 'next_episode_confirmed'); // "🎯 Próximo episódio confirmado!"

if (timeLeft <= 3600000 && timeLeft > 0) {
  statusText = t(message.guild.id, 'next_episode_soon'); // "⚠️ Próximo episódio saindo em breve!"
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
        { name: t(message.guild.id, 'episodes'), value: `Ep ${ep}`, inline: true },
        { name: t(message.guild.id, 'airing_time'), value: formattedDate, inline: true },
        { name: t(message.guild.id, 'time_left'), value: formatTimeLeft(timeLeft), inline: true },
        { name: t(message.guild.id, 'status'), value: status, inline: true }
      ]
    });

    return message.reply({ embeds: [embed] });

  } catch (err) {
    console.log(err);
    return message.reply(t(message.guild.id, 'error_occurred'));
  }
}

module.exports = next;