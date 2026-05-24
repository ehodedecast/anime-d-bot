function createFakeClient() {

  return {

    guilds: {

      cache: new Map([

        [
          '1',

          {
            memberCount: 100
          }
        ],

        [
          '2',

          {
            memberCount: 50
          }
        ]
      ])
    },

    users: {

      async fetch() {

        return {

          async send(data) {

            console.log(
              '\n📨 Fake User DM:'
            );

            console.log(data);
          }
        };
      }
    }
  };
}

module.exports = {
  createFakeClient
};