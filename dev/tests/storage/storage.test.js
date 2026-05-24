const fs =
  require('fs');

const chalk =
  require('chalk').default;

async function run() {

  console.log(
    chalk.blue(
      '\n💾 STORAGE SUITE\n'
    )
  );

  // =========================
  // TEST 1 — LOAD ANIMES
  // =========================

  console.log(
    chalk.yellow(
      '🔍 Testing animes.json load...'
    )
  );

  const animesRaw =
    fs.readFileSync(
      './data/animes.json',
      'utf8'
    );

  const animes =
    JSON.parse(animesRaw);

  if (
    typeof animes !==
    'object'
  ) {

    throw new Error(
      'animes.json is not object'
    );
  }

  console.log(
    chalk.green(
      '✅ animes.json load passed'
    )
  );

  // =========================
  // TEST 2 — GUILD STRUCTURE
  // =========================

  console.log(
    chalk.yellow(
      '🔍 Testing guild structures...'
    )
  );

  for (
    const guildId in animes
  ) {

    const guild =
      animes[guildId];

    if (
      !guild.anime
    ) {

      throw new Error(
        `Guild ${guildId} missing anime array`
      );
    }

    if (
      !Array.isArray(
        guild.anime
      )
    ) {

      throw new Error(
        `Guild ${guildId} anime is not array`
      );
    }
  }

  console.log(
    chalk.green(
      '✅ Guild structure passed'
    )
  );

  // =========================
  // TEST 3 — ANIME SCHEMA
  // =========================

  console.log(
    chalk.yellow(
      '🔍 Testing anime schema...'
    )
  );

  for (
    const guildId in animes
  ) {

    const guild =
      animes[guildId];

    for (
      const anime of
      guild.anime
    ) {

      if (
        typeof anime.id !==
        'number'
      ) {

        throw new Error(
          `Invalid anime id in ${guildId}`
        );
      }

      if (
        typeof anime.title !==
        'string'
      ) {

        throw new Error(
          `Invalid anime title in ${guildId}`
        );
      }

      if (
        typeof anime.mode !==
        'string'
      ) {

        throw new Error(
          `Invalid anime mode in ${guildId}`
        );
      }
    }
  }

  console.log(
    chalk.green(
      '✅ Anime schema passed'
    )
  );

  // =========================
  // TEST 4 — DUPLICATES
  // =========================

  console.log(
    chalk.yellow(
      '🔍 Testing duplicates...'
    )
  );

  for (
    const guildId in animes
  ) {

    const guild =
      animes[guildId];

    const ids =
      guild.anime.map(
        a => a.id
      );

    const unique =
      new Set(ids);

    if (
      ids.length !==
      unique.size
    ) {

      throw new Error(
        `Duplicate anime ids in ${guildId}`
      );
    }
  }

  console.log(
    chalk.green(
      '✅ Duplicate validation passed'
    )
  );

  console.log(
    chalk.green(
      '\n✅ Storage suite passed\n'
    )
  );
}

module.exports = {
  run
};