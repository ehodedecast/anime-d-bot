const {
  AttachmentBuilder
} = require('discord.js');

const {
  getUserAnimeList
} = require('../utils/userAnimeStorage');

const {
  ensureUserProfile
} = require('../utils/userProfileStorage');

const {
  generateProfileCard
} = require('../utils/profileCardGenerator');

const {
  createProfilePayload
} = require('../utils/profileComponentsV2');

function countWatchedEpisodes(
  profile
) {

  const history =
    profile.episodeHistory || {};

  return Object.values(history)
    .reduce((total, episodes) => {
      return total +
        Object.values(episodes || {})
          .filter(entry =>
            entry?.watchedAt
          ).length;
    }, 0);
}

function getUserAvatarUrl(
  user
) {

  if (typeof user.displayAvatarURL === 'function') {
    return user.displayAvatarURL({
      extension: 'png',
      size: 256
    });
  }

  return user.avatarURL?.() ||
    user.defaultAvatarURL;
}

async function profile(
  message
) {

  const userProfile =
    ensureUserProfile(
      message.author.id,
      message.author.username
    );

  const animeList =
    getUserAnimeList(
      message.author.id,
      message.author.username
    );

  const tracking =
    animeList.filter(anime =>
      anime.mode === 'tracking'
    ).length;

  const library =
    animeList.filter(anime =>
      anime.mode !== 'tracking'
    ).length;

  const image =
    generateProfileCard({
      username:
        message.author.username,
      stats: {
        animes:
          tracking,
        episodes:
          countWatchedEpisodes(
            userProfile
          ),
        library:
          library || animeList.length
      }
    });

  const attachment =
    new AttachmentBuilder(
      image,
      {
        name:
          'profile_card.png'
      }
    );

  return message.reply({
    ...createProfilePayload(
      message.guild.id,
      getUserAvatarUrl(
        message.author
      )
    ),
    files: [
      attachment
    ]
  });
}

module.exports = profile;
