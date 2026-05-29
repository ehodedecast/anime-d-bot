const express =
  require('express');

const {
  loadVotes,
  saveVotes
} = require(
  '../utils/voteStorage'
);

const runtimeStatus =
  require('../state/runtimeStatus');

const app =
  express();

app.use(
  express.json()
);

function startVoteServer(
  client
) {

  app.post(
    '/topgg/vote',

    async (req, res) => {

      try {

        const userId =
          req.body.user;

        if (!userId) {

          return res
            .status(400)
            .send('Missing user');
        }

        const votes =
          loadVotes();

        if (
          !votes[userId]
        ) {

          votes[userId] = {
            totalVotes: 0,
            lastVote: null
          };
        }

        votes[userId]
          .totalVotes++;

        votes[userId]
          .lastVote =
            new Date()
              .toISOString();

        saveVotes(votes);

        try {

          const user =
            await client.users.fetch(
              userId
            );

          await user.send(
            'Thank you for voting for AnimeDBot on Top.gg.'
          );

        } catch (err) {

          console.log(
            `Could not DM vote user ${userId}`
          );
        }

        console.log(
          `New Top.gg vote from ${userId}`
        );

        res.sendStatus(200);

      } catch (err) {

        console.log(
          `Vote webhook error: ${err.message}`
        );

        res.sendStatus(500);
      }
    }
  );

  const port =
    process.env.PORT || 3000;

  app.listen(
    port,

    () => {

      runtimeStatus.topggServer.started = true;
      runtimeStatus.topggServer.port = port;
      runtimeStatus.topggServer.error = null;
      runtimeStatus.topggServer.startedAt =
        new Date().toISOString();

      console.log(
        'Top.gg Vote Server Online'
      );
    }
  ).on(
    'error',
    err => {

      runtimeStatus.topggServer.started = false;
      runtimeStatus.topggServer.error =
        err.message;

      console.log(
        `Top.gg Vote Server error: ${err.message}`
      );
    }
  );
}

module.exports =
  startVoteServer;
