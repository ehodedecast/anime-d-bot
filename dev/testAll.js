const fs =
  require('fs');

const path =
  require('path');

const chalk =
  require('chalk').default;

console.log(
  chalk.cyan(
    '\n🧪 AnimeDBot Test Suite\n'
  )
);

const requiredFiles = [

  './data/animes.json',

  './data/animeMappings.json',

  './data/animeCache.json',

  './data/sentEpisodes.json',

  './data/analytics.json'
];

async function runTests() {

  try {

    console.log(
      chalk.yellow(
        '🔍 Running tests...\n'
      )
    );

    // 📂 FILE TESTS

    console.log(
      chalk.blue(
        '\n📂 Checking files...\n'
      )
    );

    for (
      const file of requiredFiles
    ) {

      const exists =
        fs.existsSync(file);

      if (!exists) {

        console.log(
          chalk.red(
            `❌ Missing: ${file}`
          )
        );

        continue;
      }

      console.log(
        chalk.green(
          `✅ Found: ${file}`
        )
      );

      // 🔍 VALID JSON

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

        console.log(
          chalk.red(
            `❌ Invalid JSON: ${file}`
          )
        );
      }
    }

    console.log(
      chalk.green(
        '\n✅ File tests completed\n'
      )
    );
    // 🧠 SCHEMA VALIDATION

console.log(
  chalk.blue(
    '\n🧠 Checking schema...\n'
  )
);

const animeData = JSON.parse(

  fs.readFileSync(
    './data/animes.json',
    'utf8'
  )
);

for (
  const guildId in animeData
) {

  const guild =
    animeData[guildId];

  // ❌ LEGACY FORMAT

  if (
    Array.isArray(guild)
  ) {

    console.log(
      chalk.red(
        `❌ Legacy schema: ${guildId}`
      )
    );

    continue;
  }

  // ❌ INVALID GUILD NAME

  if (
    typeof guild.guildName !==
    'string'
  ) {

    console.log(
      chalk.red(
        `❌ Missing guildName: ${guildId}`
      )
    );

    continue;
  }

  // ❌ INVALID ANIME ARRAY

  if (
    !Array.isArray(
      guild.anime
    )
  ) {

    console.log(
      chalk.red(
        `❌ Invalid anime array: ${guildId}`
      )
    );

    continue;
  }

  console.log(
    chalk.green(
      `✅ Valid guild: ${guild.guildName}`
    )
  );
}

console.log(
  chalk.green(
    '\n✅ Schema validation completed\n'
  )
);
// 🌐 PROVIDER TESTS

console.log(
  chalk.blue(
    '\n🌐 Testing providers...\n'
  )
);

const {
  searchAnime:
    anilistSearch
} = require(
  '../providers/anilist'
);

const {
  searchAnime:
    jikanSearch
} = require(
  '../providers/jikan'
);

// 🔵 ANILIST

try {

  const results =
    await anilistSearch(
      'Naruto'
    );

  console.log(
    chalk.green(
      `✅ AniList online (${results.length} results)`
    )
  );

} catch (err) {

  console.log(
    chalk.red(
      `❌ AniList failed: ${err.message}`
    )
  );
}

// 🟡 JIKAN

try {

  const results =
    await jikanSearch(
      'Naruto'
    );

  console.log(
    chalk.green(
      `✅ Jikan online (${results.length} results)`
    )
  );

} catch (err) {

  console.log(
    chalk.red(
      `❌ Jikan failed: ${err.message}`
    )
  );
}

console.log(
  chalk.green(
    '\n✅ Provider tests completed\n'
  )
);
// 🤖 COMMAND TESTS

console.log(
  chalk.blue(
    '\n🤖 Testing commands...\n'
  )
);

const add = require(
  '../commands/add'
);

// 🎭 FAKE MESSAGE

const fakeMessage = {

  guild: {

    id:
      'TEST_GUILD',

    name:
      'Test Guild'
  },

  author: {
    bot: false
  },

  channel: {

    async send(data) {

      console.log(
        chalk.gray(
          '\n📨 Fake Discord Output:'
        )
      );

      console.log(data);
    }
  },

  async reply(data) {

    console.log(
      chalk.gray(
        '\n💬 Fake Reply:'
      )
    );

    console.log(data);
  }
};

try {

  await add(

    fakeMessage,

    [],

    'Naruto'
  );

  console.log(
    chalk.green(
      '\n✅ Add command passed'
    )
  );

} catch (err) {

  console.log(
    chalk.red(
      `\n❌ Add command failed: ${err.message}`
    )
  );
}

console.log(
  chalk.green(
    '\n✅ Command tests completed\n'
  )
);
  } catch (err) {

    console.log(
      chalk.red(
        '\n❌ TEST FAILURE'
      )
    );

    console.log(err);
  }
}

runTests();