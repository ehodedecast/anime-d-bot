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
const state = require('../state/state');
const {
  loadCache,
  saveCache
} = require('../utils/cacheManager');
const {
  ensureCacheShape,
  getCachedUpcomingEpisode,
  upsertAnimeCacheEntry
} = require('../utils/animeCacheService');

const ITEMS_PER_PAGE = 5;
const PAGINATION_TTL_MS = 10 * 60 * 1000;

function formatTimeLeft(ms) {
  if (ms <= 0) return 'Já lançado';

  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

async function fetchUpcomingEpisodes(animeList) {
  const results = [];
  const cache =
    ensureCacheShape(loadCache());
  let cacheChanged = false;

  for (const anime of animeList) {
    const cached =
      getCachedUpcomingEpisode(
        cache,
        anime
      );

    if (cached.status === 'hit') {
      cache.stats.cacheHits += 1;
      cacheChanged = true;
      results.push(cached.item);
      continue;
    }

    if (cached.status === 'fresh-empty') {
      cache.stats.cacheHits += 1;
      cacheChanged = true;
      continue;
    }

    cache.stats.cacheMisses += 1;
    cacheChanged = true;

    try {
      const query = `
        query {
          Media(id: ${anime.id}, type: ANIME) {
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

      const res = await axios.post(
        'https://graphql.anilist.co/graphql',
        { query }
      );

      const data = res.data.data.Media;

      if (
        !data ||
        data.isAdult
      ) {
        continue;
      }

      upsertAnimeCacheEntry(
        cache,
        data
      );

      if (!data.nextAiringEpisode) {
        continue;
      }

      const airingTime =
        data.nextAiringEpisode.airingAt * 1000;
      const timeLeft = airingTime - Date.now();

      results.push({
        title: data.title.romaji,
        image: data.coverImage?.medium,
        episode: data.nextAiringEpisode.episode,
        airingTime,
        timeLeft,
        status: data.status
      });
    } catch (err) {
      console.log(
        `NEXT FAILED: ${anime.title}`
      );
    }
  }

  if (cacheChanged) {
    saveCache(cache);
  }

  return results.sort(
    (a, b) => a.airingTime - b.airingTime
  );
}

function getStoredNextResults(userId) {
  const pagination =
    state.nextPagination?.[userId];

  if (
    !pagination ||
    !Array.isArray(pagination.results)
  ) {
    return null;
  }

  if (
    Date.now() - pagination.createdAt >
    PAGINATION_TTL_MS
  ) {
    delete state.nextPagination[userId];
    return null;
  }

  return [
    ...pagination.results
  ];
}

function storeNextResults(
  userId,
  results
) {
  state.nextPagination[userId] = {
    results: [
      ...results
    ],
    createdAt: Date.now()
  };
}

async function next(
  message,
  animeList = [],
  currentPage = 0,
  options = {}
) {
  try {
    const userAnime = Array.isArray(animeList)
      ? animeList
      : [];

    if (userAnime.length === 0) {
      return message.reply(
        'Você ainda não adicionou animes à sua lista pessoal.'
      );
    }

    const userId = message.author?.id;
    let allItems =
      options.useStored && userId
        ? getStoredNextResults(userId)
        : null;

    if (!allItems) {
      allItems =
        await fetchUpcomingEpisodes(userAnime);

      if (userId) {
        storeNextResults(userId, allItems);
      }
    }

    if (allItems.length === 0) {
      return message.reply(
        t(
          message.guild.id,
          'next_episode_not_found'
        )
      );
    }

    const totalPages = Math.ceil(
      allItems.length / ITEMS_PER_PAGE
    );

    const safePage = Math.min(
      Math.max(
        Number.isFinite(currentPage)
          ? currentPage
          : 0,
        0
      ),
      totalPages - 1
    );

    const pageItems = allItems.slice(
      safePage * ITEMS_PER_PAGE,
      safePage * ITEMS_PER_PAGE + ITEMS_PER_PAGE
    );

    const embeds = [];

    embeds.push(
      createEmbed({
        title: '🎯 Upcoming Episodes',
        description:
          'Upcoming episodes from your tracked anime list.',
        color: 0x00ccff
      })
    );

    for (const anime of pageItems) {
      const formattedDate = new Date(
        anime.airingTime
      ).toLocaleString(
        'pt-BR',
        {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }
      );

      let color = 0x8b5cf6;

      if (anime.timeLeft <= 3600000) {
        color = 0xff0000;
      } else if (anime.timeLeft <= 21600000) {
        color = 0xff9900;
      } else if (anime.timeLeft <= 86400000) {
        color = 0x00ccff;
      }

      embeds.push(
        createEmbed({
          title: anime.title,
          thumbnail: anime.image,
          color,
          fields: [
            {
              name: '📺 Episode',
              value: `Ep ${anime.episode}`,
              inline: true
            },
            {
              name: '⏳ Time Left',
              value: formatTimeLeft(
                anime.timeLeft
              ),
              inline: true
            },
            {
              name: '🕒 Airing',
              value: formattedDate,
              inline: true
            }
          ]
        })
      );
    }

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(
            `next_prev_${safePage - 1}`
          )
          .setLabel('⬅️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(safePage <= 0),

        new ButtonBuilder()
          .setCustomId(
            `next_page_${safePage}`
          )
          .setLabel(
            `${safePage + 1}/${totalPages}`
          )
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),

        new ButtonBuilder()
          .setCustomId(
            `next_next_${safePage + 1}`
          )
          .setLabel('➡️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(
            safePage >= totalPages - 1
          ),

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
