const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');

const {
  tUser
} = require('../utils/language');

async function userlanguage(
  message
) {

  const userId =
    message.author.id;

  const embed =
    new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(
        tUser(
          userId,
          'user_language.title',
          message.guild?.id
        )
      )
      .setDescription(
        tUser(
          userId,
          'user_language.description',
          message.guild?.id
        )
      );

  const row =
    new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('user_lang_pt')
          .setLabel(
            tUser(
              userId,
              'language.portuguese',
              message.guild?.id
            )
          )
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('user_lang_en')
          .setLabel(
            tUser(
              userId,
              'language.english',
              message.guild?.id
            )
          )
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('user_lang_es')
          .setLabel(
            tUser(
              userId,
              'language.spanish',
              message.guild?.id
            )
          )
          .setStyle(ButtonStyle.Secondary)
      );

  return message.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true
  });
}

module.exports = userlanguage;
