const fs = require('fs');

function loadSentEpisodes() {

  try {
    return JSON.parse(
      fs.readFileSync('sentEpisodes.json')
    );
  } catch {
    return {};
  }
}

function saveSentEpisodes(data) {

  fs.writeFileSync(
    'sentEpisodes.json',
    JSON.stringify(data, null, 2)
  );
}

module.exports = {
  loadSentEpisodes,
  saveSentEpisodes
};