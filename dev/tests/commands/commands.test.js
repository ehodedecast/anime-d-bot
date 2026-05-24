const chalk =
  require('chalk').default;

const add =
  require('../../../commands/add');

const list =
  require('../../../commands/list');

const next =
  require('../../../commands/next');

const language =
  require('../../../commands/language');

const setchannel =
  require('../../../commands/setchannel');

const {

  createFakeMessage

} = require(
  '../../helpers/fakeMessage'
);

const {

  assertNoErrorReply

} = require(
  '../../helpers/assert'
);

async function run() {

  console.log(
    chalk.blue(
      '\n🤖 COMMANDS SUITE\n'
    )
  );

  // =========================
  // TEST 1 — ADD
  // =========================

  console.log(
    chalk.yellow(
      '🔍 Testing add command...'
    )
  );

  const addMessage =
    createFakeMessage();

  try {

    await add(

  addMessage,

  [],

  'Naruto'
);

    assertNoErrorReply(
      addMessage.__getReplies()
    );

    console.log(
      chalk.green(
        '✅ Add command passed'
      )
    );

  } catch (err) {

    throw new Error(
      `Add command failed: ${err.message}`
    );
  }

  // =========================
  // TEST 2 — LIST
  // =========================

  console.log(
    chalk.yellow(
      '🔍 Testing list command...'
    )
  );

  const listMessage =
    createFakeMessage();

  try {

    await list(
      listMessage
    );

    assertNoErrorReply(
      listMessage.__getReplies()
    );

    console.log(
      chalk.green(
        '✅ List command passed'
      )
    );

  } catch (err) {

    throw new Error(
      `List command failed: ${err.message}`
    );
  }

  // =========================
  // TEST 3 — NEXT
  // =========================

  console.log(
    chalk.yellow(
      '🔍 Testing next command...'
    )
  );

  const nextMessage =
    createFakeMessage();

  try {

    await next(

  nextMessage,

  'Naruto'
);

    assertNoErrorReply(
      nextMessage.__getReplies()
    );

    console.log(
      chalk.green(
        '✅ Next command passed'
      )
    );

  } catch (err) {

    throw new Error(
      `Next command failed: ${err.message}`
    );
  }

  // =========================
  // TEST 4 — LANGUAGE
  // =========================

  console.log(
    chalk.yellow(
      '🔍 Testing language command...'
    )
  );

  const languageMessage =
    createFakeMessage();

  try {

    await language(

      languageMessage
    );

    assertNoErrorReply(
      languageMessage.__getReplies()
    );

    console.log(
      chalk.green(
        '✅ Language command passed'
      )
    );

  } catch (err) {

    throw new Error(
      `Language command failed: ${err.message}`
    );
  }

  // =========================
  // TEST 5 — SETCHANNEL
  // =========================

  console.log(
    chalk.yellow(
      '🔍 Testing setchannel command...'
    )
  );

  const setChannelMessage =
    createFakeMessage();

  try {

    await setchannel(

      setChannelMessage
    );

    assertNoErrorReply(
      setChannelMessage.__getReplies()
    );

    console.log(
      chalk.green(
        '✅ SetChannel command passed'
      )
    );

  } catch (err) {

    throw new Error(
      `SetChannel command failed: ${err.message}`
    );
  }

  console.log(
    chalk.green(
      '\n✅ Commands suite passed\n'
    )
  );
}

module.exports = {
  run
};