const chalk =
  require('chalk').default;

const {

  createFakeGuild

} = require(
  './fakeGuild'
);

function createFakeMessage(
  overrides = {}
) {

  const messageData = {

    replies: [],

    sentMessages: [],

    dms: []
  };

  const fakeMessage = {

    guild:
      createFakeGuild(),

    author: {

      id:
        'TEST_USER',

      bot: false,

      async send(data) {

        messageData.dms.push(
          data
        );

        console.log(
          chalk.gray(
            '\n📨 Fake DM:'
          )
        );

        console.log(data);
      }
    },

    member: {

      permissions: {

        has() {

          return true;
        }
      }
    },

    channel: {

      async send(data) {

        messageData.sentMessages.push(
          data
        );

        console.log(
          chalk.gray(
            '\n📨 Fake Channel Output:'
          )
        );

        console.log(data);
      }
    },

    mentions: {

      channels: {

        first() {

          return {

            id:
              'TEST_CHANNEL'
          };
        }
      }
    },

    async reply(data) {

      messageData.replies.push(
        data
      );

      console.log(
        chalk.gray(
          '\n💬 Fake Reply:'
        )
      );

      console.log(data);
    },

    __getReplies() {

      return messageData.replies;
    },

    __getSentMessages() {

      return messageData.sentMessages;
    },

    __getDMs() {

      return messageData.dms;
    },

    ...overrides
  };

  return fakeMessage;
}

module.exports = {
  createFakeMessage
};