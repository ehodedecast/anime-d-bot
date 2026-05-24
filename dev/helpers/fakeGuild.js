function createFakeGuild(
  overrides = {}
) {

  return {

    id:
      'TEST_GUILD',

    name:
      'Test Guild',

    memberCount:
      50,

    async fetchOwner() {

      return {

        user: {

          tag:
            'Owner#0001'
        }
      };
    },

    ...overrides
  };
}

module.exports = {
  createFakeGuild
};