const { EmbedBuilder } = require('discord.js');

function createEmbed({ title, description, image, color = 0x5865F2, fields = [] }) {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setImage(image || null)
    .setFooter({
      text: 'AnimeDBot • André Castro'
    })
    .setTimestamp();

  // fields
  if (fields.length > 0) {
    embed.addFields(fields);
  }

  return embed;
}

module.exports = createEmbed;