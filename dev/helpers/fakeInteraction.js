const chalk =
  require('chalk').default;

const {
  createFakeGuild
} = require(
  './fakeGuild'
);

function createFakeInteraction(
  customId,
  overrides = {}
) {

  return {

    customId,

    guild:
      createFakeGuild(),

    user: {

      id:
        'TEST_USER'
    },

    async reply(data) {

      console.log(
        chalk.gray(
          '\n📨 Interaction Reply:'
        )
      );

      console.log(data);
    },

    async update(data) {

      console.log(
        chalk.gray(
          '\n🔄 Interaction Update:'
        )
      );

      console.log(data);
    },

    async deferReply() {

      console.log(
        chalk.gray(
          '\n⏳ Deferred Reply'
        )
      );
    },

    ...overrides
  };
}

module.exports = {
  createFakeInteraction
};