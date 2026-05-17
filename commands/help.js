const {

  EmbedBuilder,

  ActionRowBuilder,

  ButtonBuilder,

  ButtonStyle

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
        '🤖 AnimeDBot Help Center'
      )

      .setDescription(

        'Track anime, check upcoming episodes, manage your anime list and more.\n\n' +

'Most anime features can also be accessed through the main interaction menu, making AnimeDBot easier to use without memorizing commands.\n\n' +

'Below are all available commands and systems currently available in AnimeDBot.'
      )

      .addFields(

        {
          name:
            '📺 Anime Commands',

          value:

            '`!add <anime>` → Add anime to tracking\n' +
            '`!list` → Show tracked anime\n' +
            '`!next <anime>` → Next episode info\n' +
            '`!info <anime>` → Detailed anime info\n' +
            '`!remove <anime>` → Remove anime\n' +
            '`!clearlist` → Clear server anime list'
        },

        {
          name:
            '🌍 Language Commands',

          value:
            '`!language` → Change bot language'
        },

        {
          name:
            '⚙️ Admin Commands',

          value:
            '`!setchannel` → Configure bot channel'
        },

        {
          name:
            '💡 Features',

          value:

            '• Multi-provider anime search\n' +
            '• AniList + Jikan support\n' +
            '• Anime tracking\n' +
            '• Episode notifications\n' +
            '• Smart search system\n' +
            '• Anime selection menus'
        }
      )

      .setFooter({

        text:
          'AnimeDBot • DBOTs'
      })

      .setTimestamp();

  const row =

    new ActionRowBuilder()

      .addComponents(

        new ButtonBuilder()

          .setLabel(
            'Support Server'
          )

          .setStyle(
            ButtonStyle.Link
          )

          .setURL(
            'https://discord.com/invite/YFvye4hkuV'
          )

          .setEmoji('💬')
      );

  return message.reply({

    embeds: [embed],

    components: [row]
  });
}

module.exports = help;