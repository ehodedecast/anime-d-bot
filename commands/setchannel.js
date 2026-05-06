const { loadConfig, saveConfig } = require('../utils/config');

function setChannel(message) {

  const config = loadConfig();

  config[message.guild.id] = {
    channelId: message.channel.id
  };

  saveConfig(config);

  return message.reply(
    '✅ Este canal foi definido como canal oficial do AnimeDBot!'
  );
}

module.exports = setChannel;