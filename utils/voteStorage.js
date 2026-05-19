const fs =
  require('fs');

const PATH =
  './data/votes.json';

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

function loadVotes() {

  ensureFile();

  return JSON.parse(

    fs.readFileSync(
      PATH,
      'utf8'
    )
  );
}

function saveVotes(
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

  loadVotes,

  saveVotes
};