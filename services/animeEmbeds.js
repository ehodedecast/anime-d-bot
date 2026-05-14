const createEmbed =
  require('../utils/embed');

const { t } =
  require(
    '../utils/language'
  );

const statusMap = {

  FINISHED:
    'Finished',

  RELEASING:
    'Releasing',

  NOT_YET_RELEASED:
    'Upcoming',

  CANCELLED:
    'Cancelled',

  HIATUS:
    'Hiatus'
};

function getStatusText(

  guildId,

  anime

) {

  const translatedStatus = {

    FINISHED:
      t(guildId, 'finished'),

    RELEASING:
      t(guildId, 'releasing'),

    NOT_YET_RELEASED:
      t(guildId, 'not_yet_released'),

    CANCELLED:
      t(guildId, 'cancelled'),

    HIATUS:
      t(guildId, 'hiatus')
  };

  return (

    translatedStatus[
      anime.status
    ] ||

    anime.status
  );
}

function createAnimeAddedEmbed({

  guildId,

  anime,

  mode,

  autoSelected
}) {

  const status =
    getStatusText(
      guildId,
      anime
    );

  // 🎯 WITH EPISODE

  if (
    anime.nextAiringEpisode
  ) {

    const ep =

      anime
        .nextAiringEpisode
        .episode;

    const time =
      new Date(

        anime
          .nextAiringEpisode
          .airingAt * 1000
      );

    const formatted =

      time.toLocaleString(

        'pt-BR',

        {

          day: '2-digit',

          month: '2-digit',

          hour: '2-digit',

          minute: '2-digit'
        }
      );

    return createEmbed({

      title:
        `📺 ${anime.title}`,

      description:

t(guildId, 'anime_added') +

`\n\n` +

t(guildId, 'next_episode') +

` **${ep}**\n` +

`⏰ ${formatted}\n` +

`📊 Status: ${status}` +

(

  autoSelected

    ? `\n\n${t(
        guildId,
        'auto_selected_season'
      )}`

    : ''
) +

`\n\n` +

(

  mode === 'tracking'

    ? t(
        guildId,
        'tracking_mode_message'
      )

    : t(
        guildId,
        'library_mode_message'
      )
),

      image:
        anime.coverImage?.large,

      color:
        0x00ccff
    });
  }

  // ❌ WITHOUT EPISODE

  return createEmbed({

    title:
      `📺 ${anime.title}`,

    description:

t(guildId, 'anime_added') +

`\n\n` +

t(
  guildId,
  'next_episode_not_found'
) +

`\n\n` +

(

  mode === 'tracking'

    ? t(
        guildId,
        'tracking_mode_message'
      )

    : t(
        guildId,
        'library_mode_message'
      )
) +

`\n\n` +

t(
  guildId,
  'status'
) +

`: ${status}`,

    image:
      anime.coverImage?.large,

    color:
      0xff9900
  });
}

module.exports = {

  createAnimeAddedEmbed,

  getStatusText
};