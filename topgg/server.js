const express =
  require('express');

const {
  loadVotes,
  saveVotes
} = require(
  '../utils/voteStorage'
);

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

        // 📩 USER DM

        try {

          const user =

            await client.users.fetch(
              userId
            );

          await user.send(

            '🗳️ Thank you for voting for AnimeDBot on Top.gg!\n\n' +

            'Your support helps AnimeDBot grow 💖'
          );

        } catch (err) {

          console.log(
            `⚠️ Could not DM user ${userId}`
          );
        }

        console.log(

          `🗳️ New vote from ${userId}`
        );

        res.sendStatus(200);

      } catch (err) {

        console.log(
          `💥 Vote webhook error: ${err.message}`
        );

        res.sendStatus(500);
      }
    }
  );

  app.listen(
    3000,

    () => {

      console.log(
        '🗳️ Top.gg Vote Server Online'
      );
    }
  );
}

module.exports =
  startVoteServer;