const {
  loadAnimeData,
  saveAnimeData
} = require('../utils/animeStorage');

const { t } = require('../utils/language');

function clear(message) {

  const data = loadAnimeData();

  data[message.guild.id] = [];

  saveAnimeData(data);

  return message.reply(
    t(message.guild.id, 'anime_list_cleared')
  );
}

module.exports = clear;