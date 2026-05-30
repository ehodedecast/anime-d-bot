const axios = require('axios');
const {

  ActionRowBuilder,

  ButtonBuilder,

  ButtonStyle

} = require('discord.js');
const createEmbed = require('../utils/embed');
const { t } = require('../utils/language');
const {
  createMenuBackButton
} = require('../utils/navigationButtons');

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

async function next(
  message,

  animeList = [],

  currentPage = 0
) {

  try {

    const userAnime =
      Array.isArray(
        animeList
      )
        ? animeList
        : [];

    if (
      userAnime.length === 0
    ) {

      return message.reply(
        'Você ainda não adicionou animes à sua lista pessoal.'
      );
    }

    const results = [];

    for (
      const anime of userAnime
    ) {

      try {

        const query = `
        query {
          Media(
            id: ${anime.id},
            type: ANIME
          ) {

            isAdult

            title {
              romaji
            }

            coverImage {
              medium
            }

            status

            nextAiringEpisode {
              episode
              airingAt
            }
          }
        }`;

        const res =
          await axios.post(
            'https://graphql.anilist.co/graphql',
            { query }
          );

        const data =
          res.data.data.Media;

        if (
          !data ||
          data.isAdult ||
          !data.nextAiringEpisode
        ) {

          continue;
        }

        const airingTime =

          data
            .nextAiringEpisode
            .airingAt * 1000;

        const now =
          Date.now();

        const timeLeft =
          airingTime - now;

        results.push({

          title:
            data.title.romaji,

          image:
            data.coverImage?.medium,

          episode:
            data
              .nextAiringEpisode
              .episode,

          airingTime,

          timeLeft,

          status:
            data.status
        });

      } catch (err) {

        console.log(
          `NEXT FAILED: ${anime.title}`
        );
      }
    }

    if (
      results.length === 0
    ) {

      return message.reply(
        t(
          message.guild.id,
          'next_episode_not_found'
        )
      );
    }

    // 🧠 ORDER BY CLOSEST

    results.sort(

      (a, b) =>

        a.airingTime -
        b.airingTime
    );

    // 🧠 BUILD DESCRIPTION

    // 🎯 HEADER EMBED

const embeds = [];

const ITEMS_PER_PAGE = 5;

const headerEmbed =
  createEmbed({

    title:
      '🎯 Upcoming Episodes',

    description:
      'Upcoming episodes from your tracked anime list.',

    color:
      0x00ccff
  });

embeds.push(
  headerEmbed
);

// 📺 ANIME EMBEDS

const currentItems =

  results.slice(

    currentPage * ITEMS_PER_PAGE,

    (currentPage + 1) *
    ITEMS_PER_PAGE
  );

for (
  const anime of currentItems
) {

  const formattedDate =

    new Date(
      anime.airingTime
    )

    .toLocaleString(
      'pt-BR',
      {

        day: '2-digit',

        month: '2-digit',

        hour: '2-digit',

        minute: '2-digit'
      }
    );

  let color =
  0x8b5cf6;

// 🔴 < 1h

if (
  anime.timeLeft <=
  3600000
) {

  color =
    0xff0000;
}

// 🟠 < 6h

else if (

  anime.timeLeft <=
  21600000

) {

  color =
    0xff9900;
}

// 🔵 < 24h

else if (

  anime.timeLeft <=
  86400000

) {

  color =
    0x00ccff;
}

  const animeEmbed =
    createEmbed({

      title:
        anime.title,

      thumbnail:
        anime.image,

      color,

      fields: [

        {

          name:
            '📺 Episode',

          value:
            `Ep ${anime.episode}`,

          inline: true
        },

        {

          name:
            '⏳ Time Left',

          value:
            formatTimeLeft(
              anime.timeLeft
            ),

          inline: true
        },

        {

          name:
            '🕒 Airing',

          value:
            formattedDate,

          inline: true
        }
      ]
    });

  embeds.push(
    animeEmbed
  );
}

const totalPages =

  Math.ceil(
    results.length /
    ITEMS_PER_PAGE
  );

const row =
  new ActionRowBuilder()

  .addComponents(

    new ButtonBuilder()

      .setCustomId(
  `next_prev_${currentPage - 1}`
)

      .setLabel('⬅️')

      .setStyle(
        ButtonStyle.Secondary
      )

      .setDisabled(
  currentPage <= 0
),

    new ButtonBuilder()

      .setCustomId(
  `next_page_${currentPage}`
)

      .setLabel(
  `${currentPage + 1}/${totalPages}`
)

      .setStyle(
        ButtonStyle.Primary
      )

      .setDisabled(true),

    new ButtonBuilder()

      .setCustomId(
        `next_next_${currentPage + 1}`
      )

      .setLabel('➡️')

      .setStyle(
        ButtonStyle.Secondary
      )

      .setDisabled(
  currentPage >=
  totalPages - 1
)
,

    createMenuBackButton()
  );

return message.reply({

  embeds,

  components: [row]
});

  } catch (err) {

    console.log(err);

    return message.reply(

      t(
        message.guild.id,
        'error_occurred'
      )
    );
  }
}

module.exports = next;
