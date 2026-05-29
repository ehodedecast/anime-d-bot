const { EmbedBuilder } = require('discord.js');
const { loadAnimeData } = require('../utils/animeStorage');
const { loadCache } = require('../utils/cacheManager');
const { t, getGuildLanguage } = require('../utils/language');
const {
  createBackToMenuRow
} = require('../utils/navigationButtons');

const TEST_COVER =
  'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg';

const copy = {
  es: {
    description: 'lista de animes',
    tracking: 'Seguimiento',
    library: 'Biblioteca',
    emptyLayer: 'No hay anime en esta capa.',
    quarantine: 'Cuarentena',
    footer: 'Seguimiento recibe alertas de episodios. Biblioteca solo queda guardada.'
  },
  pt: {
    description: 'Lista de animes',
    tracking: 'Monitorados',
    library: 'Biblioteca',
    emptyLayer: 'Nenhum anime nesta camada.',
    quarantine: 'Quarentena',
    footer: 'Monitorados recebem alertas. Biblioteca fica apenas salva.'
  },
  en: {
    description: 'list of animes',
    tracking: 'Tracking',
    library: 'Library',
    emptyLayer: 'No anime in this layer.',
    quarantine: 'Quarantine',
    footer: 'Tracking receives episode alerts. Library is only saved.'
  }
};

function getCopy(guildId) {

  const language =
    getGuildLanguage(guildId);

  return copy[language] || copy.en;
}

function getAnimeCover(
  anime,
  cache
) {

  return (
    anime.coverImage?.large ||
    anime.coverImage ||
    cache.animes?.[anime.id]?.coverImage ||
    null
  );
}

function formatAnimeRows(
  animeList,
  cache,
  labels
) {

  if (!animeList.length) {
    return labels.emptyLayer;
  }

  const visible =
    animeList.slice(0, 15);

  const rows =
    visible.map((anime, index) => {

      const cacheAnime =
        cache.animes?.[anime.id];

      const nextEpisode =
        cacheAnime?.nextEpisode
          ? ` - Ep ${cacheAnime.nextEpisode.episode}`
          : '';

      const quarantine =
        anime.invalid
          ? ` - ${labels.quarantine}`
          : '';

      return (
        `**${index + 1}.** ${anime.title}` +
        `${nextEpisode}${quarantine}`
      );
    });

  if (
    animeList.length >
    visible.length
  ) {

    rows.push(
      `+${animeList.length - visible.length} animes`
    );
  }

  return rows.join('\n');
}

function list(message) {

  const data =
    loadAnimeData();

  const cache =
    loadCache();

  const labels =
    getCopy(message.guild.id);

  const animeList =
    data[message.guild.id]
      ?.anime || [];

  if (!animeList.length) {
    return message.reply(
      t(message.guild.id, 'list_empty')
    );
  }

  const tracking =
    animeList.filter(
      anime =>
        anime.mode === 'tracking'
    );

  const library =
    animeList.filter(
      anime =>
        anime.mode !== 'tracking'
    );

  const coverAnime =
    animeList.find(
      anime =>
        getAnimeCover(anime, cache)
    );

  const coverImage =
    coverAnime
      ? getAnimeCover(coverAnime, cache)
      : TEST_COVER;

  const embed =
    new EmbedBuilder()
      .setColor(0x7c3aed)
      .setTitle(
        t(message.guild.id, 'list_header')
      )
      .setDescription(
        labels.description
      )
      .setThumbnail(
        coverImage
      )
      .addFields(
        {
          name:
            `${labels.tracking} (${tracking.length})`,

          value:
            formatAnimeRows(
              tracking,
              cache,
              labels
            ),

          inline:
            false
        },
        {
          name:
            `${labels.library} (${library.length})`,

          value:
            formatAnimeRows(
              library,
              cache,
              labels
            ),

          inline:
            false
        }
      )
      .setFooter({
        text:
          labels.footer
      })
      .setTimestamp();

  return message.reply({
    embeds: [embed],
    components: [
      createBackToMenuRow()
    ]
  });
}

module.exports = list;
