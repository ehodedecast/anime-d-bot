const { EmbedBuilder } = require('discord.js');
const branding =
  require('../constants/branding.json');

function createEmbed({ title, description, image, color = 0x5865F2, fields = [] }) {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setImage(image || null)
    .setFooter({
      text: branding.footer
    })
    .setTimestamp();

  // fields
  if (fields.length > 0) {
    embed.addFields(fields);
  }

  return embed;
}

module.exports = createEmbed;