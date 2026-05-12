const axios = require('axios');
const {
  loadAnimeData,
  saveAnimeData
} = require('../utils/animeStorage');
const createEmbed = require('../utils/embed');
const { t } = require('../utils/language');
const {
  loadAnalytics,
  saveAnalytics
} = require('../utils/analyticsStorage');


async function add(message, animeList, inputName) {
  try {
    const query = `
query ($search: String) {

  Page(perPage: 10) {

    media(
      search: $search,
      type: ANIME
    ) {

      id

      isAdult

      status

      seasonYear

      title {
        romaji
      }

      coverImage {
        large
      }

      nextAiringEpisode {
        episode
        airingAt
      }
    }
  }
}`;

    const variables = {
  search: inputName
};

const res = await axios.post(
  'https://graphql.anilist.co/graphql',
  {
    query,
    variables
  }
);
    
    const results = res.data.data.Page.media;

   if (!results.length) {

  return message.reply(
    t(
      message.guild.id,
      'search_temporarily_disabled'
    )
  );
}

const priorityStatuses = [
  'RELEASING',
  'NOT_YET_RELEASED'
];

results.sort((a, b) => {

  const aPriority =
    priorityStatuses.includes(a.status)
      ? 1
      : 0;

  const bPriority =
    priorityStatuses.includes(b.status)
      ? 1
      : 0;

  if (aPriority !== bPriority) {
    return bPriority - aPriority;
  }

  return (
    (b.seasonYear || 0) -
    (a.seasonYear || 0)
  );
});

const data = results[0];
const autoSelected =
  results.length > 1;
    

   if (data.isAdult) {
  return message.reply(
    t(message.guild.id, 'adult_content_warning')
  );
}

    const name = data.title.romaji;

    const alreadyExists = animeList.find(
  anime => anime.id === data.id
);

if (alreadyExists) {
  const analytics =
  loadAnalytics();

if (
  !analytics.animeMetrics
) {
  analytics.animeMetrics = {};
}

if (
  !analytics.animeMetrics[data.id]
) {

  analytics.animeMetrics[data.id] = {

    title:
      data.title.romaji,

    successfulAdds: 0,

    attemptAdds: 0,

    duplicateAttempts: 0,

    activeGuilds: []
  };
}

analytics
  .animeMetrics[data.id]
  .attemptAdds++;

analytics
  .animeMetrics[data.id]
  .duplicateAttempts++;

saveAnalytics(analytics);
  return message.reply(t(message.guild.id, 'anime_already_exists'));
}

    const animeData = loadAnimeData();

if (!animeData[message.guild.id]) {
  animeData[message.guild.id] = [];
}


const analytics =
  loadAnalytics();

if (
  !analytics.animeMetrics
) {
  analytics.animeMetrics = {};
}

if (
  !analytics.animeMetrics[data.id]
) {

  analytics.animeMetrics[data.id] = {

    title:
      data.title.romaji,

    successfulAdds: 0,

    attemptAdds: 0,

    duplicateAttempts: 0,

    activeGuilds: []
  };
}

analytics
  .animeMetrics[data.id]
  .successfulAdds++;

analytics
  .animeMetrics[data.id]
  .attemptAdds++;

if (
  !analytics
    .animeMetrics[data.id]
    .activeGuilds
    .includes(message.guild.id)
) {

  analytics
    .animeMetrics[data.id]
    .activeGuilds
    .push(message.guild.id);
}

saveAnalytics(analytics);

const trackingStatuses = [
  'RELEASING',
  'NOT_YET_RELEASED'
];

const mode =
  trackingStatuses.includes(data.status)

    ? 'tracking'

    : 'library';

animeList.push({

  id: data.id,

  title: data.title.romaji,

  mode
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
  t(message.guild.id, 'anime_added') +
  `\n\n` +
  t(message.guild.id, 'next_episode') + ` **${ep}**\n` +
  `⏰ ${formatted}\n` +
  `📊 Status: ${status}` +
  (
  autoSelected

    ? `\n\n${t(
        message.guild.id,
        'auto_selected_season'
      )}`

    : ''
) +
  `\n\n` +
  (
    mode === 'tracking'

      ? t(
          message.guild.id,
          'tracking_mode_message'
        )

      : t(
          message.guild.id,
          'library_mode_message'
        )
  ),

        image: data.coverImage?.large,
        color: 0x00ccff
      });

      return message.reply({ embeds: [embed] });
    }

    // ❌ SEM EPISÓDIO
    const embed = createEmbed({
      title: `📺 ${name}`,
      description:
      
        t(message.guild.id, 'anime_added') +
        `\n\n` +
        t(message.guild.id, 'next_episode_not_found') +
          `\n\n` + 
        (mode === 'tracking'

  ? t(
      message.guild.id,
      'tracking_mode_message'
    )

  : t(
      message.guild.id,
      'library_mode_message'
    )) +
          `\n\n` + 
        `📊 Status: ${status}`,
      image: data.coverImage?.large,
      color: 0xff9900
    });

    return message.reply({ embeds: [embed] });

  } catch (err) {
    console.log(err);
    return message.reply(t(message.guild.id, 'api_problem'));
  }
}
module.exports = add;