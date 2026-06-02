const {
  ensureUserAnimeData,
  saveUserAnimes
} = require('../utils/userAnimeStorage');

const { t } = require('../utils/language');

function clear(message) {

  const data =
    ensureUserAnimeData(
      message.author.id,
      message.author.username
    );

  data[message.author.id].anime = [];

  saveUserAnimes(data);

  return message.reply(
    t(message.guild.id, 'anime_list_cleared')
  );
}

module.exports = clear;
