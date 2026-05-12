const { loadAnimeData } = require('../utils/animeStorage');
const { t } = require('../utils/language');

function list(message) {
console.log("ANTES DO LOAD");
  const data = loadAnimeData();

  const animeList = data[message.guild.id] || [];
  console.log(animeList);

  if (!animeList.length) {
    return message.reply(t(message.guild.id, 'list_empty'));
  }
console.log("ANTES DO REPLY");
  return message.reply(
  t(message.guild.id, 'list_header') +
  '\n\n' +
  animeList.map((anime, index) => `**${index + 1}.** ${anime.title}`).join('\n')
);
}

module.exports = list;