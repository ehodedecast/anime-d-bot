const { loadAnimeData } = require('../utils/animeStorage');

function list(message) {

  const data = loadAnimeData();

  const animeList = data[message.guild.id] || [];

  if (!animeList.length) {
    return message.reply('📭 Nenhum anime na lista.');
  }

  return message.reply(
  `📋 Lista do servidor **${message.guild.name}**:\n\n` +
  animeList.map(a => `• ${a}`).join('\n')
);
}

module.exports = list;