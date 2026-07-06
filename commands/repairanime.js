const {
  buildInitialPanel,
  createSession,
  isOwner,
  notAllowedPayload
} = require('../utils/repairAnimePanel');

async function repairanime(
  interaction
) {

  if (
    !isOwner(
      interaction
    )
  ) {
    return interaction.reply(
      notAllowedPayload()
    );
  }

  const sessionId =
    createSession(
      interaction.user.id
    );

  return interaction.reply(
    buildInitialPanel(
      sessionId
    )
  );
}

module.exports = repairanime;
