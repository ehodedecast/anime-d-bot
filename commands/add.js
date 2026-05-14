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
const state = require('../state/state');


async function add(
  message,
  animeList,
  inputName,
  skipSelection = false,
  selectedAnime = null
) {
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

      format

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

      relations {

        edges {

          relationType

          node {

            id

            title {

              romaji

            }

            format

            status

          }
        }
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
    
    const results =
  res.data.data.Page.media;
  if (
  skipSelection &&
  selectedAnime
) {

  results.length = 0;

  results.push(
    selectedAnime
  );
}

   if (!results.length) {

  return message.reply(
    t(
      message.guild.id,
      'search_temporarily_disabled'
    )
  );
}

const normalizedInput =
  inputName.toLowerCase().trim();

results.sort((a, b) => {

  function calculateScore(anime) {

    let score = 0;

    const title =
      anime.title.romaji
        .toLowerCase();

    // MATCH EXATO
    if (title === normalizedInput) {
      score += 40;
    }

    // CONTÉM O TEXTO
    if (
      title.includes(
        normalizedInput
      )
    ) {
      score += 50;
    }

    // REMOVE PRIORIDADE DE SPINOFFS
    // FORMATO PRINCIPAL

if (
  anime.format === 'TV'
) {
  score += 40;
}

// PUNIÇÃO PESADA

if (
  anime.format === 'MOVIE'
) {
  score -= 80;
}

if (
  anime.format === 'OVA'
) {
  score -= 60;
}

if (
  anime.format === 'SPECIAL'
) {
  score -= 60;
}

    // STATUS
    if (anime.status === 'RELEASING') {
      score += 120;
    }

    if (
      anime.status ===
      'NOT_YET_RELEASED'
    ) {
      score += 100;
    }

    // RECÊNCIA
    if (
  anime.seasonYear
) {

  score +=

    (
      anime.seasonYear -
      2000
    );
}

    return score;
  }

  return (
    calculateScore(b) -
    calculateScore(a)
  );
});

const data = results[0];

const autoSelected =
  results.length > 1;
  const statusMap = {

  FINISHED:
    '📚 Finished',

  RELEASING:
    '🔔 Releasing',

  NOT_YET_RELEASED:
    '🕒 Upcoming',

  HIATUS:
    '⏸️ Hiatus',

  CANCELLED:
    '❌ Cancelled'
};
if (
  !skipSelection
) {
const topResults =
  results.slice(0, 5);



const description =
  topResults.map(
    (anime, index) => {

      const status =
        statusMap[
          anime.status
        ] || anime.status;

      return (

`${index + 1}️⃣ **${anime.title.romaji}**
${status}
📺 ${anime.format || 'Unknown'}
📅 ${anime.seasonYear || 'Unknown'}`
      );
    }
  ).join('\n\n');

state.waitingForAddSelection[
  message.author.id
] = {

  results: topResults
};

return message.reply({

  embeds: [

    createEmbed({

      title:

`🎯 "${inputName}" generated ${topResults.length} results`,

      description:

`${description}

${t(message.guild.id, 'selection_prompt')}`,

      color: 0x5865F2
    })
  ]
});
}

   if (data.isAdult) {
  return message.reply(
    t(message.guild.id, 'adult_content_warning')
  );
}

   

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
        title: `📺 ${data.title.romaji}`,
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
      title: `📺 ${data.title.romaji}`,
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
        t(message.guild.id, 'status') +
`: ${status}`,


      image: data.coverImage?.large,
      color: 0xff9900
    });

    return message.reply({ embeds: [embed] });

  } catch (err) {
    console.log(err);
    return message.reply(t(message.guild.id, 'error_occurred'));
  }
}
module.exports = add;