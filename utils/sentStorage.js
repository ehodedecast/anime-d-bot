const fs = require('fs');

const PATH = './data/sentEpisodes.json';

function ensureFile() {

  if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data');
  }

  if (!fs.existsSync(PATH)) {
    fs.writeFileSync(PATH, '{}');
  }
}

function loadSentEpisodes() {

  ensureFile();

  return JSON.parse(
    fs.readFileSync(PATH, 'utf8')
  );
}

function saveSentEpisodes(data) {

  ensureFile();

  fs.writeFileSync(
    PATH,
    JSON.stringify(data, null, 2)
  );
}

module.exports = {
  loadSentEpisodes,
  saveSentEpisodes
};