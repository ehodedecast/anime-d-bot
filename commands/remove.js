const {
  loadAnimeData,
  saveAnimeData
} = require('../utils/animeStorage');
const { t } = require('../utils/language');
const {
  createRemoveNavigationRow
} = require('../utils/navigationButtons');

function remove(message, animeName) {

  const data = loadAnimeData();

  const animeList =
  data[message.guild.id]
    ?.anime || [];

    console.log(animeList);
console.log(animeName);

  const index = animeList.findIndex(
  a => a.title.toLowerCase() === animeName.toLowerCase()
);

  if (index === -1) {
    return message.reply(
      t(message.guild.id, 'anime_not_found', { title: animeName })
    );
  }
  

  const removed = animeList[index];

  animeList.splice(index, 1);

  data[message.guild.id]
  .anime = animeList;

  saveAnimeData(data);

  return message.reply({
    content:
      t(
        message.guild.id,
        'anime_removed'
      ) +
      ` ${removed.title}`,

    components: [
      createRemoveNavigationRow()
    ]
  });
}

module.exports = remove;
