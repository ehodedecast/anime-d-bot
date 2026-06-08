const express =
  require('express');

const crypto =
  require('crypto');

const {
  loadVotes,
  saveVotes
} = require(
  '../utils/voteStorage'
);

const {
  addXp
} = require(
  '../utils/userProfileStorage'
);

const {
  XP_REWARDS
} = require(
  '../utils/xpSystem'
);

const runtimeStatus =
  require('../state/runtimeStatus');

const app =
  express();

app.use(
  express.json({
    verify: (req, res, buffer) => {
      req.rawBody =
        buffer.toString('utf8');
    }
  })
);

function verifyTopggWebhook(
  rawBody,
  signature,
  secret
) {

  if (
    !rawBody ||
    !signature ||
    !secret
  ) {

    return false;
  }

  const parts =
    signature.split(',');

  const timestampPart =
    parts.find(part =>
      part.startsWith('t=')
    );

  const signaturePart =
    parts.find(part =>
      part.startsWith('v1=')
    );

  if (
    !timestampPart ||
    !signaturePart
  ) {

    return false;
  }

  const timestamp =
    timestampPart.split('=')[1];

  const receivedSignature =
    signaturePart.split('=')[1];

  const expectedSignature =
    crypto
      .createHmac(
        'sha256',
        secret
      )
      .update(
        `${timestamp}.${rawBody}`
      )
      .digest('hex');

  if (
    expectedSignature.length !==
    receivedSignature.length
  ) {

    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(receivedSignature)
  );
}

function startVoteServer(
  client
) {

  app.post(
    '/topgg/vote',

    async (req, res) => {
      try {
        if (
  req.body.type === 'webhook.test'
) {

  return res
    .sendStatus(200);
}

        const signature =
          req.headers['x-topgg-signature'];

        const secret =
          process.env.TOPGG_WEBHOOK_SECRET;

        const isValid =
          verifyTopggWebhook(
            req.rawBody,
            signature,
            secret
          );

        if (
          !isValid
        ) {

          console.log(
            'Invalid Top.gg webhook signature'
          );

          return res
            .status(401)
            .send('Invalid signature');
        }

        if (
          req.body.type !== 'vote.create'
        ) {

          console.log(
            `Ignored Top.gg event: ${req.body.type}`
          );

          return res
            .sendStatus(200);
        }

        const userId =
          req.body?.data?.user?.platform_id;

        const voteId =
          req.body?.data?.id;

        const voteWeight =
          req.body?.data?.weight || 1;

        if (
          !userId
        ) {

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
            lastVote: null,
            voteHistory: []
          };
        }

        const alreadyRegistered =
          votes[userId].voteHistory?.some(
            vote =>
              vote.voteId === voteId
          );

        if (
          alreadyRegistered
        ) {

          console.log(
            `Duplicate Top.gg vote ignored from ${userId}`
          );

          return res
            .sendStatus(200);
        }

        votes[userId].totalVotes +=
          voteWeight;

        votes[userId].lastVote =
          new Date().toISOString();

        if (
          !Array.isArray(
            votes[userId].voteHistory
          )
        ) {

          votes[userId].voteHistory = [];
        }

        votes[userId].voteHistory.push({
          voteId,
          weight: voteWeight,
          votedAt:
            req.body?.data?.created_at ||
            new Date().toISOString()
        });

        saveVotes(votes);

        addXp(
          userId,
          XP_REWARDS.topggVote
        );

        console.log(
  `Vote saved for ${userId}. Total votes: ${votes[userId].totalVotes}`
);

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
  `Top.gg Vote Server Online`
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
