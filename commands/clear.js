const {
  loadAnimeData,
  saveAnimeData
} = require('../utils/animeStorage');

function clear(message) {

  const data = loadAnimeData();

  data[message.guild.id] = [];

  saveAnimeData(data);

  return message.reply(
    '🧹 Lista limpa com sucesso!'
  );
}

module.exports = clear;