const fs =
  require('fs');

const PATH =
  './data/guildHistory.json';

function ensureFile() {

  if (
    !fs.existsSync('./data')
  ) {

    fs.mkdirSync('./data');
  }

  if (
    !fs.existsSync(PATH)
  ) {

    fs.writeFileSync(
      PATH,
      '{}'
    );
  }
}

function loadGuildHistory() {

  ensureFile();

  return JSON.parse(

    fs.readFileSync(
      PATH,
      'utf8'
    )
  );
}

function saveGuildHistory(
  data
) {

  ensureFile();

  fs.writeFileSync(

    PATH,

    JSON.stringify(
      data,
      null,
      2
    )
  );
}

module.exports = {

  loadGuildHistory,

  saveGuildHistory
};