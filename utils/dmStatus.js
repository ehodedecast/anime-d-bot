const {
  tUser
} = require('./language');

const {
  MessageFlags
} = require('discord.js');

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
        tUser(
          interaction.user.id,
          'dm_closed_warning',
          interaction.guild?.id
        ),
      flags: MessageFlags.Ephemeral
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
  runWithDmStatusWarning
};
