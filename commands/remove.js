const {
  loadAnimeData,
  saveAnimeData
} = require('../utils/animeStorage');

function remove(message, animeName) {

  const data = loadAnimeData();

  const animeList = data[message.guild.id] || [];

  const index = animeList.findIndex(
  a => a.title.toLowerCase() === animeName.toLowerCase()
);

  if (index === -1) {
    return message.reply(
      '❌ Anime não encontrado na lista.'
    );
  }

  const removed = animeList[index];

  animeList.splice(index, 1);

  data[message.guild.id] = animeList;

  saveAnimeData(data);

  return message.reply(
    `🗑️ ${removed.title} removido da lista!`
  );
}

module.exports = remove;