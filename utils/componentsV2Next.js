const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  SeparatorBuilder,
  TextDisplayBuilder
} = require('discord.js');

const { t } =
  require('./language');

const {
  createMenuBackButton
} = require('./navigationButtons');

function createPageButton({
  customId,
  label,
  style,
  disabled
}) {

  return new ButtonBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(style)
    .setDisabled(disabled);
}

function formatAnimeItem({
  guildId,
  anime,
  formattedDate,
  timeLeft
}) {

  return [
    `### ${anime.title}`,
    `${t(guildId, 'next_field_episode')}: Ep ${anime.episode}`,
    `${t(guildId, 'next_field_time_left')}: ${timeLeft}`,
    `${t(guildId, 'next_field_airing')}: ${formattedDate}`
  ].join('\n');
}

function createNextPayload({
  guildId,
  pageItems,
  safePage,
  totalPages,
  formatTimeLeft
}) {

  const container =
    new ContainerBuilder()
      .setAccentColor(0x00ccff)
      .addTextDisplayComponents(
        new TextDisplayBuilder()
          .setContent(
            `# ${t(guildId, 'next_dashboard_title')}`
          )
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder()
          .setContent(
            t(
              guildId,
              'next_dashboard_description'
            )
          )
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
      );

  pageItems.forEach(anime => {
    const formattedDate =
      new Date(
        anime.airingTime
      ).toLocaleString(
        'pt-BR',
        {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }
      );

    container.addTextDisplayComponents(
      new TextDisplayBuilder()
        .setContent(
          formatAnimeItem({
            guildId,
            anime,
            formattedDate,
            timeLeft:
              formatTimeLeft(
                anime.timeLeft
              )
          })
        )
    );
  });

  container
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(true)
    )
    .addActionRowComponents(
      new ActionRowBuilder()
        .addComponents(
          createPageButton({
            customId:
              `next_prev_${safePage - 1}`,
            label:
              '<',
            style:
              ButtonStyle.Secondary,
            disabled:
              safePage <= 0
          }),
          createPageButton({
            customId:
              `next_page_${safePage}`,
            label:
              `${safePage + 1}/${totalPages}`,
            style:
              ButtonStyle.Primary,
            disabled:
              true
          }),
          createPageButton({
            customId:
              `next_next_${safePage + 1}`,
            label:
              '>',
            style:
              ButtonStyle.Secondary,
            disabled:
              safePage >= totalPages - 1
          }),
          createMenuBackButton()
        )
    );

  return {
    flags:
      MessageFlags.IsComponentsV2,
    components: [
      container
    ]
  };
}

module.exports = {
  createNextPayload
};
