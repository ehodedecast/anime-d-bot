const fs = require('fs');

const PATH = './data/animes.json';

function ensureFile() {

  if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data');
  }

  if (!fs.existsSync(PATH)) {
    fs.writeFileSync(PATH, '{}');
  }
}

function loadAnimeData() {

  ensureFile();

  return JSON.parse(
    fs.readFileSync(PATH, 'utf8')
  );
}

function saveAnimeData(data) {

  ensureFile();

  fs.writeFileSync(
    PATH,
    JSON.stringify(data, null, 2)
  );
}
function getGuildAnimeList(
  guildId
) {

  const data =
    loadAnimeData();

  if (
    !data[guildId]
  ) {

    data[guildId] = {

      guildName:
        'Unknown Guild',

      anime: []
    };

    saveAnimeData(
      data
    );
  }

  return (
    data[guildId]
      .anime
  );
}
module.exports = {
  loadAnimeData,
  saveAnimeData,
  getGuildAnimeList
};