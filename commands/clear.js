const fs = require('fs');

function clear(message, animeList) {
  animeList.length = 0;

  fs.writeFileSync('animes.json', JSON.stringify(animeList, null, 2));

  return message.reply('🧹 Lista limpa com sucesso!');
}

module.exports = clear;