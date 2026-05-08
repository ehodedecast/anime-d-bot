const fs = require('fs');

const PATH = './data/config.json';

function ensureFile() {

  if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data');
  }

  if (!fs.existsSync(PATH)) {
    fs.writeFileSync(PATH, '{}');
  }
}

function loadConfig() {

  ensureFile();

  return JSON.parse(
    fs.readFileSync(PATH, 'utf8')
  );
}

function saveConfig(data) {

  ensureFile();

  fs.writeFileSync(
    PATH,
    JSON.stringify(data, null, 2)
  );
}

module.exports = {
  loadConfig,
  saveConfig
};