const fs =
  require('fs');

const path =
  require('path');

const chalk =
  require('chalk').default;

const DATA_DIR =
  './data';

const REQUIRED_FILES = {

  'animes.json': {},

  'animeMappings.json': {},

  'animeCache.json': {

    animes: {}
  },

  'votes.json': {},

  'sentEpisodes.json': {},

  'analytics.json': {},

  'config.json': {}
};

function ensureDirectory() {

  if (
    !fs.existsSync(DATA_DIR)
  ) {

    fs.mkdirSync(DATA_DIR);

    console.log(
      chalk.green(
        '📁 Created data directory'
      )
    );
  }
}

function ensureFile(
  fileName,
  defaultData
) {

  const filePath =
    path.join(
      DATA_DIR,
      fileName
    );

  // 📄 CREATE FILE

  if (
    !fs.existsSync(filePath)
  ) {

    fs.writeFileSync(

      filePath,

      JSON.stringify(
        defaultData,
        null,
        2
      )
    );

    console.log(
      chalk.green(
        `📄 Created ${fileName}`
      )
    );

    return;
  }

  // 🔍 VALIDATE JSON

  try {

    const raw =
      fs.readFileSync(
        filePath,
        'utf8'
      );

    JSON.parse(raw);

  } catch {

    console.log(
      chalk.red(
        `💥 Corrupted JSON repaired: ${fileName}`
      )
    );

    fs.writeFileSync(

      filePath,

      JSON.stringify(
        defaultData,
        null,
        2
      )
    );
  }
}

function validateStorage() {

  console.log(
    chalk.cyan(
      '\n🧠 Validating storage...\n'
    )
  );

  ensureDirectory();

  for (
    const fileName in
    REQUIRED_FILES
  ) {

    ensureFile(

      fileName,

      REQUIRED_FILES[
        fileName
      ]
    );
  }

  console.log(
    chalk.green(
      '\n✅ Storage validation complete\n'
    )
  );
}

module.exports =
  validateStorage;