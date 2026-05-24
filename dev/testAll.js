const chalk =
  require('chalk').default;

require('dotenv')
  .config();

console.log(
  chalk.cyan(
    '\n🧪 AnimeDBot Test Suite\n'
  )
);

const testSuites = [

  // 📂 FILESYSTEM

  require(
    './tests/filesystem/filesystem.test'
  ),

  // 🌐 PROVIDERS

  require(
    './tests/providers/providers.test'
  ),

  // 🤖 COMMANDS

  require(
    './tests/commands/commands.test'
  ),

  // 🎮 INTERACTIONS

  require(
    './tests/interactions/interactions.test'
  ),

  // 🧠 STATE

  require(
  './tests/state/state.test'
  ),

  // 🔔 NOTIFICATIONS

  require(
    './tests/notifications/notifications.test'
  ),
// 💾 STORAGE

require(
  './tests/storage/storage.test'
),
  // ⚡ CACHE

  require(
    './tests/cache/cache.test'
  ),

  // 📊 ANALYTICS

  require(
    './tests/analytics/analytics.test'
  ),

  // 💥 FAILURES

  require(
    './tests/failures/failures.test'
  ),

  // 🏰 LIFECYCLE

  require(
    './tests/lifecycle/lifecycle.test'
  )
];

let passed =
  0;

let failed =
  0;

async function runTests() {

  console.log(
    chalk.yellow(
      '🔍 Running test suites...\n'
    )
  );

  for (
    const suite of
    testSuites
  ) {

    try {

      await suite.run();

      passed++;

    } catch (err) {

      failed++;

      console.log(
        chalk.red(
          `\n❌ Suite failed: ${err.message}`
        )
      );
    }
  }

  console.log(
    chalk.cyan(
      '\n📊 TEST SUMMARY\n'
    )
  );

  console.log(
    chalk.green(
      `✅ Passed: ${passed}`
    )
  );

  console.log(
    chalk.red(
      `❌ Failed: ${failed}`
    )
  );

  console.log('');
}

runTests();