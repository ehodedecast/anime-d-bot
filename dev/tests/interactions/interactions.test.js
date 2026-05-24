const chalk =
  require('chalk').default;

const sendMenu =
  require('../../../interactions/menu');

const buttons =
  require('../../../interactions/buttons');

const {

  createFakeMessage

} = require(
  '../../helpers/fakeMessage'
);

const {

  createFakeInteraction

} = require(
  '../../helpers/fakeInteraction'
);

async function run() {

  console.log(
    chalk.blue(
      '\n🎮 INTERACTIONS SUITE\n'
    )
  );

  // =========================
  // TEST 1 — MENU VIA MESSAGE
  // =========================

  console.log(
    chalk.yellow(
      '🔍 Testing menu reply...'
    )
  );

  const fakeMessage =
    createFakeMessage();

  try {

    await sendMenu(
      fakeMessage
    );

    const replies =

      fakeMessage.__getReplies();

    if (
      !replies.length
    ) {

      throw new Error(
        'Menu did not reply'
      );
    }

    console.log(
      chalk.green(
        '✅ Menu reply passed'
      )
    );

  } catch (err) {

    throw new Error(
      `Menu reply failed: ${err.message}`
    );
  }

  // =========================
  // TEST 2 — MENU VIA BUTTON
  // =========================

  console.log(
    chalk.yellow(
      '🔍 Testing menu update...'
    )
  );

  const fakeInteraction =
    createFakeInteraction(
      'menu_test'
    );

  fakeInteraction.isButton =
    () => true;

  let updated =
    false;

  fakeInteraction.update =
    async () => {

      updated = true;
    };

  try {

    await sendMenu(
      fakeInteraction
    );

    if (!updated) {

      throw new Error(
        'Menu did not update'
      );
    }

    console.log(
      chalk.green(
        '✅ Menu update passed'
      )
    );

  } catch (err) {

    throw new Error(
      `Menu update failed: ${err.message}`
    );
  }
// =========================
// TEST 3 — BUTTON ADD
// =========================

console.log(
  chalk.yellow(
    '🔍 Testing menu_add button...'
  )
);

const addInteraction =
  createFakeInteraction(
    'menu_add'
  );

try {

  await buttons(
    addInteraction,
    []
  );

  console.log(
    chalk.green(
      '✅ menu_add passed'
    )
  );

} catch (err) {

  throw new Error(
    `menu_add failed: ${err.message}`
  );
}

// =========================
// TEST 4 — BUTTON NEXT
// =========================

console.log(
  chalk.yellow(
    '🔍 Testing menu_next button...'
  )
);

const nextInteraction =
  createFakeInteraction(
    'menu_next'
  );

try {

  await buttons(
    nextInteraction,
    []
  );

  console.log(
    chalk.green(
      '✅ menu_next passed'
    )
  );

} catch (err) {

  throw new Error(
    `menu_next failed: ${err.message}`
  );
}

// =========================
// TEST 5 — BUTTON LIST
// =========================

console.log(
  chalk.yellow(
    '🔍 Testing menu_list button...'
  )
);

const listInteraction =
  createFakeInteraction(
    'menu_list'
  );

try {

  await buttons(
    listInteraction,
    []
  );

  console.log(
    chalk.green(
      '✅ menu_list passed'
    )
  );

} catch (err) {

  throw new Error(
    `menu_list failed: ${err.message}`
  );
}
  console.log(
    chalk.green(
      '\n✅ Interactions suite passed\n'
    )
  );
}

module.exports = {
  run
};