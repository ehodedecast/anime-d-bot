const DM_CLOSED_WARNING =
  '⚠️ Nao consegui te enviar uma DM.\n\n' +
  'O AnimeDBot usa mensagens privadas para avisar sobre novos episodios.\n\n' +
  'Ative suas DMs para receber avisos de 24h e lancamentos.';

async function canSendDm(user) {
  try {
    if (
      typeof user.createDM === 'function'
    ) {
      await user.createDM();
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

async function warnDmClosed(
  interaction
) {
  try {
    const payload = {
      content:
        DM_CLOSED_WARNING,
      ephemeral: true
    };

    if (
      interaction.deferred ||
      interaction.replied
    ) {
      return interaction.followUp(
        payload
      );
    }

    return interaction.reply(
      payload
    );
  } catch (err) {
    console.log(
      'DM closed warning failed:',
      err.message
    );

    return null;
  }
}

async function runWithDmStatusWarning(
  interaction,
  handler
) {
  const dmCheck =
    canSendDm(
      interaction.user
    );

  try {
    return await handler();
  } finally {
    const canReceiveDm =
      await dmCheck;

    if (
      !canReceiveDm
    ) {
      await warnDmClosed(
        interaction
      );
    }
  }
}

module.exports = {
  canSendDm,
  warnDmClosed,
  runWithDmStatusWarning,
  DM_CLOSED_WARNING
};
