const fs =
  require('fs');

const chalk =
  require('chalk').default;

async function run() {

  console.log(
    chalk.blue(
      '\n📂 FILESYSTEM SUITE\n'
    )
  );

  const requiredFiles = [

    './data/animes.json',

    './data/animeMappings.json',

    './data/animeCache.json',

    './data/sentEpisodes.json',

    './data/analytics.json',

    './data/config.json',

    './data/guildHistory.json',

    './data/votes.json'
  ];

  for (
    const file of
    requiredFiles
  ) {

    const exists =
      fs.existsSync(file);

    if (!exists) {

      throw new Error(
        `Missing file: ${file}`
      );
    }

    console.log(
      chalk.green(
        `✅ Found: ${file}`
      )
    );

    try {

      const raw =
        fs.readFileSync(
          file,
          'utf8'
        );

      JSON.parse(raw);

      console.log(
        chalk.green(
          `✅ Valid JSON: ${file}`
        )
      );

    } catch {

      throw new Error(
        `Invalid JSON: ${file}`
      );
    }
  }

  console.log(
    chalk.green(
      '\n✅ Filesystem suite passed\n'
    )
  );
}

module.exports = {
  run
};