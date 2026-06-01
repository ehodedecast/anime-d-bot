const {
  createMainMenuPayload
} = require('../utils/componentsV2Menu');

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
    return target.update(
      payload
    );
  }

  return target.reply(
    payload
  );
}

module.exports = sendMenu;
