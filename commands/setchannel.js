const { loadConfig, saveConfig } = require('../utils/config');
const { t } = require('../utils/language');

function setChannel(message) {

  const config = loadConfig();

  config[message.guild.id] = {
    ...config[message.guild.id],

    guildName: message.guild.name,

    channelId: message.channel.id,

    language:
      config[message.guild.id]?.language || 'en'
};

  saveConfig(config);

  return message.reply(
    t(message.guild.id, 'set_channel_success')
  );
}

module.exports = setChannel;