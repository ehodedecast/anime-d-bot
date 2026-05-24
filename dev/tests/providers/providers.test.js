const chalk =
  require('chalk').default;

const {

  searchAnime

} = require(
  '../../../providers/animeProvider'
);

const {

  assertArray,

  assertExists

} = require(
  '../../helpers/assert'
);

async function run() {

  console.log(
    chalk.blue(
      '\n🌐 PROVIDERS SUITE\n'
    )
  );

  // =========================
  // TEST 1 — BASIC SEARCH
  // =========================

  console.log(
    chalk.yellow(
      '🔍 Testing anime search...'
    )
  );

  const narutoResults =

    await searchAnime(
      'Naruto'
    );

  assertArray(

    narutoResults,

    'Naruto results is not array'
  );

  assertExists(

    narutoResults.length,

    'Naruto search returned empty'
  );

  console.log(
    chalk.green(
      '✅ Naruto search passed'
    )
  );

  // =========================
  // TEST 2 — FALLBACK SAFETY
  // =========================

  console.log(
    chalk.yellow(
      '🔍 Testing invalid search...'
    )
  );

  const invalidResults =

    await searchAnime(
      'asdhjasdhjasdhjasdhj'
    );

  assertArray(

    invalidResults,

    'Invalid search did not return array'
  );

  console.log(
    chalk.green(
      '✅ Invalid search safety passed'
    )
  );

  // =========================
  // TEST 3 — MALFORMED INPUT
  // =========================

  console.log(
    chalk.yellow(
      '🔍 Testing malformed input...'
    )
  );

  const malformedResults =

    await searchAnime(
      null
    );

  assertArray(

    malformedResults,

    'Malformed input did not return array'
  );

  console.log(
    chalk.green(
      '✅ Malformed input safety passed'
    )
  );

  console.log(
    chalk.green(
      '\n✅ Providers suite passed\n'
    )
  );
}

module.exports = {
  run
};