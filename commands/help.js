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
        t(message.guild.id,'help_title')
      )

      .setDescription(

        t(message.guild.id,'help_description')
      )

      .addFields(

        {
          name:
            t(message.guild.id,'help_anime_commands_title')+'\n',

          value:

            t(message.guild.id,'help_anime_commands')
        },

        {
          name:
            t(message.guild.id,'help_language_commands_title')+'\n',

          value:
            t(message.guild.id,'help_language_commands')
        },

        {
          name:
            t(message.guild.id,'help_admin_commands_title')+'\n',

          value:
            t(message.guild.id,'help_admin_commands')
        },

        {
          name:
            t(message.guild.id,'help_features_title')+'\n',

          value:

           t(message.guild.id,'help_features') 
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
            t(message.guild.id,'join_support_server')
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