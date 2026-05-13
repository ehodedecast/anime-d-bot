const {
  EmbedBuilder
} = require('discord.js');

const {
  t
} = require('../utils/language');

async function help(
  message
) {

  const guildId =
    message.guild.id;

  const embed =
    new EmbedBuilder()

      .setColor(0x5865F2)

      .setTitle(
        t(
          guildId,
          'help_title'
        )
      )

      .setDescription(

        t(
          guildId,
          'help_description'
        )
      )

      .addFields(

        {
          name:
            '📺 Anime',

          value:

            '`!add`\n' +
            '`!list`\n' +
            '`!next`\n' +
            '`!info`\n' +
            '`!remove`\n' +
            '`!clearlist`'
        },

        {
          name:
            '🌍 Language',

          value:
            '`!language`'
        },

        {
          name:
            '⚙️ Admin',

          value:
            '`!setchannel`'
        }
      )

      .setFooter({

        text:
          'AnimeDBot - Dbots'
      });

  return message.reply({

    embeds: [embed]
  });
}

module.exports = help;