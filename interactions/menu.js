const {
  createMainMenuPayload
} = require('../utils/componentsV2Menu');

const {
  MessageFlags
} = require('discord.js');

function isComponentsV2Message(
  target
) {

  return Boolean(
    target.message?.flags?.has?.(
      MessageFlags.IsComponentsV2
    )
  );
}

function sendMenu(target) {
  const guildId =
    target.guild.id;

  const payload =
    createMainMenuPayload(
      guildId
    );

  if (
    target.isButton?.()
  ) {
    if (
      isComponentsV2Message(
        target
      )
    ) {
      return target.update(
        payload
      );
    }

    return target.update(
      {
        content:
          'Menu aberto abaixo.',
        embeds: [],
        components: []
      }
    )
      .then(() =>
        target.followUp({
          ...payload,
          flags:
            MessageFlags.IsComponentsV2 |
            MessageFlags.Ephemeral
        })
      );
  }

  return target.reply(
    payload
  );
}

module.exports = sendMenu;
