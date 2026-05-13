const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { t } = require('../utils/language');

async function language(
  message
) {

  const embed =
    new EmbedBuilder()

      .setColor(0x5865F2)

      .setTitle(
        t(message.guild.id, 'language.title')
      )

      .setDescription(

        t(message.guild.id, 'language.description')

      );

  const row =
    new ActionRowBuilder()

      .addComponents(

        new ButtonBuilder()

          .setCustomId(
            'lang_pt'
          )

          .setLabel(
            t(message.guild.id, 'language.portuguese')
          )

          .setEmoji('🇧🇷')

          .setStyle(
            ButtonStyle.Primary
          ),

        new ButtonBuilder()

          .setCustomId(
            'lang_en'
          )

          .setLabel(
            t(message.guild.id, 'language.english')
          )

          .setEmoji('🇺🇸')

          .setStyle(
            ButtonStyle.Secondary
          )
      );

  return message.reply({

    embeds: [embed],

    components: [row]
  });
}

module.exports = language;