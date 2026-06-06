const { EmbedBuilder } = require('discord.js');
const {
  getUserAnimeList
} = require('../utils/userAnimeStorage');
const { loadCache } = require('../utils/cacheManager');
const {
  tUser,
  getUserLanguage
} = require('../utils/language');
const {
  createBackToMenuRow
} = require('../utils/navigationButtons');

const TEST_COVER =
  'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg';

const copy = {
  es: {
    description: 'lista pessoal de animes',
    tracking: 'Seguimiento',
    library: 'Biblioteca',
    emptyPersonal: 'Todavia no has añadido anime a tu lista personal.',
    emptyLayer: 'No hay anime en esta capa.',
    quarantine: 'Cuarentena',
    footer: 'Lista personal del usuario. Seguimiento recibe alertas cuando el tracker por usuario esté activo.'
  },
  pt: {
    description: 'Lista pessoal de animes',
    tracking: 'Monitorados',
    library: 'Biblioteca',
    emptyPersonal: 'Você ainda não adicionou animes à sua lista pessoal.',
    emptyLayer: 'Nenhum anime nesta camada.',
    quarantine: 'Quarentena',
    footer: 'Lista pessoal do usuário. Monitorados receberão alertas quando o tracker por usuário estiver ativo.'
  },
  en: {
    description: 'personal anime list',
    tracking: 'Tracking',
    library: 'Library',
    emptyPersonal: 'You have not added anime to your personal list yet.',
    emptyLayer: 'No anime in this layer.',
    quarantine: 'Quarantine',
    footer: 'Personal user list. Tracking will receive alerts when user tracking is active.'
  }
};

function getCopy(userId, guildId) {

  const language =
    getUserLanguage(userId, guildId);

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

function getUserAvatarUrl(
  user
) {

  if (
    typeof user.displayAvatarURL === 'function'
  ) {
    return user.displayAvatarURL({
      size: 128
    });
  }

  if (
    typeof user.avatarURL === 'function'
  ) {
    return user.avatarURL({
      size: 128
    });
  }

  return null;
}

function list(message) {

  const cache =
    loadCache();

  const labels =
    getCopy(
      message.author.id,
      message.guild.id
    );

  const animeList =
    getUserAnimeList(
      message.author.id,
      message.author.username
    );

  if (!animeList.length) {
    return message.reply(
      labels.emptyPersonal
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
      .setAuthor({
        name:
          message.author.username,
        iconURL:
          getUserAvatarUrl(
            message.author
          )
      })
      .setTitle(
        tUser(
          message.author.id,
          'list_header',
          message.guild.id
        )
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
      createBackToMenuRow(
        message.guild.id,
        message.author.id
      )
    ]
  });
}

module.exports = list;
