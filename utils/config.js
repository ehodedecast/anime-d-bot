const fs = require('fs');

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync('./data/config.json'));
  } catch {
    return {};
  }
}

function saveConfig(config) {
  fs.writeFileSync('./data/config.json', JSON.stringify(config, null, 2));
}

module.exports = {
  loadConfig,
  saveConfig
};