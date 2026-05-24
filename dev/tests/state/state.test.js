const chalk =
  require('chalk').default;

const buttons =
  require('../../../interactions/buttons');

const state =
  require('../../../state/state');

const {

  createFakeInteraction

} = require(
  '../../helpers/fakeInteraction'
);

async function run() {

  console.log(
    chalk.blue(
      '\n🧠 STATE SUITE\n'
    )
  );

  // =========================
  // TEST 1 — WAITING FOR ADD
  // =========================

  console.log(
    chalk.yellow(
      '🔍 Testing waitingForAdd...'
    )
  );

  const addInteraction =
    createFakeInteraction(
      'menu_add'
    );

  await buttons(
    addInteraction,
    []
  );

  if (

    !state.waitingForAdd?.[
      addInteraction.user.id
    ]

  ) {

    throw new Error(
      'waitingForAdd not set'
    );
  }

  console.log(
    chalk.green(
      '✅ waitingForAdd passed'
    )
  );

  // =========================
  // TEST 2 — WAITING FOR NEXT
  // =========================

  console.log(
    chalk.yellow(
      '🔍 Testing waitingForNext...'
    )
  );

  const nextInteraction =
    createFakeInteraction(
      'menu_next'
    );

  await buttons(
    nextInteraction,
    []
  );

  if (

    !state.waitingForNext?.[
      nextInteraction.user.id
    ]

  ) {

    throw new Error(
      'waitingForNext not set'
    );
  }

  console.log(
    chalk.green(
      '✅ waitingForNext passed'
    )
  );

  // =========================
  // TEST 3 — WAITING FOR INFO
  // =========================

  console.log(
    chalk.yellow(
      '🔍 Testing waitingForInfo...'
    )
  );

  const infoInteraction =
    createFakeInteraction(
      'menu_info'
    );

  await buttons(
    infoInteraction,
    []
  );

  if (

    !state.waitingForInfo?.[
      infoInteraction.user.id
    ]

  ) {

    throw new Error(
      'waitingForInfo not set'
    );
  }

  console.log(
    chalk.green(
      '✅ waitingForInfo passed'
    )
  );

  // =========================
  // TEST 4 — WAITING FOR REMOVE
  // =========================

  console.log(
    chalk.yellow(
      '🔍 Testing waitingForRemove...'
    )
  );

  const removeInteraction =
    createFakeInteraction(
      'menu_remove'
    );

  await buttons(
    removeInteraction,
    []
  );

  if (

    !state.waitingForRemove?.[
      removeInteraction.user.id
    ]

  ) {

    throw new Error(
      'waitingForRemove not set'
    );
  }

  console.log(
    chalk.green(
      '✅ waitingForRemove passed'
    )
  );

  console.log(
    chalk.green(
      '\n✅ State suite passed\n'
    )
  );
}

module.exports = {
  run
};