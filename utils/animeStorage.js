const fs = require('fs');

function loadAnimeData() {
  try {
    return JSON.parse(fs.readFileSync('./data/animes.json'));
  } catch {
    return {};
  }
}

function saveAnimeData(data) {
  fs.writeFileSync('./data/animes.json', JSON.stringify(data, null, 2));
}

function getGuildAnimeList(guildId) {

  const data = loadAnimeData();

  if (!data[guildId]) {
    data[guildId] = [];
    saveAnimeData(data);
  }

  return data[guildId];
}

module.exports = {
  loadAnimeData,
  saveAnimeData,
  getGuildAnimeList
};